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

const NOTE_WORDS = new Set([
  "sliced", "diced", "chopped", "minced", "grated", "drained", "rinsed",
  "halved", "quartered", "stemmed", "cored", "seeded", "peeled", "cut",
  "zested", "juiced", "crumbled", "husked", "divided", "plus", "for", "to", "such",
  "roughly", "finely", "thinly", "freshly", "about", "optional",
  "preferably", "softened", "melted", "beaten", "trimmed", "shredded",
  "torn", "packed",
]);

function splitNote(rest: string): { name: string; note: string } {
  const commaRe = /,\s*([A-Za-z-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = commaRe.exec(rest)) !== null) {
    if (NOTE_WORDS.has(m[1].toLowerCase())) {
      return { name: rest.slice(0, m.index), note: rest.slice(m.index + 1).trim() };
    }
  }
  return { name: rest, note: "" };
}

/** Parse "(14 oz / 400 g)"-style contents into a single metric quantity; metric wins. */
export function parseParenQuantities(inner: string): MetricQuantity | null {
  let mass: number | null = null;
  let massIsMetric = false;
  let volume: number | null = null;
  let volumeIsMetric = false;
  for (const seg of inner.split(/[/;,]/)) {
    const cleaned = seg.replace(/\b(about|approx\.?|total|each)\b/gi, "").replace(/~/g, "").trim();
    const m = cleaned.match(new RegExp(`^(${NUM})\\s*(${UNIT_ALT})\\b`, "i"));
    if (!m) continue;
    const value = evalNumber(m[1]);
    const unit = UNIT_SYNONYMS[m[2].toLowerCase()];
    if (unit in MASS_TO_G) {
      const metric = unit === "g" || unit === "kg";
      if (mass === null || (metric && !massIsMetric)) { mass = value * MASS_TO_G[unit]; massIsMetric = metric; }
    } else if (unit in VOL_TO_ML) {
      const metric = unit === "ml" || unit === "l";
      if (volume === null || (metric && !volumeIsMetric)) { volume = value * VOL_TO_ML[unit]; volumeIsMetric = metric; }
    }
  }
  if (mass !== null && (massIsMetric || !volumeIsMetric)) return { value: mass, unit: "g" };
  if (volume !== null) return { value: volume, unit: "ml" };
  return null;
}

export function parseIngredient(text: string): ParsedIngredient {
  const original = text;
  let rest = text.trim();
  let quantity: number | null = null;
  let quantityMax: number | null = null;
  let unit = "";
  let unitRaw = "";
  let packageSize: MetricQuantity | null = null;
  let restatement: MetricQuantity | null = null;
  let totalWeight: ParsedIngredient["totalWeight"] = null;

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
      // Package-size paren straight after the count: "1 (14 oz / 400 g) can …"
      const pkg = rest.match(/^\(([^)]*)\)\s*(.*)$/);
      if (pkg) {
        packageSize = parseParenQuantities(pkg[1]);   // null → noise, still consumed
        rest = pkg[2];
      }
      const u = rest.match(new RegExp(`^(${UNIT_ALT})\\b\\s*(.*)$`, "i"));
      if (u) {
        unitRaw = u[1];
        unit = UNIT_SYNONYMS[u[1].toLowerCase()];
        rest = u[2];
        // Restatement paren straight after the unit: "1/2 cup (120 ml) …"
        const re = rest.match(/^\(([^)]*)\)\s*(.*)$/);
        if (re) {
          restatement = parseParenQuantities(re[1]);
          rest = re[2];
        }
      }
    }
  }

  // Remaining parens: total weight on counted lines, restatement after a unit,
  // noise otherwise. All are removed from the name.
  rest = rest.replace(/\s*\(([^)]*)\)/g, (_whole, inner: string) => {
    const parsed = parseParenQuantities(inner);
    if (parsed) {
      if (quantity !== null && unit === "" && totalWeight === null && parsed.unit === "g") {
        totalWeight = { grams: parsed.value, each: /\beach\b/i.test(inner) };
      } else if (unit !== "" && restatement === null) {
        restatement = parsed;
      }
    }
    return "";
  });

  const { name: rawName, note } = splitNote(rest);
  const name = rawName.replace(/\s+/g, " ").trim().replace(/,+$/, "");
  return {
    original, quantity, quantityMax, unit, unitRaw,
    packageSize, restatement, totalWeight, name, note,
  };
}

const SIZE_ADJECTIVES = new Set(["large", "medium", "small"]);
const PIECE_NOUNS = new Set([
  "clove", "cloves", "head", "heads", "bunch", "bunches", "cob", "cobs",
  "block", "blocks", "can", "cans", "piece", "pieces", "sprig", "sprigs",
  "stalk", "stalks", "handful", "handfuls",
]);
const VES_IRREGULARS = new Set([
  "leaves", "halves", "loaves", "knives", "calves", "shelves", "wives", "thieves", "scarves",
]);

function singularise(w: string): string {
  if (w.length <= 3 || w.endsWith("ss") || w.endsWith("us") || w.endsWith("is")) return w;
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (VES_IRREGULARS.has(w)) return w.slice(0, -3) + "f";
  if (w.endsWith("oes")) return w.slice(0, -2);
  if (/(ches|shes|xes|zes)$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

/** Stable mapping/aggregation key: the ingredient's core identity. */
export function coreNameKey(input: string | ParsedIngredient): string {
  const parsed = typeof input === "string" ? parseIngredient(input) : input;
  let words = parsed.name
    .normalize("NFC")
    .toLowerCase()
    .replace(/[(),]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  while (
    words.length > 1 &&
    (SIZE_ADJECTIVES.has(words[0]) || PIECE_NOUNS.has(words[0]) || words[0] === "of")
  ) {
    words = words.slice(1);
  }
  const orIdx = words.indexOf("or");
  if (orIdx > 0) words = words.slice(0, orIdx);
  words = words.map((w) => (w === "dry" ? "dried" : w));
  if (words.length > 0) {
    words[words.length - 1] = singularise(words[words.length - 1]);
  }
  return words.join(" ");
}

/**
 * Scale an ingredient string in place, preserving all prose.
 * Package-size parens (the can is still a 400 g can) and noise parens are
 * untouched; restatement/total-weight parens scale.
 */
export function scaleIngredientText(text: string, factor: number): string {
  const parsed = parseIngredient(text);
  if (parsed.quantity === null) return text;

  let out: string;
  const attached = text.match(new RegExp(`^(\\s*)(\\d+(?:\\.\\d+)?)(${UNIT_ALT})\\b`, "i"));
  const range = text.match(new RegExp(`^(\\s*)(${NUM})(\\s+to\\s+)(${NUM})`));
  const plain = text.match(new RegExp(`^(\\s*)(${NUM})`));
  if (attached) {
    out = text.replace(
      attached[0],
      `${attached[1]}${formatQuantity(parseFloat(attached[2]) * factor)}${attached[3]}`
    );
  } else if (range) {
    out = text.replace(
      range[0],
      `${range[1]}${formatQuantity(evalNumber(range[2]) * factor)}${range[3]}${formatQuantity(evalNumber(range[4]) * factor)}`
    );
  } else if (plain) {
    out = text.replace(plain[0], `${plain[1]}${formatQuantity(evalNumber(plain[2]) * factor)}`);
  } else {
    return text;
  }

  // Spelled-out units agree in number with the new quantity.
  if (parsed.unitRaw.length > 4) {
    const scaledQty = (parsed.quantityMax ?? parsed.quantity) * factor;
    const isPlural = parsed.unitRaw.endsWith("s");
    if (scaledQty > 1 && !isPlural) out = out.replace(parsed.unitRaw, `${parsed.unitRaw}s`);
    if (scaledQty <= 1 && isPlural) out = out.replace(parsed.unitRaw, parsed.unitRaw.slice(0, -1));
  }

  // Parens: skip the package-size paren and noise; scale quantity parens.
  return out.replace(/\(([^)]*)\)/g, (whole, inner: string, offset: number, str: string) => {
    const before = str.slice(0, offset).trim();
    const isPackageParen =
      parsed.packageSize !== null && new RegExp(`^${NUM}$`).test(before);
    if (isPackageParen) return whole;
    if (parseParenQuantities(inner) === null) return whole;
    const scaledInner = inner.replace(new RegExp(NUM, "g"), (tok) =>
      formatQuantity(evalNumber(tok) * factor)
    );
    return `(${scaledInner})`;
  });
}
