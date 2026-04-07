# Cookbook3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal recipe app as a React SPA that uses GitHub as a data store, with markdown-based recipes, client-side search, and a markdown editor for the owner.

**Architecture:** React + TypeScript SPA built with Vite. Recipes are markdown files with YAML frontmatter stored in a GitHub repo. A build-time script generates a JSON index for browsing/search. The app reads individual recipe files from the GitHub API on demand, and writes back via the Contents API using a GitHub PAT stored in localStorage. Fuse.js powers client-side search.

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS, React Router, Fuse.js, gray-matter (frontmatter parsing), react-markdown, @uiw/react-md-editor

---

## File Structure

```
cookbook3/
├── src/
│   ├── main.tsx                    # App entry point, mounts React
│   ├── App.tsx                     # Router setup, layout shell
│   ├── types/
│   │   └── recipe.ts              # Recipe, CookLogEntry, RecipeIndex types
│   ├── lib/
│   │   ├── markdown.ts            # Parse/serialize recipe markdown + frontmatter
│   │   ├── github.ts              # GitHub API client (read/write/delete files, images)
│   │   ├── search.ts              # Fuse.js search index, ingredient matching
│   │   ├── auth.ts                # PAT storage/retrieval from localStorage
│   │   ├── scaling.ts             # Ingredient quantity parser and serving scaler
│   │   └── meal-plan.ts           # Meal plan localStorage persistence
│   ├── hooks/
│   │   ├── useAuth.ts             # Auth context hook
│   │   ├── useRecipeIndex.ts      # Load and cache the recipe index
│   │   └── useRecipe.ts           # Fetch a single full recipe by slug
│   ├── components/
│   │   ├── Layout.tsx             # App shell: nav bar, footer, main content area
│   │   ├── RecipeCard.tsx         # Card for browse grid (image, title, rating, tags)
│   │   ├── StarRating.tsx         # Display and input star rating (1-5)
│   │   ├── TagList.tsx            # Display tags; in edit mode, add/remove with autocomplete
│   │   ├── IngredientList.tsx     # Display ingredients with serving scaler
│   │   ├── CookLog.tsx           # Timeline display of cook log entries
│   │   ├── RecipeFilter.tsx       # Filter/sort controls for browse page
│   │   ├── SearchBar.tsx          # Text search input with results dropdown
│   │   ├── IngredientSearch.tsx   # Multi-select ingredient picker with results
│   │   ├── MarkdownPreview.tsx    # Render markdown to HTML
│   │   ├── RecipeForm.tsx         # Metadata form (title, tags, rating, times, image)
│   │   ├── IngredientsEditor.tsx  # Line-by-line ingredient editing
│   │   ├── ShoppingList.tsx       # Combined shopping list with checkboxes
│   │   └── AuthModal.tsx          # Modal for entering/clearing PAT
│   └── pages/
│       ├── HomePage.tsx           # Browse grid with filters and sorting
│       ├── SearchPage.tsx         # Text search + ingredient search
│       ├── RecipePage.tsx         # Single recipe view
│       ├── EditorPage.tsx         # Recipe editor (new + edit)
│       └── MealPlannerPage.tsx    # Weekly planner + shopping list
├── recipes/                        # Recipe markdown files (data)
│   └── example-recipe.md
├── images/                         # Recipe images
├── scripts/
│   └── build-index.ts             # Build-time: generate recipe-index.json from recipes/
├── public/
│   └── recipe-index.json          # Generated at build time
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `src/main.tsx`, `src/App.tsx`, `index.html`, `vitest.config.ts`, `postcss.config.js`, `src/index.css`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

Run:
```bash
npm create vite@latest . -- --template react-ts
```

If the directory is not empty (docs, .gitignore exist), answer yes to proceed.

- [ ] **Step 2: Install core dependencies**

Run:
```bash
npm install react-router-dom fuse.js gray-matter react-markdown remark-gfm @uiw/react-md-editor
```

- [ ] **Step 3: Install dev dependencies**

Run:
```bash
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom @types/react @types/react-dom
```

- [ ] **Step 4: Configure Tailwind**

Replace `src/index.css` with:
```css
@import "tailwindcss";
```

Update `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

Create `src/test-setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 6: Set up minimal App shell**

Replace `src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Cookbook3</h1>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<p>Home</p>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 7: Verify the app runs**

Run: `npm run dev`
Expected: App loads in browser at localhost:5173 showing "Cookbook3" header and "Home" text.

- [ ] **Step 8: Verify tests run**

Add a smoke test `src/App.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app header", () => {
  render(<App />);
  expect(screen.getByText("Cookbook3")).toBeInTheDocument();
});
```

Run: `npx vitest run`
Expected: 1 test passes.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript project with Tailwind and Vitest"
```

---

## Task 2: TypeScript Types and Recipe Parsing

**Files:**
- Create: `src/types/recipe.ts`, `src/lib/markdown.ts`
- Test: `src/lib/markdown.test.ts`

- [ ] **Step 1: Define TypeScript types**

Create `src/types/recipe.ts`:
```ts
export interface CookLogEntry {
  date: string;
  notes: string;
}

export interface RecipeFrontmatter {
  title: string;
  slug: string;
  tags: string[];
  rating?: number;
  servings?: number;
  prep_time?: number;
  cook_time?: number;
  image?: string;
  ingredients: string[];
  cook_log: CookLogEntry[];
  created: string;
  updated: string;
}

export interface Recipe extends RecipeFrontmatter {
  body: string;
}

export type RecipeIndex = RecipeFrontmatter[];
```

- [ ] **Step 2: Write the failing test for markdown parsing**

Create `src/lib/markdown.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseRecipe, serializeRecipe } from "./markdown";

const SAMPLE_MD = `---
title: "Test Recipe"
slug: test-recipe
tags: [italian, pasta]
rating: 4
servings: 2
prep_time: 10
cook_time: 20
image: test.jpg
ingredients:
  - 200g pasta
  - 100g cheese
cook_log:
  - date: "2026-01-15"
    notes: "Great first attempt"
created: "2026-01-10"
updated: "2026-01-15"
---

## Method

1. Boil pasta
2. Add cheese

## Notes

- Use parmesan for best results
`;

describe("parseRecipe", () => {
  it("parses frontmatter and body from markdown", () => {
    const recipe = parseRecipe(SAMPLE_MD);
    expect(recipe.title).toBe("Test Recipe");
    expect(recipe.slug).toBe("test-recipe");
    expect(recipe.tags).toEqual(["italian", "pasta"]);
    expect(recipe.rating).toBe(4);
    expect(recipe.servings).toBe(2);
    expect(recipe.prep_time).toBe(10);
    expect(recipe.cook_time).toBe(20);
    expect(recipe.image).toBe("test.jpg");
    expect(recipe.ingredients).toEqual(["200g pasta", "100g cheese"]);
    expect(recipe.cook_log).toEqual([
      { date: "2026-01-15", notes: "Great first attempt" },
    ]);
    expect(recipe.body).toContain("## Method");
    expect(recipe.body).toContain("Boil pasta");
  });

  it("handles missing optional fields", () => {
    const minimal = `---
title: "Minimal"
slug: minimal
tags: []
ingredients:
  - 1 egg
cook_log: []
created: "2026-01-01"
updated: "2026-01-01"
---

Crack egg.
`;
    const recipe = parseRecipe(minimal);
    expect(recipe.title).toBe("Minimal");
    expect(recipe.rating).toBeUndefined();
    expect(recipe.servings).toBeUndefined();
    expect(recipe.image).toBeUndefined();
  });
});

describe("serializeRecipe", () => {
  it("round-trips a recipe through parse and serialize", () => {
    const recipe = parseRecipe(SAMPLE_MD);
    const serialized = serializeRecipe(recipe);
    const reparsed = parseRecipe(serialized);
    expect(reparsed.title).toBe(recipe.title);
    expect(reparsed.slug).toBe(recipe.slug);
    expect(reparsed.tags).toEqual(recipe.tags);
    expect(reparsed.ingredients).toEqual(recipe.ingredients);
    expect(reparsed.body).toContain("Boil pasta");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/markdown.test.ts`
Expected: FAIL — module `./markdown` not found.

- [ ] **Step 4: Implement markdown parsing**

Create `src/lib/markdown.ts`:
```ts
import matter from "gray-matter";
import type { Recipe, RecipeFrontmatter } from "../types/recipe";

export function parseRecipe(markdown: string): Recipe {
  const { data, content } = matter(markdown);
  return {
    title: data.title,
    slug: data.slug,
    tags: data.tags ?? [],
    rating: data.rating,
    servings: data.servings,
    prep_time: data.prep_time,
    cook_time: data.cook_time,
    image: data.image,
    ingredients: data.ingredients ?? [],
    cook_log: (data.cook_log ?? []).map((entry: { date: string; notes?: string }) => ({
      date: typeof entry.date === "object" ? (entry.date as Date).toISOString().split("T")[0] : entry.date,
      notes: entry.notes ?? "",
    })),
    created: typeof data.created === "object" ? (data.created as Date).toISOString().split("T")[0] : data.created,
    updated: typeof data.updated === "object" ? (data.updated as Date).toISOString().split("T")[0] : data.updated,
    body: content.trim(),
  };
}

export function serializeRecipe(recipe: Recipe): string {
  const { body, ...frontmatter } = recipe;
  return matter.stringify(`\n${body}\n`, frontmatter);
}

export function extractFrontmatter(recipe: Recipe): RecipeFrontmatter {
  const { body, ...frontmatter } = recipe;
  return frontmatter;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/markdown.test.ts`
Expected: All 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/types/recipe.ts src/lib/markdown.ts src/lib/markdown.test.ts
git commit -m "feat: add recipe types and markdown parse/serialize"
```

---

## Task 3: Ingredient Quantity Scaling

**Files:**
- Create: `src/lib/scaling.ts`
- Test: `src/lib/scaling.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/scaling.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseQuantity, scaleIngredient, scaleIngredients } from "./scaling";

describe("parseQuantity", () => {
  it("parses simple numbers", () => {
    expect(parseQuantity("200g pasta")).toEqual({ quantity: 200, unit: "g", rest: "pasta" });
  });

  it("parses fractions", () => {
    expect(parseQuantity("1/2 tsp salt")).toEqual({ quantity: 0.5, unit: "tsp", rest: "salt" });
  });

  it("parses mixed numbers", () => {
    expect(parseQuantity("1 1/2 cups flour")).toEqual({ quantity: 1.5, unit: "cups", rest: "flour" });
  });

  it("parses unitless quantities", () => {
    expect(parseQuantity("3 eggs")).toEqual({ quantity: 3, unit: "", rest: "eggs" });
  });

  it("handles no quantity", () => {
    expect(parseQuantity("salt to taste")).toEqual({ quantity: null, unit: "", rest: "salt to taste" });
  });
});

describe("scaleIngredient", () => {
  it("scales a simple ingredient", () => {
    expect(scaleIngredient("200g pasta", 2)).toBe("400g pasta");
  });

  it("scales fractions", () => {
    expect(scaleIngredient("1/2 tsp salt", 2)).toBe("1 tsp salt");
  });

  it("leaves non-quantified ingredients unchanged", () => {
    expect(scaleIngredient("salt to taste", 2)).toBe("salt to taste");
  });
});

describe("scaleIngredients", () => {
  it("scales all ingredients by a factor", () => {
    const ingredients = ["200g pasta", "100g cheese", "salt to taste"];
    const scaled = scaleIngredients(ingredients, 4, 2);
    expect(scaled).toEqual(["100g pasta", "50g cheese", "salt to taste"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/scaling.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement scaling**

Create `src/lib/scaling.ts`:
```ts
const UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "cups", "oz", "lb", "lbs", "pinch"];

interface ParsedQuantity {
  quantity: number | null;
  unit: string;
  rest: string;
}

export function parseQuantity(ingredient: string): ParsedQuantity {
  const trimmed = ingredient.trim();

  // Match: optional whole number, optional fraction, optional unit, rest
  const match = trimmed.match(
    /^(\d+)?\s*(\d+\/\d+)?\s*((?:g|kg|ml|l|tsp|tbsp|cups?|oz|lbs?|pinch)\b)?\s*(.*)$/i
  );

  if (!match) {
    return { quantity: null, unit: "", rest: trimmed };
  }

  const [, whole, fraction, unit, rest] = match;

  if (!whole && !fraction) {
    return { quantity: null, unit: "", rest: trimmed };
  }

  let quantity = 0;
  if (whole) quantity += parseInt(whole, 10);
  if (fraction) {
    const [num, den] = fraction.split("/");
    quantity += parseInt(num, 10) / parseInt(den, 10);
  }

  // If no unit matched but we have a quantity, the "unit" might be attached to the number (e.g. "200g")
  if (!unit && whole) {
    const attachedUnit = trimmed.match(/^\d+([a-z]+)\s/i);
    if (attachedUnit && UNITS.includes(attachedUnit[1].toLowerCase())) {
      return {
        quantity,
        unit: attachedUnit[1],
        rest: rest || trimmed.slice(whole.length + attachedUnit[1].length).trim(),
      };
    }
  }

  return { quantity, unit: unit || "", rest: (rest || "").trim() };
}

function formatQuantity(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  // Check common fractions
  const fractions: [number, string][] = [
    [0.25, "1/4"], [0.333, "1/3"], [0.5, "1/2"],
    [0.667, "2/3"], [0.75, "3/4"],
  ];
  const whole = Math.floor(n);
  const frac = n - whole;
  for (const [val, str] of fractions) {
    if (Math.abs(frac - val) < 0.01) {
      return whole > 0 ? `${whole} ${str}` : str;
    }
  }
  return n % 1 === 0 ? n.toString() : n.toFixed(1);
}

export function scaleIngredient(ingredient: string, factor: number): string {
  const parsed = parseQuantity(ingredient);
  if (parsed.quantity === null) return ingredient;

  const scaled = parsed.quantity * factor;
  const formattedQty = formatQuantity(scaled);
  const parts = [formattedQty];
  if (parsed.unit) parts[0] = `${formattedQty}${parsed.unit.match(/^[a-z]/i) && !formattedQty.endsWith(parsed.unit) ? parsed.unit : ""}`;
  if (!parsed.unit && formattedQty) {
    // unit was attached to number originally, reconstruct
  }
  if (parsed.rest) parts.push(parsed.rest);

  // Simpler approach: reconstruct from parsed parts
  if (parsed.unit) {
    return `${formattedQty}${parsed.unit} ${parsed.rest}`.trim();
  }
  return `${formattedQty} ${parsed.rest}`.trim();
}

export function scaleIngredients(
  ingredients: string[],
  targetServings: number,
  baseServings: number
): string[] {
  const factor = targetServings / baseServings;
  return ingredients.map((i) => scaleIngredient(i, factor));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/scaling.test.ts`
Expected: All tests pass. If any fail, adjust the parsing regex or formatting logic to match the expected outputs.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scaling.ts src/lib/scaling.test.ts
git commit -m "feat: add ingredient quantity parsing and serving scaler"
```

---

## Task 4: Auth (PAT Management)

**Files:**
- Create: `src/lib/auth.ts`, `src/hooks/useAuth.ts`
- Test: `src/lib/auth.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/auth.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { getToken, setToken, clearToken, isAuthenticated } from "./auth";

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no token is set", () => {
    expect(getToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("stores and retrieves a token", () => {
    setToken("ghp_test123");
    expect(getToken()).toBe("ghp_test123");
    expect(isAuthenticated()).toBe(true);
  });

  it("clears the token", () => {
    setToken("ghp_test123");
    clearToken();
    expect(getToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement auth module**

Create `src/lib/auth.ts`:
```ts
const STORAGE_KEY = "cookbook3_github_pat";

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
```

- [ ] **Step 4: Create the auth context hook**

Create `src/hooks/useAuth.ts`:
```tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { getToken, setToken as storeToken, clearToken as removeToken, isAuthenticated } from "../lib/auth";

interface AuthContextValue {
  token: string | null;
  authenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  authenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());

  const login = useCallback((newToken: string) => {
    storeToken(newToken);
    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
  }, []);

  return (
    <AuthContext value={{
      token,
      authenticated: token !== null,
      login,
      logout,
    }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: All 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts src/hooks/useAuth.ts
git commit -m "feat: add PAT-based auth with localStorage persistence"
```

---

## Task 5: GitHub API Client

**Files:**
- Create: `src/lib/github.ts`
- Test: `src/lib/github.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/github.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubClient } from "./github";

const REPO_OWNER = "testuser";
const REPO_NAME = "cookbook3";

describe("GitHubClient", () => {
  let client: GitHubClient;

  beforeEach(() => {
    client = new GitHubClient(REPO_OWNER, REPO_NAME);
    vi.restoreAllMocks();
  });

  describe("fetchRecipeIndex", () => {
    it("fetches and returns the recipe index JSON", async () => {
      const mockIndex = [{ title: "Test", slug: "test" }];
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockIndex), { status: 200 })
      );

      const index = await client.fetchRecipeIndex();
      expect(index).toEqual(mockIndex);
    });
  });

  describe("fetchRecipeFile", () => {
    it("fetches a recipe markdown file by slug", async () => {
      const content = btoa("---\ntitle: Test\n---\nBody");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ content, sha: "abc123" }), { status: 200 })
      );

      const result = await client.fetchRecipeFile("test-recipe");
      expect(result.content).toContain("title: Test");
      expect(result.sha).toBe("abc123");
    });
  });

  describe("saveRecipeFile", () => {
    it("creates a new recipe file via the Contents API", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ content: { sha: "new123" } }), { status: 201 })
      );

      const sha = await client.saveRecipeFile("new-recipe", "---\ntitle: New\n---\nBody", "ghp_token");
      expect(sha).toBe("new123");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("recipes/new-recipe.md"),
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("updates an existing recipe file with sha", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ content: { sha: "updated123" } }), { status: 200 })
      );

      const sha = await client.saveRecipeFile("existing", "content", "ghp_token", "oldsha");
      expect(sha).toBe("updated123");
    });
  });

  describe("deleteRecipeFile", () => {
    it("deletes a recipe file", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await client.deleteRecipeFile("old-recipe", "sha123", "ghp_token");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("recipes/old-recipe.md"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/github.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the GitHub API client**

Create `src/lib/github.ts`:
```ts
import type { RecipeIndex } from "../types/recipe";

const API_BASE = "https://api.github.com";

export class GitHubClient {
  private owner: string;
  private repo: string;

  constructor(owner: string, repo: string) {
    this.owner = owner;
    this.repo = repo;
  }

  async fetchRecipeIndex(): Promise<RecipeIndex> {
    // In production, this loads the pre-built index from the static site
    const res = await fetch(`/recipe-index.json`);
    if (!res.ok) throw new Error(`Failed to fetch recipe index: ${res.status}`);
    return res.json();
  }

  async fetchRecipeFile(
    slug: string,
    token?: string | null
  ): Promise<{ content: string; sha: string }> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(
      `${API_BASE}/repos/${this.owner}/${this.repo}/contents/recipes/${slug}.md`,
      { headers }
    );
    if (!res.ok) throw new Error(`Failed to fetch recipe: ${res.status}`);

    const data = await res.json();
    const content = atob(data.content.replace(/\n/g, ""));
    return { content, sha: data.sha };
  }

  async saveRecipeFile(
    slug: string,
    content: string,
    token: string,
    sha?: string
  ): Promise<string> {
    const body: Record<string, string> = {
      message: sha ? `Update ${slug}` : `Add ${slug}`,
      content: btoa(unescape(encodeURIComponent(content))),
    };
    if (sha) body.sha = sha;

    const res = await fetch(
      `${API_BASE}/repos/${this.owner}/${this.repo}/contents/recipes/${slug}.md`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to save recipe: ${res.status} ${error}`);
    }

    const data = await res.json();
    return data.content.sha;
  }

  async deleteRecipeFile(
    slug: string,
    sha: string,
    token: string
  ): Promise<void> {
    const res = await fetch(
      `${API_BASE}/repos/${this.owner}/${this.repo}/contents/recipes/${slug}.md`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Delete ${slug}`,
          sha,
        }),
      }
    );
    if (!res.ok) throw new Error(`Failed to delete recipe: ${res.status}`);
  }

  async uploadImage(
    filename: string,
    base64Content: string,
    token: string,
    sha?: string
  ): Promise<string> {
    const body: Record<string, string> = {
      message: `Add image ${filename}`,
      content: base64Content,
    };
    if (sha) body.sha = sha;

    const res = await fetch(
      `${API_BASE}/repos/${this.owner}/${this.repo}/contents/images/${filename}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) throw new Error(`Failed to upload image: ${res.status}`);

    const data = await res.json();
    return data.content.sha;
  }

  imageUrl(filename: string): string {
    return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/images/${filename}`;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/github.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.ts src/lib/github.test.ts
git commit -m "feat: add GitHub API client for recipe CRUD and image upload"
```

---

## Task 6: Search Index

**Files:**
- Create: `src/lib/search.ts`
- Test: `src/lib/search.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/search.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createSearchIndex, textSearch, ingredientSearch } from "./search";
import type { RecipeFrontmatter } from "../types/recipe";

const RECIPES: RecipeFrontmatter[] = [
  {
    title: "Chicken Tikka Masala",
    slug: "chicken-tikka-masala",
    tags: ["indian", "curry", "chicken"],
    rating: 4,
    servings: 4,
    prep_time: 20,
    cook_time: 35,
    ingredients: ["500g chicken breast", "200ml yoghurt", "400g tinned tomatoes", "1 onion", "garlic"],
    cook_log: [],
    created: "2026-01-01",
    updated: "2026-01-01",
  },
  {
    title: "Tomato Pasta",
    slug: "tomato-pasta",
    tags: ["italian", "pasta", "quick"],
    rating: 3,
    servings: 2,
    prep_time: 5,
    cook_time: 15,
    ingredients: ["200g pasta", "400g tinned tomatoes", "garlic", "basil"],
    cook_log: [],
    created: "2026-01-02",
    updated: "2026-01-02",
  },
  {
    title: "Garlic Bread",
    slug: "garlic-bread",
    tags: ["side", "quick"],
    rating: 5,
    servings: 4,
    prep_time: 5,
    cook_time: 10,
    ingredients: ["1 baguette", "butter", "garlic"],
    cook_log: [],
    created: "2026-01-03",
    updated: "2026-01-03",
  },
];

describe("textSearch", () => {
  it("finds recipes by title", () => {
    const index = createSearchIndex(RECIPES);
    const results = textSearch(index, "chicken");
    expect(results.map((r) => r.slug)).toContain("chicken-tikka-masala");
  });

  it("finds recipes by tag", () => {
    const index = createSearchIndex(RECIPES);
    const results = textSearch(index, "italian");
    expect(results.map((r) => r.slug)).toContain("tomato-pasta");
  });

  it("finds recipes by ingredient", () => {
    const index = createSearchIndex(RECIPES);
    const results = textSearch(index, "baguette");
    expect(results.map((r) => r.slug)).toContain("garlic-bread");
  });
});

describe("ingredientSearch", () => {
  it("ranks recipes by number of matching ingredients", () => {
    const results = ingredientSearch(RECIPES, ["garlic", "tomatoes"]);
    // Tomato pasta and chicken tikka both have garlic + tomatoes
    // Garlic bread only has garlic
    expect(results.length).toBe(3);
    expect(results[2].slug).toBe("garlic-bread");
    expect(results[2].matchCount).toBe(1);
  });

  it("returns missing ingredients for each recipe", () => {
    const results = ingredientSearch(RECIPES, ["garlic", "pasta"]);
    const pastaResult = results.find((r) => r.slug === "tomato-pasta")!;
    expect(pastaResult.matchCount).toBe(2);
    expect(pastaResult.missing.length).toBeGreaterThan(0);
    expect(pastaResult.missing).toContain("400g tinned tomatoes");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/search.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement search**

Create `src/lib/search.ts`:
```ts
import Fuse from "fuse.js";
import type { RecipeFrontmatter } from "../types/recipe";

type FuseIndex = Fuse<RecipeFrontmatter>;

export function createSearchIndex(recipes: RecipeFrontmatter[]): FuseIndex {
  return new Fuse(recipes, {
    keys: [
      { name: "title", weight: 2 },
      { name: "tags", weight: 1.5 },
      { name: "ingredients", weight: 1 },
    ],
    threshold: 0.4,
    includeScore: true,
  });
}

export function textSearch(
  index: FuseIndex,
  query: string
): RecipeFrontmatter[] {
  if (!query.trim()) return [];
  return index.search(query).map((result) => result.item);
}

export interface IngredientSearchResult extends RecipeFrontmatter {
  matchCount: number;
  missing: string[];
}

export function ingredientSearch(
  recipes: RecipeFrontmatter[],
  selectedIngredients: string[]
): IngredientSearchResult[] {
  if (selectedIngredients.length === 0) return [];

  const normalised = selectedIngredients.map((i) => i.toLowerCase());

  const results: IngredientSearchResult[] = recipes.map((recipe) => {
    let matchCount = 0;
    const missing: string[] = [];

    for (const ingredient of recipe.ingredients) {
      const lower = ingredient.toLowerCase();
      if (normalised.some((sel) => lower.includes(sel))) {
        matchCount++;
      } else {
        missing.push(ingredient);
      }
    }

    return { ...recipe, matchCount, missing };
  });

  return results
    .filter((r) => r.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/search.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/search.ts src/lib/search.test.ts
git commit -m "feat: add Fuse.js text search and ingredient matching"
```

---

## Task 7: Meal Plan Persistence

**Files:**
- Create: `src/lib/meal-plan.ts`
- Test: `src/lib/meal-plan.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/meal-plan.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { getMealPlan, setMealPlan, clearMealPlan, type MealPlan } from "./meal-plan";

describe("meal-plan persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns an empty plan when none is saved", () => {
    const plan = getMealPlan();
    expect(Object.keys(plan.days)).toHaveLength(7);
    expect(plan.days.monday).toEqual([]);
  });

  it("saves and retrieves a meal plan", () => {
    const plan: MealPlan = {
      weekStart: "2026-04-06",
      days: {
        monday: ["chicken-tikka-masala"],
        tuesday: [],
        wednesday: ["tomato-pasta"],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
    };
    setMealPlan(plan);
    expect(getMealPlan()).toEqual(plan);
  });

  it("clears the meal plan", () => {
    setMealPlan({
      weekStart: "2026-04-06",
      days: {
        monday: ["test"],
        tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
      },
    });
    clearMealPlan();
    expect(getMealPlan().days.monday).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/meal-plan.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement meal plan persistence**

Create `src/lib/meal-plan.ts`:
```ts
const STORAGE_KEY = "cookbook3_meal_plan";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface MealPlan {
  weekStart: string;
  days: Record<DayOfWeek, string[]>;
}

function emptyPlan(): MealPlan {
  return {
    weekStart: "",
    days: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  };
}

export function getMealPlan(): MealPlan {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return emptyPlan();
  try {
    return JSON.parse(stored) as MealPlan;
  } catch {
    return emptyPlan();
  }
}

export function setMealPlan(plan: MealPlan): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

export function clearMealPlan(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/meal-plan.test.ts`
Expected: All 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/meal-plan.ts src/lib/meal-plan.test.ts
git commit -m "feat: add meal plan localStorage persistence"
```

---

## Task 8: Build-Time Recipe Index Generator

**Files:**
- Create: `scripts/build-index.ts`
- Create: `recipes/example-recipe.md`

- [ ] **Step 1: Create an example recipe for testing**

Create `recipes/example-recipe.md`:
```markdown
---
title: "Example Recipe"
slug: example-recipe
tags: [example, test]
rating: 3
servings: 2
prep_time: 10
cook_time: 20
ingredients:
  - 200g pasta
  - 100g cheese
  - 1 clove garlic
cook_log: []
created: "2026-04-06"
updated: "2026-04-06"
---

## Method

1. Cook pasta according to package directions.
2. Add cheese and garlic.

## Notes

- This is an example recipe for development.
```

- [ ] **Step 2: Create the index build script**

Create `scripts/build-index.ts`:
```ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const recipesDir = path.resolve(import.meta.dirname, "../recipes");
const outputPath = path.resolve(import.meta.dirname, "../public/recipe-index.json");

const files = fs.readdirSync(recipesDir).filter((f) => f.endsWith(".md"));

const index = files.map((file) => {
  const content = fs.readFileSync(path.join(recipesDir, file), "utf-8");
  const { data } = matter(content);

  // Normalise date fields that gray-matter may parse as Date objects
  const normaliseDate = (d: unknown): string => {
    if (d instanceof Date) return d.toISOString().split("T")[0];
    return String(d);
  };

  return {
    title: data.title,
    slug: data.slug,
    tags: data.tags ?? [],
    rating: data.rating,
    servings: data.servings,
    prep_time: data.prep_time,
    cook_time: data.cook_time,
    image: data.image,
    ingredients: data.ingredients ?? [],
    cook_log: (data.cook_log ?? []).map((entry: { date: unknown; notes?: string }) => ({
      date: normaliseDate(entry.date),
      notes: entry.notes ?? "",
    })),
    created: normaliseDate(data.created),
    updated: normaliseDate(data.updated),
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));

console.log(`Built recipe index: ${index.length} recipes → ${outputPath}`);
```

- [ ] **Step 3: Add build scripts to package.json**

Add these scripts to the `"scripts"` section in `package.json`:
```json
"build:index": "tsx scripts/build-index.ts",
"prebuild": "npm run build:index",
"predev": "npm run build:index"
```

Install tsx:
```bash
npm install -D tsx
```

- [ ] **Step 4: Run the index build and verify**

Run: `npm run build:index`
Expected: Output says "Built recipe index: 1 recipes" and `public/recipe-index.json` exists with the example recipe frontmatter.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-index.ts recipes/example-recipe.md public/recipe-index.json package.json package-lock.json
git commit -m "feat: add build-time recipe index generator and example recipe"
```

---

## Task 9: Data Hooks (useRecipeIndex, useRecipe)

**Files:**
- Create: `src/hooks/useRecipeIndex.ts`, `src/hooks/useRecipe.ts`
- Create: `src/lib/github-instance.ts`

- [ ] **Step 1: Create the shared GitHub client instance**

Create `src/lib/github-instance.ts`:
```ts
import { GitHubClient } from "./github";

// These will be configured via environment variables
const OWNER = import.meta.env.VITE_GITHUB_OWNER ?? "your-username";
const REPO = import.meta.env.VITE_GITHUB_REPO ?? "cookbook3";

export const github = new GitHubClient(OWNER, REPO);
```

- [ ] **Step 2: Create the useRecipeIndex hook**

Create `src/hooks/useRecipeIndex.ts`:
```ts
import { useState, useEffect } from "react";
import type { RecipeIndex } from "../types/recipe";

export function useRecipeIndex() {
  const [index, setIndex] = useState<RecipeIndex>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/recipe-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: RecipeIndex) => {
        setIndex(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { index, loading, error };
}
```

- [ ] **Step 3: Create the useRecipe hook**

Create `src/hooks/useRecipe.ts`:
```ts
import { useState, useEffect } from "react";
import type { Recipe } from "../types/recipe";
import { github } from "../lib/github-instance";
import { parseRecipe } from "../lib/markdown";
import { useAuth } from "./useAuth";

export function useRecipe(slug: string | undefined) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    github
      .fetchRecipeFile(slug, token)
      .then(({ content, sha }) => {
        setRecipe(parseRecipe(content));
        setSha(sha);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug, token]);

  return { recipe, sha, loading, error };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/github-instance.ts src/hooks/useRecipeIndex.ts src/hooks/useRecipe.ts
git commit -m "feat: add useRecipeIndex and useRecipe data hooks"
```

---

## Task 10: App Layout and Routing

**Files:**
- Create: `src/components/Layout.tsx`, `src/components/AuthModal.tsx`
- Modify: `src/App.tsx`
- Create: `src/pages/HomePage.tsx`, `src/pages/SearchPage.tsx`, `src/pages/RecipePage.tsx`, `src/pages/EditorPage.tsx`, `src/pages/MealPlannerPage.tsx`

- [ ] **Step 1: Create Layout component**

Create `src/components/Layout.tsx`:
```tsx
import { Link, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AuthModal from "./AuthModal";

export default function Layout() {
  const { authenticated, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            Cookbook3
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Browse
            </Link>
            <Link to="/search" className="text-gray-600 hover:text-gray-900">
              Search
            </Link>
            <Link to="/meal-planner" className="text-gray-600 hover:text-gray-900">
              Meal Planner
            </Link>
            {authenticated && (
              <Link
                to="/new"
                className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-700"
              >
                + New Recipe
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between text-sm text-gray-400">
          <span>Cookbook3</span>
          <button
            onClick={() => (authenticated ? logout() : setShowAuth(true))}
            className="hover:text-gray-600"
          >
            {authenticated ? "Logout" : "🔑"}
          </button>
        </div>
      </footer>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
```

- [ ] **Step 2: Create AuthModal component**

Create `src/components/AuthModal.tsx`:
```tsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login } = useAuth();
  const [tokenInput, setTokenInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      login(tokenInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Enter GitHub Token</h2>
        <p className="text-sm text-gray-500 mb-4">
          Paste a GitHub Personal Access Token with repo scope to enable editing.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="ghp_..."
            className="w-full border rounded-md px-3 py-2 mb-4 font-mono text-sm"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create placeholder page components**

Create `src/pages/HomePage.tsx`:
```tsx
export default function HomePage() {
  return <p>Home page — coming soon</p>;
}
```

Create `src/pages/SearchPage.tsx`:
```tsx
export default function SearchPage() {
  return <p>Search page — coming soon</p>;
}
```

Create `src/pages/RecipePage.tsx`:
```tsx
export default function RecipePage() {
  return <p>Recipe page — coming soon</p>;
}
```

Create `src/pages/EditorPage.tsx`:
```tsx
export default function EditorPage() {
  return <p>Editor page — coming soon</p>;
}
```

Create `src/pages/MealPlannerPage.tsx`:
```tsx
export default function MealPlannerPage() {
  return <p>Meal planner — coming soon</p>;
}
```

- [ ] **Step 4: Update App.tsx with routes and AuthProvider**

Replace `src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import RecipePage from "./pages/RecipePage";
import EditorPage from "./pages/EditorPage";
import MealPlannerPage from "./pages/MealPlannerPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/recipe/:slug" element={<RecipePage />} />
            <Route path="/new" element={<EditorPage />} />
            <Route path="/edit/:slug" element={<EditorPage />} />
            <Route path="/meal-planner" element={<MealPlannerPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

- [ ] **Step 5: Update App.test.tsx**

Replace `src/App.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app header with navigation", () => {
  render(<App />);
  expect(screen.getByText("Cookbook3")).toBeInTheDocument();
  expect(screen.getByText("Browse")).toBeInTheDocument();
  expect(screen.getByText("Search")).toBeInTheDocument();
  expect(screen.getByText("Meal Planner")).toBeInTheDocument();
});
```

- [ ] **Step 6: Run tests to verify**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 7: Verify app runs with navigation**

Run: `npm run dev`
Expected: App shows header with navigation links. Clicking links changes routes. Footer shows key icon.

- [ ] **Step 8: Commit**

```bash
git add src/components/Layout.tsx src/components/AuthModal.tsx src/pages/ src/App.tsx src/App.test.tsx
git commit -m "feat: add app layout, routing, and auth modal"
```

---

## Task 11: Recipe Card and Home/Browse Page

**Files:**
- Create: `src/components/RecipeCard.tsx`, `src/components/StarRating.tsx`, `src/components/TagList.tsx`, `src/components/RecipeFilter.tsx`
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Create StarRating component**

Create `src/components/StarRating.tsx`:
```tsx
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
```

- [ ] **Step 2: Create TagList component**

Create `src/components/TagList.tsx`:
```tsx
interface TagListProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
}

export default function TagList({ tags, onTagClick }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 ${
            onTagClick ? "cursor-pointer hover:bg-blue-200" : ""
          }`}
          onClick={() => onTagClick?.(tag)}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create RecipeCard component**

Create `src/components/RecipeCard.tsx`:
```tsx
import { Link } from "react-router-dom";
import type { RecipeFrontmatter } from "../types/recipe";
import StarRating from "./StarRating";
import TagList from "./TagList";
import { github } from "../lib/github-instance";

interface RecipeCardProps {
  recipe: RecipeFrontmatter;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      to={`/recipe/${recipe.slug}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="aspect-video bg-gray-200 overflow-hidden">
        {recipe.image ? (
          <img
            src={github.imageUrl(recipe.image)}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            🍽
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{recipe.title}</h3>
        {recipe.rating !== undefined && (
          <StarRating rating={recipe.rating} />
        )}
        {recipe.tags.length > 0 && (
          <div className="mt-2">
            <TagList tags={recipe.tags} />
          </div>
        )}
        {(recipe.prep_time || recipe.cook_time) && (
          <p className="text-xs text-gray-500 mt-2">
            {recipe.prep_time && `Prep: ${recipe.prep_time}m`}
            {recipe.prep_time && recipe.cook_time && " · "}
            {recipe.cook_time && `Cook: ${recipe.cook_time}m`}
          </p>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Create RecipeFilter component**

Create `src/components/RecipeFilter.tsx`:
```tsx
import type { RecipeFrontmatter } from "../types/recipe";

export type SortOption = "recent" | "rating" | "newest" | "alpha";

interface RecipeFilterProps {
  allTags: string[];
  selectedTag: string | null;
  sortBy: SortOption;
  onTagChange: (tag: string | null) => void;
  onSortChange: (sort: SortOption) => void;
}

export function getAllTags(recipes: RecipeFrontmatter[]): string[] {
  const tagSet = new Set<string>();
  recipes.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

export function sortRecipes(
  recipes: RecipeFrontmatter[],
  sortBy: SortOption
): RecipeFrontmatter[] {
  const sorted = [...recipes];
  switch (sortBy) {
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "newest":
      return sorted.sort((a, b) => b.created.localeCompare(a.created));
    case "alpha":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "recent":
      return sorted.sort((a, b) => {
        const aDate = a.cook_log.length ? a.cook_log[0].date : a.updated;
        const bDate = b.cook_log.length ? b.cook_log[0].date : b.updated;
        return bDate.localeCompare(aDate);
      });
  }
}

export default function RecipeFilter({
  allTags,
  selectedTag,
  sortBy,
  onTagChange,
  onSortChange,
}: RecipeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <select
        value={selectedTag ?? ""}
        onChange={(e) => onTagChange(e.target.value || null)}
        className="border rounded-md px-3 py-1.5 text-sm"
      >
        <option value="">All tags</option>
        {allTags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="border rounded-md px-3 py-1.5 text-sm"
      >
        <option value="recent">Recently cooked</option>
        <option value="rating">Highest rated</option>
        <option value="newest">Newest</option>
        <option value="alpha">A-Z</option>
      </select>
    </div>
  );
}
```

- [ ] **Step 5: Implement HomePage**

Replace `src/pages/HomePage.tsx`:
```tsx
import { useState, useMemo } from "react";
import { useRecipeIndex } from "../hooks/useRecipeIndex";
import RecipeCard from "../components/RecipeCard";
import RecipeFilter, {
  getAllTags,
  sortRecipes,
  type SortOption,
} from "../components/RecipeFilter";
import { createSearchIndex, textSearch } from "../lib/search";

export default function HomePage() {
  const { index, loading, error } = useRecipeIndex();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [query, setQuery] = useState("");

  const searchIndex = useMemo(() => createSearchIndex(index), [index]);
  const allTags = useMemo(() => getAllTags(index), [index]);

  const filtered = useMemo(() => {
    let recipes = query ? textSearch(searchIndex, query) : index;
    if (selectedTag) {
      recipes = recipes.filter((r) => r.tags.includes(selectedTag));
    }
    return sortRecipes(recipes, sortBy);
  }, [index, searchIndex, query, selectedTag, sortBy]);

  if (loading) return <p className="text-gray-500">Loading recipes...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full border rounded-lg px-4 py-2.5 text-lg"
        />
      </div>
      <RecipeFilter
        allTags={allTags}
        selectedTag={selectedTag}
        sortBy={sortBy}
        onTagChange={setSelectedTag}
        onSortChange={setSortBy}
      />
      {filtered.length === 0 ? (
        <p className="text-gray-500">No recipes found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify the home page renders**

Run: `npm run dev`
Expected: Home page shows search bar, filter dropdowns, and the example recipe card in a grid.

- [ ] **Step 7: Commit**

```bash
git add src/components/StarRating.tsx src/components/TagList.tsx src/components/RecipeCard.tsx src/components/RecipeFilter.tsx src/pages/HomePage.tsx
git commit -m "feat: add recipe cards, filters, and home/browse page"
```

---

## Task 12: Recipe View Page

**Files:**
- Create: `src/components/IngredientList.tsx`, `src/components/CookLog.tsx`, `src/components/MarkdownPreview.tsx`
- Modify: `src/pages/RecipePage.tsx`

- [ ] **Step 1: Create MarkdownPreview component**

Create `src/components/MarkdownPreview.tsx`:
```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="prose prose-gray max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2: Create IngredientList component with scaler**

Create `src/components/IngredientList.tsx`:
```tsx
import { useState } from "react";
import { scaleIngredients } from "../lib/scaling";

interface IngredientListProps {
  ingredients: string[];
  baseServings?: number;
}

export default function IngredientList({ ingredients, baseServings }: IngredientListProps) {
  const [servings, setServings] = useState(baseServings ?? 0);
  const showScaler = baseServings !== undefined && baseServings > 0;

  const displayIngredients =
    showScaler && servings !== baseServings
      ? scaleIngredients(ingredients, servings, baseServings!)
      : ingredients;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold">Ingredients</h2>
        {showScaler && (
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"
            >
              -
            </button>
            <span className="font-medium">{servings} servings</span>
            <button
              onClick={() => setServings(servings + 1)}
              className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"
            >
              +
            </button>
          </div>
        )}
      </div>
      <ul className="space-y-1.5">
        {displayIngredients.map((ingredient, i) => (
          <li key={i} className="text-gray-700 pl-4 border-l-2 border-gray-200">
            {ingredient}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Create CookLog component**

Create `src/components/CookLog.tsx`:
```tsx
import type { CookLogEntry } from "../types/recipe";

interface CookLogProps {
  entries: CookLogEntry[];
}

export default function CookLog({ entries }: CookLogProps) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Cook Log</h2>
      <div className="space-y-3">
        {sorted.map((entry, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="text-gray-500 whitespace-nowrap font-mono">
              {entry.date}
            </span>
            {entry.notes && <span className="text-gray-700">{entry.notes}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement RecipePage**

Replace `src/pages/RecipePage.tsx`:
```tsx
import { useParams, Link } from "react-router-dom";
import { useRecipe } from "../hooks/useRecipe";
import { useAuth } from "../hooks/useAuth";
import StarRating from "../components/StarRating";
import TagList from "../components/TagList";
import IngredientList from "../components/IngredientList";
import CookLog from "../components/CookLog";
import MarkdownPreview from "../components/MarkdownPreview";
import { github } from "../lib/github-instance";

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  const { recipe, loading, error } = useRecipe(slug);
  const { authenticated } = useAuth();

  if (loading) return <p className="text-gray-500">Loading recipe...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!recipe) return <p className="text-gray-500">Recipe not found.</p>;

  return (
    <article className="max-w-3xl mx-auto">
      {recipe.image && (
        <div className="aspect-video rounded-lg overflow-hidden mb-6">
          <img
            src={github.imageUrl(recipe.image)}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
        {authenticated && (
          <Link
            to={`/edit/${recipe.slug}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 shrink-0"
          >
            Edit
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
        {recipe.rating !== undefined && <StarRating rating={recipe.rating} />}
        {recipe.servings && <span>Serves {recipe.servings}</span>}
        {recipe.prep_time && <span>Prep: {recipe.prep_time}m</span>}
        {recipe.cook_time && <span>Cook: {recipe.cook_time}m</span>}
      </div>

      {recipe.tags.length > 0 && (
        <div className="mb-6">
          <TagList tags={recipe.tags} />
        </div>
      )}

      <div className="mb-8">
        <IngredientList
          ingredients={recipe.ingredients}
          baseServings={recipe.servings}
        />
      </div>

      <div className="mb-8">
        <MarkdownPreview content={recipe.body} />
      </div>

      <div className="border-t pt-6">
        <CookLog entries={recipe.cook_log} />
      </div>
    </article>
  );
}
```

- [ ] **Step 5: Verify recipe page**

Run: `npm run dev`
Navigate to `/recipe/example-recipe`. Expected: Shows the example recipe with title, metadata, ingredients (with scaler), method, and cook log.

- [ ] **Step 6: Commit**

```bash
git add src/components/MarkdownPreview.tsx src/components/IngredientList.tsx src/components/CookLog.tsx src/pages/RecipePage.tsx
git commit -m "feat: add recipe view page with ingredients scaler and cook log"
```

---

## Task 13: Recipe Editor Page

**Files:**
- Create: `src/components/RecipeForm.tsx`, `src/components/IngredientsEditor.tsx`
- Modify: `src/pages/EditorPage.tsx`

- [ ] **Step 1: Create IngredientsEditor component**

Create `src/components/IngredientsEditor.tsx`:
```tsx
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
      <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="flex-1 border rounded-md px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeLine(i)}
              className="text-red-400 hover:text-red-600 px-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addLine}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
      >
        + Add ingredient
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create RecipeForm component**

Create `src/components/RecipeForm.tsx`:
```tsx
import { useState } from "react";
import StarRating from "./StarRating";
import type { CookLogEntry } from "../types/recipe";

interface RecipeFormProps {
  title: string;
  tags: string[];
  rating: number | undefined;
  servings: number | undefined;
  prepTime: number | undefined;
  cookTime: number | undefined;
  cookLog: CookLogEntry[];
  onTitleChange: (title: string) => void;
  onTagsChange: (tags: string[]) => void;
  onRatingChange: (rating: number) => void;
  onServingsChange: (servings: number | undefined) => void;
  onPrepTimeChange: (time: number | undefined) => void;
  onCookTimeChange: (time: number | undefined) => void;
  onCookLogChange: (log: CookLogEntry[]) => void;
}

export default function RecipeForm({
  title, tags, rating, servings, prepTime, cookTime, cookLog,
  onTitleChange, onTagsChange, onRatingChange, onServingsChange,
  onPrepTimeChange, onCookTimeChange, onCookLogChange,
}: RecipeFormProps) {
  const [tagInput, setTagInput] = useState("");
  const [newLogDate, setNewLogDate] = useState("");
  const [newLogNotes, setNewLogNotes] = useState("");

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const addCookLogEntry = () => {
    if (!newLogDate) return;
    onCookLogChange([{ date: newLogDate, notes: newLogNotes }, ...cookLog]);
    setNewLogDate("");
    setNewLogNotes("");
  };

  const parseNum = (val: string): number | undefined => {
    const n = parseInt(val, 10);
    return isNaN(n) ? undefined : n;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          placeholder="Recipe title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
        <StarRating rating={rating ?? 0} onChange={onRatingChange} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
          <input
            type="number"
            value={servings ?? ""}
            onChange={(e) => onServingsChange(parseNum(e.target.value))}
            className="w-full border rounded-md px-3 py-2"
            min={1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prep (min)</label>
          <input
            type="number"
            value={prepTime ?? ""}
            onChange={(e) => onPrepTimeChange(parseNum(e.target.value))}
            className="w-full border rounded-md px-3 py-2"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cook (min)</label>
          <input
            type="number"
            value={cookTime ?? ""}
            onChange={(e) => onCookTimeChange(parseNum(e.target.value))}
            className="w-full border rounded-md px-3 py-2"
            min={0}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 cursor-pointer hover:bg-red-100 hover:text-red-700"
              onClick={() => removeTag(tag)}
            >
              {tag} ×
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Add a tag..."
            className="flex-1 border rounded-md px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={addTag}
            className="text-sm text-blue-600 hover:text-blue-800 px-2"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cook Log</label>
        <div className="flex gap-2 mb-2">
          <input
            type="date"
            value={newLogDate}
            onChange={(e) => setNewLogDate(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            value={newLogNotes}
            onChange={(e) => setNewLogNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="flex-1 border rounded-md px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={addCookLogEntry}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md"
          >
            Log
          </button>
        </div>
        {cookLog.length > 0 && (
          <div className="text-sm text-gray-500 space-y-1">
            {cookLog.map((entry, i) => (
              <div key={i}>
                <span className="font-mono">{entry.date}</span>
                {entry.notes && ` — ${entry.notes}`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement EditorPage**

Replace `src/pages/EditorPage.tsx`:
```tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { useAuth } from "../hooks/useAuth";
import { useRecipe } from "../hooks/useRecipe";
import { github } from "../lib/github-instance";
import { serializeRecipe } from "../lib/markdown";
import type { Recipe, CookLogEntry } from "../types/recipe";
import RecipeForm from "../components/RecipeForm";
import IngredientsEditor from "../components/IngredientsEditor";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const isNew = !slug;
  const navigate = useNavigate();
  const { token, authenticated } = useAuth();
  const { recipe: existingRecipe, sha, loading } = useRecipe(slug);

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [servings, setServings] = useState<number | undefined>(undefined);
  const [prepTime, setPrepTime] = useState<number | undefined>(undefined);
  const [cookTime, setCookTime] = useState<number | undefined>(undefined);
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [body, setBody] = useState("");
  const [cookLog, setCookLog] = useState<CookLogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentSha, setCurrentSha] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (existingRecipe) {
      setTitle(existingRecipe.title);
      setTags(existingRecipe.tags);
      setRating(existingRecipe.rating);
      setServings(existingRecipe.servings);
      setPrepTime(existingRecipe.prep_time);
      setCookTime(existingRecipe.cook_time);
      setIngredients(existingRecipe.ingredients);
      setBody(existingRecipe.body);
      setCookLog(existingRecipe.cook_log);
    }
  }, [existingRecipe]);

  useEffect(() => {
    if (sha) setCurrentSha(sha);
  }, [sha]);

  if (!authenticated) {
    return <p className="text-gray-500">You must be logged in to edit recipes.</p>;
  }

  if (!isNew && loading) {
    return <p className="text-gray-500">Loading recipe...</p>;
  }

  const handleSave = async () => {
    if (!title.trim() || !token) return;

    setSaving(true);
    setSaveError(null);

    const recipeSlug = slug ?? slugify(title);
    const today = new Date().toISOString().split("T")[0];
    const recipe: Recipe = {
      title,
      slug: recipeSlug,
      tags,
      rating,
      servings,
      prep_time: prepTime,
      cook_time: cookTime,
      ingredients: ingredients.filter((i) => i.trim()),
      cook_log: cookLog,
      created: existingRecipe?.created ?? today,
      updated: today,
      body,
    };

    try {
      const newSha = await github.saveRecipeFile(
        recipeSlug,
        serializeRecipe(recipe),
        token,
        currentSha ?? undefined
      );
      setCurrentSha(newSha);
      navigate(`/recipe/${recipeSlug}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slug || !currentSha || !token) return;
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await github.deleteRecipeFile(slug, currentSha, token);
      navigate("/");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isNew ? "New Recipe" : `Edit: ${title}`}
        </h1>
        <div className="flex gap-2">
          {!isNew && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {saveError}
        </div>
      )}

      <div className="space-y-6">
        <RecipeForm
          title={title}
          tags={tags}
          rating={rating}
          servings={servings}
          prepTime={prepTime}
          cookTime={cookTime}
          cookLog={cookLog}
          onTitleChange={setTitle}
          onTagsChange={setTags}
          onRatingChange={setRating}
          onServingsChange={setServings}
          onPrepTimeChange={setPrepTime}
          onCookTimeChange={setCookTime}
          onCookLogChange={setCookLog}
        />

        <IngredientsEditor
          ingredients={ingredients}
          onChange={setIngredients}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Method & Notes (Markdown)
          </label>
          <div data-color-mode="light">
            <MDEditor value={body} onChange={(val) => setBody(val ?? "")} height={400} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify editor page**

Run: `npm run dev`
Navigate to `/new`. Expected: Shows the recipe editor form with metadata fields, ingredient editor, markdown editor with preview. Save button visible.

- [ ] **Step 5: Commit**

```bash
git add src/components/IngredientsEditor.tsx src/components/RecipeForm.tsx src/pages/EditorPage.tsx
git commit -m "feat: add recipe editor with markdown editing and metadata form"
```

---

## Task 14: Search Page

**Files:**
- Create: `src/components/SearchBar.tsx`, `src/components/IngredientSearch.tsx`
- Modify: `src/pages/SearchPage.tsx`

- [ ] **Step 1: Create SearchBar component**

Create `src/components/SearchBar.tsx`:
```tsx
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
      placeholder={placeholder ?? "Search recipes..."}
      className="w-full border rounded-lg px-4 py-2.5 text-lg"
    />
  );
}
```

- [ ] **Step 2: Create IngredientSearch component**

Create `src/components/IngredientSearch.tsx`:
```tsx
import { useState } from "react";
import type { IngredientSearchResult } from "../lib/search";
import { Link } from "react-router-dom";

interface IngredientSearchProps {
  allIngredients: string[];
  results: IngredientSearchResult[];
  onSelectionChange: (selected: string[]) => void;
}

export default function IngredientSearch({
  allIngredients,
  results,
  onSelectionChange,
}: IngredientSearchProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const suggestions = input.trim()
    ? allIngredients.filter(
        (ing) =>
          ing.toLowerCase().includes(input.toLowerCase()) &&
          !selected.includes(ing)
      ).slice(0, 8)
    : [];

  const addIngredient = (ing: string) => {
    const updated = [...selected, ing];
    setSelected(updated);
    onSelectionChange(updated);
    setInput("");
  };

  const removeIngredient = (ing: string) => {
    const updated = selected.filter((s) => s !== ing);
    setSelected(updated);
    onSelectionChange(updated);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((ing) => (
            <span
              key={ing}
              className="text-sm px-2 py-1 rounded-full bg-green-100 text-green-700 cursor-pointer hover:bg-red-100 hover:text-red-700"
              onClick={() => removeIngredient(ing)}
            >
              {ing} ×
            </span>
          ))}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type an ingredient..."
          className="w-full border rounded-md px-3 py-2"
        />
        {suggestions.length > 0 && (
          <div className="border rounded-md mt-1 max-h-48 overflow-y-auto">
            {suggestions.map((ing) => (
              <button
                key={ing}
                onClick={() => addIngredient(ing)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
              >
                {ing}
              </button>
            ))}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <Link
              key={r.slug}
              to={`/recipe/${r.slug}`}
              className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="text-sm text-green-600 mt-1">
                    {r.matchCount} ingredient{r.matchCount !== 1 ? "s" : ""} matched
                  </p>
                </div>
                {r.missing.length > 0 && (
                  <p className="text-xs text-gray-400">
                    Missing: {r.missing.slice(0, 3).join(", ")}
                    {r.missing.length > 3 && ` +${r.missing.length - 3} more`}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Implement SearchPage**

Replace `src/pages/SearchPage.tsx`:
```tsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useRecipeIndex } from "../hooks/useRecipeIndex";
import { createSearchIndex, textSearch, ingredientSearch } from "../lib/search";
import SearchBar from "../components/SearchBar";
import IngredientSearch from "../components/IngredientSearch";
import StarRating from "../components/StarRating";

type SearchMode = "text" | "ingredient";

export default function SearchPage() {
  const { index, loading } = useRecipeIndex();
  const [mode, setMode] = useState<SearchMode>("text");
  const [query, setQuery] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const fuseIndex = useMemo(() => createSearchIndex(index), [index]);

  const textResults = useMemo(
    () => (query ? textSearch(fuseIndex, query) : []),
    [fuseIndex, query]
  );

  const ingredientResults = useMemo(
    () => ingredientSearch(index, selectedIngredients),
    [index, selectedIngredients]
  );

  const allIngredients = useMemo(() => {
    const set = new Set<string>();
    index.forEach((r) => r.ingredients.forEach((i) => {
      // Extract the ingredient name without quantity for matching
      const name = i.replace(/^[\d\s/]+\s*(g|kg|ml|l|tsp|tbsp|cups?|oz|lbs?|pinch)?\s*/i, "").trim();
      if (name) set.add(name.toLowerCase());
    }));
    return Array.from(set).sort();
  }, [index]);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode("text")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            mode === "text"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Text Search
        </button>
        <button
          onClick={() => setMode("ingredient")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            mode === "ingredient"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          By Ingredient
        </button>
      </div>

      {mode === "text" ? (
        <div>
          <SearchBar value={query} onChange={setQuery} />
          {textResults.length > 0 && (
            <div className="mt-4 space-y-3">
              {textResults.map((r) => (
                <Link
                  key={r.slug}
                  to={`/recipe/${r.slug}`}
                  className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md"
                >
                  <h3 className="font-semibold">{r.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    {r.rating !== undefined && <StarRating rating={r.rating} />}
                    <span>{r.tags.join(", ")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {query && textResults.length === 0 && (
            <p className="text-gray-500 mt-4">No results for "{query}"</p>
          )}
        </div>
      ) : (
        <IngredientSearch
          allIngredients={allIngredients}
          results={ingredientResults}
          onSelectionChange={setSelectedIngredients}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify search page**

Run: `npm run dev`
Navigate to `/search`. Expected: Shows mode toggle, text search with results, ingredient search with picker.

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchBar.tsx src/components/IngredientSearch.tsx src/pages/SearchPage.tsx
git commit -m "feat: add search page with text and ingredient search modes"
```

---

## Task 15: Meal Planner Page

**Files:**
- Create: `src/components/ShoppingList.tsx`
- Modify: `src/pages/MealPlannerPage.tsx`

- [ ] **Step 1: Create ShoppingList component**

Create `src/components/ShoppingList.tsx`:
```tsx
import { useState } from "react";

interface ShoppingListProps {
  items: string[];
}

export default function ShoppingList({ items }: ShoppingListProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    const next = new Set(checked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setChecked(next);
  };

  if (items.length === 0) {
    return <p className="text-gray-500 text-sm">Add recipes to generate a shopping list.</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Shopping List</h2>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={checked.has(i)}
              onChange={() => toggle(i)}
              className="rounded"
            />
            <span className={checked.has(i) ? "line-through text-gray-400" : "text-gray-700"}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Implement MealPlannerPage**

Replace `src/pages/MealPlannerPage.tsx`:
```tsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useRecipeIndex } from "../hooks/useRecipeIndex";
import { getMealPlan, setMealPlan, clearMealPlan, type MealPlan } from "../lib/meal-plan";
import ShoppingList from "../components/ShoppingList";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export default function MealPlannerPage() {
  const { index, loading } = useRecipeIndex();
  const [plan, setPlanState] = useState<MealPlan>(getMealPlan);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const updatePlan = (updated: MealPlan) => {
    setPlanState(updated);
    setMealPlan(updated);
  };

  const addRecipe = (day: string, slug: string) => {
    const updated = {
      ...plan,
      days: { ...plan.days, [day]: [...plan.days[day as keyof typeof plan.days], slug] },
    };
    updatePlan(updated);
    setAddingTo(null);
    setSearchQuery("");
  };

  const removeRecipe = (day: string, index: number) => {
    const dayRecipes = [...plan.days[day as keyof typeof plan.days]];
    dayRecipes.splice(index, 1);
    updatePlan({ ...plan, days: { ...plan.days, [day]: dayRecipes } });
  };

  const handleClear = () => {
    clearMealPlan();
    setPlanState(getMealPlan());
  };

  const recipeMap = useMemo(() => {
    const map = new Map<string, string>();
    index.forEach((r) => map.set(r.slug, r.title));
    return map;
  }, [index]);

  const shoppingItems = useMemo(() => {
    const items: string[] = [];
    for (const day of DAYS) {
      for (const slug of plan.days[day]) {
        const recipe = index.find((r) => r.slug === slug);
        if (recipe) items.push(...recipe.ingredients);
      }
    }
    // Deduplicate by lowercase
    const seen = new Map<string, string>();
    items.forEach((item) => {
      const key = item.toLowerCase();
      if (!seen.has(key)) seen.set(key, item);
    });
    return Array.from(seen.values());
  }, [plan, index]);

  const filteredRecipes = searchQuery.trim()
    ? index.filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : index;

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meal Planner</h1>
        <button onClick={handleClear} className="text-sm text-gray-500 hover:text-red-600">
          Clear week
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-8">
        {DAYS.map((day) => (
          <div key={day} className="bg-white rounded-lg p-3 shadow-sm min-h-[120px]">
            <h3 className="font-semibold text-sm text-gray-500 mb-2">{DAY_LABELS[day]}</h3>
            <div className="space-y-1">
              {plan.days[day].map((slug, i) => (
                <div key={i} className="text-xs flex justify-between items-start group">
                  <Link to={`/recipe/${slug}`} className="text-blue-600 hover:underline">
                    {recipeMap.get(slug) ?? slug}
                  </Link>
                  <button
                    onClick={() => removeRecipe(day, i)}
                    className="text-gray-300 group-hover:text-red-400 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setAddingTo(addingTo === day ? null : day)}
              className="text-xs text-blue-500 hover:text-blue-700 mt-2"
            >
              + Add
            </button>
            {addingTo === day && (
              <div className="mt-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full border rounded px-2 py-1 text-xs"
                  autoFocus
                />
                <div className="max-h-32 overflow-y-auto mt-1">
                  {filteredRecipes.slice(0, 5).map((r) => (
                    <button
                      key={r.slug}
                      onClick={() => addRecipe(day, r.slug)}
                      className="block w-full text-left text-xs px-2 py-1 hover:bg-gray-100"
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ShoppingList items={shoppingItems} />
    </div>
  );
}
```

- [ ] **Step 3: Verify meal planner**

Run: `npm run dev`
Navigate to `/meal-planner`. Expected: Shows 7-day grid, can add recipes to days, shopping list generates from assigned recipes.

- [ ] **Step 4: Commit**

```bash
git add src/components/ShoppingList.tsx src/pages/MealPlannerPage.tsx
git commit -m "feat: add meal planner with weekly grid and auto shopping list"
```

---

## Task 16: Image Upload in Editor

**Files:**
- Modify: `src/pages/EditorPage.tsx`

- [ ] **Step 1: Add image upload to EditorPage**

Add the following above the `<RecipeForm>` in `src/pages/EditorPage.tsx`, after the `saveError` block:

```tsx
const [image, setImage] = useState<string | undefined>(existingRecipe?.image);
const [uploading, setUploading] = useState(false);

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !token) return;

  setUploading(true);
  try {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const filename = `${slug ?? slugify(title)}.${file.name.split(".").pop()}`;
      await github.uploadImage(filename, base64, token);
      setImage(filename);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  } catch (err) {
    setSaveError(err instanceof Error ? err.message : "Image upload failed");
    setUploading(false);
  }
};
```

Add the image field in the form, before RecipeForm:
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
  {image && (
    <img src={github.imageUrl(image)} alt="Recipe" className="w-48 h-32 object-cover rounded-md mb-2" />
  )}
  <input
    type="file"
    accept="image/*"
    onChange={handleImageUpload}
    disabled={uploading}
    className="text-sm"
  />
  {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
</div>
```

Also include `image` in the recipe object in `handleSave`:
```ts
image,
```

- [ ] **Step 2: Update the existingRecipe effect to include image**

In the `useEffect` that sets fields from `existingRecipe`, add:
```ts
setImage(existingRecipe.image);
```

- [ ] **Step 3: Verify image upload**

Run: `npm run dev`
Navigate to `/new`. Expected: Image upload field appears, can select a file.

- [ ] **Step 4: Commit**

```bash
git add src/pages/EditorPage.tsx
git commit -m "feat: add image upload support to recipe editor"
```

---

## Task 17: Deployment Configuration

**Files:**
- Create: `.env.example`
- Modify: `vite.config.ts`, `package.json`

- [ ] **Step 1: Create environment variable example**

Create `.env.example`:
```
VITE_GITHUB_OWNER=your-github-username
VITE_GITHUB_REPO=cookbook3
```

- [ ] **Step 2: Add SPA fallback and build config**

Update `vite.config.ts` to handle SPA routing on GitHub Pages:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
  },
});
```

- [ ] **Step 3: Add a 404.html for GitHub Pages SPA routing**

Create `public/404.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <script>
    // Redirect all 404s to index.html for SPA routing on GitHub Pages
    const path = window.location.pathname + window.location.search + window.location.hash;
    window.location.replace('/' + '?redirect=' + encodeURIComponent(path));
  </script>
</head>
<body></body>
</html>
```

Add redirect handling to `src/main.tsx` — replace with:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Handle GitHub Pages SPA redirect
const params = new URLSearchParams(window.location.search);
const redirect = params.get("redirect");
if (redirect) {
  window.history.replaceState(null, "", redirect);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 4: Verify production build**

Run: `npm run build`
Expected: Build completes, `dist/` directory contains `index.html`, `404.html`, `recipe-index.json`, and JS/CSS bundles.

- [ ] **Step 5: Commit**

```bash
git add .env.example vite.config.ts public/404.html src/main.tsx
git commit -m "feat: add deployment config with GitHub Pages SPA routing"
```

---

## Task 18: Tailwind Typography and Final Polish

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Install Tailwind Typography plugin**

Run:
```bash
npm install -D @tailwindcss/typography
```

- [ ] **Step 2: Add typography plugin to CSS**

Update `src/index.css`:
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

- [ ] **Step 3: Verify markdown renders with typography styles**

Run: `npm run dev`
Navigate to a recipe page. Expected: Method steps and notes render with proper typography (headings, lists, paragraphs styled nicely).

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/index.css package.json package-lock.json
git commit -m "feat: add Tailwind Typography plugin for markdown rendering"
```
