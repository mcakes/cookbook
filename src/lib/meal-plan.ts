const STORAGE_KEY = "cookbook_meal_plan";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface MealPlan {
  weekStart: string;
  days: Record<DayOfWeek, string[]>;
}

function emptyPlan(): MealPlan {
  return {
    weekStart: "",
    days: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  };
}

export function getMealPlan(): MealPlan {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return emptyPlan();
  try {
    return JSON.parse(stored) as MealPlan;
  } catch {
    return emptyPlan();
  }
}

export function setMealPlan(plan: MealPlan): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

export function clearMealPlan(): void {
  localStorage.removeItem(STORAGE_KEY);
}
