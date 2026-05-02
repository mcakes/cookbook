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

describe("resolveGrams", () => {
  it("converts mass units to grams", () => {
    expect(resolveGrams({ quantity: 2, unit: "lbs" }, tomatillo, undefined).grams).toBeCloseTo(907.18, 1);
    expect(resolveGrams({ quantity: 200, unit: "g" },  tomatillo, undefined).grams).toBe(200);
    expect(resolveGrams({ quantity: 1,   unit: "kg" },  tomatillo, undefined).grams).toBe(1000);
    expect(resolveGrams({ quantity: 8,   unit: "oz" }, tomatillo, undefined).grams).toBeCloseTo(226.8, 1);
  });

  it("converts volume to grams via density", () => {
    const r = resolveGrams({ quantity: 1, unit: "tbsp" }, olive, undefined);
    expect(r.grams).toBeCloseTo(14.79 * 0.92, 1);
    expect(r.approximate).toBeFalsy();
  });

  it("falls back to water-equivalent when no density, flagging approximate", () => {
    const r = resolveGrams({ quantity: 1, unit: "cup" }, tomatillo, undefined);
    expect(r.grams).toBeCloseTo(236.59, 1);
    expect(r.approximate).toBe(true);
  });

  it("uses defaultPiece when unit matches", () => {
    const r = resolveGrams({ quantity: 5, unit: "" }, tomatillo, undefined);
    expect(r.grams).toBe(170); // 5 × 34
  });

  it("uses pieceOverride preferentially over defaultPiece", () => {
    const mapping: IngredientMapping = { foodId: tomatillo.id, confirmed: true, source: "manual",
      pieceOverride: { unit: "", grams: 50 } };
    const r = resolveGrams({ quantity: 2, unit: "" }, tomatillo, mapping);
    expect(r.grams).toBe(100);
  });

  it("returns null grams when unit is unrecognised and no piece info", () => {
    const r = resolveGrams({ quantity: 1, unit: "" }, olive, undefined); // olive has no defaultPiece
    expect(r.grams).toBeNull();
  });

  it("returns null grams when quantity is null", () => {
    const r = resolveGrams({ quantity: null, unit: "" }, tomatillo, undefined);
    expect(r.grams).toBeNull();
  });
});
