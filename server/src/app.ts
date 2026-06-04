import express from "express";
import cors from "cors";
import prisma from "./config/prisma.js";

const app = express();

app.use(cors());
app.use(express.json());

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