import type { CookLogEntry } from "../types/recipe";

interface CookLogProps {
  entries: CookLogEntry[];
}

export default function CookLog({ entries }: CookLogProps) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <h2 className="font-display text-lg font-medium text-ink mb-4 pb-2 border-b border-line">
        Cook Log
      </h2>
      <div className="space-y-3">
        {sorted.map((entry, i) => (
          <div key={i} className="flex gap-4 text-sm">
            <span className="text-muted whitespace-nowrap font-mono tabular-nums">
              {entry.date}
            </span>
            {entry.notes && <span className="text-ink">{entry.notes}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
