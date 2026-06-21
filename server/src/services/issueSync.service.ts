import prisma from "../config/prisma.js";
import { fetchIssues, type GitHubIssue } from "./issue.service.js";

export const getDifficulty = (labels: Array<{ name: string }>) => {
  const names = labels.map((label) => label.name.toLowerCase());

  if (names.includes("good first issue")) {
    return "BEGINNER";
  }

  if (names.includes("easy")) {
    return "EASY";
  }

  if (names.includes("help wanted")) {
    return "INTERMEDIATE";
  }

  return "UNKNOWN";
};

const parseRepoFromRepositoryUrl = (repository_url: string) => {
  const parts = repository_url.split("/").filter(Boolean);
  const owner = parts[parts.length - 2] || "";
  const name = parts[parts.length - 1] || "";
  return { owner, name };
};

// We only have a numeric-free identifier from search payload.
// Derive a deterministic positive Int for githubRepoId.
const deriveRepoIntId = (owner: string, name: string) => {
  const str = `${owner}/${name}`;
  let hash = 7;
  for (const ch of str) hash = hash * 31 + ch.charCodeAt(0);
  return Math.abs(hash);
};

const deriveRepoStubs = () => {
  // GitHub search issues API does not include repository stars/forks reliably.
  // For now store 0 defaults; later you can enrich via repo API if desired.
  return { language: null as string | null, stars: 0, forks: 0 };
};

const saveIssue = async (issue: GitHubIssue) => {
  // Ensure we can always compute a derived repo id.
  if (!issue.repository_url) return;
  const { owner, name } = parseRepoFromRepositoryUrl(issue.repository_url);
  const derivedRepoId = deriveRepoIntId(owner, name);
  const repoStubs = deriveRepoStubs();

  // Upsert Repository by githubRepoId
  const repository = await (prisma as any).repository.upsert({
    where: { githubRepoId: derivedRepoId },
    update: {
      stars: repoStubs.stars,
      forks: repoStubs.forks,
      language: repoStubs.language
    },
    create: {
      githubRepoId: derivedRepoId,
      owner,
      name,
      language: repoStubs.language,
      stars: repoStubs.stars,
      forks: repoStubs.forks
    }
  });

  // Upsert Issue
  await (prisma as any).issue.upsert({
    where: {
      githubIssueId: issue.id
    },
    update: {
      title: issue.title,
      body: issue.body,
      state: issue.state,
      difficulty: getDifficulty(issue.labels),
      updatedAtGithub: new Date(issue.updated_at),
      url: issue.html_url
    },
    create: {
      githubIssueId: issue.id,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      difficulty: getDifficulty(issue.labels),
      url: issue.html_url,
      createdAtGithub: new Date(issue.created_at),
      updatedAtGithub: new Date(issue.updated_at),
      repositoryId: repository.id
    }
  });
};

export const syncIssues = async () => {
  const queries = [
    'is:open is:issue label:"good first issue"',
    'is:open is:issue label:"help wanted"'
  ];

  for (const query of queries) {
    const issues = await fetchIssues(query);

    for (const issue of issues) {
      try {
        await saveIssue(issue);
      } catch {
        // ignore single issue persistence failures
      }
    }
  }

  console.log("Issue sync complete");
};

