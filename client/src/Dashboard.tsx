import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  api,
  type RecommendedIssue,
  type Skill,
  type UserProfile
} from "./api";

type Category = {
  label: string;
  value: number;
};

const categoryMatchers: Array<{ label: string; terms: string[] }> = [
  { label: "Backend", terms: ["java", "kotlin", "go", "python", "rust", "ruby", "php", "c#", "node", "typescript", "javascript"] },
  { label: "Frontend", terms: ["javascript", "typescript", "html", "css", "vue", "svelte", "react"] },
  { label: "Data", terms: ["sql", "postgres", "mysql", "sqlite", "oracle", "database"] },
  { label: "Testing", terms: ["junit", "jest", "pytest", "cypress", "playwright", "spec", "test"] },
  { label: "DevOps", terms: ["docker", "kubernetes", "terraform", "yaml", "shell", "makefile", "groovy"] }
];

const scoreCategories = (skills: Skill[]): Category[] => {
  const lowered = skills.map((skill) => ({ ...skill, language: skill.language.toLowerCase() }));

  return categoryMatchers.map((category) => {
    const matches = lowered.filter((skill) =>
      category.terms.some((term) => skill.language.includes(term))
    );

    if (matches.length === 0) {
      return { label: category.label, value: 0 };
    }

    const average = matches.reduce((sum, skill) => sum + skill.score, 0) / matches.length;
    return { label: category.label, value: Math.round(average) };
  });
};

const estimateDeveloperScore = (skills: Skill[]) => {
  if (skills.length === 0) return 0;
  const topSkills = [...skills].sort((a, b) => b.score - a.score).slice(0, 5);
  return Math.round(topSkills.reduce((sum, skill) => sum + skill.score, 0) / topSkills.length);
};

const estimateHours = (score: number) => {
  if (score >= 90) return "1-3 hours";
  if (score >= 75) return "3-5 hours";
  if (score >= 60) return "5-8 hours";
  return "8+ hours";
};

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async (syncFromGitHub = false) => {
    try {
      setLoading(true);
      setError(null);

      if (syncFromGitHub) {
        await api.post("/users/sync-skills");
      }

      const [profileRes, skillsRes, recommendationsRes] = await Promise.all([
        api.get<UserProfile>("/auth/me"),
        api.get<Skill[]>("/users/skills"),
        api.get<RecommendedIssue[]>("/recommendations", { params: { limit: 4 } })
      ]);

      setProfile(profileRes.data);
      setSkills(skillsRes.data);
      setRecommendations(recommendationsRes.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(true);
  }, []);

  const developerScore = useMemo(() => estimateDeveloperScore(skills), [skills]);
  const topStack = useMemo(
    () => [...skills].sort((a, b) => b.score - a.score).slice(0, 4),
    [skills]
  );
  const categories = useMemo(() => scoreCategories(skills), [skills]);

  const handleSyncSkills = async () => {
    try {
      setSyncing(true);
      await loadDashboard(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to sync skills");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="page-grid">
      <section className="panel profile-panel">
        <div className="profile-top">
          <div className="avatar-shell">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.username} className="avatar" />
            ) : (
              <div className="avatar avatar--fallback">{profile?.username?.[0]?.toUpperCase() ?? "D"}</div>
            )}
          </div>

          <div>
            <p className="eyebrow">Developer profile</p>
            <h1 style={{ marginTop: 0, marginBottom: 8 }}>
              {loading ? "Loading your profile..." : `Hello ${profile?.username ?? "developer"} 👋`}
            </h1>
            <p className="muted">
              {profile?.bio || "Your GitHub profile powers personalized issue recommendations and skill analysis."}
            </p>
          </div>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-label">Developer score</span>
            <strong className="metric-value">{developerScore}/100</strong>
            <span className="metric-caption">Based on your strongest repositories.</span>
          </article>

          <article className="metric-card">
            <span className="metric-label">Primary stack</span>
            <strong className="metric-value">{topStack.length ? topStack.map((skill) => skill.language).join(" • ") : "Sync skills to begin"}</strong>
            <span className="metric-caption">Your most dominant languages and tools.</span>
          </article>

          <article className="metric-card">
            <span className="metric-label">Synced languages</span>
            <strong className="metric-value">{skills.length}</strong>
            <span className="metric-caption">Languages extracted from your GitHub repos.</span>
          </article>

          <article className="metric-card metric-card--accent">
            <span className="metric-label">Best next contribution</span>
            <strong className="metric-value">{estimateHours(developerScore)}</strong>
            <span className="metric-caption">Estimated time for a strong first match.</span>
          </article>
        </div>

        <div className="section-heading" style={{ marginTop: 8 }}>
          <div>
            <p className="eyebrow">Skill graph</p>
            <h2>Your developer DNA</h2>
          </div>

          <button className="button button--ghost" type="button" onClick={handleSyncSkills} disabled={syncing}>
            {syncing ? "Syncing skills..." : "Sync skills"}
          </button>
        </div>

        <div className="bar-chart-shell panel panel--inner">
          {skills.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categories} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--accent-strong)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state empty-state--compact">
              <h3>No skills synced yet</h3>
              <p>Use the sync button to import your GitHub languages and populate the dashboard.</p>
            </div>
          )}
        </div>
      </section>

      <aside className="sidebar-stack">
        <section className="panel panel--inner">
          <div className="section-heading section-heading--tight">
            <div>
              <p className="eyebrow">Recommendation preview</p>
              <h2>Recommended for you</h2>
            </div>
          </div>

          {loading && <p className="muted">Loading recommendations...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && recommendations.length === 0 && (
            <div className="empty-state empty-state--compact">
              <h3>No matches yet</h3>
              <p>Sync issues and skills, then the model will have something to rank.</p>
            </div>
          )}

          <div className="stack-list">
            {recommendations.map((issue) => (
              <article className="stack-list-item" key={issue.id}>
                <div className="stack-list-item__top">
                  <strong>{issue.title}</strong>
                  <span className="pill">{issue.matchScore}%</span>
                </div>
                <p className="muted">{issue.repository?.owner}/{issue.repository?.name}</p>
                <p className="muted">{issue.matchReasons[0] || "Matches your current profile."}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel--inner">
          <div className="section-heading section-heading--tight">
            <div>
              <p className="eyebrow">Skill summary</p>
              <h2>Top languages</h2>
            </div>
          </div>

          <div className="skill-stack">
            {topStack.map((skill) => (
              <div className="skill-row" key={skill.language}>
                <div className="skill-row__labels">
                  <span>{skill.language}</span>
                  <span>{skill.score}%</span>
                </div>
                <div className="skill-row__bar">
                  <span style={{ width: `${skill.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}

