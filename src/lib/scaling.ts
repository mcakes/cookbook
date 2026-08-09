import { parseIngredient, scaleIngredientText } from "./ingredient-parser";

export interface ParsedQuantity {
  quantity: number | null;
  unit: string;
  rest: string;
}

/** @deprecated transition wrapper for nutrition.ts — removed once it consumes the parser directly. */
export function parseQuantity(ingredient: string): ParsedQuantity {
  const p = parseIngredient(ingredient);
  return { quantity: p.quantity, unit: p.unit, rest: p.name };
}

/**
 * Scale an ingredient string by the given factor.
 * Ingredients without a parseable quantity are returned unchanged.
 */
export function scaleIngredient(ingredient: string, factor: number): string {
  return scaleIngredientText(ingredient, factor);
}

/** Scale an array of ingredient strings from baseServings to targetServings. */
export function scaleIngredients(
  ingredients: string[],
  baseServings: number,
  targetServings: number
): string[] {
  const factor = targetServings / baseServings;
  return ingredients.map((ing) => scaleIngredient(ing, factor));
}
