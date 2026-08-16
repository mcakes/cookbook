import { describe, it, expect } from "vitest";
import { splitLeadingQuantity } from "./IngredientList";

describe("splitLeadingQuantity", () => {
  it("splits count + unit", () => {
    expect(splitLeadingQuantity("2 tbsp olive oil")).toEqual({ qty: "2 tbsp", rest: "olive oil" });
  });
  it("splits attached metric unit", () => {
    expect(splitLeadingQuantity("400g chopped tomatoes")).toEqual({ qty: "400g", rest: "chopped tomatoes" });
  });
  it("splits bare count without swallowing the noun", () => {
    expect(splitLeadingQuantity("1 lemon")).toEqual({ qty: "1", rest: "lemon" });
  });
  it("splits unicode fractions", () => {
    expect(splitLeadingQuantity("½ red onion, sliced")).toEqual({ qty: "½", rest: "red onion, sliced" });
  });
  it("returns empty qty when there is no leading quantity", () => {
    expect(splitLeadingQuantity("salt and pepper")).toEqual({ qty: "", rest: "salt and pepper" });
  });
});
