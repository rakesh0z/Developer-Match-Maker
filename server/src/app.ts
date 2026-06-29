import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./config/prisma.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import issuesRoutes from "./routes/issues.routes.js";
import recommendationsRoutes from "./routes/recommendations.routes.js";
import { getRedis } from "./config/redis.js";

import "./cron/syncIssues.js";

getRedis();



const app = express();


app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/issues", issuesRoutes);
app.use("/api/recommendations", recommendationsRoutes);


app.get("/", (req, res) => {

  res.send("API Running");
});

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.post("/users", async (req, res) => {
  const {githubId, username, avatarUrl} = req.body;
  const user = await prisma.user.create({
    data: {
      githubId,
      username,
      avatarUrl
    }
  });
  res.json(user);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

