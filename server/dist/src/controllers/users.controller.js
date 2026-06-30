import prisma from "../config/prisma.js";
const sanitizeText = (value) => String(value ?? "").trim();
export const getCurrentUserProfile = async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            createdAt: true
        }
    });
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
};
export const updateCurrentUserProfile = async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const username = sanitizeText(req.body?.username);
    const avatarUrl = sanitizeText(req.body?.avatarUrl);
    const bio = sanitizeText(req.body?.bio);
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }
    const updated = await prisma.user.update({
        where: { id: req.user.userId },
        data: {
            username,
            avatarUrl: avatarUrl || null,
            bio: bio || null
        },
        select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            createdAt: true
        }
    });
    return res.json(updated);
};
//# sourceMappingURL=users.controller.js.map