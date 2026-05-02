"""Tests for scripts/import_recipe.py."""

import sys
from datetime import date
from pathlib import Path

# Make scripts/ importable when running `pytest scripts/`.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import import_recipe  # noqa: E402


def test_module_imports():
    assert import_recipe.SLUG_RE.match("chicken-enchiladas-verde")
    assert not import_recipe.SLUG_RE.match("Chicken Enchiladas")


FIXTURE_FULL = {
    "title": "Beef Stew",
    "yields": "4 servings",
    "prep_time": 15,
    "cook_time": 90,
    "image": "https://example.com/img.jpg",
    "ingredients": ["1 lb beef", "2 carrots"],
    "instructions": "Brown beef.\nAdd vegetables.\nSimmer 1 hour.",
}


def test_build_recipe_full():
    result = import_recipe.build_recipe(FIXTURE_FULL, today=date(2026, 5, 2))
    assert result == {
        "title": "Beef Stew",
        "slug": "beef-stew",
        "tags": [],
        "servings": 4,
        "prep_time": 15,
        "cook_time": 90,
        "image": "https://example.com/img.jpg",
        "ingredients": ["1 lb beef", "2 carrots"],
        "cook_log": [],
        "created": "2026-05-02",
        "updated": "2026-05-02",
        "instructions": ["Brown beef.", "Add vegetables.", "Simmer 1 hour."],
    }


def test_build_recipe_omits_missing_optional():
    scraped = {
        "title": "Minimal",
        "yields": None,
        "prep_time": None,
        "cook_time": None,
        "image": None,
        "ingredients": ["water"],
        "instructions": "Boil.",
    }
    result = import_recipe.build_recipe(scraped, today=date(2026, 5, 2))
    assert "servings" not in result
    assert "prep_time" not in result
    assert "cook_time" not in result
    assert "image" not in result
    assert result["title"] == "Minimal"
    assert result["slug"] == "minimal"


def test_build_recipe_parses_servings_string():
    for raw, expected in [("4 servings", 4), ("Serves 6", 6), ("12", 12)]:
        result = import_recipe.build_recipe(
            {**FIXTURE_FULL, "yields": raw}, today=date(2026, 5, 2)
        )
        assert result["servings"] == expected, f"{raw!r} → {result.get('servings')!r}"


def test_build_recipe_omits_servings_when_unparseable():
    result = import_recipe.build_recipe(
        {**FIXTURE_FULL, "yields": "a few"}, today=date(2026, 5, 2)
    )
    assert "servings" not in result


def test_build_recipe_strips_existing_numbering():
    result = import_recipe.build_recipe(
        {**FIXTURE_FULL, "instructions": "1. Heat oil\n2) Add onion\n3 - Sauté"},
        today=date(2026, 5, 2),
    )
    assert result["instructions"] == ["Heat oil", "Add onion", "Sauté"]


def test_build_recipe_skips_blank_instruction_lines():
    result = import_recipe.build_recipe(
        {**FIXTURE_FULL, "instructions": "Heat oil\n\n  \nAdd onion"},
        today=date(2026, 5, 2),
    )
    assert result["instructions"] == ["Heat oil", "Add onion"]


def test_build_recipe_exits_on_missing_title(capsys):
    import pytest

    with pytest.raises(SystemExit) as exc:
        import_recipe.build_recipe(
            {**FIXTURE_FULL, "title": None}, today=date(2026, 5, 2)
        )
    assert exc.value.code == 1
    assert "no title" in capsys.readouterr().err
