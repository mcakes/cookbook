import { useParams, Link } from "react-router-dom";
import { useRecipe } from "../hooks/useRecipe";
import { useAuth } from "../hooks/useAuth";
import StarRating from "../components/StarRating";
import TagList from "../components/TagList";
import IngredientList from "../components/IngredientList";
import CookLog from "../components/CookLog";
import MarkdownPreview from "../components/MarkdownPreview";
import { github } from "../lib/github-instance";

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  const { recipe, loading, error } = useRecipe(slug);
  const { authenticated } = useAuth();

  if (loading) return <p className="text-muted">Loading recipe…</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;
  if (!recipe) return <p className="text-muted">Recipe not found.</p>;

  return (
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
          <span className="ml-1"><StarRating rating={recipe.rating} /></span>
        )}
      </div>

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
              baseServings={recipe.servings}
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
  );
}
