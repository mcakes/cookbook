import {
  parseIngredient, coreNameKey, formatQuantity, MASS_TO_G, VOL_TO_ML,
} from "./ingredient-parser";

interface Group {
  firstName: string;      // first-seen parsed name (prep note already dropped)
  firstOriginal: string;
  massG: number;
  volMl: number;
  count: number;
  unitVotes: Map<string, number>;
  nonNumeric: number;
}

function pickUnit(g: Group, table: Record<string, number>): string {
  const candidates = [...g.unitVotes.entries()].filter(([u]) => u in table);
  if (candidates.length === 0) return table === MASS_TO_G ? "g" : "ml";
  // Most votes first; ties broken by the larger unit.
  candidates.sort((a, b) => b[1] - a[1] || table[b[0]] - table[a[0]]);
  return candidates[0][0];
}

/**
 * Unit-converted totals accumulate float error (e.g. 3 tbsp + 60 ml + 3 tbsp
 * = 10.058 tbsp), so snap near-integers before formatting. Counts stay exact
 * and don't need this.
 */
function formatUnitTotal(n: number): string {
  const snapped = Math.abs(n - Math.round(n)) < 0.1 ? Math.round(n) : n;
  return formatQuantity(snapped);
}

export function aggregateIngredients(ingredients: string[]): string[] {
  const groups = new Map<string, Group>();
  const order: string[] = [];

  for (const raw of ingredients) {
    const p = parseIngredient(raw);
    const key = coreNameKey(p);
    let g = groups.get(key);
    if (!g) {
      g = {
        firstName: p.name, firstOriginal: raw.trim(),
        massG: 0, volMl: 0, count: 0,
        unitVotes: new Map(), nonNumeric: 0,
      };
      groups.set(key, g);
      order.push(key);
    }

    if (p.quantity === null) {
      g.nonNumeric += 1;
      continue;
    }
    // Prefer the author's metric restatement over converting the stated unit.
    if (p.restatement?.unit === "g") {
      g.massG += p.restatement.value;
      g.unitVotes.set(p.unit || "g", (g.unitVotes.get(p.unit || "g") ?? 0) + 1);
    } else if (p.restatement?.unit === "ml") {
      g.volMl += p.restatement.value;
      g.unitVotes.set(p.unit || "ml", (g.unitVotes.get(p.unit || "ml") ?? 0) + 1);
    } else if (p.unit in MASS_TO_G) {
      g.massG += p.quantity * MASS_TO_G[p.unit];
      g.unitVotes.set(p.unit, (g.unitVotes.get(p.unit) ?? 0) + 1);
    } else if (p.unit in VOL_TO_ML) {
      g.volMl += p.quantity * VOL_TO_ML[p.unit];
      g.unitVotes.set(p.unit, (g.unitVotes.get(p.unit) ?? 0) + 1);
    } else {
      g.count += p.quantity;
    }
  }

  const out: string[] = [];
  for (const key of order) {
    const g = groups.get(key)!;
    const hasNumeric = g.count > 0 || g.massG > 0 || g.volMl > 0;
    if (!hasNumeric) {
      out.push(g.nonNumeric > 1 ? `${g.firstOriginal} ×${g.nonNumeric}` : g.firstOriginal);
      continue;
    }
    // Unquantified duplicates only count as 1 each when the group already has
    // a count; if the group's numeric evidence is mass/volume-only, a bare
    // "lemon" doesn't get its own phantom count line.
    const count = g.count > 0 ? g.count + g.nonNumeric : g.count;
    if (count > 0) out.push(`${formatQuantity(count)} ${g.firstName}`);
    if (g.massG > 0) {
      const unit = pickUnit(g, MASS_TO_G);
      out.push(`${formatUnitTotal(g.massG / MASS_TO_G[unit])} ${unit} ${g.firstName}`);
    }
    if (g.volMl > 0) {
      const unit = pickUnit(g, VOL_TO_ML);
      out.push(`${formatUnitTotal(g.volMl / VOL_TO_ML[unit])} ${unit} ${g.firstName}`);
    }
  }
  return out;
}
