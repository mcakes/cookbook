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
