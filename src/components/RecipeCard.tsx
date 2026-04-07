import { Link } from "react-router-dom";
import type { RecipeFrontmatter } from "../types/recipe";
import StarRating from "./StarRating";
import TagList from "./TagList";
import { github } from "../lib/github-instance";

interface RecipeCardProps {
  recipe: RecipeFrontmatter;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      to={`/recipe/${recipe.slug}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="aspect-video bg-gray-200 overflow-hidden">
        {recipe.image ? (
          <img
            src={github.imageUrl(recipe.image)}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            🍽
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{recipe.title}</h3>
        {recipe.rating !== undefined && (
          <StarRating rating={recipe.rating} />
        )}
        {recipe.tags.length > 0 && (
          <div className="mt-2">
            <TagList tags={recipe.tags} />
          </div>
        )}
        {(recipe.prep_time || recipe.cook_time) && (
          <p className="text-xs text-gray-500 mt-2">
            {recipe.prep_time && `Prep: ${recipe.prep_time}m`}
            {recipe.prep_time && recipe.cook_time && " · "}
            {recipe.cook_time && `Cook: ${recipe.cook_time}m`}
          </p>
        )}
      </div>
    </Link>
  );
}
