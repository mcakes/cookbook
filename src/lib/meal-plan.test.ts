import { describe, it, expect, beforeEach } from "vitest";
import { getMealPlan, setMealPlan, clearMealPlan, type MealPlan } from "./meal-plan";

describe("meal-plan persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns an empty plan when none is saved", () => {
    const plan = getMealPlan();
    expect(Object.keys(plan.days)).toHaveLength(7);
    expect(plan.days.monday).toEqual([]);
  });

  it("saves and retrieves a meal plan", () => {
    const plan: MealPlan = {
      weekStart: "2026-04-06",
      days: {
        monday: ["chicken-tikka-masala"],
        tuesday: [],
        wednesday: ["tomato-pasta"],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
    };
    setMealPlan(plan);
    expect(getMealPlan()).toEqual(plan);
  });

  it("clears the meal plan", () => {
    setMealPlan({
      weekStart: "2026-04-06",
      days: {
        monday: ["test"],
        tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
      },
    });
    clearMealPlan();
    expect(getMealPlan().days.monday).toEqual([]);
  });
});
