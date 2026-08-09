import fs from "fs";
import path from "path";
import { coreNameKey } from "../src/lib/ingredient-parser";

const file = path.resolve(import.meta.dirname, "../public/data/nutrition-mappings.json");
const mappings: Record<string, unknown> = JSON.parse(fs.readFileSync(file, "utf-8"));

const migrated: Record<string, unknown> = {};
for (const [key, value] of Object.entries(mappings)) {
  const newKey = coreNameKey(key);
  if (newKey in migrated) {
    console.warn(`collision: "${key}" → "${newKey}" already present; keeping first entry`);
    continue;
  }
  migrated[newKey] = value;
}

fs.writeFileSync(file, JSON.stringify(migrated, null, 2) + "\n");
console.log(`Migrated ${Object.keys(mappings).length} → ${Object.keys(migrated).length} keys`);
