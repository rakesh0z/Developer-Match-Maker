import axios from "axios";
import prisma from "../config/prisma.js";
import { getUserRepos } from "./github.service.js";
const getRepoLanguages = async (owner, repo, token) => {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};
const bytesMapToSkills = (languageMap) => {
    const totalBytes = Object.values(languageMap).reduce((a, b) => a + b, 0);
    if (totalBytes <= 0)
        return [];
    return Object.entries(languageMap)
        .map(([language, bytes]) => ({
        language,
        score: Math.round((bytes / totalBytes) * 100)
    }))
        .sort((a, b) => b.score - a.score);
};
export const calculateSkillsForUser = async (userId, token) => {
    const repos = await getUserRepos(token);
    const languageMap = {};
    // Basic sequential loop (keeps GitHub rate limits happier than a large parallel batch)
    for (const repo of repos) {
        if (!repo?.owner?.login || !repo?.name)
            continue;
        try {
            const languages = await getRepoLanguages(repo.owner.login, repo.name, token);
            for (const [lang, bytes] of Object.entries(languages)) {
                languageMap[lang] = (languageMap[lang] || 0) + Number(bytes);
            }
        }
        catch (e) {
            // Ignore per-repo failures; continue aggregating other repos
            continue;
        }
    }
    const skills = bytesMapToSkills(languageMap);
    await prisma.skill.deleteMany({ where: { userId } });
    if (skills.length > 0) {
        await prisma.skill.createMany({
            data: skills.map((s) => ({
                userId,
                language: s.language,
                score: s.score
            }))
        });
    }
    return skills;
};
//# sourceMappingURL=skills.service.js.map