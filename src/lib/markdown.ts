import matter from "gray-matter";
import type { Recipe, RecipeFrontmatter } from "../types/recipe";

export function parseRecipe(markdown: string): Recipe {
  const { data, content } = matter(markdown);
  return {
    title: data.title,
    slug: data.slug,
    tags: data.tags ?? [],
    rating: data.rating,
    servings: data.servings,
    prep_time: data.prep_time,
    cook_time: data.cook_time,
    image: data.image,
    ingredients: data.ingredients ?? [],
    cook_log: (data.cook_log ?? []).map((entry: { date: string; notes?: string }) => ({
      date: typeof entry.date === "object" ? (entry.date as Date).toISOString().split("T")[0] : entry.date,
      notes: entry.notes ?? "",
    })),
    created: typeof data.created === "object" ? (data.created as Date).toISOString().split("T")[0] : data.created,
    updated: typeof data.updated === "object" ? (data.updated as Date).toISOString().split("T")[0] : data.updated,
    body: content.trim(),
  };
}

export function serializeRecipe(recipe: Recipe): string {
  const { body, ...frontmatter } = recipe;
  return matter.stringify(`\n${body}\n`, frontmatter);
}

export function extractFrontmatter(recipe: Recipe): RecipeFrontmatter {
  const { body, ...frontmatter } = recipe;
  return frontmatter;
}
