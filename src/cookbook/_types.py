from dataclasses import dataclass

@dataclass(frozen=True)
class Ingredient:
    name: str
    quantity: float
    unit: str
    processing:str | None = None

@dataclass(frozen=True)
class ParsedRecipe:
    title: str
    servings: int
    tags: list[str]
    steps: list[str]
    ingredients: list[Ingredient]