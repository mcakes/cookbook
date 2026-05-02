// src/lib/nutrition.test.ts
import { describe, it, expect } from "vitest";
import { normaliseKey } from "./nutrition";

describe("normaliseKey", () => {
  it("lowercases", () => {
    expect(normaliseKey("Tomatillos")).toBe("tomatillos");
  });
  it("trims and collapses whitespace", () => {
    expect(normaliseKey("  whole   chicken  ")).toBe("whole chicken");
  });
  it("NFC-normalises accents", () => {
    // "Jalapeño" (combining tilde) → "Jalapeño" (precomposed)
    expect(normaliseKey("Jalapeño peppers")).toBe(normaliseKey("Jalapeño peppers"));
  });
});
