// src/components/MatchPicker.tsx
import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import type { Food, IngredientMapping } from "../lib/nutrition-types";

interface Props {
  mappingKey: string;
  foods: Food[];
  onSave: (mapping: IngredientMapping) => void;
  onClose: () => void;
}

export default function MatchPicker({ mappingKey, foods, onSave, onClose }: Props) {
  const [query, setQuery] = useState(mappingKey);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pieceGrams, setPieceGrams] = useState<string>("");

  const fuse = useMemo(
    () => new Fuse(foods, { keys: ["aliases", "name"], threshold: 0.4, includeScore: true }),
    [foods]
  );
  const results = useMemo(() => {
    const hits = fuse.search(query, { limit: 8 }).map((r) => r.item);
    return hits.length > 0 ? hits : foods.slice(0, 8);
  }, [fuse, query, foods]);

  function handleConfirm() {
    if (!selectedId) return;
    const mapping: IngredientMapping = {
      foodId: selectedId, confirmed: true, source: "manual",
    };
    if (pieceGrams) {
      mapping.pieceOverride = { unit: "", grams: parseFloat(pieceGrams) };
    }
    onSave(mapping);
  }

  function handleExclude() {
    onSave({ foodId: null, exclude: true, confirmed: true, source: "manual" });
  }

  return (
    <div role="dialog" aria-label="Match ingredient" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-paper border border-line rounded-md w-full max-w-md p-5">
        <header className="mb-3">
          <h3 className="font-display text-base font-medium text-ink">Match: {mappingKey}</h3>
        </header>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-line rounded px-2 py-1 mb-3 text-sm"
          aria-label="Search foods"
        />
        <ul className="max-h-48 overflow-y-auto mb-3 border border-line rounded">
          {results.map((food) => (
            <li key={food.id}>
              <button
                onClick={() => setSelectedId(food.id)}
                className={`w-full text-left px-2 py-1 text-sm hover:bg-wash ${
                  selectedId === food.id ? "bg-wash" : ""
                }`}
              >
                {food.name}
              </button>
            </li>
          ))}
        </ul>
        <label className="block text-xs text-muted mb-3">
          Grams per item (optional, for counted ingredients)
          <input
            type="number"
            value={pieceGrams}
            onChange={(e) => setPieceGrams(e.target.value)}
            className="ml-2 w-24 border border-line rounded px-2 py-0.5 text-sm"
            aria-label="grams per item"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-3 py-1 text-muted hover:text-ink">
            Cancel
          </button>
          <button onClick={handleExclude} className="text-sm px-3 py-1 border border-line rounded">
            Exclude from nutrition
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="text-sm px-3 py-1 border border-line rounded bg-wash disabled:opacity-50"
          >
            Confirm match
          </button>
        </div>
      </div>
    </div>
  );
}
