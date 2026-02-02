"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type QuizQuestion = {
  id: number;
  text: string;
  options: string[];
  timeLimitSeconds: number;
};

type StartResponse = {
  sessionId: string;
  startedAt: number;
  totalTimeLimitSeconds: number;
  questions: QuizQuestion[];
  answeredIds?: number[];
};

type FinishResponse = {
  score: number;
  totalQuestions: number;
  totalTimeMs: number;
  incorrect: Array<{ id: number; text: string; yourAnswer: string | null; correctAnswer: string }>;
  grade: number | null;
  controlTotal?: number;
  leaderboard: Array<{
    id: string;
    email: string;
    score: number;
    totalTimeMs: number;
    grade: number;
    controlCorrectCount?: number;
    controlAllCorrect?: boolean;
  }>;
};

const formatTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function HomePage() {
  const unknownOption = "I don't know";
  const shuffleOptions = (items: string[]) => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answer: string | null; timeMs: number }>>(
    {}
  );
  const [quizStart, setQuizStart] = useState<number | null>(null);
  const [questionStart, setQuestionStart] = useState<number | null>(null);
  const [totalLimitMs, setTotalLimitMs] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState<FinishResponse | null>(null);

  const autoAdvanceLock = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedSessionId = window.localStorage.getItem("quizSessionId");
    const storedEmail = window.localStorage.getItem("quizEmail");
    if (!storedSessionId) return;
    const restore = async () => {
      try {
        const response = await fetch(`/api/session?sessionId=${storedSessionId}`);
        if (!response.ok) {
          window.localStorage.removeItem("quizSessionId");
          window.localStorage.removeItem("quizEmail");
          return;
        }
        const data = (await response.json()) as StartResponse & { email?: string };
        setSessionId(data.sessionId);
        setQuestions(data.questions);
        setEmail(data.email ?? storedEmail ?? "");
        const answeredSet = new Set(data.answeredIds ?? []);
        const firstUnansweredIndex = data.questions.findIndex((q) => !answeredSet.has(q.id));
        setCurrentIndex(firstUnansweredIndex === -1 ? 0 : firstUnansweredIndex);
        setQuizStart(data.startedAt);
        setQuestionStart(Date.now());
        setTotalLimitMs(data.totalTimeLimitSeconds * 1000);
      } catch {
        // ignore
      }
    };
    void restore();
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    setQuestionStart(Date.now());
    autoAdvanceLock.current = false;
  }, [currentIndex, sessionId]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id]?.answer ?? null : null;

  const totalRemainingMs = useMemo(() => {
    if (!quizStart) return 0;
    return totalLimitMs - (now - quizStart);
  }, [now, quizStart, totalLimitMs]);

  const questionRemainingMs = useMemo(() => {
    if (!questionStart || !currentQuestion) return 0;
    return currentQuestion.timeLimitSeconds * 1000 - (now - questionStart);
  }, [now, questionStart, currentQuestion]);

  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return [...shuffleOptions(currentQuestion.options), unknownOption];
  }, [currentQuestion]);

  useEffect(() => {
    if (!sessionId || !currentQuestion) return;
    if (autoAdvanceLock.current) return;
    if (totalRemainingMs <= 0) {
      autoAdvanceLock.current = true;
      void finishQuiz();
      return;
    }
    if (questionRemainingMs <= 0) {
      autoAdvanceLock.current = true;
      void handleNext(null, true);
    }
  }, [sessionId, currentQuestion, questionRemainingMs, totalRemainingMs]);

  const startQuiz = async (emailOverride?: string) => {
    setError(null);
    setLoading(true);
    try {
      const emailToUse = emailOverride ?? email;
      const response = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse }),
      });
      const data = (await response.json()) as StartResponse & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to start quiz.");
        return;
      }
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("quizSessionId", data.sessionId);
        window.localStorage.setItem("quizEmail", emailToUse.trim().toLowerCase());
      }
      const answeredSet = new Set(data.answeredIds ?? []);
      const firstUnansweredIndex = data.questions.findIndex((q) => !answeredSet.has(q.id));
      if (firstUnansweredIndex === -1) {
        setCurrentIndex(0);
        setQuizStart(data.startedAt);
        setTotalLimitMs(data.totalTimeLimitSeconds * 1000);
        await finishQuiz();
        return;
      }
      setCurrentIndex(firstUnansweredIndex);
      setQuizStart(data.startedAt);
      setQuestionStart(Date.now());
      setTotalLimitMs(data.totalTimeLimitSeconds * 1000);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer: string | null, timeMs: number) => {
    if (!sessionId || !currentQuestion) return;
    try {
      await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          answer,
          timeMs,
        }),
      });
    } catch {
      // Ignore client-side submit errors; quiz can still continue.
    }
  };

  const recordAndSubmit = async (answerOverride?: string | null) => {
    if (!currentQuestion || !questionStart) return;
    const answer = answerOverride !== undefined ? answerOverride : currentAnswer;
    const previousTime = answers[currentQuestion.id]?.timeMs ?? 0;
    const timeMs = previousTime + (Date.now() - questionStart);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { answer: answer ?? null, timeMs },
    }));
    await submitAnswer(answer ?? null, timeMs);
  };

  const handleNext = async (answerOverride?: string | null, timedOut?: boolean) => {
    if (!currentQuestion || !sessionId || !questionStart) return;
    await recordAndSubmit(answerOverride);

    if (currentIndex + 1 >= questions.length || timedOut) {
      if (currentIndex + 1 >= questions.length) {
        await finishQuiz();
      } else if (timedOut) {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= questions.length) {
          await finishQuiz();
        } else {
          setCurrentIndex(nextIndex);
        }
      }
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const finishQuiz = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch("/api/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await response.json()) as FinishResponse & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to finish quiz.");
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("quizSessionId");
        window.localStorage.removeItem("quizEmail");
      }
      setResult(data);
    } catch {
      setError("Network error while finishing.");
    }
  };

  useEffect(() => {
    if (!result || !sessionId) return;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/leaderboard?sessionId=${sessionId}`);
        if (!response.ok) return;
        const data = (await response.json()) as {
          grade: number | null;
          leaderboard: FinishResponse["leaderboard"];
          controlTotal?: number;
        };
        setResult((prev) =>
          prev
            ? {
                ...prev,
                grade: data.grade ?? prev.grade,
                leaderboard: data.leaderboard ?? prev.leaderboard,
                controlTotal: data.controlTotal ?? prev.controlTotal,
              }
            : prev
        );
      } catch {
        // Ignore refresh errors.
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [result, sessionId]);

  const resetAll = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("quizSessionId");
      window.localStorage.removeItem("quizEmail");
    }
    setEmail("");
    setError(null);
    setLoading(false);
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setQuizStart(null);
    setQuestionStart(null);
    setTotalLimitMs(0);
    setResult(null);
  };


  if (result) {
    return (
      <main>
        <header>
          <h1>Results</h1>
          <p>Score: {result.score} / {result.totalQuestions}</p>
          <p>Total time: {formatTime(result.totalTimeMs)}</p>
          <p>Grade: {result.grade ?? "-"}</p>
        </header>
        <section className="card">
          {result.incorrect.length === 0 ? (
            <p>All answers correct. Great job!</p>
          ) : (
            <>
              <p>Incorrect answers:</p>
              <ol className="result-list">
                {result.incorrect.map((item) => (
                  <li key={item.id}>
                    <strong>{item.text}</strong>
                    <div>Your answer: {item.yourAnswer ?? "(no answer)"}</div>
                    <div>Correct answer: {item.correctAnswer}</div>
                  </li>
                ))}
              </ol>
            </>
          )}
          <div className="footer-actions">
            <a className="option" href="/leaderboard">View leaderboard</a>
            <button type="button" onClick={resetAll}>Log in with a different email</button>
          </div>
        </section>
      </main>
    );
  }

  if (!sessionId) {
    return (
      <main>
        <header>
          <h1>Git &amp; GitHub Basics Test</h1>
          <p>Only students with @pmfst.hr emails can take the test.</p>
        </header>
        <section className="card">
          <div className="field">
            <label htmlFor="email">Student email</label>
            <input
              id="email"
              type="email"
              placeholder="name@pmfst.hr"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          {error && <p className="notice">{error}</p>}
          <button type="button" onClick={() => void startQuiz()} disabled={loading || email.trim() === ""}>
            {loading ? "Starting..." : "Start quiz"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main>
      <header>
        <h1>Git &amp; GitHub Basics Test</h1>
        <p>Answer each question before the timer runs out.</p>
      </header>
      <section className="card">
        <div className="timer">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>Total remaining: {formatTime(totalRemainingMs)}</span>
          <span>Question remaining: {formatTime(questionRemainingMs)}</span>
        </div>
        {error && <p className="notice">{error}</p>}
        {currentQuestion ? (
          <>
            <h2>{currentQuestion.text}</h2>
            <div className="options">
              {shuffledOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`option ${currentAnswer === option ? "selected" : ""}`}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: {
                        answer: option,
                        timeMs: prev[currentQuestion.id]?.timeMs ?? 0,
                      },
                    }))
                  }
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="footer-actions">
              <button type="button" onClick={() => handleNext()} disabled={currentAnswer === null}>
                {currentIndex + 1 === questions.length ? "Finish" : "Next"}
              </button>
            </div>
          </>
        ) : (
          <p>Loading question...</p>
        )}
      </section>
    </main>
  );
}
