import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NUTRITION_DEFAULTS } from "./nutrition-defaults";

const CACHE_DIR  = path.resolve(import.meta.dirname, ".cache");
const FOUNDATION = path.join(CACHE_DIR, "foundation.json");
const SR_LEGACY  = path.join(CACHE_DIR, "sr-legacy.json");
const OUT_DIR    = path.resolve(import.meta.dirname, "../public/nutrition");

// FDC nutrient IDs we care about (per FDC documentation).
const NUTRIENT_IDS = {
  kcal:       1008,  // Energy (kcal)
  protein_g:  1003,
  fat_g:      1004,
  sat_fat_g:  1258,
  carbs_g:    1005,
  sugar_g:    2000,
  fibre_g:    1079,
  sodium_mg:  1093,
};

interface FdcFood {
  fdcId: number;
  description: string;
  foodNutrients: { nutrient: { id: number }; amount?: number }[];
}

interface OutFood {
  id: string;
  name: string;
  aliases: string[];
  per100g: Record<keyof typeof NUTRIENT_IDS, number>;
  density_g_per_ml?: number;
  defaultPiece?: { unit: string; grams: number };
}

// Foods relevant to home cooking. We exclude branded products and prepared
// dishes by sourcing only from Foundation Foods + SR Legacy (which already
// excludes branded), and by filtering descriptions for raw/basic forms.
const KEEP_PATTERNS: RegExp[] = [
  /\braw\b/i,
  /\bdried\b/i,
  /\b(whole|skim|low.fat)\b/i,
  /\bunprepared\b/i,
  /\bground\b/i,
];
const DROP_PATTERNS: RegExp[] = [
  /\bcanned\b/i,
  /\bbabyfood\b/i,
  /\brestaurant\b/i,
  /\bfast.foods\b/i,
];

function shouldKeep(name: string): boolean {
  if (DROP_PATTERNS.some((re) => re.test(name))) return false;
  // Always keep entries that already have a manual default (so we don't accidentally drop them)
  if (name.toLowerCase() in NUTRITION_DEFAULTS) return true;
  return KEEP_PATTERNS.some((re) => re.test(name));
}

function projectFood(food: FdcFood): OutFood | null {
  const per100g = {} as OutFood["per100g"];
  for (const [key, id] of Object.entries(NUTRIENT_IDS)) {
    const match = food.foodNutrients.find((fn) => fn.nutrient.id === id);
    per100g[key as keyof typeof NUTRIENT_IDS] = match?.amount ?? 0;
  }
  // Drop foods with no calorie data — almost certainly not useful
  if (per100g.kcal === 0 && per100g.protein_g === 0 && per100g.fat_g === 0 && per100g.carbs_g === 0) {
    return null;
  }
  const nameLower = food.description.toLowerCase();
  const defaults = NUTRITION_DEFAULTS[nameLower] ?? {};
  const baseAlias = food.description.split(",")[0].toLowerCase().trim();
  const aliases = Array.from(new Set([baseAlias, ...(defaults.aliases ?? [])]));
  return {
    id: `fdc:${food.fdcId}`,
    name: food.description,
    aliases,
    per100g,
    density_g_per_ml: defaults.density_g_per_ml,
    defaultPiece: defaults.defaultPiece,
  };
}

function loadFdc(file: string): FdcFood[] {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing FDC cache: ${file}\n` +
      `Download FoodData Central JSON bundles from https://fdc.nal.usda.gov/fdc-datasets/\n` +
      `Extract foundation.json and sr-legacy.json into scripts/.cache/`
    );
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  // FDC bulk JSON top-level key is "FoundationFoods" or "SRLegacyFoods"
  return raw.FoundationFoods ?? raw.SRLegacyFoods ?? [];
}

function main() {
  const foundation = loadFdc(FOUNDATION);
  const srLegacy   = loadFdc(SR_LEGACY);
  const all: FdcFood[] = [...foundation, ...srLegacy];

  const projected: OutFood[] = [];
  for (const f of all) {
    if (!shouldKeep(f.description)) continue;
    const p = projectFood(f);
    if (p) projected.push(p);
  }

  // Build alias index
  const index: Record<string, string> = {};
  for (const food of projected) {
    for (const alias of food.aliases) {
      // First-write wins: stable ordering means foundation foods take priority
      if (!(alias in index)) index[alias] = food.id;
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Hash the foods JSON; index references the hash
  const foodsBuf = Buffer.from(JSON.stringify(projected));
  const hash = crypto.createHash("sha256").update(foodsBuf).digest("hex").slice(0, 8);

  const foodsPath = path.join(OUT_DIR, `foods.${hash}.json`);
  const indexPath = path.join(OUT_DIR, `foods.index.${hash}.json`);
  const manifestPath = path.join(OUT_DIR, "manifest.json");

  fs.writeFileSync(foodsPath, foodsBuf);
  fs.writeFileSync(indexPath, JSON.stringify(index));
  fs.writeFileSync(manifestPath, JSON.stringify({ hash, foodsPath: `foods.${hash}.json`, indexPath: `foods.index.${hash}.json` }));

  // Clean older artefacts (only files matching this script's own naming scheme)
  const ARTEFACT_RE = /^foods(\.index)?\.[0-9a-f]{8}\.json$/;
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (ARTEFACT_RE.test(f) && !f.includes(hash)) {
      fs.unlinkSync(path.join(OUT_DIR, f));
    }
  }

  console.log(`Built nutrition dataset: ${projected.length} foods @ ${hash} → ${OUT_DIR}`);
}

main();
