import { fetchIssuesCached } from "./githubCache.service.js";

export type GitHubIssue = {
  id: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: Array<{ name: string }>;
  repository_url: string;
};

export const fetchIssues = async (query: string, token?: string) => {
  return fetchIssuesCached(query, token);
};

