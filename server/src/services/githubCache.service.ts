import axios from "axios";
import {
  CACHE_TTL,
  cacheGet,
  cacheKey,
  cacheSet
} from "./cache.service.js";
import type { GitHubIssue } from "./issue.service.js";

export type RepoMetadata = {
  language: string | null;
  stars: number;
  forks: number;
};

const githubHeaders = (token?: string) => ({
  Accept: "application/vnd.github+json",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

export const fetchIssuesCached = async (
  query: string,
  token?: string
): Promise<GitHubIssue[]> => {
  const key = cacheKey("github", "search", query);

  const cached = await cacheGet<GitHubIssue[]>(key);
  if (cached) return cached;

  const response = await axios.get("https://api.github.com/search/issues", {
    params: { q: query, per_page: 100 },
    headers: githubHeaders(token)
  });

  const items = response.data.items as GitHubIssue[];
  await cacheSet(key, items, CACHE_TTL.GITHUB_SEARCH);
  return items;
};

export const getRepoMetadataCached = async (
  owner: string,
  repo: string,
  token?: string
): Promise<RepoMetadata> => {
  const key = cacheKey("github", "repo", owner, repo);

  const cached = await cacheGet<RepoMetadata>(key);
  if (cached) return cached;

  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: githubHeaders(token) }
  );

  const metadata: RepoMetadata = {
    language: response.data?.language ?? null,
    stars: response.data?.stargazers_count ?? 0,
    forks: response.data?.forks_count ?? 0
  };

  await cacheSet(key, metadata, CACHE_TTL.GITHUB_REPO);
  return metadata;
};

export const getRepoLanguageCached = async (
  repositoryUrl: string,
  token?: string
): Promise<string | null> => {
  const parts = repositoryUrl.split("/").filter(Boolean);
  const owner = parts[parts.length - 2] ?? "";
  const name = parts[parts.length - 1] ?? "";
  if (!owner || !name) return null;

  const metadata = await getRepoMetadataCached(owner, name, token);
  return metadata.language;
};
