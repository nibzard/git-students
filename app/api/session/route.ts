import { NextResponse } from "next/server";
import { ensureSchema, getDbClient } from "@/lib/db";
import { questions, quizConfig } from "@/lib/questions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
  }

  await ensureSchema();
  const db = getDbClient();

  const sessionResult = await db.execute({
    sql: "SELECT id, email, started_at, finished_at, question_order FROM sessions WHERE id = ?",
    args: [sessionId],
  });

  if (sessionResult.rows.length === 0) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const row = sessionResult.rows[0];
  if (row.finished_at !== null) {
    return NextResponse.json({ error: "Session already finished." }, { status: 410 });
  }

  const questionOrder: number[] = JSON.parse(String(row.question_order));
  const safeQuestions = questionOrder.map((id) => {
    const question = questions.find((q) => q.id === id);
    if (!question) {
      throw new Error("Question not found");
    }
    return {
      id: question.id,
      text: question.text,
      options: question.options,
      timeLimitSeconds: question.timeLimitSeconds,
    };
  });

  const answersResult = await db.execute({
    sql: "SELECT question_id FROM answers WHERE session_id = ?",
    args: [sessionId],
  });

  const answeredIds = answersResult.rows.map((r) => Number(r.question_id));

  return NextResponse.json({
    sessionId,
    email: String(row.email),
    startedAt: Number(row.started_at),
    totalTimeLimitSeconds: quizConfig.totalTimeLimitSeconds,
    questions: safeQuestions,
    answeredIds,
  });
}
