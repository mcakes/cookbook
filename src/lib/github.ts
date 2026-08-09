import type { RecipeIndex } from "../types/recipe";

const API_BASE = "https://api.github.com";

/** Decode GitHub's base64 file content as UTF-8 (atob alone mangles multibyte chars). */
function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export class GitHubClient {
  private owner: string;
  private repo: string;

  constructor(owner: string, repo: string) {
    this.owner = owner;
    this.repo = repo;
  }

  async fetchRecipeIndex(): Promise<RecipeIndex> {
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
    const content = decodeBase64Utf8(data.content);
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
    const url = `${API_BASE}/repos/${this.owner}/${this.repo}/contents/images/${filename}`;

    if (sha === undefined) {
      // The Contents API rejects a PUT without a sha if the file already exists.
      const existing = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (existing.ok) sha = (await existing.json()).sha;
    }

    const body: Record<string, string> = {
      message: `Add image ${filename}`,
      content: base64Content,
    };
    if (sha) body.sha = sha;

    const res = await fetch(
      url,
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

  async fetchMappings(): Promise<{ content: Record<string, unknown>; sha: string | null }> {
    // Try the static file first (works for unauthenticated viewers).
    const res = await fetch(`${import.meta.env.BASE_URL}data/nutrition-mappings.json`);
    if (res.ok) {
      const content = await res.json();
      return { content, sha: null };
    }
    return { content: {}, sha: null };
  }

  async fetchMappingsViaApi(token: string): Promise<{ content: Record<string, unknown>; sha: string }> {
    const res = await fetch(
      `${API_BASE}/repos/${this.owner}/${this.repo}/contents/public/data/nutrition-mappings.json`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" } }
    );
    if (!res.ok) throw new Error(`Failed to fetch mappings: ${res.status}`);
    const data = await res.json();
    const decoded = decodeBase64Utf8(data.content);
    return { content: JSON.parse(decoded), sha: data.sha };
  }

  async saveMappings(
    mappings: Record<string, unknown>,
    token: string,
    sha?: string
  ): Promise<string> {
    const body: Record<string, string> = {
      message: "chore: update nutrition mappings",
      content: btoa(unescape(encodeURIComponent(JSON.stringify(mappings, null, 2) + "\n"))),
    };
    if (sha) body.sha = sha;
    const res = await fetch(
      `${API_BASE}/repos/${this.owner}/${this.repo}/contents/public/data/nutrition-mappings.json`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to save mappings: ${res.status} ${err}`);
    }
    const data = await res.json();
    return data.content.sha;
  }
}
