import axios from "axios";
import prisma from "../config/prisma.js";
import { getUserRepos } from "./github.service.js";

export type Skill = {
  language: string;
  score: number;
};

type PrismaSkill = {
  id: string;
  language: string;
  score: number;
  userId: string;
};


const getRepoLanguages = async (
  owner: string,
  repo: string,
  token: string
): Promise<Record<string, number>> => {
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/languages`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};

const bytesMapToSkills = (languageMap: Record<string, number>): Skill[] => {
  const totalBytes = Object.values(languageMap).reduce(
    (a, b) => a + b,
    0
  );

  if (totalBytes <= 0) return [];

  return Object.entries(languageMap)
    .map(([language, bytes]) => ({
      language,
      score: Math.round((bytes / totalBytes) * 100)
    }))
    .sort((a, b) => b.score - a.score);
};

export const calculateSkillsForUser = async (userId: string, token: string) => {
  const repos = await getUserRepos(token);

  const languageMap: Record<string, number> = {};

  // Basic sequential loop (keeps GitHub rate limits happier than a large parallel batch)
  for (const repo of repos) {
    if (!repo?.owner?.login || !repo?.name) continue;

    try {
      const languages = await getRepoLanguages(
        repo.owner.login,
        repo.name,
        token
      );

      for (const [lang, bytes] of Object.entries(languages)) {
        languageMap[lang] = (languageMap[lang] || 0) + Number(bytes);
      }
    } catch (e) {
      // Ignore per-repo failures; continue aggregating other repos
      continue;
    }
  }

  const skills = bytesMapToSkills(languageMap);

  await (prisma as any).skill.deleteMany({ where: { userId } });

  if (skills.length > 0) {
    await (prisma as any).skill.createMany({
      data: skills.map((s) => ({
        userId,
        language: s.language,
        score: s.score
      }))
    });
  }

  return skills;
};

