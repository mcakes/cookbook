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
    <Link to={`/recipe/${recipe.slug}`} className="group block">
      <div className="aspect-video rounded-[3px] overflow-hidden bg-wash mb-3">
        {recipe.image ? (
          <img
            src={github.imageUrl(recipe.image)}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-4xl">
            🍽
          </div>
        )}
      </div>
      <h3 className="font-display text-lg text-ink leading-snug mb-1">
        {recipe.title}
      </h3>
      {recipe.rating !== undefined && <StarRating rating={recipe.rating} />}
      {(recipe.prep_time || recipe.cook_time) && (
        <p className="text-[11px] text-muted mt-1.5 uppercase tracking-[0.14em]">
          {recipe.prep_time && `Prep ${recipe.prep_time}m`}
          {recipe.prep_time && recipe.cook_time && " · "}
          {recipe.cook_time && `Cook ${recipe.cook_time}m`}
        </p>
      )}
      {recipe.tags.length > 0 && (
        <div className="mt-2.5">
          <TagList tags={recipe.tags} />
        </div>
      )}
    </Link>
  );
}
