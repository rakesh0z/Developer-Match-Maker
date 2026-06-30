import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true
});

export type Skill = {
  id?: string;
  language: string;
  score: number;
};

export type UserProfile = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt?: string;
};

export type UserProfileUpdate = {
  username: string;
  avatarUrl: string;
  bio: string;
};

export type RecommendedIssue = {
  id: string;
  githubIssueId: number;
  title: string;
  body?: string | null;
  state: string;
  difficulty?: string | null;
  url: string;
  updatedAtGithub?: string;
  matchScore: number;
  matchReasons: string[];
  repository?: {
    owner: string;
    name: string;
    language?: string | null;
    stars?: number;
    forks?: number;
  };
};

export type GitHubIssue = {
  githubIssueId: number;
  title: string;
  body?: string | null;
  state: string;
  difficulty?: string | null;
  url: string;
  updatedAtGithub: string;
  labels: string[];
  repository: {
    owner: string;
    name: string;
    language?: string | null;
    stars?: number;
    forks?: number;
  };
};