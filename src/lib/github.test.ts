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
