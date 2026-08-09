import { scaleIngredientText } from "./ingredient-parser";

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
