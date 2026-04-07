import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useRecipeIndex } from "../hooks/useRecipeIndex";
import { createSearchIndex, textSearch, ingredientSearch } from "../lib/search";
import SearchBar from "../components/SearchBar";
import IngredientSearch from "../components/IngredientSearch";
import StarRating from "../components/StarRating";

type SearchMode = "text" | "ingredient";

export default function SearchPage() {
  const { index, loading } = useRecipeIndex();
  const [mode, setMode] = useState<SearchMode>("text");
  const [query, setQuery] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const fuseIndex = useMemo(() => createSearchIndex(index), [index]);

  const textResults = useMemo(
    () => (query ? textSearch(fuseIndex, query) : []),
    [fuseIndex, query]
  );

  const ingredientResults = useMemo(
    () => ingredientSearch(index, selectedIngredients),
    [index, selectedIngredients]
  );

  const allIngredients = useMemo(() => {
    const set = new Set<string>();
    index.forEach((r) => r.ingredients.forEach((i) => {
      const name = i.replace(/^[\d\s/]+\s*(g|kg|ml|l|tsp|tbsp|cups?|oz|lbs?|pinch)?\s*/i, "").trim();
      if (name) set.add(name.toLowerCase());
    }));
    return Array.from(set).sort();
  }, [index]);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode("text")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            mode === "text"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Text Search
        </button>
        <button
          onClick={() => setMode("ingredient")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            mode === "ingredient"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          By Ingredient
        </button>
      </div>

      {mode === "text" ? (
        <div>
          <SearchBar value={query} onChange={setQuery} />
          {textResults.length > 0 && (
            <div className="mt-4 space-y-3">
              {textResults.map((r) => (
                <Link
                  key={r.slug}
                  to={`/recipe/${r.slug}`}
                  className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md"
                >
                  <h3 className="font-semibold">{r.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    {r.rating !== undefined && <StarRating rating={r.rating} />}
                    <span>{r.tags.join(", ")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {query && textResults.length === 0 && (
            <p className="text-gray-500 mt-4">No results for "{query}"</p>
          )}
        </div>
      ) : (
        <IngredientSearch
          allIngredients={allIngredients}
          results={ingredientResults}
          onSelectionChange={setSelectedIngredients}
        />
      )}
    </div>
  );
}
