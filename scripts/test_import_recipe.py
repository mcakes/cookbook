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


def test_build_recipe_preserves_decimal_numbers_in_instructions():
    result = import_recipe.build_recipe(
        {**FIXTURE_FULL, "instructions": "Add 1.5 cups flour\n2. Stir"},
        today=date(2026, 5, 2),
    )
    assert result["instructions"] == ["Add 1.5 cups flour", "Stir"]


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


def make_recipe(**overrides):
    base = {
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
        "instructions": ["Brown beef.", "Add vegetables."],
    }
    base.update(overrides)
    return base


def test_render_markdown_full():
    out = import_recipe.render_markdown(make_recipe())
    expected = (
        "---\n"
        "title: Beef Stew\n"
        "slug: beef-stew\n"
        "tags: []\n"
        "rating:\n"
        "servings: 4\n"
        "prep_time: 15\n"
        "cook_time: 90\n"
        "image: https://example.com/img.jpg\n"
        "ingredients:\n"
        "  - 1 lb beef\n"
        "  - 2 carrots\n"
        "cook_log: []\n"
        "created: '2026-05-02'\n"
        "updated: '2026-05-02'\n"
        "---\n"
        "\n"
        "## Method\n"
        "\n"
        "1. Brown beef.\n"
        "2. Add vegetables.\n"
    )
    assert out == expected


def test_render_markdown_omits_optional_fields():
    recipe = make_recipe()
    for key in ("servings", "prep_time", "cook_time", "image"):
        del recipe[key]
    out = import_recipe.render_markdown(recipe)
    for key in ("servings:", "prep_time:", "cook_time:", "image:"):
        assert key not in out, f"{key} should not appear"
    # Required fields still present
    assert "title: Beef Stew\n" in out
    assert "rating:\n" in out
    assert "ingredients:\n" in out


def test_render_markdown_rating_has_no_value():
    out = import_recipe.render_markdown(make_recipe())
    assert "\nrating:\n" in out
    assert "rating: null" not in out
    assert "rating: ~" not in out


def test_render_markdown_method_renumbers():
    out = import_recipe.render_markdown(
        make_recipe(instructions=["Step A", "Step B", "Step C"])
    )
    assert "1. Step A\n2. Step B\n3. Step C\n" in out


import pytest


def test_resolve_slug_no_collision(tmp_path):
    assert import_recipe.resolve_slug("beef-stew", recipes_dir=tmp_path) == "beef-stew"


def test_resolve_slug_with_collision(tmp_path, monkeypatch, capsys):
    (tmp_path / "beef-stew.md").write_text("existing")
    inputs = iter(["beef-bourguignon"])
    monkeypatch.setattr("builtins.input", lambda: next(inputs))
    result = import_recipe.resolve_slug("beef-stew", recipes_dir=tmp_path)
    assert result == "beef-bourguignon"
    err = capsys.readouterr().err
    assert "already exists" in err


def test_resolve_slug_reprompts_on_invalid(tmp_path, monkeypatch, capsys):
    (tmp_path / "beef-stew.md").write_text("existing")
    inputs = iter(["Beef Stew!", "beef-bourguignon"])
    monkeypatch.setattr("builtins.input", lambda: next(inputs))
    result = import_recipe.resolve_slug("beef-stew", recipes_dir=tmp_path)
    assert result == "beef-bourguignon"
    err = capsys.readouterr().err
    assert "Invalid slug" in err


def test_resolve_slug_reprompts_on_taken(tmp_path, monkeypatch):
    (tmp_path / "beef-stew.md").write_text("existing")
    (tmp_path / "beef-bourguignon.md").write_text("also existing")
    inputs = iter(["beef-bourguignon", "boeuf"])
    monkeypatch.setattr("builtins.input", lambda: next(inputs))
    result = import_recipe.resolve_slug("beef-stew", recipes_dir=tmp_path)
    assert result == "boeuf"


def test_resolve_slug_aborts_on_eof(tmp_path, monkeypatch, capsys):
    (tmp_path / "beef-stew.md").write_text("existing")

    def raise_eof():
        raise EOFError

    monkeypatch.setattr("builtins.input", raise_eof)
    with pytest.raises(SystemExit) as exc:
        import_recipe.resolve_slug("beef-stew", recipes_dir=tmp_path)
    assert exc.value.code == 2
    assert "Aborted" in capsys.readouterr().err


def test_resolve_slug_aborts_on_keyboard_interrupt(tmp_path, monkeypatch, capsys):
    (tmp_path / "beef-stew.md").write_text("existing")

    def raise_kbd():
        raise KeyboardInterrupt

    monkeypatch.setattr("builtins.input", raise_kbd)
    with pytest.raises(SystemExit) as exc:
        import_recipe.resolve_slug("beef-stew", recipes_dir=tmp_path)
    assert exc.value.code == 2
    assert "Aborted" in capsys.readouterr().err


class FakeScraper:
    def __init__(self, **values):
        self._values = values

    def title(self):
        return self._values.get("title")

    def yields(self):
        return self._values.get("yields")

    def prep_time(self):
        return self._values.get("prep_time")

    def cook_time(self):
        return self._values.get("cook_time")

    def image(self):
        return self._values.get("image")

    def ingredients(self):
        return self._values.get("ingredients", [])

    def instructions(self):
        return self._values.get("instructions", "")


class FakeResponse:
    def __init__(self, text="<html></html>", status=200):
        self.text = text
        self.status_code = status

    def raise_for_status(self):
        if self.status_code >= 400:
            import requests as _r
            raise _r.HTTPError(f"HTTP {self.status_code}")


def test_scrape_returns_normalized_dict(monkeypatch):
    fake = FakeScraper(
        title="Beef Stew",
        yields="4 servings",
        prep_time=15,
        cook_time=90,
        image="https://example.com/img.jpg",
        ingredients=["1 lb beef"],
        instructions="Brown beef.",
    )
    monkeypatch.setattr(import_recipe.requests, "get", lambda *a, **kw: FakeResponse())
    monkeypatch.setattr(import_recipe, "scrape_html", lambda html, org_url, **kw: fake)
    result = import_recipe.scrape("https://example.com/r")
    assert result == {
        "title": "Beef Stew",
        "yields": "4 servings",
        "prep_time": 15,
        "cook_time": 90,
        "image": "https://example.com/img.jpg",
        "ingredients": ["1 lb beef"],
        "instructions": "Brown beef.",
    }


def test_scrape_falls_back_to_wild_mode(monkeypatch):
    from recipe_scrapers._exceptions import WebsiteNotImplementedError

    fake = FakeScraper(title="Wild", ingredients=[], instructions="")
    calls = []

    def fake_scrape_html(html, org_url, **kw):
        calls.append(kw)
        if not kw.get("wild_mode"):
            raise WebsiteNotImplementedError("unsupported")
        return fake

    monkeypatch.setattr(import_recipe.requests, "get", lambda *a, **kw: FakeResponse())
    monkeypatch.setattr(import_recipe, "scrape_html", fake_scrape_html)
    result = import_recipe.scrape("https://example.com/r")
    assert result["title"] == "Wild"
    assert calls[-1].get("wild_mode") is True


def test_scrape_exits_1_on_unsupported_with_no_jsonld(monkeypatch, capsys):
    from recipe_scrapers._exceptions import WebsiteNotImplementedError

    def fake_scrape_html(html, org_url, **kw):
        raise WebsiteNotImplementedError("unsupported")

    monkeypatch.setattr(import_recipe.requests, "get", lambda *a, **kw: FakeResponse())
    monkeypatch.setattr(import_recipe, "scrape_html", fake_scrape_html)
    with pytest.raises(SystemExit) as exc:
        import_recipe.scrape("https://nope.example.com/r")
    assert exc.value.code == 1
    assert "nope.example.com" in capsys.readouterr().err


def test_scrape_exits_1_on_network_error(monkeypatch, capsys):
    import requests as requests_mod
    def boom(*a, **kw):
        raise requests_mod.ConnectionError("dns failure")

    monkeypatch.setattr(import_recipe.requests, "get", boom)
    with pytest.raises(SystemExit) as exc:
        import_recipe.scrape("https://example.com/r")
    assert exc.value.code == 1
    assert "could not fetch" in capsys.readouterr().err


def test_scrape_swallows_per_field_errors(monkeypatch):
    """If a scraper method raises (some sites don't have all fields), return None for that field."""
    class AngryScraper(FakeScraper):
        def prep_time(self):
            raise ValueError("no prep time")

    fake = AngryScraper(title="X", ingredients=[], instructions="")
    monkeypatch.setattr(import_recipe.requests, "get", lambda *a, **kw: FakeResponse())
    monkeypatch.setattr(import_recipe, "scrape_html", lambda html, org_url, **kw: fake)
    result = import_recipe.scrape("https://example.com/r")
    assert result["prep_time"] is None
    assert result["title"] == "X"


def _patch_main_environment(monkeypatch, tmp_path, fake_scraped):
    """Wire up monkeypatches so main() runs against tmp_path with deterministic dates."""
    monkeypatch.setattr(import_recipe, "scrape", lambda url: fake_scraped)
    monkeypatch.setattr(import_recipe, "RECIPES_DIR", tmp_path)
    monkeypatch.setattr(import_recipe, "REPO_ROOT", tmp_path.parent)

    # Pin date.today() so created/updated values are deterministic.
    class _FixedDate(date):
        @classmethod
        def today(cls):
            return date(2026, 5, 2)

    monkeypatch.setattr(import_recipe, "date", _FixedDate)


def test_main_end_to_end(monkeypatch, tmp_path, capsys):
    """main() writes a markdown file and prints its relative path."""
    fake_scraped = {
        "title": "Test Stew",
        "yields": "2",
        "prep_time": 5,
        "cook_time": 10,
        "image": None,
        "ingredients": ["water"],
        "instructions": "Boil water.",
    }
    _patch_main_environment(monkeypatch, tmp_path, fake_scraped)
    import_recipe.main("https://example.com/r")
    out_file = tmp_path / "test-stew.md"
    assert out_file.exists()
    content = out_file.read_text()
    assert "title: Test Stew" in content
    assert "## Method" in content
    assert "1. Boil water." in content
    assert "created: '2026-05-02'" in content


def test_main_warns_on_missing_ingredients(monkeypatch, tmp_path, capsys):
    fake_scraped = {
        "title": "Empty",
        "yields": None,
        "prep_time": None,
        "cook_time": None,
        "image": None,
        "ingredients": [],
        "instructions": "Step 1.",
    }
    _patch_main_environment(monkeypatch, tmp_path, fake_scraped)
    import_recipe.main("https://example.com/r")
    err = capsys.readouterr().err
    assert "no ingredients" in err.lower()
