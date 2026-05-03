// src/components/NutritionPanel.tsx
import { useState } from "react";
import { useServings } from "../lib/servings-context";
import type { NutritionRow, NutritionTotals } from "../lib/nutrition-types";

interface Props {
  rows: NutritionRow[];
  totals: NutritionTotals;
}

function fmt(n: number, digits = 0): string {
  return n.toFixed(digits).replace(/\.0+$/, "");
}

export default function NutritionPanel({ rows: _rows, totals }: Props) {
  const { servings, baseServings } = useServings();
  const canPerServing = baseServings !== undefined && baseServings > 0;
  const [mode, setMode] = useState<"per-serving" | "per-recipe">(
    canPerServing ? "per-serving" : "per-recipe"
  );

  // Per-serving = totals / baseServings (invariant under slider — per-serving stays constant).
  // Per-recipe   = totals * (servings / baseServings) — scales with the slider.
  const display = canPerServing && mode === "per-serving"
    ? scale(totals, 1 / (baseServings ?? 1))
    : canPerServing
    ? scale(totals, servings / (baseServings ?? 1))
    : totals;

  return (
    <section className="bg-paper border border-line rounded-md p-5 mb-6" aria-label="Nutrition">
      <header className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base font-medium text-ink">
          {mode === "per-serving" ? `Per serving (${servings})` : "Per recipe"}
        </h2>
        {canPerServing && (
          <button
            onClick={() => setMode(mode === "per-serving" ? "per-recipe" : "per-serving")}
            className="text-xs text-muted hover:text-ink"
          >
            {mode === "per-serving" ? "Per recipe ▾" : "Per serving ▾"}
          </button>
        )}
      </header>
      <div className="text-sm text-ink leading-relaxed tabular-nums">
        <div className="text-lg font-medium">{fmt(display.kcal)} kcal</div>
        <div>
          {fmt(display.protein_g, 1)} g protein
          {"  ·  "}
          {fmt(display.fat_g, 1)} g fat ({fmt(display.sat_fat_g, 1)} g sat)
        </div>
        <div>
          {fmt(display.carbs_g, 1)} g carbs ({fmt(display.sugar_g, 1)} g sugar)
          {"  ·  "}
          {fmt(display.fibre_g, 1)} g fibre
        </div>
        <div>{fmt(display.sodium_mg)} mg sodium</div>
      </div>
      {totals.unmatchedCount > 0 && (
        <p className="mt-3 text-xs text-muted italic">
          {totals.unmatchedCount} {totals.unmatchedCount === 1 ? "ingredient" : "ingredients"} unmatched
        </p>
      )}
    </section>
  );
}

function scale(t: NutritionTotals, f: number): NutritionTotals {
  return {
    kcal: t.kcal * f, protein_g: t.protein_g * f, fat_g: t.fat_g * f,
    sat_fat_g: t.sat_fat_g * f, carbs_g: t.carbs_g * f, sugar_g: t.sugar_g * f,
    fibre_g: t.fibre_g * f, sodium_mg: t.sodium_mg * f,
    unmatchedCount: t.unmatchedCount,
  };
}
