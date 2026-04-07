import Fuse from "fuse.js";
import type { RecipeFrontmatter } from "../types/recipe";

type FuseIndex = Fuse<RecipeFrontmatter>;

export function createSearchIndex(recipes: RecipeFrontmatter[]): FuseIndex {
  return new Fuse(recipes, {
    keys: [
      { name: "title", weight: 2 },
      { name: "tags", weight: 1.5 },
      { name: "ingredients", weight: 1 },
    ],
    threshold: 0.4,
    includeScore: true,
  });
}

export function textSearch(
  index: FuseIndex,
  query: string
): RecipeFrontmatter[] {
  if (!query.trim()) return [];
  return index.search(query).map((result) => result.item);
}

export interface IngredientSearchResult extends RecipeFrontmatter {
  matchCount: number;
  missing: string[];
}

export function ingredientSearch(
  recipes: RecipeFrontmatter[],
  selectedIngredients: string[]
): IngredientSearchResult[] {
  if (selectedIngredients.length === 0) return [];

  const normalised = selectedIngredients.map((i) => i.toLowerCase());

  const results: IngredientSearchResult[] = recipes.map((recipe) => {
    let matchCount = 0;
    const missing: string[] = [];

    for (const ingredient of recipe.ingredients) {
      const lower = ingredient.toLowerCase();
      if (normalised.some((sel) => lower.includes(sel))) {
        matchCount++;
      } else {
        missing.push(ingredient);
      }
    }

    return { ...recipe, matchCount, missing };
  });

  return results
    .filter((r) => r.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);
}
