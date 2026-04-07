interface StarRatingProps {
  rating: number;
  max?: number;
  onChange?: (rating: number) => void;
}

export default function StarRating({ rating, max = 5, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`text-lg ${i < rating ? "text-yellow-400" : "text-gray-300"} ${
            onChange ? "cursor-pointer" : ""
          }`}
          onClick={() => onChange?.(i + 1)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
