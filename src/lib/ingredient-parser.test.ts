import { describe, it, expect } from "vitest";
import { parseIngredient, formatQuantity } from "./ingredient-parser";

describe("parseIngredient — quantities and units", () => {
  it("parses attached units", () => {
    const p = parseIngredient("200g pasta");
    expect(p.quantity).toBe(200);
    expect(p.unit).toBe("g");
    expect(p.unitRaw).toBe("g");
    expect(p.name).toBe("pasta");
  });

  it("parses abbreviated units", () => {
    const p = parseIngredient("1/2 tsp salt");
    expect(p.quantity).toBe(0.5);
    expect(p.unit).toBe("tsp");
  });

  it("canonicalises spelled-out units, preserving the raw form", () => {
    const p = parseIngredient("3 tablespoons extra-virgin olive oil");
    expect(p.quantity).toBe(3);
    expect(p.unit).toBe("tbsp");
    expect(p.unitRaw).toBe("tablespoons");
    expect(p.name).toBe("extra-virgin olive oil");
  });

  it("canonicalises singular spelled-out units", () => {
    const p = parseIngredient("1 tablespoon maple syrup");
    expect(p.unit).toBe("tbsp");
    expect(p.name).toBe("maple syrup");
  });

  it("parses mixed numbers with spelled-out units", () => {
    const p = parseIngredient("1 1/2 teaspoons garam masala");
    expect(p.quantity).toBe(1.5);
    expect(p.unit).toBe("tsp");
    expect(p.name).toBe("garam masala");
  });

  it("parses pounds and ounces", () => {
    expect(parseIngredient("2 lbs tomatillos").unit).toBe("lb");
    expect(parseIngredient("3 pounds chicken thighs").unit).toBe("lb");
    expect(parseIngredient("5 ounces pitted green olives").unit).toBe("oz");
    expect(parseIngredient("1 pint cherry tomatoes").unit).toBe("pint");
  });

  it("parses unicode fractions", () => {
    expect(parseIngredient("½ cup rice").quantity).toBe(0.5);
    expect(parseIngredient("1½ cups rice").quantity).toBe(1.5);
  });

  it("parses ranges", () => {
    const p = parseIngredient("1/4 to 1/2 teaspoon Aleppo pepper");
    expect(p.quantity).toBe(0.25);
    expect(p.quantityMax).toBe(0.5);
    expect(p.unit).toBe("tsp");
    expect(p.name).toBe("Aleppo pepper");
  });

  it("parses bare counts", () => {
    const p = parseIngredient("8 large eggs");
    expect(p.quantity).toBe(8);
    expect(p.unit).toBe("");
    expect(p.name).toBe("large eggs");
  });

  it("handles no quantity", () => {
    const p = parseIngredient("Freshly ground black pepper");
    expect(p.quantity).toBeNull();
    expect(p.name).toBe("Freshly ground black pepper");
  });
});

describe("formatQuantity", () => {
  it("snaps near-integers", () => {
    expect(formatQuantity(10.04)).toBe("10");
    expect(formatQuantity(3)).toBe("3");
  });
  it("renders common fractions", () => {
    expect(formatQuantity(0.5)).toBe("1/2");
    expect(formatQuantity(1.5)).toBe("1 1/2");
    expect(formatQuantity(0.25)).toBe("1/4");
    expect(formatQuantity(0.75)).toBe("3/4");
  });
  it("falls back to two decimals", () => {
    expect(formatQuantity(0.1)).toBe("0.1");
    expect(formatQuantity(1.33)).toBe("1 1/3");
    expect(formatQuantity(2.6)).toBe("2.6");
  });
});

describe("parseIngredient — notes and noise parens", () => {
  it("splits prep notes at a comma followed by a prep word", () => {
    const p = parseIngredient("1 large yellow onion, finely diced");
    expect(p.name).toBe("large yellow onion");
    expect(p.note).toBe("finely diced");
  });

  it("keeps commas that are part of the name", () => {
    const p = parseIngredient("8 bone-in, skin-on chicken thighs");
    expect(p.name).toBe("bone-in, skin-on chicken thighs");
    expect(p.note).toBe("");
  });

  it("splits multi-clause notes at the first prep word", () => {
    const p = parseIngredient("2 red bell peppers, cored, seeded, and thinly sliced");
    expect(p.name).toBe("red bell peppers");
    expect(p.note).toBe("cored, seeded, and thinly sliced");
  });

  it("treats 'plus …' as a note", () => {
    const p = parseIngredient("3 tablespoons extra-virgin olive oil, plus more for finishing");
    expect(p.name).toBe("extra-virgin olive oil");
    expect(p.note).toBe("plus more for finishing");
  });

  it("strips non-quantity parens from the name", () => {
    const p = parseIngredient("1/2 teaspoon red pepper flakes (optional)");
    expect(p.name).toBe("red pepper flakes");
  });

  it("strips 'such as' parens", () => {
    const p = parseIngredient("3 tablespoons neutral oil (such as avocado or grapeseed), divided");
    expect(p.name).toBe("neutral oil");
    expect(p.note).toBe("divided");
  });

  it("strips alternative parens", () => {
    const p = parseIngredient("1 1/2 teaspoons Diamond Crystal kosher salt (or 3/4 teaspoon table salt), divided");
    expect(p.name).toBe("Diamond Crystal kosher salt");
    expect(p.note).toBe("divided");
  });
});
