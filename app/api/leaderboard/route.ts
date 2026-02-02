import { NextResponse } from "next/server";
import { ensureSchema, getDbClient } from "@/lib/db";
import { computeGrades } from "@/lib/grading";
import { controlQuestionIds } from "@/lib/questions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  await ensureSchema();
  const db = getDbClient();

  const sessionsResult = await db.execute({
    sql: "SELECT id, email, score, total_time_ms FROM sessions WHERE finished_at IS NOT NULL",
  });

  const sessions = sessionsResult.rows.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    score: Number(row.score ?? 0),
    totalTimeMs: Number(row.total_time_ms ?? 0),
  }));

  const { leaderboard, gradesById } = computeGrades(sessions);

  const controlMap = new Map<string, number>();
  if (controlQuestionIds.length > 0 && sessions.length > 0) {
    const placeholders = controlQuestionIds.map(() => "?").join(", ");
    const answersResult = await db.execute({
      sql: `SELECT session_id, question_id, correct FROM answers WHERE question_id IN (${placeholders})`,
      args: controlQuestionIds,
    });
    for (const row of answersResult.rows) {
      const sessionKey = String(row.session_id);
      if (Number(row.correct) === 1) {
        controlMap.set(sessionKey, (controlMap.get(sessionKey) ?? 0) + 1);
      }
    }
  }

  const grade = sessionId ? gradesById.get(sessionId) ?? null : null;
  const leaderboardWithControl = leaderboard.map((entry) => {
    const controlCorrectCount = controlMap.get(entry.id) ?? 0;
    return {
      ...entry,
      controlCorrectCount,
      controlAllCorrect: controlCorrectCount === controlQuestionIds.length,
    };
  });

  return NextResponse.json({
    grade,
    leaderboard: leaderboardWithControl.slice(0, 10),
    controlTotal: controlQuestionIds.length,
  });
}
