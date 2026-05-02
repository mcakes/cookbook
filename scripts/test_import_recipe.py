"""Tests for scripts/import_recipe.py."""

import sys
from pathlib import Path

# Make scripts/ importable when running `pytest scripts/`.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import import_recipe  # noqa: E402


def test_module_imports():
    assert import_recipe.SLUG_RE.match("chicken-enchiladas-verde")
    assert not import_recipe.SLUG_RE.match("Chicken Enchiladas")
