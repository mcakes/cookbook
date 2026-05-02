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
from recipe_scrapers import scrape_html
from recipe_scrapers._exceptions import WebsiteNotImplementedError
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

    def increase_indent(self, flow=False, indentless=False):
        return super().increase_indent(flow, False)


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


def resolve_slug(slug: str, recipes_dir: Path = RECIPES_DIR) -> str:
    while (recipes_dir / f"{slug}.md").exists():
        print(
            f"recipes/{slug}.md already exists. Enter a new slug "
            f"(Ctrl-C to abort):",
            file=sys.stderr,
        )
        try:
            candidate = input().strip()
        except EOFError:
            print("Aborted.", file=sys.stderr)
            sys.exit(2)
        if not SLUG_RE.match(candidate):
            print(
                f"Invalid slug. Must match {SLUG_RE.pattern}",
                file=sys.stderr,
            )
            continue
        slug = candidate
    return slug


def _safe_call(fn):
    # recipe-scrapers methods inconsistently return None vs. raise for missing
    # fields; normalize both to None so a single missing field doesn't kill the scrape.
    try:
        return fn()
    except Exception:
        return None


def scrape(url: str) -> dict:
    try:
        response = requests.get(
            url, timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT}
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"Error: could not fetch {url}: {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        scraper = scrape_html(response.text, org_url=url)
    except WebsiteNotImplementedError:
        try:
            scraper = scrape_html(response.text, org_url=url, wild_mode=True)
        except Exception:
            host = urlparse(url).netloc
            print(
                f"Error: {host} is not supported and has no parseable Recipe schema",
                file=sys.stderr,
            )
            sys.exit(1)

    return {
        "title": _safe_call(scraper.title),
        "yields": _safe_call(scraper.yields),
        "prep_time": _safe_call(scraper.prep_time),
        "cook_time": _safe_call(scraper.cook_time),
        "image": _safe_call(scraper.image),
        "ingredients": _safe_call(scraper.ingredients) or [],
        "instructions": _safe_call(scraper.instructions) or "",
    }


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main(url: str) -> None:
    scraped = scrape(url)
    if not scraped.get("ingredients"):
        print("Warning: no ingredients found in scrape", file=sys.stderr)
    if not scraped.get("instructions"):
        print("Warning: no instructions found in scrape", file=sys.stderr)

    recipe = build_recipe(scraped)
    final_slug = resolve_slug(recipe["slug"])
    recipe["slug"] = final_slug
    content = render_markdown(recipe)
    output_path = RECIPES_DIR / f"{final_slug}.md"
    write_file(output_path, content)
    try:
        rel = output_path.relative_to(REPO_ROOT)
    except ValueError:
        rel = output_path
    print(str(rel))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/import_recipe.py <url>", file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1])
