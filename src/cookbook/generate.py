import io 
from string import Template

from ._types import Ingredient, ParsedRecipe




def generate_recipe(template: Template, recipe: ParsedRecipe) -> str:
    """Generate a recipe string from a template and a ParsedRecipe object.

    Args:
        template: A file-like object containing the recipe template.
        recipe: A ParsedRecipe object containing the recipe data.
    Returns:
        A string containing the generated recipe.
    """
    ingredients_str = "\n".join(
        f'<li><span class="qty">{ing.quantity}</span><span class="unit">{ing.unit}</span>'
        f'<span class="ingredient">{ing.name}'
        f'{f"<span class=\"processing\"> ({ing.processing})</span>" if ing.processing else ""}</span></li>'
        for ing in recipe.ingredients
    )
    def highlight_ingredients_in_text(text: str, ingredients: list[Ingredient]) -> str:
        """Highlight ingredient names in step text."""
        import re
        result = text
        
        # Sort ingredients by length (longest first) to avoid partial matches
        ingredient_names = sorted([ing.name.strip() for ing in ingredients], key=len, reverse=True)
        
        for ingredient_name in ingredient_names:
            # Use word boundary regex to match whole words only
            pattern = r'\b' + re.escape(ingredient_name) + r'\b'
            replacement = f'<span class="step-ingredient">{ingredient_name}</span>'
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        
        return result
    
    steps_str = "\n".join(
        f"<li>{highlight_ingredients_in_text(step, recipe.ingredients)}</li>"
        for idx, step in enumerate(recipe.steps)
    )
    tags_str = "\n".join(
        f'<a href="index.html?tag={tag}" class="tag-chip">{tag}</a>'
        for tag in recipe.tags
    )

    result = template.substitute(
        title=recipe.title,
        servings=recipe.servings,
        time="N/A",
        tags=tags_str,
        ingredients=ingredients_str,
        steps=steps_str
    )

    return result


def generate_home(template: Template, recipes: list[ParsedRecipe]) -> str:
    """Generate a home page string from a template and a list of ParsedRecipe objects.

    Args:
        template: A file-like object containing the home page template.
        recipes: A list of ParsedRecipe objects.
    Returns:
        A string containing the generated home page.
    """
    # Collect all unique tags from all recipes
    all_tags = set()
    for recipe in recipes:
        all_tags.update(recipe.tags)
    
    # Generate HTML for tag chips
    tags_str = "\n".join(
        f'<span class="tag-chip" data-tag="{tag}">{tag}</span>'
        for tag in sorted(all_tags)
    )
    
    # Generate HTML for recipe links
    recipes_str = "\n".join(
        f'<a href="{recipe_title_to_html_filename(recipe)}" '
        f'class="recipe-item" data-tags="{",".join(recipe.tags)}">{recipe.title}</a>'
        for recipe in recipes
    )
    
    result = template.substitute(
        all_tags=tags_str,
        recipes=recipes_str
    )
    
    return result

def recipe_title_to_html_filename(recipe: ParsedRecipe) -> str:
    """Convert a recipe title to a safe filename.

    Args:
        recipe: A ParsedRecipe object.
    Returns:
        A string containing the filename.
    """
    filename = recipe.title.lower().replace(" ", "-").replace("&", "and")
    return f"{filename}.html"