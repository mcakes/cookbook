import { useServings } from "../lib/servings-context";
import { scaleIngredients } from "../lib/scaling";
import type { NutritionRow } from "../lib/nutrition-types";

interface IngredientListProps {
  ingredients: string[];
  nutritionRows?: NutritionRow[];        // optional — undefined while loading
  onEditMatch?: (key: string) => void;   // open MatchPicker for this row
  canEdit?: boolean;                     // hides affordances for anon viewers
}

function fmt(n: number, digits = 0): string {
  return n.toFixed(digits).replace(/\.0+$/, "");
}

function rowSubline(row: NutritionRow): string {
  if (!row.values) return "";
  const v = row.values;
  return `${fmt(v.kcal)} kcal · ${fmt(v.protein_g, 1)} g P · ${fmt(v.fat_g, 1)} g F · ${fmt(v.carbs_g, 1)} g C`;
}

export default function IngredientList({
  ingredients, nutritionRows, onEditMatch, canEdit,
}: IngredientListProps) {
  const { servings, setServings, baseServings } = useServings();
  const showScaler = baseServings !== undefined && baseServings > 0;
  const factor = showScaler ? servings / (baseServings ?? 1) : 1;

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
            <button onClick={() => setServings(Math.max(1, servings - 1))}
              className="w-6 h-6 rounded-full border border-line flex items-center justify-center hover:bg-tag transition-colors"
              aria-label="Fewer servings">−</button>
            <span className="text-ink tabular-nums">{servings} servings</span>
            <button onClick={() => setServings(servings + 1)}
              className="w-6 h-6 rounded-full border border-line flex items-center justify-center hover:bg-tag transition-colors"
              aria-label="More servings">+</button>
          </div>
        )}
      </div>
      <ul className="space-y-3 text-sm leading-relaxed">
        {displayIngredients.map((ingredient, i) => {
          const row = nutritionRows?.[i];
          return (
            <li key={i} className="text-ink">
              <div>{ingredient}</div>
              {row && <Subline row={row} factor={factor} canEdit={!!canEdit} onEditMatch={onEditMatch} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Subline({
  row, factor, canEdit, onEditMatch,
}: { row: NutritionRow; factor: number; canEdit: boolean; onEditMatch?: (key: string) => void }) {
  const edit = canEdit && onEditMatch
    ? <button onClick={() => onEditMatch(row.key)}
        className="ml-2 text-xs text-muted hover:text-ink underline-offset-2 hover:underline">
        ✎
      </button>
    : null;

  switch (row.status) {
    case "ok":
    case "approximate": {
      const v = row.values!;
      const scaled = {
        ...v, kcal: v.kcal * factor, protein_g: v.protein_g * factor,
        fat_g: v.fat_g * factor, carbs_g: v.carbs_g * factor,
      };
      const prefix = row.status === "approximate" ? "≈ " : "";
      return (
        <div className="text-xs text-muted">
          {prefix}{rowSubline({ ...row, values: scaled })}
          {edit}
        </div>
      );
    }
    case "excluded":
      return <div className="text-xs text-muted">—</div>;
    case "no-weight":
      return (
        <div className="text-xs text-muted">
          {canEdit
            ? <button onClick={() => onEditMatch?.(row.key)} className="underline">set weight</button>
            : "—"}
        </div>
      );
    case "unmatched":
    case "no-food":
      return (
        <div className="text-xs text-muted">
          {canEdit
            ? <button onClick={() => onEditMatch?.(row.key)} className="underline">set match</button>
            : "—"}
        </div>
      );
  }
}
