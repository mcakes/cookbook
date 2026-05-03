import type { ShoppingItem } from "./shopping-list";

export function toPlainText(items: ShoppingItem[]): string {
  return items
    .filter((i) => !i.checked)
    .map((i) => i.text)
    .join("\n");
}

export function toMarkdown(items: ShoppingItem[]): string {
  return items
    .map((i) => `- [${i.checked ? "x" : " "}] ${i.text}`)
    .join("\n");
}
