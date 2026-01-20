from string import Template
import typing
import typer
from pathlib import Path

from cookbook.generate import recipe_title_to_html_filename

app = typer.Typer(name="cookbook", help="A simple cookbook application.")


@app.command("gen")
def generate(
    paths: typing.Annotated[
        list[Path] | None, typer.Argument(..., help="Paths to recipe YAML files.")
    ] = None,
    template_dir: typing.Annotated[
        Path, typer.Option("-t", "--template", help="Path to the recipe template directory.")
    ] = Path("templates"),
    output_dir: typing.Annotated[
        Path,
        typer.Option("-o", "--output-dir", help="Directory to save generated recipes."),
    ] = Path("www"),
):
    """Generate recipes from YAML files using a template."""
    from cookbook.generate import generate_recipe, generate_home
    from cookbook.parse import parse_recipe

    if not paths:
        paths = list(Path("recipes").glob("*.yaml"))

    with open(template_dir / "recipe.html", "r") as template_file:
        template = Template(template_file.read())

    parsed_recipes = []
    for path in paths:
        with open(path, "r") as recipe_file:
            parsed_recipe = parse_recipe(recipe_file)
            parsed_recipes.append(parsed_recipe)
            output = generate_recipe(template, parsed_recipe)

        with open(output_dir / recipe_title_to_html_filename(parsed_recipe), "w") as output_file:
            output_file.write(output)
    
    with open(output_dir / "index.html", "w") as home_file:
        with open(template_dir / "home.html", "r") as home_template_file:
            home_template = Template(home_template_file.read())
        home_output = generate_home(home_template, parsed_recipes)
        home_file.write(home_output)

if __name__ == "__main__":
    app()
