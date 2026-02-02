import { NextResponse } from "next/server";
import { ensureSchema, getDbClient } from "@/lib/db";
import { questions, quizConfig } from "@/lib/questions";

function isValidEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) return false;
  const [local, domain] = trimmed.split("@");
  if (!local || !domain) return false;
  return domain === quizConfig.emailDomain;
}

function shuffle<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Only @pmfst.hr emails are allowed." },
      { status: 400 }
    );
  }

  await ensureSchema();
  const db = getDbClient();

  const normalizedEmail = email.trim().toLowerCase();
  const finishedSession = await db.execute({
    sql: "SELECT id FROM sessions WHERE email = ? AND finished_at IS NOT NULL LIMIT 1",
    args: [normalizedEmail],
  });
  if (finishedSession.rows.length > 0) {
    return NextResponse.json(
      { error: "This email already completed the test." },
      { status: 403 }
    );
  }

  const existingSession = await db.execute({
    sql: "SELECT id, started_at, question_order FROM sessions WHERE email = ? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1",
    args: [normalizedEmail],
  });

  let sessionId: string;
  let startedAt: number;
  let questionOrder: number[];
  let answeredIds: number[] = [];

  if (existingSession.rows.length > 0) {
    sessionId = String(existingSession.rows[0].id);
    startedAt = Number(existingSession.rows[0].started_at);
    questionOrder = JSON.parse(String(existingSession.rows[0].question_order));

    const answersResult = await db.execute({
      sql: "SELECT question_id FROM answers WHERE session_id = ?",
      args: [sessionId],
    });
    answeredIds = answersResult.rows.map((row) => Number(row.question_id));
  } else {
    questionOrder = shuffle(questions.map((q) => q.id));
    sessionId = crypto.randomUUID();
    startedAt = Date.now();

    await db.execute({
      sql: "INSERT INTO sessions (id, email, started_at, question_order) VALUES (?, ?, ?, ?)",
      args: [sessionId, normalizedEmail, startedAt, JSON.stringify(questionOrder)],
    });
  }

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

  return NextResponse.json({
    sessionId,
    startedAt,
    totalTimeLimitSeconds: quizConfig.totalTimeLimitSeconds,
    questions: safeQuestions,
    answeredIds,
  });
}
