// src/lib/nutrition.ts
export function normaliseKey(s: string): string {
  return s.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
}

import type { Food, IngredientMapping } from "./nutrition-types";

const MASS_TO_G: Record<string, number> = {
  g: 1, kg: 1000, oz: 28.3495, lb: 453.592, lbs: 453.592,
};
const VOL_TO_ML: Record<string, number> = {
  ml: 1, l: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588, cups: 236.588,
};

export interface ResolveResult {
  grams: number | null;
  approximate?: boolean;
}

export function resolveGrams(
  parsed: { quantity: number | null; unit: string },
  food: Food,
  mapping: IngredientMapping | undefined
): ResolveResult {
  if (parsed.quantity === null) return { grams: null };

  const unit = parsed.unit.toLowerCase();

  // 1. Mass
  if (unit in MASS_TO_G) {
    return { grams: parsed.quantity * MASS_TO_G[unit] };
  }
  // 2. Volume with density
  if (unit in VOL_TO_ML) {
    const ml = parsed.quantity * VOL_TO_ML[unit];
    if (food.density_g_per_ml !== undefined) {
      return { grams: ml * food.density_g_per_ml };
    }
    // 3. Volume fallback (water-equivalent)
    return { grams: ml, approximate: true };
  }
  // 4. Per-piece (override beats default)
  const piece = mapping?.pieceOverride ?? food.defaultPiece;
  if (piece) {
    // Accept any unit (or empty unit) when a piece weight is configured.
    // The recipe-author's chosen unit is the count multiplier.
    return { grams: parsed.quantity * piece.grams };
  }
  return { grams: null };
}

import Fuse from "fuse.js";

export interface AutoMatchResult {
  foodId: string;
  confidence: number;
}

const FUSE_OPTIONS = {
  includeScore: true,
  threshold: 0.3,
  keys: ["aliases", "name"],
};

export function autoMatch(key: string, foods: Food[]): AutoMatchResult | null {
  const fuse = new Fuse(foods, FUSE_OPTIONS);
  const [best] = fuse.search(key, { limit: 1 });
  if (!best || best.score === undefined || best.score > 0.3) return null;
  return { foodId: best.item.id, confidence: 1 - best.score };
}

import { parseQuantity } from "./scaling";
import type { NutritionRow, NutritionTotals, Mappings } from "./nutrition-types";

const ZERO_TOTALS = (): NutritionTotals => ({
  kcal: 0, protein_g: 0, fat_g: 0, sat_fat_g: 0,
  carbs_g: 0, sugar_g: 0, fibre_g: 0, sodium_mg: 0,
  unmatchedCount: 0,
});

/** Find a mapping entry whose key is a prefix of `key` (word-boundary aligned). */
function lookupMappingPrefix(key: string, mappings: Mappings): IngredientMapping | undefined {
  // Try longest prefix first — sort keys by descending length
  const candidates = Object.keys(mappings)
    .filter((k) => key === k || key.startsWith(k + " "))
    .sort((a, b) => b.length - a.length);
  return candidates.length > 0 ? mappings[candidates[0]] : undefined;
}

export function computeRecipeNutrition(
  ingredients: string[],
  foods: Food[],
  mappings: Mappings
): { rows: NutritionRow[]; totals: NutritionTotals } {
  const foodById = new Map(foods.map((f) => [f.id, f]));
  const rows: NutritionRow[] = [];
  const totals = ZERO_TOTALS();

  for (const ingredient of ingredients) {
    const parsed = parseQuantity(ingredient);
    const key = normaliseKey(parsed.rest);
    const explicit = mappings[key] ?? lookupMappingPrefix(key, mappings);
    let mapping = explicit;

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
      kcal:        food.per100g.kcal        * factor,
      protein_g:   food.per100g.protein_g   * factor,
      fat_g:       food.per100g.fat_g       * factor,
      sat_fat_g:   food.per100g.sat_fat_g   * factor,
      carbs_g:     food.per100g.carbs_g     * factor,
      sugar_g:     food.per100g.sugar_g     * factor,
      fibre_g:     food.per100g.fibre_g     * factor,
      sodium_mg:   food.per100g.sodium_mg   * factor,
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
