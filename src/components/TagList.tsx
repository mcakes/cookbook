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
          className={`text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 ${
            onTagClick ? "cursor-pointer hover:bg-blue-200" : ""
          }`}
          onClick={() => onTagClick?.(tag)}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
