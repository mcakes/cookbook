import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useRecipeIndex } from "../hooks/useRecipeIndex";
import { createSearchIndex, textSearch, ingredientSearch } from "../lib/search";
import { parseIngredient } from "../lib/ingredient-parser";
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
      const name = parseIngredient(i).name.trim();
      if (name) set.add(name.toLowerCase());
    }));
    return Array.from(set).sort();
  }, [index]);

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode("text")}
          className={`px-4 py-1.5 rounded-full text-xs tracking-wide border transition-colors ${
            mode === "text"
              ? "bg-accent border-accent text-paper"
              : "bg-transparent border-line text-tag-ink hover:border-accent hover:text-accent"
          }`}
        >
          Text Search
        </button>
        <button
          onClick={() => setMode("ingredient")}
          className={`px-4 py-1.5 rounded-full text-xs tracking-wide border transition-colors ${
            mode === "ingredient"
              ? "bg-accent border-accent text-paper"
              : "bg-transparent border-line text-tag-ink hover:border-accent hover:text-accent"
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
                  className="block p-4 bg-paper rounded-md border border-panel-line transition-colors hover:border-accent"
                >
                  <h3 className="font-display text-lg text-ink">{r.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted">
                    {r.rating !== undefined && <StarRating rating={r.rating} />}
                    <span>{r.tags.join(", ")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {query && textResults.length === 0 && (
            <p className="text-muted mt-4">No results for "{query}"</p>
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
