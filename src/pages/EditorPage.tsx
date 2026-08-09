import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { useAuth } from "../hooks/useAuth";
import { useRecipe } from "../hooks/useRecipe";
import { github } from "../lib/github-instance";
import { serializeRecipe } from "../lib/markdown";
import type { Recipe, CookLogEntry } from "../types/recipe";
import RecipeForm from "../components/RecipeForm";
import IngredientsEditor from "../components/IngredientsEditor";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const isNew = !slug;
  const navigate = useNavigate();
  const { token, authenticated } = useAuth();
  const { recipe: existingRecipe, sha, loading } = useRecipe(slug);

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [servings, setServings] = useState<number | undefined>(undefined);
  const [prepTime, setPrepTime] = useState<number | undefined>(undefined);
  const [cookTime, setCookTime] = useState<number | undefined>(undefined);
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [body, setBody] = useState("");
  const [cookLog, setCookLog] = useState<CookLogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentSha, setCurrentSha] = useState<string | undefined>(undefined);
  const [image, setImage] = useState<string | undefined>(existingRecipe?.image);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existingRecipe) {
      setTitle(existingRecipe.title);
      setTags(existingRecipe.tags);
      setRating(existingRecipe.rating);
      setServings(existingRecipe.servings);
      setPrepTime(existingRecipe.prep_time);
      setCookTime(existingRecipe.cook_time);
      setIngredients(existingRecipe.ingredients);
      setBody(existingRecipe.body);
      setCookLog(existingRecipe.cook_log);
      setImage(existingRecipe.image);
    }
  }, [existingRecipe]);

  useEffect(() => {
    if (sha) setCurrentSha(sha);
  }, [sha]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    setSaveError(null);
    try {
      const base64 = await readFileAsBase64(file);
      const filename = `${slug ?? slugify(title)}.${file.name.split(".").pop()}`;
      await github.uploadImage(filename, base64, token);
      setImage(filename);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!authenticated) {
    return <p className="text-muted">You must be logged in to edit recipes.</p>;
  }

  if (!isNew && loading) {
    return <p className="text-muted">Loading recipe...</p>;
  }

  const handleSave = async () => {
    if (!title.trim() || !token) return;

    setSaving(true);
    setSaveError(null);

    const recipeSlug = slug ?? slugify(title);
    const today = new Date().toISOString().split("T")[0];
    const recipe: Recipe = {
      title,
      slug: recipeSlug,
      tags,
      rating,
      servings,
      prep_time: prepTime,
      cook_time: cookTime,
      ingredients: ingredients.filter((i) => i.trim()),
      cook_log: cookLog,
      created: existingRecipe?.created ?? today,
      updated: today,
      body,
      image,
    };

    try {
      const newSha = await github.saveRecipeFile(
        recipeSlug,
        serializeRecipe(recipe),
        token,
        currentSha ?? undefined
      );
      setCurrentSha(newSha);
      navigate(`/recipe/${recipeSlug}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slug || !currentSha || !token) return;
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await github.deleteRecipeFile(slug, currentSha, token);
      navigate("/");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isNew ? "New Recipe" : `Edit: ${title}`}
        </h1>
        <div className="flex gap-2">
          {!isNew && (
            <button onClick={handleDelete} className="px-4 py-2 text-sm text-danger hover:text-danger">
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm bg-accent text-paper rounded-md hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="bg-tag border border-line text-danger px-4 py-3 rounded-md mb-4">
          {saveError}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Image</label>
          {image && (
            <img src={github.imageUrl(image)} alt="Recipe" className="w-48 h-32 object-cover rounded-md mb-2" />
          )}
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="text-sm" />
          {uploading && <p className="text-sm text-muted mt-1">Uploading...</p>}
        </div>

        <RecipeForm
          title={title} tags={tags} rating={rating} servings={servings}
          prepTime={prepTime} cookTime={cookTime} cookLog={cookLog}
          onTitleChange={setTitle} onTagsChange={setTags} onRatingChange={setRating}
          onServingsChange={setServings} onPrepTimeChange={setPrepTime}
          onCookTimeChange={setCookTime} onCookLogChange={setCookLog}
        />

        <IngredientsEditor ingredients={ingredients} onChange={setIngredients} />

        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Method & Notes (Markdown)
          </label>
          <div data-color-mode="light">
            <MDEditor value={body} onChange={(val) => setBody(val ?? "")} height={400} />
          </div>
        </div>
      </div>
    </div>
  );
}
