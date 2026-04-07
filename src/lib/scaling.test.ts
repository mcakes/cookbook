import { describe, it, expect } from "vitest";
import { parseQuantity, scaleIngredient, scaleIngredients } from "./scaling";

describe("parseQuantity", () => {
  it("parses simple numbers", () => {
    expect(parseQuantity("200g pasta")).toEqual({ quantity: 200, unit: "g", rest: "pasta" });
  });

  it("parses fractions", () => {
    expect(parseQuantity("1/2 tsp salt")).toEqual({ quantity: 0.5, unit: "tsp", rest: "salt" });
  });

  it("parses mixed numbers", () => {
    expect(parseQuantity("1 1/2 cups flour")).toEqual({ quantity: 1.5, unit: "cups", rest: "flour" });
  });

  it("parses unitless quantities", () => {
    expect(parseQuantity("3 eggs")).toEqual({ quantity: 3, unit: "", rest: "eggs" });
  });

  it("handles no quantity", () => {
    expect(parseQuantity("salt to taste")).toEqual({ quantity: null, unit: "", rest: "salt to taste" });
  });
});

describe("scaleIngredient", () => {
  it("scales a simple ingredient", () => {
    expect(scaleIngredient("200g pasta", 2)).toBe("400g pasta");
  });

  it("scales fractions", () => {
    expect(scaleIngredient("1/2 tsp salt", 2)).toBe("1 tsp salt");
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
