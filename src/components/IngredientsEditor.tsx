interface IngredientsEditorProps {
  ingredients: string[];
  onChange: (ingredients: string[]) => void;
}

export default function IngredientsEditor({ ingredients, onChange }: IngredientsEditorProps) {
  const updateLine = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    onChange(updated);
  };

  const addLine = () => onChange([...ingredients, ""]);

  const removeLine = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-2">
        Ingredients
      </label>
      <div className="space-y-2">
        {ingredients.map((ingredient, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={ingredient}
              onChange={(e) => updateLine(i, e.target.value)}
              placeholder="e.g. 200g pasta"
              className="flex-1 border border-line rounded-md px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeLine(i)}
              className="text-danger hover:text-danger px-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addLine}
        className="mt-2 text-sm text-accent hover:text-ink"
      >
        + Add ingredient
      </button>
    </div>
  );
}
