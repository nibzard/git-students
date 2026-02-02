import { NextResponse } from "next/server";
import { ensureSchema, getDbClient } from "@/lib/db";
import { controlQuestionIds, questionMap } from "@/lib/questions";
import { computeGrades } from "@/lib/grading";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";

  if (!sessionId) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  await ensureSchema();
  const db = getDbClient();

  const sessionResult = await db.execute({
    sql: "SELECT started_at, question_order FROM sessions WHERE id = ?",
    args: [sessionId],
  });

  if (sessionResult.rows.length === 0) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const startedAt = Number(sessionResult.rows[0].started_at);
  const questionOrderRaw = String(sessionResult.rows[0].question_order);
  const questionOrder: number[] = JSON.parse(questionOrderRaw);

  const answersResult = await db.execute({
    sql: "SELECT question_id, answer, correct, time_ms FROM answers WHERE session_id = ?",
    args: [sessionId],
  });

  const answersById = new Map<number, { answer: string | null; correct: number; timeMs: number }>();
  for (const row of answersResult.rows) {
    const qid = Number(row.question_id);
    answersById.set(qid, {
      answer: row.answer === null ? null : String(row.answer),
      correct: Number(row.correct),
      timeMs: Number(row.time_ms),
    });
  }

  let score = 0;
  const incorrect: Array<{
    id: number;
    text: string;
    yourAnswer: string | null;
    correctAnswer: string;
  }> = [];

  for (const qid of questionOrder) {
    const question = questionMap.get(qid);
    if (!question) continue;
    const answer = answersById.get(qid);
    if (answer?.correct === 1) {
      score += 1;
      continue;
    }
    incorrect.push({
      id: qid,
      text: question.text,
      yourAnswer: answer?.answer ?? null,
      correctAnswer: question.options[question.correctIndex],
    });
  }

  const finishedAt = Date.now();
  const totalTimeMs = Math.max(0, finishedAt - startedAt);

  await db.execute({
    sql: "UPDATE sessions SET finished_at = ?, total_time_ms = ?, score = ? WHERE id = ?",
    args: [finishedAt, totalTimeMs, score, sessionId],
  });

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

  const leaderboardWithControl = leaderboard.map((entry) => {
    const controlCorrectCount = controlMap.get(entry.id) ?? 0;
    return {
      ...entry,
      controlCorrectCount,
      controlAllCorrect: controlCorrectCount === controlQuestionIds.length,
    };
  });

  return NextResponse.json({
    score,
    totalQuestions: questionOrder.length,
    totalTimeMs,
    incorrect,
    grade: gradesById.get(sessionId) ?? null,
    leaderboard: leaderboardWithControl,
    controlTotal: controlQuestionIds.length,
  });
}
