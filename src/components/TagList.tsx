interface TagListProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
}

export default function TagList({ tags, onTagClick }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`text-xs px-2.5 py-0.5 rounded-full bg-tag text-tag-ink tracking-wide ${
            onTagClick ? "cursor-pointer hover:bg-line" : ""
          }`}
          onClick={() => onTagClick?.(tag)}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
