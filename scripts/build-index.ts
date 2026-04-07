import fs from "fs";
import path from "path";
import matter from "gray-matter";

const recipesDir = path.resolve(import.meta.dirname, "../recipes");
const outputPath = path.resolve(import.meta.dirname, "../public/recipe-index.json");

const files = fs.readdirSync(recipesDir).filter((f) => f.endsWith(".md"));

const index = files.map((file) => {
  const content = fs.readFileSync(path.join(recipesDir, file), "utf-8");
  const { data } = matter(content);

  const normaliseDate = (d: unknown): string => {
    if (d instanceof Date) return d.toISOString().split("T")[0];
    return String(d);
  };

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
    cook_log: (data.cook_log ?? []).map((entry: { date: unknown; notes?: string }) => ({
      date: normaliseDate(entry.date),
      notes: entry.notes ?? "",
    })),
    created: normaliseDate(data.created),
    updated: normaliseDate(data.updated),
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));

console.log(`Built recipe index: ${index.length} recipes → ${outputPath}`);
