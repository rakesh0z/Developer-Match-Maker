import { syncIssues } from "../services/issueSync.service.js";
import prisma from "../config/prisma.js";
export const manualSyncIssues = async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    await syncIssues();
    return res.json({ message: "Sync complete" });
};
export const getIssues = async (req, res) => {
    const rawDifficulty = req.query.difficulty;
    const language = req.query.language;
    // UI sometimes sends difficulty=UNKNOWN:1; treat it as "no difficulty filter".
    const difficulty = rawDifficulty && rawDifficulty.trim() !== "" && rawDifficulty !== "UNKNOWN"
        ? rawDifficulty
        : undefined;
    // Prisma model delegate should exist on the PrismaClient instance.
    // If it doesn't, prisma client might not be generated/compatible with this schema.
    const issueClient = prisma.issue;
    // If the delegate isn't present, PrismaClient is likely not the right instance.
    // Fall back to using the root client in case of unexpected shapes.
    if (!issueClient?.findMany) {
        return res.status(500).json({
            error: "Prisma client missing issue.findMany",
            keys: Object.keys(prisma)
        });
    }
    try {
        const issues = await issueClient.findMany({
            where: {
                state: "open",
                ...(difficulty ? { difficulty } : {}),
                // Robust language filtering:
                // - repository.language is nullable in the schema
                // - depending on DB state, nested filters can behave unexpectedly
                // - we explicitly require a Repository relation when filtering by language
                ...(language
                    ? {
                        repository: {
                            is: {
                                language
                            }
                        }
                    }
                    : {})
            },
            include: {
                repository: true
            },
            take: 50,
            orderBy: {
                updatedAtGithub: "desc"
            }
        });
        return res.json(issues);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).json({
            error: "Failed to fetch issues",
            details: message,
            difficulty: rawDifficulty,
            language
        });
    }
};
//# sourceMappingURL=issues.controller.js.map