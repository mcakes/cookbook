import { useState, useEffect } from "react";
import type { RecipeIndex } from "../types/recipe";

export function useRecipeIndex() {
  const [index, setIndex] = useState<RecipeIndex>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/recipe-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: RecipeIndex) => {
        setIndex(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { index, loading, error };
}
