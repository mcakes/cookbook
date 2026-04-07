const KNOWN_UNITS = new Set([
  "g", "kg", "ml", "l", "tsp", "tbsp", "cup", "cups", "oz", "lb", "lbs", "pinch",
]);

export interface ParsedQuantity {
  quantity: number | null;
  unit: string;
  rest: string;
}

interface InternalParsed extends ParsedQuantity {
  attachedUnit: boolean;
}

/**
 * Parses an ingredient string into its numeric quantity, unit, and remainder.
 *
 * Handles:
 *   - Attached units:    "200g pasta"       → { quantity: 200,  unit: "g",    rest: "pasta" }
 *   - Fraction + unit:   "1/2 tsp salt"     → { quantity: 0.5,  unit: "tsp",  rest: "salt" }
 *   - Mixed + unit:      "1 1/2 cups flour" → { quantity: 1.5,  unit: "cups", rest: "flour" }
 *   - Unitless:          "3 eggs"           → { quantity: 3,    unit: "",     rest: "eggs" }
 *   - No quantity:       "salt to taste"    → { quantity: null, unit: "",     rest: "salt to taste" }
 */
export function parseQuantity(ingredient: string): ParsedQuantity {
  const { attachedUnit: _ignored, ...result } = parseQuantityInternal(ingredient);
  return result;
}

function parseQuantityInternal(ingredient: string): InternalParsed {
  ingredient = ingredient.trim();

  // Pattern pieces
  const integer = "\\d+";
  const fraction = "\\d+/\\d+";
  // mixed number: integer SPACE fraction  e.g. "1 1/2"
  const mixed = `${integer}\\s+${fraction}`;
  // number token: mixed | fraction | integer  (order matters — try mixed first)
  const numToken = `(?:${mixed}|${fraction}|${integer})`;
  // unit attached directly after digits with no space: "200g"
  const attachedUnitPat = `(${integer})(${[...KNOWN_UNITS].join("|")})\\b`;

  // 1. Try attached unit first: "200g pasta"
  const attachedRe = new RegExp(`^${attachedUnitPat}\\s*(.*)$`);
  const attachedMatch = ingredient.match(attachedRe);
  if (attachedMatch) {
    const quantity = parseFloat(attachedMatch[1]);
    const unit = attachedMatch[2];
    const rest = attachedMatch[3].trim();
    return { quantity, unit, rest, attachedUnit: true };
  }

  // 2. Try number (mixed / fraction / integer) followed by a known unit
  const knownUnitList = [...KNOWN_UNITS].join("|");
  const withUnitRe = new RegExp(
    `^(${numToken})\\s+(${knownUnitList})\\b\\s*(.*)$`
  );
  const withUnitMatch = ingredient.match(withUnitRe);
  if (withUnitMatch) {
    const quantity = evalNumber(withUnitMatch[1]);
    const unit = withUnitMatch[2];
    const rest = withUnitMatch[3].trim();
    return { quantity, unit, rest, attachedUnit: false };
  }

  // 3. Try bare number (unitless): "3 eggs"
  const bareNumberRe = new RegExp(`^(${numToken})\\s+(.+)$`);
  const bareMatch = ingredient.match(bareNumberRe);
  if (bareMatch) {
    const quantity = evalNumber(bareMatch[1]);
    const rest = bareMatch[2].trim();
    return { quantity, unit: "", rest, attachedUnit: false };
  }

  // 4. No quantity found
  return { quantity: null, unit: "", rest: ingredient, attachedUnit: false };
}

/** Evaluate a number string: integer, fraction, or mixed number. */
function evalNumber(s: string): number {
  s = s.trim();
  // mixed: "1 1/2"
  const mixedMatch = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
  }
  // fraction: "1/2"
  const fracMatch = s.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    return parseInt(fracMatch[1]) / parseInt(fracMatch[2]);
  }
  return parseFloat(s);
}

/** Format a scaled number as a clean string (no trailing zeros, nice fractions). */
function formatNumber(n: number): string {
  // Round to reasonable precision to avoid floating-point noise
  const rounded = Math.round(n * 10000) / 10000;

  // Try to express as a nice fraction if close to a common one
  const commonFractions: [number, string][] = [
    [1 / 4, "1/4"],
    [1 / 3, "1/3"],
    [1 / 2, "1/2"],
    [2 / 3, "2/3"],
    [3 / 4, "3/4"],
  ];

  const intPart = Math.floor(rounded);
  const fracPart = rounded - intPart;

  if (fracPart > 0.001) {
    for (const [val, str] of commonFractions) {
      if (Math.abs(fracPart - val) < 0.01) {
        return intPart > 0 ? `${intPart} ${str}` : str;
      }
    }
  }

  // Fall back to decimal, stripping unnecessary trailing zeros
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  // Use up to 2 decimal places
  return parseFloat(rounded.toFixed(2)).toString();
}

/**
 * Scale an ingredient string by the given factor.
 * Ingredients without a parseable quantity are returned unchanged.
 */
export function scaleIngredient(ingredient: string, factor: number): string {
  const parsed = parseQuantityInternal(ingredient);

  if (parsed.quantity === null) {
    return ingredient;
  }

  const scaled = parsed.quantity * factor;
  const numStr = formatNumber(scaled);

  // Reconstruct: attached units have no space ("400g"), separated units have a space ("1 tsp")
  let prefix: string;
  if (parsed.unit) {
    prefix = parsed.attachedUnit ? `${numStr}${parsed.unit}` : `${numStr} ${parsed.unit}`;
  } else {
    prefix = numStr;
  }

  return parsed.rest ? `${prefix} ${parsed.rest}` : prefix;
}

/**
 * Scale an array of ingredient strings from baseServings to targetServings.
 */
export function scaleIngredients(
  ingredients: string[],
  baseServings: number,
  targetServings: number
): string[] {
  const factor = targetServings / baseServings;
  return ingredients.map((ing) => scaleIngredient(ing, factor));
}
