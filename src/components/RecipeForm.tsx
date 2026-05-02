import { useState } from "react";
import StarRating from "./StarRating";
import type { CookLogEntry } from "../types/recipe";

interface RecipeFormProps {
  title: string;
  tags: string[];
  rating: number | undefined;
  servings: number | undefined;
  prepTime: number | undefined;
  cookTime: number | undefined;
  cookLog: CookLogEntry[];
  onTitleChange: (title: string) => void;
  onTagsChange: (tags: string[]) => void;
  onRatingChange: (rating: number) => void;
  onServingsChange: (servings: number | undefined) => void;
  onPrepTimeChange: (time: number | undefined) => void;
  onCookTimeChange: (time: number | undefined) => void;
  onCookLogChange: (log: CookLogEntry[]) => void;
}

export default function RecipeForm({
  title, tags, rating, servings, prepTime, cookTime, cookLog,
  onTitleChange, onTagsChange, onRatingChange, onServingsChange,
  onPrepTimeChange, onCookTimeChange, onCookLogChange,
}: RecipeFormProps) {
  const [tagInput, setTagInput] = useState("");
  const [newLogDate, setNewLogDate] = useState("");
  const [newLogNotes, setNewLogNotes] = useState("");

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const addCookLogEntry = () => {
    if (!newLogDate) return;
    onCookLogChange([{ date: newLogDate, notes: newLogNotes }, ...cookLog]);
    setNewLogDate("");
    setNewLogNotes("");
  };

  const parseNum = (val: string): number | undefined => {
    const n = parseInt(val, 10);
    return isNaN(n) ? undefined : n;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full border border-line rounded-md px-3 py-2"
          placeholder="Recipe title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Rating</label>
        <StarRating rating={rating ?? 0} onChange={onRatingChange} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Servings</label>
          <input type="number" value={servings ?? ""} onChange={(e) => onServingsChange(parseNum(e.target.value))} className="w-full border border-line rounded-md px-3 py-2" min={1} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Prep (min)</label>
          <input type="number" value={prepTime ?? ""} onChange={(e) => onPrepTimeChange(parseNum(e.target.value))} className="w-full border border-line rounded-md px-3 py-2" min={0} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Cook (min)</label>
          <input type="number" value={cookTime ?? ""} onChange={(e) => onCookTimeChange(parseNum(e.target.value))} className="w-full border border-line rounded-md px-3 py-2" min={0} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-tag text-tag-ink cursor-pointer hover:bg-tag hover:text-danger" onClick={() => removeTag(tag)}>
              {tag} ×
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add a tag..." className="flex-1 border border-line rounded-md px-3 py-1.5 text-sm" />
          <button type="button" onClick={addTag} className="text-sm text-accent hover:text-ink px-2">Add</button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Cook Log</label>
        <div className="flex gap-2 mb-2">
          <input type="date" value={newLogDate} onChange={(e) => setNewLogDate(e.target.value)} className="border border-line rounded-md px-3 py-1.5 text-sm" />
          <input type="text" value={newLogNotes} onChange={(e) => setNewLogNotes(e.target.value)} placeholder="Notes (optional)" className="flex-1 border border-line rounded-md px-3 py-1.5 text-sm" />
          <button type="button" onClick={addCookLogEntry} className="text-sm bg-tag hover:bg-line px-3 py-1.5 rounded-md">Log</button>
        </div>
        {cookLog.length > 0 && (
          <div className="text-sm text-muted space-y-1">
            {cookLog.map((entry, i) => (
              <div key={i}><span className="font-mono">{entry.date}</span>{entry.notes && ` — ${entry.notes}`}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
