import { useState } from "react";

interface ShoppingListProps {
  items: string[];
}

export default function ShoppingList({ items }: ShoppingListProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    const next = new Set(checked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setChecked(next);
  };

  if (items.length === 0) {
    return <p className="text-muted text-sm">Add recipes to generate a shopping list.</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Shopping List</h2>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={checked.has(i)}
              onChange={() => toggle(i)}
              className="rounded"
            />
            <span className={checked.has(i) ? "line-through text-muted" : "text-ink"}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
