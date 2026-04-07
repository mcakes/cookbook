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

  if (loading) return <p className="text-gray-500">Loading recipe...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!recipe) return <p className="text-gray-500">Recipe not found.</p>;

  return (
    <article className="max-w-3xl mx-auto">
      {recipe.image && (
        <div className="aspect-video rounded-lg overflow-hidden mb-6">
          <img
            src={github.imageUrl(recipe.image)}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
        {authenticated && (
          <Link
            to={`/edit/${recipe.slug}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 shrink-0"
          >
            Edit
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
        {recipe.rating !== undefined && <StarRating rating={recipe.rating} />}
        {recipe.servings && <span>Serves {recipe.servings}</span>}
        {recipe.prep_time && <span>Prep: {recipe.prep_time}m</span>}
        {recipe.cook_time && <span>Cook: {recipe.cook_time}m</span>}
      </div>

      {recipe.tags.length > 0 && (
        <div className="mb-6">
          <TagList tags={recipe.tags} />
        </div>
      )}

      <div className="mb-8">
        <IngredientList
          ingredients={recipe.ingredients}
          baseServings={recipe.servings}
        />
      </div>

      <div className="mb-8">
        <MarkdownPreview content={recipe.body} />
      </div>

      <div className="border-t pt-6">
        <CookLog entries={recipe.cook_log} />
      </div>
    </article>
  );
}
