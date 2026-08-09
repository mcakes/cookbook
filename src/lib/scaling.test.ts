import { describe, it, expect } from "vitest";
import { scaleIngredient, scaleIngredients } from "./scaling";

describe("scaleIngredient", () => {
  it("scales a simple ingredient", () => {
    expect(scaleIngredient("200g pasta", 2)).toBe("400g pasta");
  });

  it("scales fractions", () => {
    expect(scaleIngredient("1/2 tsp salt", 2)).toBe("1 tsp salt");
  });

  it("scales spelled-out units", () => {
    expect(scaleIngredient("3 tablespoons gochujang", 2)).toBe("6 tablespoons gochujang");
  });

  it("leaves non-quantified ingredients unchanged", () => {
    expect(scaleIngredient("salt to taste", 2)).toBe("salt to taste");
  });
});

describe("scaleIngredients", () => {
  it("scales all ingredients by a factor", () => {
    const ingredients = ["200g pasta", "100g cheese", "salt to taste"];
    const scaled = scaleIngredients(ingredients, 4, 2);
    expect(scaled).toEqual(["100g pasta", "50g cheese", "salt to taste"]);
  });
});
