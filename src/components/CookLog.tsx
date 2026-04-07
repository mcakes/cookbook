import type { CookLogEntry } from "../types/recipe";

interface CookLogProps {
  entries: CookLogEntry[];
}

export default function CookLog({ entries }: CookLogProps) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Cook Log</h2>
      <div className="space-y-3">
        {sorted.map((entry, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="text-gray-500 whitespace-nowrap font-mono">
              {entry.date}
            </span>
            {entry.notes && <span className="text-gray-700">{entry.notes}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
