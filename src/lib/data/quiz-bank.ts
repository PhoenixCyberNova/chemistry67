import { chapters, quizData } from "./catalogue";
import { whyFor } from "./quiz-why";
import type { ChapterId, QuizItem, QuizKind, QuizMark } from "./quiz";

export type BankItem = QuizItem & {
  id: string;
  ch: ChapterId;
  kind: QuizKind;
  mark: QuizMark;
  why: string;
  topic: "reactions" | "acids" | "metals" | "carbon";
};

const TOPIC: Record<ChapterId, BankItem["topic"]> = {
  ch1: "reactions",
  ch2: "acids",
  ch3: "metals",
  ch4: "carbon",
};

function inferKind(item: QuizItem): QuizKind {
  if (item.kind) return item.kind;
  const q = item.q.toLowerCase();
  if (q.includes("assertion") || q.startsWith("a:") || q.includes("reason (r)")) return "assertion";
  if (q.startsWith("case:") || q.includes("case:")) return "case";
  return "mcq";
}

function inferMark(item: QuizItem, kind: QuizKind): QuizMark {
  if (item.mark) return item.mark;
  if (kind === "assertion") return "2";
  if (kind === "case") return "3";
  return "1";
}

function slug(q: string): string {
  return q.slice(0, 72).replace(/\s+/g, " ").trim();
}

export const quizBank: BankItem[] = (["ch1", "ch2", "ch3", "ch4"] as ChapterId[]).flatMap((ch) =>
  quizData[ch].map((item) => {
    const kind = inferKind(item);
    return {
      ...item,
      id: `${ch}::${slug(item.q)}`,
      ch,
      kind,
      mark: inferMark(item, kind),
      why: whyFor(item.q, item.options, item.ans, item.why),
      topic: TOPIC[ch],
    };
  }),
);

export const quizByChapter = (ch: ChapterId | "mix"): BankItem[] => {
  if (ch === "mix") return quizBank;
  return quizBank.filter((q) => q.ch === ch);
};

export const quizCounts = {
  total: quizBank.length,
  mcq: quizBank.filter((q) => q.kind === "mcq").length,
  assertion: quizBank.filter((q) => q.kind === "assertion").length,
  case: quizBank.filter((q) => q.kind === "case").length,
};

export function chapterLabel(id: ChapterId | "mix"): string {
  if (id === "mix") return "Mixed";
  return chapters.find((c) => c.id === id)?.title ?? id;
}
