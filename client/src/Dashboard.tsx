import axios from "axios";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Skill = {
  id?: string;
  language: string;
  score: number;
};

export default function Dashboard() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get<Skill[]>("http://localhost:5000/api/users/skills", {
          withCredentials: true
        });
        setSkills(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.error || e?.message || "Failed to load skills");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section id="center">
      <div>
        <h1>Skill Graph</h1>
        {loading && <p>Loading skills...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && skills.length === 0 && (
          <p>No skills found. Try logging in again.</p>
        )}

        {!loading && !error && skills.length > 0 && (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={skills} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="language" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

