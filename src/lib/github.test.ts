import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubClient } from "./github";

const REPO_OWNER = "testuser";
const REPO_NAME = "cookbook";

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

  describe("fetchRecipeFile UTF-8 handling", () => {
    it("decodes multibyte UTF-8 content without corruption", async () => {
      const markdown = "---\ntitle: Test\n---\nHeat to 375°F (190°C) — about ½ hour";
      // Base64-encode the UTF-8 bytes with a line break, as the GitHub API does
      const utf8Bytes = new TextEncoder().encode(markdown);
      const base64 = btoa(String.fromCharCode(...utf8Bytes));
      const wrapped = base64.slice(0, 60) + "\n" + base64.slice(60);
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ content: wrapped, sha: "abc123" }), { status: 200 })
      );

      const result = await client.fetchRecipeFile("test-recipe");
      expect(result.content).toBe(markdown);
    });
  });

  describe("fetchMappingsViaApi", () => {
    it("decodes multibyte UTF-8 mapping keys without corruption", async () => {
      const mappings = { "jalapeño pepper": { foodId: "fdc:1", confirmed: true } };
      const utf8Bytes = new TextEncoder().encode(JSON.stringify(mappings));
      const base64 = btoa(String.fromCharCode(...utf8Bytes));
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ content: base64, sha: "map123" }), { status: 200 })
      );

      const result = await client.fetchMappingsViaApi("ghp_token");
      expect(result.content).toEqual(mappings);
      expect(result.sha).toBe("map123");
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
