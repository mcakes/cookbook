export function aggregateIngredients(ingredients: string[]): string[] {
  type Group = {
    rest: string;
    original: string;
    numericTotal: number;
    numericCount: number;
    nonNumericCount: number;
  };

  const groups = new Map<string, Group>();
  const order: string[] = [];

  for (const raw of ingredients) {
    const original = raw.trim();
    if (original === "") continue;

    const match = original.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    let quantity: number | null;
    let rest: string;
    if (match) {
      quantity = Number(match[1]);
      rest = match[2];
    } else {
      quantity = null;
      rest = original;
    }

    const key = rest
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .map((w) => w.replace(/(es|s)$/, ""))
      .join(" ");

    let group = groups.get(key);
    if (!group) {
      group = {
        rest,
        original,
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
    const g = groups.get(key)!;
    if (g.numericCount > 0) {
      const total = g.numericTotal + g.nonNumericCount;
      return `${total} ${g.rest}`;
    }
    if (g.nonNumericCount > 1) {
      return `${g.original} ×${g.nonNumericCount}`;
    }
    return g.original;
  });
}
