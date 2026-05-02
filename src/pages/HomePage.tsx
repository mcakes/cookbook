import { useState, useMemo } from "react";
import { useRecipeIndex } from "../hooks/useRecipeIndex";
import RecipeCard from "../components/RecipeCard";
import RecipeFilter, {
  getAllTags,
  sortRecipes,
  type SortOption,
} from "../components/RecipeFilter";
import { createSearchIndex, textSearch } from "../lib/search";

export default function HomePage() {
  const { index, loading, error } = useRecipeIndex();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [query, setQuery] = useState("");

  const searchIndex = useMemo(() => createSearchIndex(index), [index]);
  const allTags = useMemo(() => getAllTags(index), [index]);

  const filtered = useMemo(() => {
    let recipes = query ? textSearch(searchIndex, query) : index;
    if (selectedTag) {
      recipes = recipes.filter((r) => r.tags.includes(selectedTag));
    }
    return sortRecipes(recipes, sortBy);
  }, [index, searchIndex, query, selectedTag, sortBy]);

  if (loading) return <p className="text-muted">Loading recipes…</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes…"
          className="w-full bg-field border border-line rounded-md px-4 py-2.5 text-lg text-ink placeholder:text-muted focus:border-accent transition-colors"
        />
      </div>
      <RecipeFilter
        allTags={allTags}
        selectedTag={selectedTag}
        sortBy={sortBy}
        onTagChange={setSelectedTag}
        onSortChange={setSortBy}
      />
      {filtered.length === 0 ? (
        <p className="text-muted">No recipes found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
