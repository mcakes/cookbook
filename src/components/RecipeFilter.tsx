import type { RecipeFrontmatter } from "../types/recipe";

export type SortOption = "recent" | "rating" | "newest" | "alpha";

interface RecipeFilterProps {
  allTags: string[];
  selectedTag: string | null;
  sortBy: SortOption;
  onTagChange: (tag: string | null) => void;
  onSortChange: (sort: SortOption) => void;
}

export function getAllTags(recipes: RecipeFrontmatter[]): string[] {
  const tagSet = new Set<string>();
  recipes.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

export function sortRecipes(
  recipes: RecipeFrontmatter[],
  sortBy: SortOption
): RecipeFrontmatter[] {
  const sorted = [...recipes];
  switch (sortBy) {
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "newest":
      return sorted.sort((a, b) => b.created.localeCompare(a.created));
    case "alpha":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "recent":
      return sorted.sort((a, b) => {
        const aDate = a.cook_log.length ? a.cook_log[0].date : a.updated;
        const bDate = b.cook_log.length ? b.cook_log[0].date : b.updated;
        return bDate.localeCompare(aDate);
      });
  }
}

export default function RecipeFilter({
  allTags,
  selectedTag,
  sortBy,
  onTagChange,
  onSortChange,
}: RecipeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <select
        value={selectedTag ?? ""}
        onChange={(e) => onTagChange(e.target.value || null)}
        className="border rounded-md px-3 py-1.5 text-sm"
      >
        <option value="">All tags</option>
        {allTags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="border rounded-md px-3 py-1.5 text-sm"
      >
        <option value="recent">Recently cooked</option>
        <option value="rating">Highest rated</option>
        <option value="newest">Newest</option>
        <option value="alpha">A-Z</option>
      </select>
    </div>
  );
}
