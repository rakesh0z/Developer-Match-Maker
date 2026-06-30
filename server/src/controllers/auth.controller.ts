import type { Request, Response } from "express";
import axios from "axios";
import prisma from "../config/prisma.js";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const githubLogin = (req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback";

  if (!clientId) {
    return res.status(500).json({ error: "Missing GitHub client ID." });
  }

  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=user:email,read:user`;

  res.redirect(url);
};

export const githubCallback = async (
  req: Request,
  res: Response
) => {
  try {
    const code = String(req.query.code || "");

    if (!code) {
      return res.status(400).json({ error: "Missing OAuth code." });
    }

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(500).json({ error: "Failed to retrieve GitHub access token." });
    }


    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const githubUser = userResponse.data;

    const user = await prisma.user.upsert({
      where: {
        githubId: String(githubUser.id)
      },
      update: {
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        bio: githubUser.bio,
        accessToken: accessToken
      },
      create: {
        githubId: String(githubUser.id),
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        bio: githubUser.bio,
        accessToken: accessToken
      }
    });

    try {
      // Auto-sync skills on login.
      const { calculateSkillsForUser } = await import("../services/skills.service.js");
      if (accessToken) {
        await calculateSkillsForUser(user.id, accessToken);
      }
    } catch (e) {
      // Don't block login redirect if GitHub analysis fails.
      console.error("Failed to sync skills:", e);
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({ error: "Missing JWT secret." });
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: "7d"
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });

    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "GitHub authentication failed." });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: req.user.userId
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      createdAt: true
    }
  });

  res.json(user);
};