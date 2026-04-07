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
