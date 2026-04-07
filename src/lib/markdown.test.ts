import { describe, it, expect } from "vitest";
import { parseRecipe, serializeRecipe } from "./markdown";

const SAMPLE_MD = `---
title: "Test Recipe"
slug: test-recipe
tags: [italian, pasta]
rating: 4
servings: 2
prep_time: 10
cook_time: 20
image: test.jpg
ingredients:
  - 200g pasta
  - 100g cheese
cook_log:
  - date: "2026-01-15"
    notes: "Great first attempt"
created: "2026-01-10"
updated: "2026-01-15"
---

## Method

1. Boil pasta
2. Add cheese

## Notes

- Use parmesan for best results
`;

describe("parseRecipe", () => {
  it("parses frontmatter and body from markdown", () => {
    const recipe = parseRecipe(SAMPLE_MD);
    expect(recipe.title).toBe("Test Recipe");
    expect(recipe.slug).toBe("test-recipe");
    expect(recipe.tags).toEqual(["italian", "pasta"]);
    expect(recipe.rating).toBe(4);
    expect(recipe.servings).toBe(2);
    expect(recipe.prep_time).toBe(10);
    expect(recipe.cook_time).toBe(20);
    expect(recipe.image).toBe("test.jpg");
    expect(recipe.ingredients).toEqual(["200g pasta", "100g cheese"]);
    expect(recipe.cook_log).toEqual([
      { date: "2026-01-15", notes: "Great first attempt" },
    ]);
    expect(recipe.body).toContain("## Method");
    expect(recipe.body).toContain("Boil pasta");
  });

  it("handles missing optional fields", () => {
    const minimal = `---
title: "Minimal"
slug: minimal
tags: []
ingredients:
  - 1 egg
cook_log: []
created: "2026-01-01"
updated: "2026-01-01"
---

Crack egg.
`;
    const recipe = parseRecipe(minimal);
    expect(recipe.title).toBe("Minimal");
    expect(recipe.rating).toBeUndefined();
    expect(recipe.servings).toBeUndefined();
    expect(recipe.image).toBeUndefined();
  });
});

describe("serializeRecipe", () => {
  it("round-trips a recipe through parse and serialize", () => {
    const recipe = parseRecipe(SAMPLE_MD);
    const serialized = serializeRecipe(recipe);
    const reparsed = parseRecipe(serialized);
    expect(reparsed.title).toBe(recipe.title);
    expect(reparsed.slug).toBe(recipe.slug);
    expect(reparsed.tags).toEqual(recipe.tags);
    expect(reparsed.ingredients).toEqual(recipe.ingredients);
    expect(reparsed.body).toContain("Boil pasta");
  });
});
