import { describe, it, expect } from "vitest";
import { createSearchIndex, textSearch, ingredientSearch } from "./search";
import type { RecipeFrontmatter } from "../types/recipe";

const RECIPES: RecipeFrontmatter[] = [
  {
    title: "Chicken Tikka Masala",
    slug: "chicken-tikka-masala",
    tags: ["indian", "curry", "chicken"],
    rating: 4,
    servings: 4,
    prep_time: 20,
    cook_time: 35,
    ingredients: ["500g chicken breast", "200ml yoghurt", "400g tinned tomatoes", "1 onion", "garlic"],
    cook_log: [],
    created: "2026-01-01",
    updated: "2026-01-01",
  },
  {
    title: "Tomato Pasta",
    slug: "tomato-pasta",
    tags: ["italian", "pasta", "quick"],
    rating: 3,
    servings: 2,
    prep_time: 5,
    cook_time: 15,
    ingredients: ["200g pasta", "400g tinned tomatoes", "garlic", "basil"],
    cook_log: [],
    created: "2026-01-02",
    updated: "2026-01-02",
  },
  {
    title: "Garlic Bread",
    slug: "garlic-bread",
    tags: ["side", "quick"],
    rating: 5,
    servings: 4,
    prep_time: 5,
    cook_time: 10,
    ingredients: ["1 baguette", "butter", "garlic"],
    cook_log: [],
    created: "2026-01-03",
    updated: "2026-01-03",
  },
];

describe("textSearch", () => {
  it("finds recipes by title", () => {
    const index = createSearchIndex(RECIPES);
    const results = textSearch(index, "chicken");
    expect(results.map((r) => r.slug)).toContain("chicken-tikka-masala");
  });

  it("finds recipes by tag", () => {
    const index = createSearchIndex(RECIPES);
    const results = textSearch(index, "italian");
    expect(results.map((r) => r.slug)).toContain("tomato-pasta");
  });

  it("finds recipes by ingredient", () => {
    const index = createSearchIndex(RECIPES);
    const results = textSearch(index, "baguette");
    expect(results.map((r) => r.slug)).toContain("garlic-bread");
  });
});

describe("ingredientSearch", () => {
  it("ranks recipes by number of matching ingredients", () => {
    const results = ingredientSearch(RECIPES, ["garlic", "tomatoes"]);
    expect(results.length).toBe(3);
    expect(results[2].slug).toBe("garlic-bread");
    expect(results[2].matchCount).toBe(1);
  });

  it("returns missing ingredients for each recipe", () => {
    const results = ingredientSearch(RECIPES, ["garlic", "pasta"]);
    const pastaResult = results.find((r) => r.slug === "tomato-pasta")!;
    expect(pastaResult.matchCount).toBe(2);
    expect(pastaResult.missing.length).toBeGreaterThan(0);
    expect(pastaResult.missing).toContain("400g tinned tomatoes");
  });
});
