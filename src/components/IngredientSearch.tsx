import { useState } from "react";
import type { IngredientSearchResult } from "../lib/search";
import { Link } from "react-router-dom";

interface IngredientSearchProps {
  allIngredients: string[];
  results: IngredientSearchResult[];
  onSelectionChange: (selected: string[]) => void;
}

export default function IngredientSearch({
  allIngredients,
  results,
  onSelectionChange,
}: IngredientSearchProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const suggestions = input.trim()
    ? allIngredients.filter(
        (ing) =>
          ing.toLowerCase().includes(input.toLowerCase()) &&
          !selected.includes(ing)
      ).slice(0, 8)
    : [];

  const addIngredient = (ing: string) => {
    const updated = [...selected, ing];
    setSelected(updated);
    onSelectionChange(updated);
    setInput("");
  };

  const removeIngredient = (ing: string) => {
    const updated = selected.filter((s) => s !== ing);
    setSelected(updated);
    onSelectionChange(updated);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((ing) => (
            <span
              key={ing}
              className="text-sm px-2.5 py-1 rounded-full bg-accent text-paper cursor-pointer hover:bg-accent-hover transition-colors"
              onClick={() => removeIngredient(ing)}
            >
              {ing} ×
            </span>
          ))}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type an ingredient..."
          className="w-full bg-field border border-line rounded-md px-3 py-2"
        />
        {suggestions.length > 0 && (
          <div className="border border-line rounded-md mt-1 max-h-48 overflow-y-auto">
            {suggestions.map((ing) => (
              <button
                key={ing}
                onClick={() => addIngredient(ing)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-wash"
              >
                {ing}
              </button>
            ))}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <Link
              key={r.slug}
              to={`/recipe/${r.slug}`}
              className="block p-4 bg-paper rounded-md border border-panel-line transition-colors hover:border-accent"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display text-lg text-ink">{r.title}</h3>
                  <p className="text-sm text-accent mt-1">
                    {r.matchCount} ingredient{r.matchCount !== 1 ? "s" : ""} matched
                  </p>
                </div>
                {r.missing.length > 0 && (
                  <p className="text-xs text-muted">
                    Missing: {r.missing.slice(0, 3).join(", ")}
                    {r.missing.length > 3 && ` +${r.missing.length - 3} more`}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
