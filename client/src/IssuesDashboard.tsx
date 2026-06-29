import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";

type RecommendedIssue = {
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

const difficultyOptions = ["BEGINNER", "EASY", "INTERMEDIATE", "UNKNOWN"];

export default function IssuesDashboard() {
  const [issues, setIssues] = useState<RecommendedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [difficulty, setDifficulty] = useState<string>("BEGINNER");
  const [language, setLanguage] = useState<string>("");

  const languageOptions = useMemo(() => {
    const set = new Set<string>();
    for (const i of issues) {
      const lang = i.repository?.language;
      if (lang) set.add(lang);
    }
    return Array.from(set).sort();
  }, [issues]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string> = {};
        if (difficulty) params.difficulty = difficulty;
        if (language && language !== "") params.language = language;

        const res = await axios.get<RecommendedIssue[]>(
          "http://localhost:5000/api/recommendations",
          {
            params,
            withCredentials: true
          }
        );

        setIssues(res.data);
      } catch (e) {
        const err = e as AxiosError<{ error?: string }>;
        setError(err?.response?.data?.error || err?.message || "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [difficulty, language]);

  const scoreColor = (score: number) => {
    if (score >= 60) return "#22c55e";
    if (score >= 30) return "#eab308";
    return "#94a3b8";
  };

  return (
    <section id="center">
      <div style={{ width: "100%", maxWidth: 980 }}>
        <h1>Recommended Issues</h1>
        <p style={{ opacity: 0.75, marginTop: -8, marginBottom: 18 }}>
          Ranked by how well each issue matches your skill profile
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <label>
            Difficulty:
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              {difficultyOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label>
            Language:
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              <option value="">Any</option>
              {languageOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && <p>Loading recommendations...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && issues.length === 0 && (
          <p>No matching issues found. Try syncing issues or adjusting filters.</p>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          {!loading &&
            !error &&
            issues.map((issue) => {
              const repo = issue.repository
                ? `${issue.repository.owner}/${issue.repository.name}`
                : "unknown/repo";

              return (
                <article
                  key={issue.id ?? issue.githubIssueId ?? issue.url}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 14
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <h3 style={{ margin: 0, flex: 1 }}>
                      <a href={issue.url} target="_blank" rel="noreferrer">
                        {issue.title}
                      </a>
                    </h3>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: scoreColor(issue.matchScore)
                        }}
                        title="Match score"
                      >
                        {issue.matchScore}% match
                      </span>
                      <span>{issue.difficulty ?? "UNKNOWN"}</span>
                    </div>
                  </div>

                  <p style={{ marginTop: 8, marginBottom: 0, opacity: 0.85 }}>
                    {repo}
                    {issue.repository?.language ? ` • ${issue.repository.language}` : ""}
                    {issue.repository?.stars
                      ? ` • ${issue.repository.stars.toLocaleString()} stars`
                      : ""}
                  </p>

                  {issue.matchReasons.length > 0 && (
                    <ul
                      style={{
                        marginTop: 10,
                        marginBottom: 0,
                        paddingLeft: 18,
                        opacity: 0.8,
                        fontSize: "0.9em"
                      }}
                    >
                      {issue.matchReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
        </div>
      </div>
    </section>
  );
}
