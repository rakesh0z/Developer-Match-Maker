import prisma from "../config/prisma.js";
import { getRecommendationsForUser } from "../services/recommendation.service.js";
export const getRecommendations = async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, accessToken: true }
    });
    if (!user) {
        console.warn(`Recommendations requested for missing user ${req.user.userId}; returning empty list.`);
        return res.json([]);
    }
    const rawDifficulty = req.query.difficulty;
    const rawLanguage = req.query.language;
    const rawLimit = req.query.limit;
    const difficulty = rawDifficulty && rawDifficulty.trim() !== "" && rawDifficulty !== "UNKNOWN"
        ? rawDifficulty
        : undefined;
    const language = rawLanguage && rawLanguage.trim() !== "" ? rawLanguage : undefined;
    const limit = rawLimit ? Math.min(parseInt(rawLimit, 10) || 50, 100) : 50;
    try {
        const recommendations = await getRecommendationsForUser(user.id, {
            limit,
            ...(difficulty ? { difficulty } : {}),
            ...(language ? { language } : {}),
            ...(user.accessToken ? { accessToken: user.accessToken } : {})
        });
        return res.json(recommendations);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).json({
            error: "Failed to generate recommendations",
            details: message
        });
    }
};
//# sourceMappingURL=recommendations.controller.js.map