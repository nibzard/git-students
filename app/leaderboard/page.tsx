"use client";

import { useEffect, useState } from "react";

type LeaderboardEntry = {
  id: string;
  email: string;
  score: number;
  totalTimeMs: number;
  grade: number;
  controlCorrectCount?: number;
  controlAllCorrect?: boolean;
};

type LeaderboardResponse = {
  grade: number | null;
  leaderboard: LeaderboardEntry[];
  controlTotal?: number;
};

const formatTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [controlTotal, setControlTotal] = useState<number>(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/leaderboard");
        if (!response.ok) return;
        const data = (await response.json()) as LeaderboardResponse;
        if (active) {
          setLeaderboard(data.leaderboard ?? []);
          setControlTotal(data.controlTotal ?? 0);
        }
      } catch {
        // ignore
      }
    };
    void load();
    const interval = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main>
      <header>
        <h1>Leaderboard</h1>
        <p>Top 10 results (updates every 10 seconds).</p>
      </header>
      <section className="card">
        {leaderboard.length === 0 ? (
          <p>No results yet.</p>
        ) : (
          <ol className="result-list">
            {leaderboard.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.email}</strong> — {entry.score} pts — {formatTime(entry.totalTimeMs)} — Grade {entry.grade}
                {controlTotal > 0 && (
                  <span>
                    {" "}- Control {entry.controlCorrectCount ?? 0}/{controlTotal}
                    {entry.controlAllCorrect ? " ✓" : ""}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
        <div className="footer-actions">
          <a className="option" href="/">Back to quiz</a>
        </div>
      </section>
    </main>
  );
}
