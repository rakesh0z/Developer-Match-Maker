import prisma from "../config/prisma.js";
import axios from "axios";
const getDifficulty = (labels) => {
    const names = labels.map((label) => label.name.toLowerCase());
    if (names.includes("good first issue"))
        return "BEGINNER";
    if (names.includes("easy"))
        return "EASY";
    if (names.includes("help wanted"))
        return "INTERMEDIATE";
    return "UNKNOWN";
};
export const getGitHubIssues = async (req, res) => {
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
    const rawDifficulty = req.query.difficulty;
    const rawLanguage = req.query.language;
    const difficultyFilter = rawDifficulty && rawDifficulty.trim() !== "" && rawDifficulty !== "UNKNOWN"
        ? rawDifficulty
        : undefined;
    const language = rawLanguage && rawLanguage.trim() !== "" ? rawLanguage : undefined;
    // Baseline search: open issues with labels that map to our difficulty.
    // We still filter by difficulty+language client-side after fetching.
    const queries = [
        'is:open is:issue label:"good first issue"',
        'is:open is:issue label:"help wanted"'
    ];
    const headers = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${user.accessToken}`
    };
    const perPage = 50;
    const allIssues = [];
    for (const q of queries) {
        const response = await axios.get("https://api.github.com/search/issues", {
            params: { q, per_page: perPage },
            headers
        });
        allIssues.push(...response.data.items);
    }
    // Filter by difficulty using labels returned from search.
    let filtered = allIssues.filter((i) => {
        if (!difficultyFilter)
            return true;
        return getDifficulty(i.labels) === difficultyFilter;
    });
    // Filter by language using repository_url (need extra request per unique repo).
    // For performance, dedupe and cache language lookups within the request.
    if (language) {
        const repoLanguageCache = new Map();
        const getRepoLanguage = async (repository_url) => {
            if (repoLanguageCache.has(repository_url))
                return repoLanguageCache.get(repository_url) ?? null;
            const repoResp = await axios.get(repository_url, { headers });
            const lang = repoResp.data?.language ?? null;
            repoLanguageCache.set(repository_url, lang);
            return lang;
        };
        const withLang = await Promise.all(filtered.map(async (i) => {
            const repoLang = await getRepoLanguage(i.repository_url);
            return { issue: i, repoLang };
        }));
        filtered = withLang
            .filter((x) => x.repoLang === language)
            .map((x) => x.issue);
    }
    const mapped = filtered.slice(0, 50).map((i) => {
        const repoParts = i.repository_url.split("/").filter(Boolean);
        const owner = repoParts[repoParts.length - 2] || "";
        const name = repoParts[repoParts.length - 1] || "";
        return {
            githubIssueId: i.id,
            title: i.title,
            body: i.body,
            state: i.state,
            difficulty: getDifficulty(i.labels),
            url: i.html_url,
            updatedAtGithub: i.updated_at,
            repository: {
                owner,
                name,
                language: language ?? null
            }
        };
    });
    return res.json(mapped);
};
//# sourceMappingURL=githubIssues.controller.js.map