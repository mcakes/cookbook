import { describe, it, expect } from "vitest";
import { aggregateIngredients } from "./ingredient-aggregator";

describe("aggregateIngredients", () => {
  it("sums quantities when the same ingredient string appears multiple times", () => {
    const result = aggregateIngredients([
      "1 whole chicken",
      "2 bay leaves",
      "1 whole chicken",
      "2 bay leaves",
    ]);
    expect(result).toEqual(["2 whole chicken", "4 bay leaves"]);
  });

  it("aggregates across different recipes when keys match (plural-aware)", () => {
    const result = aggregateIngredients([
      "2 white onions",
      "1 white onion",
    ]);
    expect(result).toEqual(["3 white onions"]);
  });

  it("preserves the first-seen rest form when totalling", () => {
    const result = aggregateIngredients([
      "1 white onion",
      "2 white onions",
    ]);
    expect(result).toEqual(["3 white onion"]);
  });

  it("shows a count multiplier for repeated ingredients without a leading number", () => {
    const result = aggregateIngredients([
      "Corn or flour tortillas",
      "Corn or flour tortillas",
    ]);
    expect(result).toEqual(["Corn or flour tortillas ×2"]);
  });

  it("does not append a multiplier when the count is 1", () => {
    const result = aggregateIngredients(["Salt to taste"]);
    expect(result).toEqual(["Salt to taste"]);
  });

  it("treats non-numeric occurrences as quantity 1 when grouped with numeric ones", () => {
    const result = aggregateIngredients([
      "2 lemons",
      "lemon",
    ]);
    expect(result).toEqual(["3 lemons"]);
  });

  it("preserves first-seen order across the output", () => {
    const result = aggregateIngredients([
      "1 whole chicken",
      "2 bay leaves",
      "5 cloves garlic",
      "1 whole chicken",
    ]);
    expect(result).toEqual(["2 whole chicken", "2 bay leaves", "5 cloves garlic"]);
  });
});
