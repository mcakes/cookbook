const STORAGE_KEY = "cookbook_shopping_list";

export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface ShoppingListSnapshot {
  items: ShoppingItem[];
  generatedAt: string;
}

export function getShoppingList(): ShoppingListSnapshot | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ShoppingListSnapshot;
  } catch {
    return null;
  }
}

export function setShoppingList(snapshot: ShoppingListSnapshot): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearShoppingList(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function snapshotFromDerived(items: string[]): ShoppingListSnapshot {
  return {
    items: items.map((text) => ({
      id: crypto.randomUUID(),
      text,
      checked: false,
    })),
    generatedAt: new Date().toISOString(),
  };
}
