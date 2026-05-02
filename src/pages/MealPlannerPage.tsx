import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useRecipeIndex } from "../hooks/useRecipeIndex";
import { getMealPlan, setMealPlan, clearMealPlan, type MealPlan } from "../lib/meal-plan";
import { aggregateIngredients } from "../lib/ingredient-aggregator";
import ShoppingList from "../components/ShoppingList";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export default function MealPlannerPage() {
  const { index, loading } = useRecipeIndex();
  const [plan, setPlanState] = useState<MealPlan>(getMealPlan);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const updatePlan = (updated: MealPlan) => {
    setPlanState(updated);
    setMealPlan(updated);
  };

  const addRecipe = (day: string, slug: string) => {
    const updated = {
      ...plan,
      days: { ...plan.days, [day]: [...plan.days[day as keyof typeof plan.days], slug] },
    };
    updatePlan(updated);
    setAddingTo(null);
    setSearchQuery("");
  };

  const removeRecipe = (day: string, index: number) => {
    const dayRecipes = [...plan.days[day as keyof typeof plan.days]];
    dayRecipes.splice(index, 1);
    updatePlan({ ...plan, days: { ...plan.days, [day]: dayRecipes } });
  };

  const handleClear = () => {
    clearMealPlan();
    setPlanState(getMealPlan());
  };

  const recipeMap = useMemo(() => {
    const map = new Map<string, string>();
    index.forEach((r) => map.set(r.slug, r.title));
    return map;
  }, [index]);

  const shoppingItems = useMemo(() => {
    const items: string[] = [];
    for (const day of DAYS) {
      for (const slug of plan.days[day]) {
        const recipe = index.find((r) => r.slug === slug);
        if (recipe) items.push(...recipe.ingredients);
      }
    }
    return aggregateIngredients(items);
  }, [plan, index]);

  const filteredRecipes = searchQuery.trim()
    ? index.filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : index;

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meal Planner</h1>
        <button onClick={handleClear} className="text-sm text-muted hover:text-danger">
          Clear week
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-8">
        {DAYS.map((day) => (
          <div key={day} className="bg-paper rounded-lg p-3 shadow-sm min-h-[120px]">
            <h3 className="font-semibold text-sm text-muted mb-2">{DAY_LABELS[day]}</h3>
            <div className="space-y-1">
              {plan.days[day].map((slug, i) => (
                <div key={i} className="text-xs flex justify-between items-start group">
                  <Link to={`/recipe/${slug}`} className="text-accent hover:underline">
                    {recipeMap.get(slug) ?? slug}
                  </Link>
                  <button
                    onClick={() => removeRecipe(day, i)}
                    className="text-line group-hover:text-danger ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setAddingTo(addingTo === day ? null : day)}
              className="text-xs text-accent hover:text-accent-hover mt-2"
            >
              + Add
            </button>
            {addingTo === day && (
              <div className="mt-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-field border border-line rounded px-2 py-1 text-xs"
                  autoFocus
                />
                <div className="max-h-32 overflow-y-auto mt-1">
                  {filteredRecipes.slice(0, 5).map((r) => (
                    <button
                      key={r.slug}
                      onClick={() => addRecipe(day, r.slug)}
                      className="block w-full text-left text-xs px-2 py-1 hover:bg-tag"
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ShoppingList items={shoppingItems} />
    </div>
  );
}
