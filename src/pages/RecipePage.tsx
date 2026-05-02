import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useRecipe } from "../hooks/useRecipe";
import { useAuth } from "../hooks/useAuth";
import StarRating from "../components/StarRating";
import TagList from "../components/TagList";
import IngredientList from "../components/IngredientList";
import CookLog from "../components/CookLog";
import MarkdownPreview from "../components/MarkdownPreview";
import MatchPicker from "../components/MatchPicker";
import { github } from "../lib/github-instance";
import type { IngredientMapping, Mappings } from "../lib/nutrition-types";
import { ServingsProvider } from "../lib/servings-context";
import NutritionPanel from "../components/NutritionPanel";
import { useNutritionData } from "../hooks/useNutritionData";
import { computeRecipeNutrition } from "../lib/nutrition";

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  const { recipe, loading, error } = useRecipe(slug);
  const { token, authenticated } = useAuth();
  const { foods, mappings, mappingsSha, loading: nutLoading, error: nutError, setMappings } = useNutritionData();
  const [editKey, setEditKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inFlightRef = useRef<Promise<unknown> | null>(null);
  const pendingRef = useRef<Mappings | null>(null);
  const mappingsShaRef = useRef<string | null>(mappingsSha);

  useEffect(() => {
    mappingsShaRef.current = mappingsSha;
  }, [mappingsSha]);

  if (loading) return <p className="text-muted">Loading recipe…</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;
  if (!recipe) return <p className="text-muted">Recipe not found.</p>;

  const nutrition = recipe && foods
    ? computeRecipeNutrition(recipe.ingredients, foods, mappings)
    : null;

  async function commitMappings(next: Mappings) {
    if (!token) throw new Error("not authenticated");
    if (inFlightRef.current) {
      pendingRef.current = next;          // single-slot debounce
      return;
    }
    const tryCommit = async (payload: Mappings) => {
      let sha = mappingsShaRef.current;
      if (!sha) {
        // Look up the live sha if we don't have one yet (initial fetch was unauth).
        const fresh = await github.fetchMappingsViaApi(token);
        sha = fresh.sha;
      }
      const newSha = await github.saveMappings(payload, token, sha);
      mappingsShaRef.current = newSha;
      setMappings(payload, newSha);
    };
    const p = tryCommit(next).finally(() => {
      inFlightRef.current = null;
      if (pendingRef.current) {
        const nextNext = pendingRef.current; pendingRef.current = null;
        void commitMappings(nextNext);
      }
    });
    inFlightRef.current = p;
    await p;
  }

  function handleSave(mapping: IngredientMapping) {
    if (!editKey) return;
    const prev = mappings;
    const next = { ...mappings, [editKey]: mapping };
    setMappings(next, mappingsSha);   // optimistic
    setEditKey(null);
    commitMappings(next).catch((e: Error) => {
      setMappings(prev, mappingsShaRef.current); // rollback
      setSaveError(`Failed to save: ${e.message}`);
    });
  }

  return (
    <ServingsProvider baseServings={recipe.servings}>
    <article className="max-w-5xl mx-auto">
      {recipe.image && (
        <div className="aspect-video rounded-md overflow-hidden mb-8 border border-line">
          <img
            src={github.imageUrl(recipe.image)}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-3">
        <h1 className="font-display text-3xl md:text-4xl font-medium text-ink leading-tight tracking-tight">
          {recipe.title}
        </h1>
        {authenticated && (
          <Link
            to={`/edit/${recipe.slug}`}
            className="bg-paper border border-line text-ink px-3 py-1.5 rounded text-sm hover:bg-tag transition-colors shrink-0"
          >
            Edit
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 text-xs uppercase tracking-wider text-muted">
        {recipe.servings && <span>Serves {recipe.servings}</span>}
        {recipe.prep_time && <span>Prep {recipe.prep_time}m</span>}
        {recipe.cook_time && <span>Cook {recipe.cook_time}m</span>}
        {recipe.rating !== undefined && (
          <div className="ml-1"><StarRating rating={recipe.rating} /></div>
        )}
      </div>

      {nutError && <p className="text-xs text-muted italic mb-4">Nutrition info unavailable</p>}
      {nutrition && !nutLoading && (
        <NutritionPanel rows={nutrition.rows} totals={nutrition.totals} />
      )}

      {recipe.tags.length > 0 && (
        <div className="mb-10">
          <TagList tags={recipe.tags} />
        </div>
      )}

      <div className="md:grid md:grid-cols-[260px_1fr] md:gap-10">
        <aside className="mb-8 md:mb-0">
          <div className="bg-paper border border-line rounded-md p-5 md:sticky md:top-6">
            <IngredientList
              ingredients={recipe.ingredients}
              nutritionRows={nutrition?.rows}
              canEdit={authenticated}
              onEditMatch={(key) => setEditKey(key)}
            />
          </div>
        </aside>
        <div className="min-w-0">
          <MarkdownPreview content={recipe.body} />
          <div className="mt-12 pt-8 border-t border-line">
            <CookLog entries={recipe.cook_log} />
          </div>
        </div>
      </div>
    </article>
    {editKey && foods && (
      <MatchPicker
        mappingKey={editKey}
        foods={foods}
        onSave={handleSave}
        onClose={() => setEditKey(null)}
      />
    )}
    {saveError && (
      <button
        role="alert"
        onClick={() => setSaveError(null)}
        className="fixed bottom-4 right-4 bg-paper border border-danger text-danger px-3 py-2 rounded text-sm hover:bg-danger/5"
        aria-label="Dismiss error"
      >
        {saveError}
      </button>
    )}
    </ServingsProvider>
  );
}
