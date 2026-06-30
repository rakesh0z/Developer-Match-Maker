import { useEffect, useMemo, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { api, type GitHubIssue, type Skill, type UserProfile } from "./api";

const difficultyOptions = ["", "BEGINNER", "EASY", "INTERMEDIATE"];

const estimateHours = (score: number) => {
  if (score >= 90) return "1-3 hours";
  if (score >= 75) return "3-5 hours";
  if (score >= 60) return "5-8 hours";
  return "8+ hours";
};

const summarizeBody = (body?: string | null) => {
  if (!body) {
    return "This issue already includes the essential GitHub metadata and can be opened directly.";
  }

  return body.length > 220 ? `${body.slice(0, 220).trim()}...` : body;
};

const scoreIssue = (issue: GitHubIssue, skills: Skill[]) => {
  const language = issue.repository.language?.toLowerCase() ?? "";
  const hasLanguageMatch = language
    ? skills.some((skill) => skill.language.toLowerCase() === language)
    : false;

  const score = Math.min(
    100,
    Math.round(
      (hasLanguageMatch ? 45 : 12) +
        (issue.difficulty && issue.difficulty !== "UNKNOWN" ? 25 : 8) +
        Math.min(issue.labels.length * 5, 15) +
        (issue.repository.stars ? Math.min(issue.repository.stars / 200, 15) : 0)
    )
  );

  const reasons = [
    hasLanguageMatch && issue.repository.language
      ? `Matches ${issue.repository.language}`
      : "No direct language overlap yet",
    issue.difficulty && issue.difficulty !== "UNKNOWN"
      ? `${issue.difficulty} difficulty`
      : "Difficulty inferred from GitHub labels",
    issue.repository.stars
      ? `Popular repo (${issue.repository.stars.toLocaleString()} stars)`
      : "Repo metadata loaded from GitHub"
  ];

  return { score, reasons };
};

export default function IssuesDashboard() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const hasSyncedSkills = useRef(false);

  const selectedIssue = useMemo(
    () => issues.find((issue) => issue.githubIssueId.toString() === selectedIssueId) ?? issues[0] ?? null,
    [issues, selectedIssueId]
  );

  const selectedScore = useMemo(
    () => (selectedIssue ? scoreIssue(selectedIssue, skills) : null),
    [selectedIssue, skills]
  );

  const languageOptions = useMemo(() => {
    const set = new Set<string>();
    for (const issue of issues) {
      const lang = issue.repository.language;
      if (lang) set.add(lang);
    }
    return Array.from(set).sort();
  }, [issues]);

  const loadIssues = async (syncFromGitHub = false) => {
    try {
      setLoading(true);
      setError(null);

      if (syncFromGitHub) {
        await api.post("/users/sync-skills");
      }

      const params: Record<string, string> = { limit: "24" };
      if (difficulty) params.difficulty = difficulty;
      if (language) params.language = language;

      const [issuesRes, skillsRes, profileRes] = await Promise.all([
        api.get<GitHubIssue[]>("/issues/github", { params }),
        api.get<Skill[]>("/users/skills"),
        api.get<UserProfile>("/auth/me")
      ]);

      setIssues(issuesRes.data);
      setSkills(skillsRes.data);
      setProfile(profileRes.data);
      setSelectedIssueId((current) => current ?? issuesRes.data[0]?.githubIssueId.toString() ?? null);
    } catch (e) {
      const err = e as AxiosError<{ error?: string }>;
      setError(err?.response?.data?.error || err?.message || "Failed to load GitHub issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasSyncedSkills.current) {
      hasSyncedSkills.current = true;
      loadIssues(true);
      return;
    }

    loadIssues(false);
  }, [difficulty, language]);

  const refreshIssues = async () => {
    try {
      setRefreshing(true);
      await loadIssues(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to refresh GitHub issues");
    } finally {
      setRefreshing(false);
    }
  };

  const missingSkills = selectedIssue?.repository.language
    ? skills.some((skill) => skill.language.toLowerCase() === selectedIssue.repository.language?.toLowerCase())
      ? []
      : [selectedIssue.repository.language]
    : [];

  return (
    <div className="issue-explorer">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Issue explorer</p>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>Live GitHub issues</h1>
          <p className="section-note">Fetched from GitHub with the signed-in account and enriched with repository metadata.</p>
        </div>

        <div className="cta-row">
          <button className="button button--ghost" type="button" onClick={refreshIssues} disabled={refreshing}>
            {refreshing ? "Refreshing issues..." : "Refresh GitHub issues"}
          </button>
          <a className="button button--primary" href="#issue-detail">
            Inspect issue
          </a>
        </div>
      </div>

      <section className="panel panel--inner" style={{ display: "grid", gap: 14 }}>
        <div className="section-heading section-heading--tight" style={{ marginBottom: 0 }}>
          <div>
            <p className="eyebrow">Signed-in developer</p>
            <h2 style={{ marginBottom: 6 }}>{profile?.username ?? "Developer"}</h2>
            <p className="section-note">Essential GitHub profile data pulled from the authenticated session.</p>
          </div>
          <span className="pill">{skills.length} synced languages</span>
        </div>

        <p className="muted">{profile?.bio || "GitHub bio not available yet."}</p>
      </section>

      <section className="panel panel--inner filter-panel">
        <label className="filter-field">
          <span>Difficulty</span>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">All difficulty levels</option>
            {difficultyOptions.filter(Boolean).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Language</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="">Any language</option>
            {languageOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <div className="filter-summary">
          <span className="pill">{issues.length} issues</span>
          <span className="pill">{skills.length} synced languages</span>
          <span className="pill">{selectedScore ? `${selectedScore.score}% best match` : "No active match"}</span>
        </div>
      </section>

      {loading && <p className="muted">Loading GitHub issues...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && issues.length === 0 && (
        <section className="panel empty-state">
          <h3>No matching issues found</h3>
          <p>
            Try refreshing GitHub issues, clearing the filters, or widening the difficulty range.
          </p>
          <div className="cta-row">
            <button className="button button--primary" type="button" onClick={refreshIssues} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh issues now"}
            </button>
            <button className="button button--ghost" type="button" onClick={() => {
              setDifficulty("");
              setLanguage("");
            }}>
              Reset filters
            </button>
          </div>
        </section>
      )}

      <div className="issue-grid">
        <section className="issue-list">
          {issues.map((issue) => {
            const repo = `${issue.repository.owner}/${issue.repository.name}`;
            const isActive = selectedIssue?.githubIssueId === issue.githubIssueId;
            const score = scoreIssue(issue, skills);

            return (
              <article
                key={issue.githubIssueId}
                className={isActive ? "issue-card issue-card--active" : "issue-card"}
                onClick={() => setSelectedIssueId(issue.githubIssueId.toString())}
                role="button"
                tabIndex={0}
              >
                <div className="issue-card__top">
                  <div>
                    <p className="eyebrow">{issue.difficulty ?? "UNKNOWN"}</p>
                    <h3>{issue.title}</h3>
                  </div>
                  <span className="match-pill">{score.score}% match</span>
                </div>

                <p className="muted">
                  {repo}
                  {issue.repository.language ? ` • ${issue.repository.language}` : ""}
                  {issue.repository.stars ? ` • ${issue.repository.stars.toLocaleString()} stars` : ""}
                  {issue.repository.forks ? ` • ${issue.repository.forks.toLocaleString()} forks` : ""}
                </p>

                <p className="issue-card__body">{summarizeBody(issue.body)}</p>

                <div className="reason-list">
                  {issue.labels.slice(0, 3).map((label) => (
                    <span className="reason-pill" key={label}>
                      {label}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <aside className="panel panel--inner issue-detail" id="issue-detail">
          {selectedIssue ? (
            <>
              <p className="eyebrow">Issue details</p>
              <h2 style={{ marginTop: 0 }}>{selectedIssue.title}</h2>

              <div className="detail-grid">
                <div>
                  <span className="detail-label">Repository</span>
                  <strong>{selectedIssue.repository.owner}/{selectedIssue.repository.name}</strong>
                </div>
                <div>
                  <span className="detail-label">Difficulty</span>
                  <strong>{selectedIssue.difficulty ?? "UNKNOWN"}</strong>
                </div>
                <div>
                  <span className="detail-label">Estimated time</span>
                  <strong>{estimateHours(selectedScore?.score ?? 0)}</strong>
                </div>
                <div>
                  <span className="detail-label">Good fit</span>
                  <strong>{selectedScore?.score ?? 0}%</strong>
                </div>
              </div>

              <div className="issue-summary">
                <p className="detail-label">Plain-English summary</p>
                <p>{summarizeBody(selectedIssue.body)}</p>
              </div>

              <div className="detail-list">
                <p className="detail-label">Why this matches</p>
                {selectedScore?.reasons.length ? (
                  selectedScore.reasons.map((reason) => (
                    <span key={reason} className="detail-chip">
                      {reason}
                    </span>
                  ))
                ) : (
                  <span className="detail-chip">Matches your current skill profile</span>
                )}
              </div>

              <div className="detail-list">
                <p className="detail-label">Learning mode</p>
                {missingSkills.length > 0 ? (
                  missingSkills.map((skill) => (
                    <span key={skill} className="detail-chip detail-chip--warning">
                      Learn {skill}
                    </span>
                  ))
                ) : (
                  <span className="detail-chip">No major skill gaps detected</span>
                )}
              </div>

              <div className="cta-row">
                <a className="button button--primary" href={selectedIssue.url} target="_blank" rel="noreferrer">
                  Open on GitHub
                </a>
                <button className="button button--ghost" type="button" onClick={() => setSelectedIssueId(selectedIssue.githubIssueId.toString())}>
                  Keep focus on this issue
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state empty-state--compact">
              <h3>No issue selected</h3>
              <p>Select a GitHub issue to inspect the summary, metadata, and next steps.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
