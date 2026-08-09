// src/lib/nutrition.ts
import Fuse from "fuse.js";
import {
  parseIngredient, coreNameKey, MASS_TO_G, VOL_TO_ML,
  type ParsedIngredient,
} from "./ingredient-parser";
import type {
  Food, IngredientMapping, NutritionRow, NutritionTotals, Mappings,
} from "./nutrition-types";

export function normaliseKey(s: string): string {
  return s.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
}

export interface ResolveResult {
  grams: number | null;
  approximate?: boolean;
}

export function resolveGrams(
  parsed: ParsedIngredient,
  food: Food,
  mapping: IngredientMapping | undefined
): ResolveResult {
  const mlToGrams = (ml: number): ResolveResult =>
    food.density_g_per_ml !== undefined
      ? { grams: ml * food.density_g_per_ml }
      : { grams: ml, approximate: true };
  const metric = (q: { value: number; unit: "g" | "ml" }): ResolveResult =>
    q.unit === "g" ? { grams: q.value } : mlToGrams(q.value);

  // 1. Author-stated restatement is the most precise source.
  if (parsed.restatement) return metric(parsed.restatement);

  if (parsed.quantity === null) return { grams: null };

  // 2. Package size × count.
  if (parsed.packageSize) {
    return metric({
      value: parsed.packageSize.value * parsed.quantity,
      unit: parsed.packageSize.unit,
    });
  }

  // 3. Canonical unit conversion.
  if (parsed.unit in MASS_TO_G) return { grams: parsed.quantity * MASS_TO_G[parsed.unit] };
  if (parsed.unit in VOL_TO_ML) return mlToGrams(parsed.quantity * VOL_TO_ML[parsed.unit]);

  // 4. Per-piece: override → weight stated on the line → food default.
  // A hand-confirmed pieceOverride is trusted over the line's own stated
  // weight — someone has already verified it against the food actually used.
  if (mapping?.pieceOverride) return { grams: parsed.quantity * mapping.pieceOverride.grams };
  if (parsed.totalWeight) {
    return {
      grams: parsed.totalWeight.each
        ? parsed.totalWeight.grams * parsed.quantity
        : parsed.totalWeight.grams,
    };
  }
  if (food.defaultPiece) return { grams: parsed.quantity * food.defaultPiece.grams };

  return { grams: null };
}

export interface AutoMatchResult {
  foodId: string;
  confidence: number;
}

const FUSE_OPTIONS = {
  includeScore: true,
  threshold: 0.3,
  keys: ["aliases", "name"],
};

let fuseCache: { foods: Food[]; fuse: Fuse<Food> } | null = null;

export function autoMatch(key: string, foods: Food[]): AutoMatchResult | null {
  if (!fuseCache || fuseCache.foods !== foods) {
    fuseCache = { foods, fuse: new Fuse(foods, FUSE_OPTIONS) };
  }
  const [best] = fuseCache.fuse.search(key, { limit: 1 });
  if (!best || best.score === undefined || best.score > 0.3) return null;
  return { foodId: best.item.id, confidence: 1 - best.score };
}

const ZERO_TOTALS = (): NutritionTotals => ({
  kcal: 0, protein_g: 0, fat_g: 0, sat_fat_g: 0,
  carbs_g: 0, sugar_g: 0, fibre_g: 0, sodium_mg: 0,
  unmatchedCount: 0,
});

export function computeRecipeNutrition(
  ingredients: string[],
  foods: Food[],
  mappings: Mappings
): { rows: NutritionRow[]; totals: NutritionTotals } {
  const foodById = new Map(foods.map((f) => [f.id, f]));
  const rows: NutritionRow[] = [];
  const totals = ZERO_TOTALS();

  for (const ingredient of ingredients) {
    const parsed = parseIngredient(ingredient);
    const key = coreNameKey(parsed);
    let mapping = mappings[key];

    if (!mapping) {
      const auto = autoMatch(key, foods);
      if (auto) {
        mapping = { foodId: auto.foodId, confirmed: false, source: "auto" };
      }
    }

    if (!mapping) {
      rows.push({ ingredient, key, status: "unmatched" });
      totals.unmatchedCount += 1;
      continue;
    }

    if (mapping.exclude) {
      rows.push({ ingredient, key, status: "excluded" });
      continue;
    }

    if (!mapping.foodId) {
      rows.push({ ingredient, key, status: "unmatched" });
      totals.unmatchedCount += 1;
      continue;
    }

    const food = foodById.get(mapping.foodId);
    if (!food) {
      rows.push({ ingredient, key, status: "no-food", foodId: mapping.foodId });
      totals.unmatchedCount += 1;
      continue;
    }

    const { grams, approximate } = resolveGrams(parsed, food, mapping);
    if (grams === null) {
      rows.push({ ingredient, key, status: "no-weight", foodId: mapping.foodId });
      continue;
    }

    const factor = grams / 100;
    const values: NutritionRow["values"] = {
      kcal:      food.per100g.kcal      * factor,
      protein_g: food.per100g.protein_g * factor,
      fat_g:     food.per100g.fat_g     * factor,
      sat_fat_g: food.per100g.sat_fat_g * factor,
      carbs_g:   food.per100g.carbs_g   * factor,
      sugar_g:   food.per100g.sugar_g   * factor,
      fibre_g:   food.per100g.fibre_g   * factor,
      sodium_mg: food.per100g.sodium_mg * factor,
    };
    rows.push({
      ingredient, key,
      status: approximate ? "approximate" : "ok",
      foodId: mapping.foodId, values, grams,
    });
    for (const k of Object.keys(values) as (keyof typeof values)[]) {
      totals[k] += values[k];
    }
  }

  return { rows, totals };
}
