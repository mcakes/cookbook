// src/lib/nutrition.ts
export function normaliseKey(s: string): string {
  return s.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
}
