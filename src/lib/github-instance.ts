import { GitHubClient } from "./github";

const OWNER = import.meta.env.VITE_GITHUB_OWNER ?? "your-username";
const REPO = import.meta.env.VITE_GITHUB_REPO ?? "cookbook";

export const github = new GitHubClient(OWNER, REPO);
