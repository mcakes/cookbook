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
