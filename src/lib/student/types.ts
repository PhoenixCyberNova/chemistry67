export type MasteryFlag = "unset" | "learned" | "review";
export type ThemeName = "dark" | "light";

export type QuizLogEntry = {
  id: string;
  at: number;
  mode: string;
  ch: string;
  score: number;
  total: number;
  wrong: string[];
  durationMs: number;
};

export type StudentPayload = {
  v: 1;
  updatedAt: number;
  theme: ThemeName;
  onboardingDone: boolean;
  stars: string[];
  bookDefs: string[];
  bookNotes: string[];
  bookQuiz: string[];
  mastery: Record<string, MasteryFlag>;
  quizLog: QuizLogEntry[];
  streak: { count: number; lastDay: string };
};

export const EMPTY_STUDENT: StudentPayload = {
  v: 1,
  updatedAt: 0,
  theme: "dark",
  onboardingDone: false,
  stars: [],
  bookDefs: [],
  bookNotes: [],
  bookQuiz: [],
  mastery: {},
  quizLog: [],
  streak: { count: 0, lastDay: "" },
};

export function todayStamp(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function bumpStreak(prev: StudentPayload["streak"], day = todayStamp()): StudentPayload["streak"] {
  if (prev.lastDay === day) return prev;
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yestStamp = todayStamp(yest);
  if (prev.lastDay === yestStamp) return { count: prev.count + 1, lastDay: day };
  return { count: 1, lastDay: day };
}

export function mergePayload(a: StudentPayload, b: StudentPayload): StudentPayload {
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  const older = newer === a ? b : a;
  const mastery = { ...older.mastery, ...newer.mastery };
  const union = (x: string[], y: string[]) => [...new Set([...x, ...y])];
  const logs = [...older.quizLog, ...newer.quizLog]
    .sort((p, q) => p.at - q.at)
    .filter((row, i, arr) => arr.findIndex((r) => r.id === row.id) === i)
    .slice(-80);
  return {
    v: 1,
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
    theme: newer.theme,
    onboardingDone: a.onboardingDone || b.onboardingDone,
    stars: union(a.stars, b.stars),
    bookDefs: union(a.bookDefs, b.bookDefs),
    bookNotes: union(a.bookNotes, b.bookNotes),
    bookQuiz: union(a.bookQuiz, b.bookQuiz),
    mastery,
    quizLog: logs,
    streak:
      a.streak.count > b.streak.count || (a.streak.count === b.streak.count && a.streak.lastDay >= b.streak.lastDay)
        ? a.streak
        : b.streak,
  };
}
