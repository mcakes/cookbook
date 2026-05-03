import { useState } from "react";
import {
  getShoppingList,
  setShoppingList,
  clearShoppingList,
  snapshotFromDerived,
  type ShoppingListSnapshot,
  type ShoppingItem,
} from "../lib/shopping-list";
import { toPlainText, toMarkdown } from "../lib/shopping-export";

interface ShoppingListProps {
  derivedItems: string[];
}

type CopyTarget = "text" | "markdown" | null;

export default function ShoppingList({ derivedItems }: ShoppingListProps) {
  const [snapshot, setSnapshot] = useState<ShoppingListSnapshot | null>(getShoppingList);
  const [previewChecked, setPreviewChecked] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [copied, setCopied] = useState<CopyTarget>(null);

  const persist = (next: ShoppingListSnapshot | null) => {
    if (next) setShoppingList(next);
    else clearShoppingList();
    setSnapshot(next);
  };

  const updateItems = (mutate: (items: ShoppingItem[]) => ShoppingItem[]) => {
    if (!snapshot) return;
    persist({ ...snapshot, items: mutate(snapshot.items) });
  };

  const togglePreview = (i: number) => {
    const next = new Set(previewChecked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setPreviewChecked(next);
  };

  const handleGenerate = () => {
    persist(snapshotFromDerived(derivedItems));
    setPreviewChecked(new Set());
  };

  const handleRegenerate = () => {
    if (!window.confirm("Replace shopping list with a fresh snapshot? This discards your edits.")) {
      return;
    }
    persist(snapshotFromDerived(derivedItems));
  };

  const handleToggle = (id: string) => {
    updateItems((items) =>
      items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  };

  const handleDelete = (id: string) => {
    updateItems((items) => items.filter((it) => it.id !== id));
  };

  const startEditing = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const commitEdit = () => {
    if (editingId === null) return;
    const trimmed = editingText.trim();
    if (trimmed === "") {
      handleDelete(editingId);
    } else {
      updateItems((items) =>
        items.map((it) => (it.id === editingId ? { ...it, text: trimmed } : it))
      );
    }
    setEditingId(null);
    setEditingText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const handleAdd = () => {
    const trimmed = newItemText.trim();
    if (trimmed === "" || !snapshot) return;
    persist({
      ...snapshot,
      items: [
        ...snapshot.items,
        { id: crypto.randomUUID(), text: trimmed, checked: false },
      ],
    });
    setNewItemText("");
  };

  const copy = async (target: Exclude<CopyTarget, null>) => {
    if (!snapshot) return;
    const text = target === "text" ? toPlainText(snapshot.items) : toMarkdown(snapshot.items);
    await navigator.clipboard.writeText(text);
    setCopied(target);
    setTimeout(() => setCopied((curr) => (curr === target ? null : curr)), 1500);
  };

  if (!snapshot && derivedItems.length === 0) {
    return <p className="text-muted text-sm">Add recipes to generate a shopping list.</p>;
  }

  if (!snapshot) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-3">Shopping List</h2>
        <ul className="space-y-1.5">
          {derivedItems.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={previewChecked.has(i)}
                onChange={() => togglePreview(i)}
                className="rounded"
              />
              <span className={previewChecked.has(i) ? "line-through text-muted" : "text-ink"}>
                {item}
              </span>
            </li>
          ))}
        </ul>
        <button
          onClick={handleGenerate}
          className="mt-4 px-3 py-1.5 bg-accent text-paper rounded text-sm hover:bg-accent-hover"
        >
          Generate Shopping List
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Shopping List</h2>
      <ul className="space-y-1.5">
        {snapshot.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleToggle(item.id)}
              className="rounded"
            />
            {editingId === item.id ? (
              <input
                type="text"
                value={editingText}
                autoFocus
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  else if (e.key === "Escape") cancelEdit();
                }}
                className="flex-1 bg-field border border-line rounded px-2 py-0.5 text-sm"
              />
            ) : (
              <span
                onClick={() => startEditing(item)}
                className={
                  item.checked
                    ? "line-through text-muted flex-1 cursor-text"
                    : "text-ink flex-1 cursor-text"
                }
              >
                {item.text}
              </span>
            )}
            <button
              onClick={() => handleDelete(item.id)}
              className="text-line group-hover:text-danger ml-1"
              aria-label="Delete item"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="Add item..."
          className="flex-1 bg-field border border-line rounded px-2 py-1 text-sm"
        />
        <button
          onClick={handleAdd}
          className="text-sm text-accent hover:text-accent-hover"
        >
          Add
        </button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => copy("text")}
          className="px-3 py-1.5 bg-tag rounded text-sm hover:bg-line"
        >
          {copied === "text" ? "Copied!" : "Copy as text"}
        </button>
        <button
          onClick={() => copy("markdown")}
          className="px-3 py-1.5 bg-tag rounded text-sm hover:bg-line"
        >
          {copied === "markdown" ? "Copied!" : "Copy as markdown"}
        </button>
        <button
          onClick={handleRegenerate}
          className="ml-auto text-sm text-muted hover:text-danger"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}
