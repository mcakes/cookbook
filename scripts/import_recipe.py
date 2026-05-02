"""Import a recipe from a URL into recipes/<slug>.md.

Usage: python scripts/import_recipe.py <url>
"""

import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

import requests
import yaml
from slugify import slugify

REPO_ROOT = Path(__file__).resolve().parent.parent
RECIPES_DIR = REPO_ROOT / "recipes"
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
USER_AGENT = (
    "Mozilla/5.0 (compatible; cookbook-import/1.0; "
    "+https://github.com/mcakes/cookbook)"
)
LEADING_NUMBER_RE = re.compile(r"^\s*\d+\s*[.)\-]\s*")
REQUEST_TIMEOUT = 15


def main(url: str) -> None:
    raise NotImplementedError


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/import_recipe.py <url>", file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1])
