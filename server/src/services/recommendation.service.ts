import prisma from "../config/prisma.js";
import {
  CACHE_TTL,
  cacheGet,
  cacheKey,
  cacheSet,
  cacheDel
} from "./cache.service.js";
import { getRepoMetadataCached } from "./githubCache.service.js";

type UserSkill = {
  language: string;
  score: number;
};

type IssueWithRepo = {
  id: string;
  githubIssueId: number;
  title: string;
  body: string | null;
  state: string;
  difficulty: string | null;
  url: string;
  updatedAtGithub: Date;
  repository: {
    id: string;
    owner: string;
    name: string;
    language: string | null;
    stars: number;
    forks: number;
  };
};

export type RecommendedIssue = {
  id: string;
  githubIssueId: number;
  title: string;
  body: string | null;
  state: string;
  difficulty: string | null;
  url: string;
  updatedAtGithub: string;
  repository: {
    owner: string;
    name: string;
    language: string | null;
    stars: number;
    forks: number;
  };
  matchScore: number;
  matchReasons: string[];
};

export type RecommendationOptions = {
  limit?: number;
  difficulty?: string;
  language?: string;
  accessToken?: string;
};

const DIFFICULTY_RANK: Record<string, number> = {
  BEGINNER: 0,
  EASY: 1,
  INTERMEDIATE: 2,
  UNKNOWN: 3
};

const getSkillStrength = (skills: UserSkill[]): number => {
  if (skills.length === 0) return 0;
  return Math.max(...skills.map((s) => s.score));
};

const scoreLanguageMatch = (
  repoLanguage: string | null,
  skills: UserSkill[]
): { points: number; reasons: string[] } => {
  if (!repoLanguage || skills.length === 0) {
    return { points: repoLanguage ? 5 : 0, reasons: [] };
  }

  const match = skills.find(
    (s) => s.language.toLowerCase() === repoLanguage.toLowerCase()
  );

  if (!match) {
    return {
      points: 0,
      reasons: [`Uses ${repoLanguage} — not in your skill profile`]
    };
  }

  const points = Math.round(match.score * 0.5);
  return {
    points,
    reasons: [`Strong ${repoLanguage} match (${match.score}% of your repos)`]
  };
};

const scoreDifficultyFit = (
  difficulty: string | null,
  skillStrength: number
): { points: number; reasons: string[] } => {
  const level = difficulty ?? "UNKNOWN";

  if (level === "BEGINNER") {
    if (skillStrength <= 30) {
      return { points: 30, reasons: ["Beginner-friendly — great starting point"] };
    }
    if (skillStrength <= 60) {
      return { points: 15, reasons: ["Beginner issue — quick win opportunity"] };
    }
    return { points: 5, reasons: [] };
  }

  if (level === "EASY") {
    if (skillStrength <= 40) {
      return { points: 25, reasons: ["Easy difficulty fits your experience"] };
    }
    if (skillStrength <= 70) {
      return { points: 15, reasons: ["Easy issue within reach"] };
    }
    return { points: 8, reasons: [] };
  }

  if (level === "INTERMEDIATE") {
    if (skillStrength >= 50) {
      return { points: 30, reasons: ["Intermediate — matches your skill level"] };
    }
    if (skillStrength >= 25) {
      return { points: 20, reasons: ["Stretch goal to grow your skills"] };
    }
    return { points: 10, reasons: [] };
  }

  return { points: 10, reasons: [] };
};

const scoreRecency = (updatedAt: Date): { points: number; reasons: string[] } => {
  const daysSinceUpdate =
    (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate <= 7) {
    return { points: 10, reasons: ["Recently updated"] };
  }
  if (daysSinceUpdate <= 30) {
    return { points: 5, reasons: [] };
  }
  return { points: 0, reasons: [] };
};

const scorePopularity = (stars: number): { points: number; reasons: string[] } => {
  if (stars <= 0) return { points: 0, reasons: [] };

  const points = Math.min(Math.round(stars / 100), 10);
  if (points >= 5) {
    return { points, reasons: [`Popular repo (${stars.toLocaleString()} stars)`] };
  }
  return { points, reasons: [] };
};

const scoreIssue = (
  issue: IssueWithRepo,
  skills: UserSkill[]
): { score: number; reasons: string[] } => {
  const skillStrength = getSkillStrength(skills);
  const reasons: string[] = [];

  const language = scoreLanguageMatch(issue.repository.language, skills);
  const difficulty = scoreDifficultyFit(issue.difficulty, skillStrength);
  const recency = scoreRecency(issue.updatedAtGithub);
  const popularity = scorePopularity(issue.repository.stars);

  reasons.push(...language.reasons, ...difficulty.reasons, ...recency.reasons, ...popularity.reasons);

  const total =
    language.points + difficulty.points + recency.points + popularity.points;

  return { score: total, reasons: reasons.filter(Boolean) };
};

const enrichRepository = async (
  issue: IssueWithRepo,
  accessToken?: string
): Promise<IssueWithRepo> => {
  if (issue.repository.language !== null) return issue;

  const metadata = await getRepoMetadataCached(
    issue.repository.owner,
    issue.repository.name,
    accessToken
  );

  await (prisma as any).repository.update({
    where: { id: issue.repository.id },
    data: {
      language: metadata.language,
      stars: metadata.stars,
      forks: metadata.forks
    }
  });

  return {
    ...issue,
    repository: {
      ...issue.repository,
      language: metadata.language,
      stars: metadata.stars,
      forks: metadata.forks
    }
  };
};

export const invalidateUserRecommendations = async (userId: string): Promise<void> => {
  await cacheDel(cacheKey("recs", "user", userId, "*"));
};

export const getRecommendationsForUser = async (
  userId: string,
  options: RecommendationOptions = {}
): Promise<RecommendedIssue[]> => {
  const limit = options.limit ?? 50;
  const difficulty = options.difficulty;
  const language = options.language;

  const cacheKeyStr = cacheKey(
    "recs",
    "user",
    userId,
    difficulty ?? "all",
    language ?? "all",
    String(limit)
  );

  const cached = await cacheGet<RecommendedIssue[]>(cacheKeyStr);
  if (cached) return cached;

  const skills: UserSkill[] = await (prisma as any).skill.findMany({
    where: { userId },
    orderBy: { score: "desc" }
  });

  const issueClient = (prisma as any).issue;
  const issues: IssueWithRepo[] = await issueClient.findMany({
    where: {
      state: "open",
      ...(difficulty ? { difficulty } : {})
    },
    include: { repository: true },
    take: 200,
    orderBy: { updatedAtGithub: "desc" }
  });

  const enrichedIssues: IssueWithRepo[] = [];
  for (const issue of issues) {
    enrichedIssues.push(await enrichRepository(issue, options.accessToken));
  }

  if (language) {
    const filtered = enrichedIssues.filter(
      (i) => i.repository.language?.toLowerCase() === language.toLowerCase()
    );
    enrichedIssues.length = 0;
    enrichedIssues.push(...filtered);
  }

  const ranked = enrichedIssues
    .map((issue) => {
      const { score, reasons } = scoreIssue(issue, skills);

      if (skills.length === 0 && reasons.length === 0) {
        reasons.push("Sync your skills for personalized matching");
      }

      return {
        id: issue.id,
        githubIssueId: issue.githubIssueId,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        difficulty: issue.difficulty,
        url: issue.url,
        updatedAtGithub: issue.updatedAtGithub.toISOString(),
        repository: {
          owner: issue.repository.owner,
          name: issue.repository.name,
          language: issue.repository.language,
          stars: issue.repository.stars,
          forks: issue.repository.forks
        },
        matchScore: score,
        matchReasons: reasons
      } satisfies RecommendedIssue;
    })
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      const diffRank =
        (DIFFICULTY_RANK[a.difficulty ?? "UNKNOWN"] ?? 3) -
        (DIFFICULTY_RANK[b.difficulty ?? "UNKNOWN"] ?? 3);
      if (diffRank !== 0) return diffRank;
      return (
        new Date(b.updatedAtGithub).getTime() -
        new Date(a.updatedAtGithub).getTime()
      );
    })
    .slice(0, limit);

  await cacheSet(cacheKeyStr, ranked, CACHE_TTL.RECOMMENDATIONS);
  return ranked;
};
