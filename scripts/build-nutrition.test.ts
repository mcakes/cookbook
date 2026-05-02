import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CACHE_DIR = path.resolve(import.meta.dirname, ".cache");
const OUT_DIR   = path.resolve(import.meta.dirname, "../public/nutrition");

const fixture = {
  FoundationFoods: [
    {
      fdcId: 11952,
      description: "Tomatillos, raw",
      foodNutrients: [
        { nutrient: { id: 1008 }, amount: 32 },
        { nutrient: { id: 1003 }, amount: 0.96 },
        { nutrient: { id: 1004 }, amount: 1.02 },
        { nutrient: { id: 1258 }, amount: 0.14 },
        { nutrient: { id: 1005 }, amount: 5.84 },
        { nutrient: { id: 2000 }, amount: 3.93 },
        { nutrient: { id: 1079 }, amount: 1.9 },
        { nutrient: { id: 1093 }, amount: 1 },
      ],
    },
  ],
};

describe("build-nutrition", () => {
  let foundationBackup: Buffer | null = null;
  let srBackup: Buffer | null = null;
  let outDirBefore: Set<string> = new Set();

  beforeEach(() => {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const fPath = path.join(CACHE_DIR, "foundation.json");
    const sPath = path.join(CACHE_DIR, "sr-legacy.json");
    if (fs.existsSync(fPath)) foundationBackup = fs.readFileSync(fPath);
    if (fs.existsSync(sPath)) srBackup = fs.readFileSync(sPath);
    fs.writeFileSync(fPath, JSON.stringify(fixture));
    fs.writeFileSync(sPath, JSON.stringify({ SRLegacyFoods: [] }));

    outDirBefore = fs.existsSync(OUT_DIR) ? new Set(fs.readdirSync(OUT_DIR)) : new Set();
  });

  afterEach(() => {
    const fPath = path.join(CACHE_DIR, "foundation.json");
    const sPath = path.join(CACHE_DIR, "sr-legacy.json");
    if (foundationBackup) fs.writeFileSync(fPath, foundationBackup);
    else fs.unlinkSync(fPath);
    if (srBackup) fs.writeFileSync(sPath, srBackup);
    else fs.unlinkSync(sPath);

    if (fs.existsSync(OUT_DIR)) {
      for (const name of fs.readdirSync(OUT_DIR)) {
        if (!outDirBefore.has(name)) {
          fs.unlinkSync(path.join(OUT_DIR, name));
        }
      }
      // If we created the directory, remove it too
      if (outDirBefore.size === 0 && fs.readdirSync(OUT_DIR).length === 0) {
        fs.rmdirSync(OUT_DIR);
      }
    }
  });

  it("emits foods, index, and manifest", () => {
    execSync("npx tsx scripts/build-nutrition.ts", { stdio: "pipe" });
    const manifest = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "manifest.json"), "utf-8"));
    expect(manifest.hash).toMatch(/^[0-9a-f]{8}$/);
    const foods = JSON.parse(fs.readFileSync(path.join(OUT_DIR, manifest.foodsPath), "utf-8"));
    expect(foods).toHaveLength(1);
    expect(foods[0].id).toBe("fdc:11952");
    expect(foods[0].defaultPiece).toEqual({ unit: "tomatillo", grams: 34 });
    expect(foods[0].aliases).toContain("tomatillo");
  });
});
