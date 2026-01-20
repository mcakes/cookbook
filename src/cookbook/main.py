from string import Template
import typing
import typer
from pathlib import Path

app = typer.Typer(name="cookbook", help="A simple cookbook application.")


@app.command("gen")
def generate(
    paths: typing.Annotated[
        list[Path] | None, typer.Argument(..., help="Paths to recipe YAML files.")
    ] = None,
    template_path: typing.Annotated[
        Path, typer.Option("-t", "--template", help="Path to the recipe template file.")
    ] = Path("templates/recipe.html"),
    output_dir: typing.Annotated[
        Path,
        typer.Option("-o", "--output-dir", help="Directory to save generated recipes."),
    ] = Path("www"),
):
    """Generate recipes from YAML files using a template."""
    from cookbook.generate import generate_recipe
    from cookbook.parse import parse_recipe

    if not paths:
        paths = list(Path("recipes").glob("*.yaml"))

    with open(template_path, "r") as template_file:
        template = Template(template_file.read())

    for path in paths:
        with open(path, "r") as recipe_file:
            parsed_recipe = parse_recipe(recipe_file)
            output = generate_recipe(template, parsed_recipe)

        with open(output_dir / f"{path.stem}.html", "w") as output_file:
            output_file.write(output)


if __name__ == "__main__":
    app()
