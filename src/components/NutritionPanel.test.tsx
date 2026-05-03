// src/components/NutritionPanel.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServingsProvider } from "../lib/servings-context";
import NutritionPanel from "./NutritionPanel";
import type { NutritionRow, NutritionTotals } from "../lib/nutrition-types";

const totals: NutritionTotals = {
  kcal: 2080, protein_g: 152, fat_g: 88, sat_fat_g: 32,
  carbs_g: 164, sugar_g: 16, fibre_g: 24, sodium_mg: 2880,
  unmatchedCount: 0,
};
const rows: NutritionRow[] = [];

describe("NutritionPanel", () => {
  it("shows per-serving values by default", () => {
    render(
      <ServingsProvider baseServings={4}>
        <NutritionPanel rows={rows} totals={totals} />
      </ServingsProvider>
    );
    expect(screen.getByText(/520 kcal/)).toBeInTheDocument(); // 2080/4
    expect(screen.getByText(/Per serving/)).toBeInTheDocument();
  });

  it("toggles to per-recipe", () => {
    render(
      <ServingsProvider baseServings={4}>
        <NutritionPanel rows={rows} totals={totals} />
      </ServingsProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /per recipe/i }));
    expect(screen.getByText(/2080 kcal/)).toBeInTheDocument();
  });

  it("shows unmatched count when present", () => {
    const t = { ...totals, unmatchedCount: 2 };
    render(
      <ServingsProvider baseServings={4}>
        <NutritionPanel rows={rows} totals={t} />
      </ServingsProvider>
    );
    expect(screen.getByText(/2 ingredients unmatched/i)).toBeInTheDocument();
  });

  it("falls back to per-recipe when servings is missing", () => {
    render(
      <ServingsProvider baseServings={undefined}>
        <NutritionPanel rows={rows} totals={totals} />
      </ServingsProvider>
    );
    expect(screen.getByText(/2080 kcal/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /per serving/i })).not.toBeInTheDocument();
  });
});
