import axios from "axios";

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

export const fetchIssues = async (query: string) => {
  const response = await axios.get(
    "https://api.github.com/search/issues",
    {
      params: {
        q: query,
        per_page: 100
      },
      headers: {
        Accept: "application/vnd.github+json"
      }
    }
  );

  return response.data.items as GitHubIssue[];
};

