// src/lib/nutrition.test.ts
import { describe, it, expect } from "vitest";
import { normaliseKey, resolveGrams } from "./nutrition";
import type { Food, IngredientMapping } from "./nutrition-types";

describe("normaliseKey", () => {
  it("lowercases", () => {
    expect(normaliseKey("Tomatillos")).toBe("tomatillos");
  });
  it("trims and collapses whitespace", () => {
    expect(normaliseKey("  whole   chicken  ")).toBe("whole chicken");
  });
  it("NFC-normalises accents", () => {
    // "Jalapeño" (combining tilde) → "Jalapeño" (precomposed)
    expect(normaliseKey("Jalapeño peppers")).toBe(normaliseKey("Jalapeño peppers"));
  });
});

const tomatillo: Food = {
  id: "fdc:11952", name: "Tomatillos, raw", aliases: ["tomatillo", "tomatillos"],
  per100g: { kcal: 32, protein_g: 0.96, fat_g: 1.02, sat_fat_g: 0.14, carbs_g: 5.84, sugar_g: 3.93, fibre_g: 1.9, sodium_mg: 1 },
  defaultPiece: { unit: "tomatillo", grams: 34 },
};
const olive: Food = {
  id: "fdc:171413", name: "Oil, olive", aliases: ["olive oil"],
  per100g: { kcal: 884, protein_g: 0, fat_g: 100, sat_fat_g: 13.8, carbs_g: 0, sugar_g: 0, fibre_g: 0, sodium_mg: 2 },
  density_g_per_ml: 0.92,
};

import { parseIngredient } from "./ingredient-parser";

describe("resolveGrams", () => {
  it("converts mass units to grams, including spelled-out ones", () => {
    expect(resolveGrams(parseIngredient("2 lbs tomatillos"), tomatillo, undefined).grams).toBeCloseTo(907.18, 1);
    expect(resolveGrams(parseIngredient("200g tomatillos"), tomatillo, undefined).grams).toBe(200);
    expect(resolveGrams(parseIngredient("3 pounds tomatillos"), tomatillo, undefined).grams).toBeCloseTo(1360.78, 1);
    expect(resolveGrams(parseIngredient("8 oz tomatillos"), tomatillo, undefined).grams).toBeCloseTo(226.8, 1);
  });

  it("converts volume via density, spelled-out units included", () => {
    const r = resolveGrams(parseIngredient("2 tablespoons olive oil"), olive, undefined);
    expect(r.grams).toBeCloseTo(2 * 14.7868 * 0.92, 1);
    expect(r.approximate).toBeFalsy();
  });

  it("falls back to water-equivalent volume, flagged approximate", () => {
    const r = resolveGrams(parseIngredient("1 cup tomatillos"), tomatillo, undefined);
    expect(r.grams).toBeCloseTo(236.59, 1);
    expect(r.approximate).toBe(true);
  });

  it("prefers a metric restatement over unit conversion", () => {
    const r = resolveGrams(parseIngredient("1/2 cup (100 g) tomatillos"), tomatillo, undefined);
    expect(r.grams).toBe(100);
    expect(r.approximate).toBeFalsy();
  });

  it("resolves package size × count", () => {
    const r = resolveGrams(parseIngredient("2 (15 oz / 425 g) cans butter beans"), tomatillo, undefined);
    expect(r.grams).toBe(850);
  });

  it("resolves ml packages via density", () => {
    const r = resolveGrams(parseIngredient("1 (400 ml) can olive oil"), olive, undefined);
    expect(r.grams).toBeCloseTo(400 * 0.92, 1);
  });

  it("derives per-piece weight from a total-weight paren", () => {
    const r = resolveGrams(parseIngredient("8 chicken thighs (~1.1 kg)"), tomatillo, undefined);
    expect(r.grams).toBeCloseTo(1100, 0);
  });

  it("multiplies each-weights by the count", () => {
    const r = resolveGrams(parseIngredient("4 salmon fillets (~170 g each)"), tomatillo, undefined);
    expect(r.grams).toBe(680);
  });

  it("uses defaultPiece for bare counts", () => {
    expect(resolveGrams(parseIngredient("5 tomatillos"), tomatillo, undefined).grams).toBe(170);
  });

  it("prefers pieceOverride over defaultPiece and derived weights", () => {
    const mapping: IngredientMapping = {
      foodId: tomatillo.id, confirmed: true, source: "manual",
      pieceOverride: { unit: "", grams: 50 },
    };
    expect(resolveGrams(parseIngredient("2 tomatillos"), tomatillo, mapping).grams).toBe(100);
  });

  it("returns null grams without quantity or piece info", () => {
    expect(resolveGrams(parseIngredient("1 splash olive oil"), olive, undefined).grams).toBeNull();
    expect(resolveGrams(parseIngredient("olive oil"), olive, undefined).grams).toBeNull();
  });
});

import { autoMatch } from "./nutrition";

describe("autoMatch", () => {
  const foods: Food[] = [tomatillo, olive];

  it("returns a confident match for an alias hit", () => {
    const m = autoMatch("tomatillos", foods);
    expect(m?.foodId).toBe("fdc:11952");
    expect(m?.confidence).toBeGreaterThan(0.7);
  });

  it("matches close spellings", () => {
    const m = autoMatch("tomatillo", foods);
    expect(m?.foodId).toBe("fdc:11952");
  });

  it("returns null below threshold", () => {
    const m = autoMatch("xylophone", foods);
    expect(m).toBeNull();
  });
});

import { computeRecipeNutrition } from "./nutrition";
import type { Mappings } from "./nutrition-types";

describe("computeRecipeNutrition", () => {
  const foods: Food[] = [tomatillo, olive];

  it("computes totals from confirmed core-name mappings", () => {
    const mappings: Mappings = {
      "tomatillo": { foodId: "fdc:11952", confirmed: true, source: "manual" },
      "olive oil": { foodId: "fdc:171413", confirmed: true, source: "manual" },
    };
    const { rows, totals } = computeRecipeNutrition(
      ["2 lbs tomatillos", "2 tbsp olive oil"],
      foods,
      mappings
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].status).toBe("ok");
    expect(rows[0].key).toBe("tomatillo");
    expect(rows[0].grams).toBeCloseTo(907.18, 1);
    expect(totals.kcal).toBeCloseTo((907.18 * 32 + 14.7868 * 2 * 0.92 * 884) / 100, 1);
    expect(totals.unmatchedCount).toBe(0);
  });

  it("keys survive rewording", () => {
    const mappings: Mappings = {
      "tomatillo": { foodId: "fdc:11952", confirmed: true, source: "manual" },
    };
    const { rows } = computeRecipeNutrition(
      ["2 lbs tomatillos, husked and rinsed"],
      foods,
      mappings
    );
    expect(rows[0].status).toBe("ok");
  });

  it("auto-matches missing entries without mutating input mappings", () => {
    const mappings: Mappings = {};
    const before = JSON.stringify(mappings);
    const { rows } = computeRecipeNutrition(["2 lbs tomatillos"], foods, mappings);
    expect(rows[0].status).toBe("ok");
    expect(JSON.stringify(mappings)).toBe(before);
  });

  it("flags unmatched ingredients and counts them", () => {
    const { rows, totals } = computeRecipeNutrition(["2 lbs zorblax"], foods, {});
    expect(rows[0].status).toBe("unmatched");
    expect(totals.unmatchedCount).toBe(1);
    expect(totals.kcal).toBe(0);
  });

  it("respects exclude flag", () => {
    const mappings: Mappings = {
      "salt to taste": { foodId: null, exclude: true, confirmed: true, source: "manual" },
    };
    const { rows, totals } = computeRecipeNutrition(["salt to taste"], foods, mappings);
    expect(rows[0].status).toBe("excluded");
    expect(totals.unmatchedCount).toBe(0);
  });

  it("flags resolved-but-no-weight rows", () => {
    const mappings: Mappings = {
      "olive oil": { foodId: "fdc:171413", confirmed: true, source: "manual" },
    };
    const { rows } = computeRecipeNutrition(["olive oil"], foods, mappings);
    expect(rows[0].status).toBe("no-weight");
  });

  it("flags mappings pointing at missing foods", () => {
    const mappings: Mappings = {
      "ghost food": { foodId: "fdc:00000", confirmed: true, source: "manual" },
    };
    const { rows } = computeRecipeNutrition(["1 lb ghost food"], foods, mappings);
    expect(rows[0].status).toBe("no-food");
  });

  it("propagates approximate flag from volume-without-density", () => {
    const mappings: Mappings = {
      "tomatillo": { foodId: "fdc:11952", confirmed: true, source: "manual" },
    };
    const { rows } = computeRecipeNutrition(["1 cup tomatillos"], foods, mappings);
    expect(rows[0].status).toBe("approximate");
  });
});
