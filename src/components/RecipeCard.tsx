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
      className="block bg-paper rounded-md border border-line overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="aspect-video bg-tag overflow-hidden">
        {recipe.image ? (
          <img
            src={github.imageUrl(recipe.image)}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-4xl">
            🍽
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-medium text-ink leading-snug mb-1">
          {recipe.title}
        </h3>
        {recipe.rating !== undefined && (
          <StarRating rating={recipe.rating} />
        )}
        {recipe.tags.length > 0 && (
          <div className="mt-2.5">
            <TagList tags={recipe.tags} />
          </div>
        )}
        {(recipe.prep_time || recipe.cook_time) && (
          <p className="text-xs text-muted mt-2.5 uppercase tracking-wider">
            {recipe.prep_time && `Prep ${recipe.prep_time}m`}
            {recipe.prep_time && recipe.cook_time && " · "}
            {recipe.cook_time && `Cook ${recipe.cook_time}m`}
          </p>
        )}
      </div>
    </Link>
  );
}
