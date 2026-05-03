// src/components/MatchPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MatchPicker from "./MatchPicker";
import type { Food } from "../lib/nutrition-types";

const foods: Food[] = [
  { id: "fdc:1", name: "Tomatillos, raw", aliases: ["tomatillo", "tomatillos"],
    per100g: { kcal: 32, protein_g: 1, fat_g: 1, sat_fat_g: 0, carbs_g: 6, sugar_g: 4, fibre_g: 2, sodium_mg: 1 },
    defaultPiece: { unit: "tomatillo", grams: 34 } },
  { id: "fdc:2", name: "Tomato, raw", aliases: ["tomato", "tomatoes"],
    per100g: { kcal: 18, protein_g: 1, fat_g: 0, sat_fat_g: 0, carbs_g: 4, sugar_g: 3, fibre_g: 1, sodium_mg: 5 } },
];

describe("MatchPicker", () => {
  it("shows fuzzy matches for the prefilled key", () => {
    render(<MatchPicker mappingKey="tomatillos" foods={foods} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/Tomatillos, raw/)).toBeInTheDocument();
  });

  it("calls onSave with confirm-match shape", () => {
    const onSave = vi.fn();
    render(<MatchPicker mappingKey="tomatillos" foods={foods} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText(/Tomatillos, raw/));
    fireEvent.click(screen.getByRole("button", { name: /confirm match/i }));
    expect(onSave).toHaveBeenCalledWith({
      foodId: "fdc:1", confirmed: true, source: "manual",
    });
  });

  it("calls onSave with exclude shape", () => {
    const onSave = vi.fn();
    render(<MatchPicker mappingKey="salt to taste" foods={foods} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /exclude from nutrition/i }));
    expect(onSave).toHaveBeenCalledWith({
      foodId: null, exclude: true, confirmed: true, source: "manual",
    });
  });

  it("calls onSave with pieceOverride shape", () => {
    const onSave = vi.fn();
    render(<MatchPicker mappingKey="whole chicken" foods={foods} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText(/Tomatillos, raw/)); // pretend it's a chicken; UI doesn't validate
    fireEvent.change(screen.getByLabelText(/grams per item/i), { target: { value: "1500" } });
    fireEvent.click(screen.getByRole("button", { name: /confirm match/i }));
    expect(onSave).toHaveBeenCalledWith({
      foodId: "fdc:1", confirmed: true, source: "manual",
      pieceOverride: { unit: "", grams: 1500 },
    });
  });
});
