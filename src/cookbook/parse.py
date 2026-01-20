__all__ = ["parse_recipe"]

import io
import re
import yaml

from ._types import Ingredient, ParsedRecipe


_INGREDIENT_PATTERN = re.compile(
    r"(?P<quantity>\d+(?:\.\d+)?)\s*(?P<unit>\w+)?\s+(?P<name>[^(]+?)(?:\s*\((?P<processing>[^)]+)\))?\s*$"
)

# Unit normalization mapping - maps various forms to canonical abbreviations
_UNIT_MAPPING = {
    # Volume - liquid
    "tablespoon": "tbsp",
    "tablespoons": "tbsp",
    "tbsp": "tbsp",
    "tbs": "tbsp",
    "Tbsp": "tbsp",
    "teaspoon": "tsp",
    "teaspoons": "tsp",
    "tsp": "tsp",
    "Tsp": "tsp",
    "cup": "cup",
    "cups": "cup",
    "c": "cup",
    "Cup": "cup",
    "pint": "pt",
    "pints": "pt",
    "pt": "pt",
    "Pint": "pt",
    "quart": "qt",
    "quarts": "qt",
    "qt": "qt",
    "Quart": "qt",
    "gallon": "gal",
    "gallons": "gal",
    "gal": "gal",
    "Gallon": "gal",
    "liter": "L",
    "liters": "L",
    "litre": "L",
    "litres": "L",
    "l": "L",
    "L": "L",
    "milliliter": "mL",
    "milliliters": "mL",
    "millilitre": "mL",
    "millilitres": "mL",
    "ml": "mL",
    "mL": "mL",
    "fluid ounce": "fl oz",
    "fluid ounces": "fl oz",
    "fl oz": "fl oz",
    "floz": "fl oz",
    # Weight
    "pound": "lb",
    "pounds": "lb",
    "lb": "lb",
    "lbs": "lb",
    "Pound": "lb",
    "ounce": "oz",
    "ounces": "oz",
    "oz": "oz",
    "Ounce": "oz",
    "gram": "g",
    "grams": "g",
    "g": "g",
    "Gram": "g",
    "kilogram": "kg",
    "kilograms": "kg",
    "kg": "kg",
    "Kilogram": "kg",
    "milligram": "mg",
    "milligrams": "mg",
    "mg": "mg",
    # Count/portions
    "piece": "piece",
    "pieces": "piece",
    "pc": "piece",
    "pcs": "piece",
    "slice": "slice",
    "slices": "slice",
    "clove": "clove",
    "cloves": "clove",
    "sprig": "sprig",
    "sprigs": "sprig",
    "leaf": "leaf",
    "leaves": "leaf",
    "stalk": "stalk",
    "stalks": "stalk",
    "head": "head",
    "heads": "head",
    # Size descriptors
    "small": "small",
    "medium": "medium",
    "large": "large",
    "whole": "whole",
    "half": "half",
    "quarter": "quarter",
    # Length
    "inch": "in",
    "inches": "in",
    "in": "in",
    '"': "in",
    "foot": "ft",
    "feet": "ft",
    "ft": "ft",
    "'": "ft",
    "centimeter": "cm",
    "centimeters": "cm",
    "cm": "cm",
    "millimeter": "mm",
    "millimeters": "mm",
    "mm": "mm",
}


def _normalize_unit(unit: str | None) -> str:
    """Normalize a unit string to its canonical form."""
    if not unit:
        return ""

    # Try exact match first
    canonical = _UNIT_MAPPING.get(unit)
    if canonical:
        return canonical

    # Try lowercase match
    canonical = _UNIT_MAPPING.get(unit.lower())
    if canonical:
        return canonical

    # Return original if no mapping found
    return unit


def parse_recipe(file: io.TextIOBase) -> ParsedRecipe:
    """Parse a recipe from a YAML file-like object.

    Args:
        file: A file-like object containing the recipe in YAML format.

    Returns:
        A ParsedRecipe object containing the parsed recipe data.
    """
    data = yaml.safe_load(file)

    matches = (_INGREDIENT_PATTERN.match(ing) for ing in data.get("ingredients", []))
    ingredients = [
        Ingredient(
            name=match.group("name").strip(),
            quantity=float(match.group("quantity")),
            unit=_normalize_unit(match.group("unit")),
            processing=match.group("processing"),
        )
        for match in matches
        if match is not None
    ]

    return ParsedRecipe(
        title=data["title"],
        servings=data["servings"],
        tags=data.get("tags", []),
        steps=data.get("steps", []),
        ingredients=ingredients,
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
    assert parsed.ingredients[0] == Ingredient(
        name="bacon", quantity=2.0, unit="slice", processing=None
    )
    assert parsed.ingredients[1] == Ingredient(
        name="onion", quantity=1.0, unit="medium", processing="fine dice"
    )
    assert parsed.ingredients[6] == Ingredient(
        name="lemon zest", quantity=1.0, unit="tsp", processing=None
    )  # Test normalization


def test_unit_normalization():
    """Test that various unit forms are normalized correctly."""
    recipe = io.StringIO("""title: Unit Test
servings: 1
ingredients:
  - 2 tablespoons olive oil
  - 1 Tbsp vinegar
  - 3 teaspoons salt
  - 4 tsp pepper
  - 1 pound flour
  - 2 ounces cheese
""")
    parsed = parse_recipe(recipe)

    assert parsed.ingredients[0] == Ingredient(
        name="olive oil", quantity=2.0, unit="tbsp", processing=None
    )
    assert parsed.ingredients[1] == Ingredient(
        name="vinegar", quantity=1.0, unit="tbsp", processing=None
    )
    assert parsed.ingredients[2] == Ingredient(
        name="salt", quantity=3.0, unit="tsp", processing=None
    )
    assert parsed.ingredients[3] == Ingredient(
        name="pepper", quantity=4.0, unit="tsp", processing=None
    )
    assert parsed.ingredients[4] == Ingredient(
        name="flour", quantity=1.0, unit="lb", processing=None
    )
    assert parsed.ingredients[5] == Ingredient(
        name="cheese", quantity=2.0, unit="oz", processing=None
    )
