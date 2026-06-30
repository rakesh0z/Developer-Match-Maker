import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import prisma from "../config/prisma.js";
import { fetchIssuesCached, getRepoMetadataCached } from "../services/githubCache.service.js";

type GitHubIssue = {
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

const getDifficulty = (labels: Array<{ name: string }>) => {
  const names = labels.map((label) => label.name.toLowerCase());

  if (names.includes("good first issue")) return "BEGINNER";
  if (names.includes("easy")) return "EASY";
  if (names.includes("help wanted")) return "INTERMEDIATE";
  return "UNKNOWN";
};

export const getGitHubIssues = async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, accessToken: true }
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!user.accessToken) {
    return res.status(400).json({ error: "Missing GitHub access token" });
  }

  // Optional query params from UI
  const rawDifficulty = req.query.difficulty as string | undefined;
  const rawLanguage = req.query.language as string | undefined;

  const difficultyFilter =
    rawDifficulty && rawDifficulty.trim() !== "" && rawDifficulty !== "UNKNOWN"
      ? rawDifficulty
      : undefined;

  const language = rawLanguage && rawLanguage.trim() !== "" ? rawLanguage : undefined;

  // Baseline search: open issues with labels that map to our difficulty.
  // We still filter by difficulty+language client-side after fetching.
  const queries: string[] = [
    'is:open is:issue label:"good first issue"',
    'is:open is:issue label:"help wanted"'
  ];

  const perPage = 50;
  const allIssues: GitHubIssue[] = [];

  for (const q of queries) {
    const items = await fetchIssuesCached(q, user.accessToken);
    allIssues.push(...items.slice(0, perPage));
  }

  // Filter by difficulty using labels returned from search.
  let filtered = allIssues.filter((i) => {
    if (!difficultyFilter) return true;
    return getDifficulty(i.labels) === difficultyFilter;
  });

  // Filter by language using repository_url (need extra request per unique repo).
  // For performance, dedupe and cache metadata lookups within the request.
  if (language) {
    const withLang = await Promise.all(
      filtered.map(async (i) => {
        const repoParts = i.repository_url.split("/").filter(Boolean);
        const owner = repoParts[repoParts.length - 2] || "";
        const name = repoParts[repoParts.length - 1] || "";
        const metadata = await getRepoMetadataCached(owner, name, user.accessToken);
        return { issue: i, repoLang: metadata.language };
      })
    );

    filtered = withLang
      .filter((x) => x.repoLang === language)
      .map((x) => x.issue);
  }

  const mapped = await Promise.all(
    filtered.slice(0, 50).map(async (i) => {
      const repoParts = i.repository_url.split("/").filter(Boolean);
      const owner = repoParts[repoParts.length - 2] || "";
      const name = repoParts[repoParts.length - 1] || "";
      const metadata = await getRepoMetadataCached(owner, name, user.accessToken);

      return {
        githubIssueId: i.id,
        title: i.title,
        body: i.body,
        state: i.state,
        difficulty: getDifficulty(i.labels),
        url: i.html_url,
        updatedAtGithub: i.updated_at,
        labels: i.labels.map((label) => label.name),
        repository: {
          owner,
          name,
          language: metadata.language,
          stars: metadata.stars,
          forks: metadata.forks
        }
      };
    })
  );

  return res.json(mapped);
};

