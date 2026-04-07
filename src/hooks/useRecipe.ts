import { useState, useEffect } from "react";
import type { Recipe } from "../types/recipe";
import { github } from "../lib/github-instance";
import { parseRecipe } from "../lib/markdown";
import { useAuth } from "./useAuth";

export function useRecipe(slug: string | undefined) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    github
      .fetchRecipeFile(slug, token)
      .then(({ content, sha }) => {
        setRecipe(parseRecipe(content));
        setSha(sha);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug, token]);

  return { recipe, sha, loading, error };
}
