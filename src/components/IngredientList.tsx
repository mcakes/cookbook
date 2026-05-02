import { useServings } from "../lib/servings-context";
import { scaleIngredients } from "../lib/scaling";

interface IngredientListProps {
  ingredients: string[];
}

export default function IngredientList({ ingredients }: IngredientListProps) {
  const { servings, setServings, baseServings } = useServings();
  const showScaler = baseServings !== undefined && baseServings > 0;

  const displayIngredients =
    showScaler && servings !== baseServings
      ? scaleIngredients(ingredients, baseServings!, servings)
      : ingredients;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-line">
        <h2 className="font-display text-lg font-medium text-ink">Ingredients</h2>
        {showScaler && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="w-6 h-6 rounded-full border border-line flex items-center justify-center hover:bg-tag transition-colors"
              aria-label="Fewer servings"
            >−</button>
            <span className="text-ink tabular-nums">{servings} servings</span>
            <button
              onClick={() => setServings(servings + 1)}
              className="w-6 h-6 rounded-full border border-line flex items-center justify-center hover:bg-tag transition-colors"
              aria-label="More servings"
            >+</button>
          </div>
        )}
      </div>
      <ul className="space-y-2 text-sm leading-relaxed">
        {displayIngredients.map((ingredient, i) => (
          <li key={i} className="text-ink">{ingredient}</li>
        ))}
      </ul>
    </div>
  );
}
