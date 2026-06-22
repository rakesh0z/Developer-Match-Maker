import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";

type Issue = {
  id?: string;
  githubIssueId?: number;
  title: string;
  body?: string | null;
  state: string;
  difficulty?: string | null;
  url: string;
  updatedAtGithub?: string;
  repository?: {
    owner: string;
    name: string;
    language?: string | null;
  };
};

const difficultyOptions = ["BEGINNER", "EASY", "INTERMEDIATE", "UNKNOWN"];

export default function IssuesDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
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
// Avoid sending a language filter when the UI is still default/empty.
        if (language && language !== "") params.language = language;
        

        // Prefer live GitHub fetch so issues show even if DB sync is empty.
        const res = await axios.get<Issue[]>("http://localhost:5000/api/issues/github", {
          params,
          withCredentials: true
        });

        setIssues(res.data);
      } catch (e) {
        const err = e as AxiosError<any>;
        setError(err?.response?.data?.error || err?.message || "Failed to load issues");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [difficulty, language]);

  return (
    <section id="center">
      <div style={{ width: "100%", maxWidth: 980 }}>
        <h1>Recommended Issues</h1>

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

        {loading && <p>Loading issues...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && issues.length === 0 && <p>No issues found.</p>}

        <div style={{ display: "grid", gap: 14 }}>
          {!loading && !error &&
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
                    <h3 style={{ margin: 0 }}>
                      <a href={issue.url} target="_blank" rel="noreferrer">
                        {issue.title}
                      </a>
                    </h3>
                    <span style={{ whiteSpace: "nowrap" }}>
                      {issue.difficulty ?? "UNKNOWN"}
                    </span>
                  </div>

                  <p style={{ marginTop: 8, marginBottom: 0, opacity: 0.85 }}>
                    {repo}
                    {issue.repository?.language ? ` • ${issue.repository.language}` : ""}
                  </p>
                </article>
              );
            })}
        </div>
      </div>
    </section>
  );
}

