import { describe, it, expect, beforeEach } from "vitest";
import {
  getShoppingList,
  setShoppingList,
  clearShoppingList,
  snapshotFromDerived,
  type ShoppingListSnapshot,
} from "./shopping-list";

describe("shopping-list persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no snapshot is stored", () => {
    expect(getShoppingList()).toBeNull();
  });

  it("round-trips a snapshot through localStorage", () => {
    const snapshot: ShoppingListSnapshot = {
      items: [
        { id: "a", text: "2 white onions", checked: false },
        { id: "b", text: "1 lemon", checked: true },
      ],
      generatedAt: "2026-05-02T12:00:00.000Z",
    };
    setShoppingList(snapshot);
    expect(getShoppingList()).toEqual(snapshot);
  });

  it("clears the stored snapshot", () => {
    setShoppingList({
      items: [{ id: "a", text: "x", checked: false }],
      generatedAt: "2026-05-02T12:00:00.000Z",
    });
    clearShoppingList();
    expect(getShoppingList()).toBeNull();
  });

  it("returns null when stored data is corrupt", () => {
    localStorage.setItem("cookbook_shopping_list", "not json");
    expect(getShoppingList()).toBeNull();
  });
});

describe("snapshotFromDerived", () => {
  it("builds a snapshot with one item per derived string, all unchecked, in order", () => {
    const snapshot = snapshotFromDerived(["2 white onions", "1 lemon", "Salt to taste"]);
    expect(snapshot.items.map((i) => i.text)).toEqual([
      "2 white onions",
      "1 lemon",
      "Salt to taste",
    ]);
    expect(snapshot.items.every((i) => i.checked === false)).toBe(true);
  });

  it("assigns a unique id to each item", () => {
    const snapshot = snapshotFromDerived(["a", "b", "a"]);
    const ids = snapshot.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("populates generatedAt with an ISO timestamp", () => {
    const snapshot = snapshotFromDerived(["x"]);
    expect(snapshot.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
