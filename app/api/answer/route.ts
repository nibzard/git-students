import { NextResponse } from "next/server";
import { ensureSchema, getDbClient } from "@/lib/db";
import { questionMap } from "@/lib/questions";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  const questionId = Number(body?.questionId);
  const answer = typeof body?.answer === "string" ? body.answer : null;
  const timeMs = Number(body?.timeMs);

  if (!sessionId || !Number.isFinite(questionId) || !Number.isFinite(timeMs)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const question = questionMap.get(questionId);
  if (!question) {
    return NextResponse.json({ error: "Unknown question." }, { status: 400 });
  }

  await ensureSchema();
  const db = getDbClient();

  const maxTimeMs = question.timeLimitSeconds * 1000;
  const safeTimeMs = Math.max(0, Math.min(timeMs, maxTimeMs));
  const isCorrect = answer !== null && question.options[question.correctIndex] === answer ? 1 : 0;

  await db.execute({
    sql: `INSERT INTO answers (session_id, question_id, answer, time_ms, correct)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(session_id, question_id)
          DO UPDATE SET answer = excluded.answer, time_ms = excluded.time_ms, correct = excluded.correct`,
    args: [sessionId, questionId, answer, safeTimeMs, isCorrect],
  });

  return NextResponse.json({ ok: true });
}
