import { useState } from "react";
import { scaleIngredients } from "../lib/scaling";

interface IngredientListProps {
  ingredients: string[];
  baseServings?: number;
}

export default function IngredientList({ ingredients, baseServings }: IngredientListProps) {
  const [servings, setServings] = useState(baseServings ?? 0);
  const showScaler = baseServings !== undefined && baseServings > 0;

  const displayIngredients =
    showScaler && servings !== baseServings
      ? scaleIngredients(ingredients, baseServings!, servings)
      : ingredients;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold">Ingredients</h2>
        {showScaler && (
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"
            >
              -
            </button>
            <span className="font-medium">{servings} servings</span>
            <button
              onClick={() => setServings(servings + 1)}
              className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"
            >
              +
            </button>
          </div>
        )}
      </div>
      <ul className="space-y-1.5">
        {displayIngredients.map((ingredient, i) => (
          <li key={i} className="text-gray-700 pl-4 border-l-2 border-gray-200">
            {ingredient}
          </li>
        ))}
      </ul>
    </div>
  );
}
