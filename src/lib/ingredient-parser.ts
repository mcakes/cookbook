export interface MetricQuantity { value: number; unit: "g" | "ml" }

export interface ParsedIngredient {
  original: string;
  quantity: number | null;      // lower bound for ranges
  quantityMax: number | null;   // upper bound for "1/4 to 1/2"; else null
  unit: string;                 // canonical unit; "" for counts
  unitRaw: string;              // as written, for display reconstruction
  packageSize: MetricQuantity | null;   // "1 (14 oz / 400 g) can …" → per-can size
  restatement: MetricQuantity | null;   // "1/2 cup (120 ml)" → same amount restated
  totalWeight: { grams: number; each: boolean } | null;
                                // "8 thighs (~1.1 kg)" total; "(~170 g each)" per piece
  name: string;                 // after unit, parens stripped, before prep note
  note: string;                 // "finely diced", "plus more to taste", …
}

const UNIT_SYNONYMS: Record<string, string> = {
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
  tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
  cup: "cup", cups: "cup",
  g: "g", gram: "g", grams: "g",
  kg: "kg", kilogram: "kg", kilograms: "kg",
  ml: "ml", milliliter: "ml", milliliters: "ml", millilitre: "ml", millilitres: "ml",
  l: "l", liter: "l", liters: "l", litre: "l", litres: "l",
  oz: "oz", ounce: "oz", ounces: "oz",
  lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
  pint: "pint", pints: "pint",
  pinch: "pinch", pinches: "pinch",
};
// Longest-first so "lb" wins over "l", "grams" over "g"
const UNIT_ALT = Object.keys(UNIT_SYNONYMS).sort((a, b) => b.length - a.length).join("|");

export const MASS_TO_G: Record<string, number> = {
  g: 1, kg: 1000, oz: 28.3495, lb: 453.592,
};
export const VOL_TO_ML: Record<string, number> = {
  ml: 1, l: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588, pint: 473.176,
};

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 1 / 2, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 1 / 4, "¾": 3 / 4, "⅕": 1 / 5, "⅛": 1 / 8,
};
// number token: mixed number | fraction | unicode fraction | decimal/integer
const NUM = String.raw`(?:\d+\s+\d+/\d+|\d+/\d+|\d*[½⅓⅔¼¾⅕⅛]|\d+(?:\.\d+)?)`;

export function evalNumber(tok: string): number {
  tok = tok.trim();
  const uni = tok.match(/^(\d*)([½⅓⅔¼¾⅕⅛])$/);
  if (uni) return (uni[1] ? parseInt(uni[1]) : 0) + UNICODE_FRACTIONS[uni[2]];
  const mixed = tok.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  const frac = tok.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(tok);
}

const COMMON_FRACTIONS: [number, string][] = [
  [1 / 4, "1/4"], [1 / 3, "1/3"], [1 / 2, "1/2"], [2 / 3, "2/3"], [3 / 4, "3/4"],
];

export function formatQuantity(n: number): string {
  if (Math.round(n) > 0 && Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n));
  const intPart = Math.floor(n);
  const fracPart = n - intPart;
  for (const [val, str] of COMMON_FRACTIONS) {
    if (Math.abs(fracPart - val) < 0.02) return intPart > 0 ? `${intPart} ${str}` : str;
  }
  return parseFloat(n.toFixed(2)).toString();
}

export function parseIngredient(text: string): ParsedIngredient {
  const original = text;
  let rest = text.trim();
  let quantity: number | null = null;
  let quantityMax: number | null = null;
  let unit = "";
  let unitRaw = "";
  const packageSize: MetricQuantity | null = null;
  const restatement: MetricQuantity | null = null;
  const totalWeight: ParsedIngredient["totalWeight"] = null;

  const attached = rest.match(new RegExp(`^(\\d+(?:\\.\\d+)?)(${UNIT_ALT})\\b\\s*(.*)$`, "i"));
  if (attached) {
    quantity = parseFloat(attached[1]);
    unitRaw = attached[2];
    unit = UNIT_SYNONYMS[attached[2].toLowerCase()];
    rest = attached[3];
  } else {
    const q = rest.match(new RegExp(`^(${NUM})(?:\\s+to\\s+(${NUM}))?\\s+(.*)$`));
    if (q) {
      quantity = evalNumber(q[1]);
      quantityMax = q[2] ? evalNumber(q[2]) : null;
      rest = q[3];
      const u = rest.match(new RegExp(`^(${UNIT_ALT})\\b\\s*(.*)$`, "i"));
      if (u) {
        unitRaw = u[1];
        unit = UNIT_SYNONYMS[u[1].toLowerCase()];
        rest = u[2];
      }
    }
  }

  const name = rest.replace(/\s+/g, " ").trim();
  return {
    original, quantity, quantityMax, unit, unitRaw,
    packageSize, restatement, totalWeight, name, note: "",
  };
}
