// scripts/nutrition-defaults.ts

// Aliases mapped onto FDC foods that need additional `density_g_per_ml` or
// `defaultPiece`. Keys are lower-cased FDC names; values are merged onto the
// projected food record by build-nutrition.ts.

export interface DefaultsEntry {
  density_g_per_ml?: number;
  defaultPiece?: { unit: string; grams: number };
  aliases?: string[];
}

export const NUTRITION_DEFAULTS: Record<string, DefaultsEntry> = {
  // Volume-measured liquids
  "oil, olive, salad or cooking": { density_g_per_ml: 0.92, aliases: ["olive oil"] },
  "oil, vegetable, sunflower":     { density_g_per_ml: 0.92, aliases: ["sunflower oil", "vegetable oil"] },
  "milk, whole, 3.25% milkfat, with added vitamin d": { density_g_per_ml: 1.03, aliases: ["whole milk", "milk"] },
  "water, tap, drinking":          { density_g_per_ml: 1.00, aliases: ["water"] },
  "vinegar, distilled":            { density_g_per_ml: 1.01, aliases: ["white vinegar", "vinegar"] },
  "honey":                         { density_g_per_ml: 1.42, aliases: ["honey"] },

  // Counted items — defaultPiece grams
  "garlic, raw":                   { defaultPiece: { unit: "clove", grams: 3 },  aliases: ["garlic", "garlic clove", "garlic cloves"] },
  "spices, bay leaf":              { defaultPiece: { unit: "leaf",  grams: 0.1 }, aliases: ["bay leaf", "bay leaves"] },
  "egg, whole, raw, fresh":        { defaultPiece: { unit: "egg",   grams: 50 },  aliases: ["egg", "eggs"] },
  "onions, raw":                   { defaultPiece: { unit: "onion", grams: 110 }, aliases: ["white onion", "yellow onion", "onion", "onions"] },
  "lemon, raw, without peel":      { defaultPiece: { unit: "lemon", grams: 84 },  aliases: ["lemon", "lemons"] },
  "lime, raw":                     { defaultPiece: { unit: "lime",  grams: 67 },  aliases: ["lime", "limes"] },
  "tomatillos, raw":               { defaultPiece: { unit: "tomatillo", grams: 34 }, aliases: ["tomatillo", "tomatillos"] },
};
