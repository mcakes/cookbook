// src/lib/nutrition-types.ts

export interface Food {
  id: string;
  name: string;
  aliases: string[];
  per100g: {
    kcal: number;
    protein_g: number;
    fat_g: number;
    sat_fat_g: number;
    carbs_g: number;
    sugar_g: number;
    fibre_g: number;
    sodium_mg: number;
  };
  density_g_per_ml?: number;
  defaultPiece?: { unit: string; grams: number };
}

export interface IngredientMapping {
  foodId: string | null;
  exclude?: true;
  pieceOverride?: { unit: string; grams: number };
  confirmed: boolean;
  source: "auto" | "manual";
}

export type Mappings = Record<string, IngredientMapping>;

export interface NutritionRow {
  ingredient: string;            // original string
  key: string;                   // normalised key
  status: "ok" | "approximate" | "excluded" | "unmatched" | "no-weight" | "no-food";
  foodId?: string;
  values?: Food["per100g"];      // values for this row, NOT per100g — already scaled to grams
  grams?: number;
}

export interface NutritionTotals {
  kcal: number;
  protein_g: number;
  fat_g: number;
  sat_fat_g: number;
  carbs_g: number;
  sugar_g: number;
  fibre_g: number;
  sodium_mg: number;
  unmatchedCount: number;
}
