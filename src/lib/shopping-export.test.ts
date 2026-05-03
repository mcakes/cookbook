import { describe, it, expect } from "vitest";
import { toPlainText, toMarkdown } from "./shopping-export";
import type { ShoppingItem } from "./shopping-list";

const sample: ShoppingItem[] = [
  { id: "1", text: "2 white onions", checked: false },
  { id: "2", text: "1 lemon", checked: true },
  { id: "3", text: "Salt to taste", checked: false },
];

describe("toPlainText", () => {
  it("excludes checked items and joins remaining items with newlines", () => {
    expect(toPlainText(sample)).toBe("2 white onions\nSalt to taste");
  });

  it("returns an empty string when every item is checked", () => {
    const allChecked: ShoppingItem[] = sample.map((i) => ({ ...i, checked: true }));
    expect(toPlainText(allChecked)).toBe("");
  });

  it("returns an empty string for an empty list", () => {
    expect(toPlainText([])).toBe("");
  });

  it("does not append a trailing newline", () => {
    expect(toPlainText([{ id: "1", text: "milk", checked: false }])).toBe("milk");
  });
});

describe("toMarkdown", () => {
  it("formats each item as a checklist line preserving check state", () => {
    expect(toMarkdown(sample)).toBe(
      "- [ ] 2 white onions\n- [x] 1 lemon\n- [ ] Salt to taste"
    );
  });

  it("returns an empty string for an empty list", () => {
    expect(toMarkdown([])).toBe("");
  });

  it("does not append a trailing newline", () => {
    expect(toMarkdown([{ id: "1", text: "milk", checked: false }])).toBe(
      "- [ ] milk"
    );
  });
});
