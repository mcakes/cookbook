import { describe, it, expect } from "vitest";
import { aggregateIngredients } from "./ingredient-aggregator";

describe("aggregateIngredients", () => {
  it("sums repeated count ingredients", () => {
    const result = aggregateIngredients([
      "1 whole chicken", "2 bay leaves", "1 whole chicken", "2 bay leaves",
    ]);
    expect(result).toEqual(["2 whole chicken", "4 bay leaves"]);
  });

  it("aggregates plural variants under one key, first-seen name wins", () => {
    expect(aggregateIngredients(["2 white onions", "1 white onion"]))
      .toEqual(["3 white onions"]);
    expect(aggregateIngredients(["1 white onion", "2 white onions"]))
      .toEqual(["3 white onion"]);
  });

  it("merges fractions and mixed numbers", () => {
    expect(aggregateIngredients(["1 1/2 tablespoons rice vinegar", "2 tablespoons rice vinegar"]))
      .toEqual(["3 1/2 tbsp rice vinegar"]);
  });

  it("merges across volume units, displaying the most-used unit", () => {
    expect(aggregateIngredients([
      "3 tablespoons extra-virgin olive oil, divided",
      "1/4 cup (60 ml) extra-virgin olive oil",
      "3 tablespoons extra-virgin olive oil, plus more for finishing",
    ])).toEqual(["10 tbsp extra-virgin olive oil"]);
  });

  it("merges attached metric units, ties broken by the smaller unit", () => {
    expect(aggregateIngredients(["200g pasta", "1/2 kg pasta"]))
      .toEqual(["700 g pasta"]);
  });

  it("prefers the smaller unit on cross-recipe ties", () => {
    expect(aggregateIngredients([
      "3 tablespoons extra-virgin olive oil, divided",
      "1/4 cup (60 ml) extra-virgin olive oil",
    ])).toEqual(["7 tbsp extra-virgin olive oil"]);
  });

  it("keeps counts and masses of the same ingredient on separate lines", () => {
    expect(aggregateIngredients(["2 lemons", "200g lemons"]))
      .toEqual(["2 lemons", "200 g lemons"]);
  });

  it("drops prep notes from merged lines", () => {
    expect(aggregateIngredients([
      "1 large yellow onion, finely diced",
      "1 large yellow onion, thinly sliced",
    ])).toEqual(["2 large yellow onion"]);
  });

  it("shows a multiplier for repeated unquantified ingredients", () => {
    expect(aggregateIngredients(["Corn or flour tortillas", "Corn or flour tortillas"]))
      .toEqual(["Corn or flour tortillas ×2"]);
    expect(aggregateIngredients(["Salt to taste"])).toEqual(["Salt to taste"]);
  });

  it("counts unquantified occurrences as 1 when grouped with numeric ones", () => {
    expect(aggregateIngredients(["2 lemons", "lemon"])).toEqual(["3 lemons"]);
  });

  it("does not emit a phantom count line for unquantified duplicates of a weighed ingredient", () => {
    expect(aggregateIngredients(["200g lemons", "lemon"])).toEqual(["200 g lemons"]);
  });

  it("preserves first-seen order", () => {
    expect(aggregateIngredients([
      "1 whole chicken", "2 bay leaves", "5 cloves garlic", "1 whole chicken",
    ])).toEqual(["2 whole chicken", "2 bay leaves", "5 cloves garlic"]);
  });
});
