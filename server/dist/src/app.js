import "dotenv/config";
import express from "express";
import cors from "cors";
let prisma = null;
let app = null;
const initApp = async () => {
    try {
        // Import prisma dynamically
        const prismaModule = await import("./config/prisma.js");
        prisma = prismaModule.default;
        // Import other modules
        const cookieParser = (await import("cookie-parser")).default;
        const { getRedis } = await import("./config/redis.js");
        console.log("📦 Initializing application...");
        getRedis();
        // Delay cron job initialization to avoid startup errors
        setTimeout(() => {
            try {
                import("./cron/syncIssues.js").catch((err) => {
                    console.warn("⚠️  Failed to initialize cron job:", err.message);
                });
            }
            catch (error) {
                console.warn("⚠️  Cron job skipped");
            }
        }, 1000);
        app = express();
        app.use(cookieParser());
        app.use(cors({
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            credentials: true
        }));
        app.use(express.json());
        // Import and use routes
        const authRoutes = (await import("./routes/auth.routes.js")).default;
        const usersRoutes = (await import("./routes/users.routes.js")).default;
        const issuesRoutes = (await import("./routes/issues.routes.js")).default;
        const recommendationsRoutes = (await import("./routes/recommendations.routes.js")).default;
        app.use("/api/auth", authRoutes);
        app.use("/api/users", usersRoutes);
        app.use("/api/issues", issuesRoutes);
        app.use("/api/recommendations", recommendationsRoutes);
        app.get("/", (req, res) => {
            res.json({ message: "API Running", status: "ok" });
        });
        app.get("/health", (req, res) => {
            res.json({
                status: "ok",
                database: prisma ? "available" : "unavailable",
                timestamp: new Date().toISOString()
            });
        });
        app.get("/users", async (req, res) => {
            try {
                if (!prisma || !prisma.user) {
                    return res.status(503).json({ error: "Database unavailable" });
                }
                const users = await prisma.user.findMany();
                res.json(users);
            }
            catch (error) {
                console.error("Error fetching users:", error);
                res.status(500).json({ error: "Failed to fetch users" });
            }
        });
        app.post("/users", async (req, res) => {
            try {
                if (!prisma || !prisma.user) {
                    return res.status(503).json({ error: "Database unavailable" });
                }
                const { githubId, username, avatarUrl } = req.body;
                const user = await prisma.user.create({
                    data: {
                        githubId,
                        username,
                        avatarUrl
                    }
                });
                res.json(user);
            }
            catch (error) {
                console.error("Error creating user:", error);
                res.status(500).json({ error: "Failed to create user" });
            }
        });
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
        });
        return app;
    }
    catch (error) {
        console.error("❌ Failed to initialize app:", error);
        process.exit(1);
    }
};
// Initialize app
initApp().catch((err) => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=app.js.map