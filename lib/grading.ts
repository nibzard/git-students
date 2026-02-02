export type FinishedSession = {
  id: string;
  email: string;
  score: number;
  totalTimeMs: number;
};

export type LeaderboardEntry = {
  id: string;
  email: string;
  score: number;
  totalTimeMs: number;
  grade: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function computeGrades(sessions: FinishedSession[]) {
  if (sessions.length === 0) {
    return {
      bestScore: 0,
      bestTimeMs: 0,
      leaderboard: [] as LeaderboardEntry[],
      gradesById: new Map<string, number>(),
    };
  }

  const bestScore = Math.max(...sessions.map((s) => s.score));
  const bestTimeMs = Math.min(...sessions.map((s) => s.totalTimeMs));

  const gradesById = new Map<string, number>();
  const leaderboard = sessions
    .slice()
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalTimeMs - b.totalTimeMs;
    })
    .map((session) => {
      const scoreRatio = bestScore === 0 ? 0 : session.score / bestScore;
      const speedRatio = bestTimeMs === 0 ? 0 : bestTimeMs / session.totalTimeMs;
      const composite = clamp(scoreRatio * 0.85 + speedRatio * 0.15, 0, 1);

      let grade = 1;
      if (composite >= 0.9) grade = 5;
      else if (composite >= 0.8) grade = 4;
      else if (composite >= 0.7) grade = 3;
      else if (composite >= 0.6) grade = 2;

      gradesById.set(session.id, grade);

      return {
        id: session.id,
        email: session.email,
        score: session.score,
        totalTimeMs: session.totalTimeMs,
        grade,
      };
    });

  return { bestScore, bestTimeMs, leaderboard, gradesById };
}
