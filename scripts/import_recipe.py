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


class _PrettyDumper(yaml.SafeDumper):
    """Custom YAML dumper with 2-space indentation for nested lists."""

    pass


def _increase_indent(self, flow=False, indentless=False):
    return super(_PrettyDumper, self).increase_indent(flow, False)


_PrettyDumper.increase_indent = _increase_indent


def _parse_servings(yields) -> int | None:
    if yields is None:
        return None
    match = re.search(r"\d+", str(yields))
    return int(match.group()) if match else None


def _parse_instructions(instructions: str | None) -> list[str]:
    if not instructions:
        return []
    steps: list[str] = []
    for raw_line in instructions.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        line = LEADING_NUMBER_RE.sub("", line).strip()
        if line:
            steps.append(line)
    return steps


def build_recipe(scraped: dict, today: date | None = None) -> dict:
    if not scraped.get("title"):
        print("Error: scraped page has no title", file=sys.stderr)
        sys.exit(1)
    today = today or date.today()
    today_str = today.isoformat()
    title = scraped["title"]

    recipe: dict = {
        "title": title,
        "slug": slugify(title),
        "tags": [],
    }
    servings = _parse_servings(scraped.get("yields"))
    if servings is not None:
        recipe["servings"] = servings
    if scraped.get("prep_time") is not None:
        recipe["prep_time"] = scraped["prep_time"]
    if scraped.get("cook_time") is not None:
        recipe["cook_time"] = scraped["cook_time"]
    if scraped.get("image"):
        recipe["image"] = scraped["image"]

    recipe["ingredients"] = list(scraped.get("ingredients") or [])
    recipe["cook_log"] = []
    recipe["created"] = today_str
    recipe["updated"] = today_str
    recipe["instructions"] = _parse_instructions(scraped.get("instructions"))
    return recipe


_FRONTMATTER_ORDER_PRE_RATING = ["title", "slug", "tags"]
_FRONTMATTER_ORDER_POST_RATING = [
    "servings",
    "prep_time",
    "cook_time",
    "image",
    "ingredients",
    "cook_log",
    "created",
    "updated",
]


def _dump_yaml_section(data: dict) -> str:
    if not data:
        return ""
    return yaml.dump(
        data,
        Dumper=_PrettyDumper,
        default_flow_style=False,
        sort_keys=False,
        allow_unicode=True,
    )


def render_markdown(recipe: dict) -> str:
    pre = {k: recipe[k] for k in _FRONTMATTER_ORDER_PRE_RATING if k in recipe}
    post = {k: recipe[k] for k in _FRONTMATTER_ORDER_POST_RATING if k in recipe}

    pre_yaml = _dump_yaml_section(pre)
    post_yaml = _dump_yaml_section(post)

    method_lines = "\n".join(
        f"{i + 1}. {step}" for i, step in enumerate(recipe.get("instructions", []))
    )
    method_section = f"## Method\n\n{method_lines}\n" if method_lines else "## Method\n"

    return (
        "---\n"
        f"{pre_yaml}"
        "rating:\n"
        f"{post_yaml}"
        "---\n"
        "\n"
        f"{method_section}"
    )


def main(url: str) -> None:
    raise NotImplementedError


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/import_recipe.py <url>", file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1])
