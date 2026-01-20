__all__ = ["parse_recipe"]

import io
import re
import yaml

from ._types import Ingredient, ParsedRecipe


_INGREDIENT_PATTERN = re.compile(
    r'(?P<quantity>\d+(?:\.\d+)?)\s*(?P<unit>\w+)?\s+(?P<name>.+)'
)

def parse_recipe(file: io.TextIOBase)-> ParsedRecipe:
    """Parse a recipe from a YAML file-like object.

    Args:
        file: A file-like object containing the recipe in YAML format.
    
    Returns:
        A ParsedRecipe object containing the parsed recipe data.
    """
    data = yaml.safe_load(file)

    matches = (
        _INGREDIENT_PATTERN.match(ing) for ing in data.get('ingredients', [])
    )
    ingredients = [
        Ingredient(
            name=match.group('name'),
            quantity=float(match.group('quantity')),
            unit=match.group('unit') or ''
        )
        for match in matches if match is not None
    ]

    return ParsedRecipe(
        title=data['title'],
        servings=data['servings'],
        tags=data.get('tags', []),
        steps=data.get('steps', []),
        ingredients=ingredients
    )

def test_parse_recipe():
    recipe = io.StringIO("""title: Creamy Pasta with Peas and Ham
servings: 2 
tags: [
    creamy,
    pasta,
]

steps:
  - Cook pasta until not quite al dente (time to complete with sauce). Reserve 1 cup pasta water. 2. Cool bacon over medium. Remove with slotted spoon (leaving fat).
  - Add onion, stirring until soft.
  - Deglaze with chicken stock.
  - Add peas.
  - Add cream. Bring to boil.
  - Add pasta and pasta water. Maintain rapid simmer until sauce is thickened and pasta is al dente
  - Add bacon and lemon zest.

ingredients:
  - 2 slice bacon
  - 1 medium onion (fine dice)
  - 200 grams pasta
  - 0.75 cup peas
  - 1 cup heavy cream
  - 1 tsp lemon zest
  - 0.25 cup chicken stock
  - 0.25 cup parmesan

""")
    parsed = parse_recipe(recipe)

    assert parsed.title == "Creamy Pasta with Peas and Ham"
    assert parsed.servings == 2
    assert parsed.tags == ["creamy", "pasta"]
    assert len(parsed.steps) == 7
    assert len(parsed.ingredients) == 8
    assert parsed.ingredients[0] == Ingredient(name="bacon", quantity=2.0, unit="slice")
    assert parsed.ingredients[2] == Ingredient(name="pasta", quantity=200.0, unit="grams")