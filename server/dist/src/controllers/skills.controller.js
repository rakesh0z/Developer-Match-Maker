import prisma from "../config/prisma.js";
import { calculateSkillsForUser } from "../services/skills.service.js";
import { invalidateUserRecommendations } from "../services/recommendation.service.js";
export const syncSkills = async (req, res) => {
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
    await calculateSkillsForUser(user.id, user.accessToken);
    await invalidateUserRecommendations(user.id);
    return res.json({ message: "Skills updated" });
};
export const getSkills = async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const skills = await prisma.skill.findMany({
        where: { userId: req.user.userId },
        orderBy: { score: "desc" }
    });
    return res.json(skills);
};
//# sourceMappingURL=skills.controller.js.map