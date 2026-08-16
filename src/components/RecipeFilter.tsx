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
  const chipBase =
    "rounded-full px-3 py-1 text-xs tracking-wide border transition-colors";
  const inactive =
    "bg-transparent border-line text-tag-ink hover:border-accent hover:text-accent";
  const active =
    "bg-accent border-accent text-paper";

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onTagChange(null)}
          className={`${chipBase} ${selectedTag === null ? active : inactive}`}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onTagChange(tag)}
            className={`${chipBase} ${selectedTag === tag ? active : inactive}`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="ml-auto">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="bg-field border border-line rounded-md px-3 py-1.5 text-sm text-ink"
        >
          <option value="recent">Recently cooked</option>
          <option value="rating">Highest rated</option>
          <option value="newest">Newest</option>
          <option value="alpha">A–Z</option>
        </select>
      </div>
    </div>
  );
}
