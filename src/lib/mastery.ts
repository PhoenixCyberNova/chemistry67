import { reactions } from "@/lib/data/catalogue";
import { quizBank } from "@/lib/data/quiz-bank";
import { reactionKey } from "@/lib/reaction-filters";
import type { ChapterId } from "@/lib/data/quiz";
import type { StudentPayload } from "@/lib/student/types";

export type TopicId = ChapterId;

export function topicMastery(ch: TopicId, state: StudentPayload): { pct: number; learned: number; review: number; total: number; quizPct: number } {
  const rx = reactions.filter((r) => r.ch === ch);
  const learned = rx.filter((r) => state.mastery[reactionKey(r)] === "learned").length;
  const review = rx.filter((r) => state.mastery[reactionKey(r)] === "review").length;
  const rxScore = rx.length ? (learned + 0.35 * review) / rx.length : 0;

  const logs = state.quizLog.filter((l) => l.ch === ch || l.ch === "mix").slice(-6);
  const quizPct = logs.length
    ? logs.reduce((s, l) => s + (l.total ? l.score / l.total : 0), 0) / logs.length
    : 0;

  const hasSignal = learned + review + logs.length > 0;
  const pct = hasSignal ? Math.round(100 * (0.55 * rxScore + 0.45 * quizPct)) : 0;
  return { pct, learned, review, total: rx.length, quizPct: Math.round(quizPct * 100) };
}

export function overallMastery(state: StudentPayload): number {
  const parts = (["ch1", "ch2", "ch3", "ch4"] as TopicId[]).map((c) => topicMastery(c, state).pct);
  if (parts.every((p) => p === 0)) return 0;
  return Math.round(parts.reduce((a, b) => a + b, 0) / 4);
}

export function weakestChapter(state: StudentPayload): TopicId {
  let min: TopicId = "ch1";
  let val = 101;
  for (const ch of ["ch1", "ch2", "ch3", "ch4"] as TopicId[]) {
    const p = topicMastery(ch, state).pct;
    if (p < val) {
      val = p;
      min = ch;
    }
  }
  return min;
}

export function dueReviewCount(state: StudentPayload): number {
  const rx = reactions.filter((r) => state.mastery[reactionKey(r)] === "review" || state.stars.includes(reactionKey(r))).length;
  const wrong = new Set(state.quizLog.flatMap((l) => l.wrong));
  return rx + wrong.size + state.bookDefs.length + state.bookNotes.length;
}

export function wrongQuestionIds(state: StudentPayload): string[] {
  const last = [...state.quizLog].reverse();
  const ids = new Set<string>();
  for (const log of last) {
    for (const w of log.wrong) ids.add(w);
  }
  return [...ids].filter((id) => quizBank.some((q) => q.id === id));
}
