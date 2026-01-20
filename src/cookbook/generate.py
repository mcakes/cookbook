import io 
from string import Template

from ._types import ParsedRecipe




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
        f'<span class="ingredient">{ing.name}</span></li>'
        for ing in recipe.ingredients
    )
    steps_str = "\n".join(
        f"<li>{step}</li>"
        for idx, step in enumerate(recipe.steps)
    )
    tags_str = "\n".join(
        f'<span class="tag">{tag}</span>'
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