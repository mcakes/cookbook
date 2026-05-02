// src/hooks/useNutritionData.ts
import { useEffect, useState } from "react";
import type { Food, Mappings } from "../lib/nutrition-types";

interface NutritionData {
  foods: Food[] | null;
  mappings: Mappings;
  mappingsSha: string | null;
  loading: boolean;
  error: string | null;
  setMappings: (m: Mappings, sha: string | null) => void;
}

let cache: { foods: Food[]; mappings: Mappings; mappingsSha: string | null } | null = null;
let inflight: Promise<void> | null = null;

async function loadOnce(): Promise<typeof cache> {
  if (cache) return cache;
  if (!inflight) {
    inflight = (async () => {
      const manifestRes = await fetch("/nutrition/manifest.json");
      if (!manifestRes.ok) throw new Error(`manifest: ${manifestRes.status}`);
      const manifest = await manifestRes.json();
      const foodsRes = await fetch(`/nutrition/${manifest.foodsPath}`);
      if (!foodsRes.ok) throw new Error(`foods: ${foodsRes.status}`);
      const foods: Food[] = await foodsRes.json();
      const mapsRes = await fetch("/data/nutrition-mappings.json");
      const mappings: Mappings = mapsRes.ok ? await mapsRes.json() : {};
      cache = { foods, mappings, mappingsSha: null };
    })();
  }
  await inflight;
  return cache;
}

export function useNutritionData(): NutritionData {
  const [, force] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    if (cache) { setLoading(false); return; }
    loadOnce()
      .then(() => { setLoading(false); force((n) => n + 1); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, []);

  const setMappings = (m: Mappings, sha: string | null) => {
    if (cache) { cache.mappings = m; cache.mappingsSha = sha; }
    force((n) => n + 1);
  };

  return {
    foods: cache?.foods ?? null,
    mappings: cache?.mappings ?? {},
    mappingsSha: cache?.mappingsSha ?? null,
    loading, error, setMappings,
  };
}
