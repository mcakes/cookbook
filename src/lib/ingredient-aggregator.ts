const QUANTITY_RE = /^(\d+(?:\.\d+)?)\s+(.+)$/;

function parse(ingredient: string): { quantity: number | null; rest: string; original: string } {
  const trimmed = ingredient.trim();
  const match = trimmed.match(QUANTITY_RE);
  if (match) {
    return { quantity: Number(match[1]), rest: match[2], original: trimmed };
  }
  return { quantity: null, rest: trimmed, original: trimmed };
}

function stripPlural(word: string): string {
  if (word.endsWith("es") && word.length > 2) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 1) return word.slice(0, -1);
  return word;
}

function keyFor(rest: string): string {
  return rest
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map(stripPlural)
    .join(" ");
}

export function aggregateIngredients(ingredients: string[]): string[] {
  type Group = {
    firstRest: string;
    firstOriginal: string;
    numericTotal: number;
    numericCount: number;
    nonNumericCount: number;
  };

  const groups = new Map<string, Group>();
  const order: string[] = [];

  for (const raw of ingredients) {
    const { quantity, rest, original } = parse(raw);
    const key = keyFor(rest);

    let group = groups.get(key);
    if (!group) {
      group = {
        firstRest: rest,
        firstOriginal: original,
        numericTotal: 0,
        numericCount: 0,
        nonNumericCount: 0,
      };
      groups.set(key, group);
      order.push(key);
    }

    if (quantity !== null) {
      group.numericTotal += quantity;
      group.numericCount += 1;
    } else {
      group.nonNumericCount += 1;
    }
  }

  return order.map((key) => {
    const group = groups.get(key)!;
    if (group.numericCount > 0) {
      const total = group.numericTotal + group.nonNumericCount;
      return `${total} ${group.firstRest}`;
    }
    if (group.nonNumericCount > 1) {
      return `${group.firstOriginal} ×${group.nonNumericCount}`;
    }
    return group.firstOriginal;
  });
}
