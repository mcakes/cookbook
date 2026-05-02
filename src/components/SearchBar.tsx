interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Search recipes…"}
      className="w-full bg-field border border-line rounded-md px-4 py-2.5 text-lg text-ink placeholder:text-muted focus:border-accent transition-colors"
    />
  );
}
