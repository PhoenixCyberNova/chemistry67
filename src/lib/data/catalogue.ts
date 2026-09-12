import { extraColours, extraDefs, extraNotes, extraQuiz, extraReactions } from "./extras";
import {
  moreColours,
  moreDefs,
  moreNotes,
  moreQuiz,
  moreReactions,
} from "./more";
import { plusQuiz } from "./quiz-plus";
import { notes as baseNotes } from "./notes";
import { quizData as baseQuiz } from "./quiz";
import { reactions as baseReactions } from "./reactions";
import { colours as baseColours } from "./colours";
import { definitions as baseDefs } from "./definitions";
import type { ChapterId, QuizItem } from "./quiz";

function uniqBy<T>(rows: T[], key: (row: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const k = key(row);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  return out;
}

export const reactions = uniqBy(
  [...baseReactions, ...extraReactions, ...moreReactions],
  (r) => `${r.ch}|${r.title}|${r.eq}`,
);
export const colours = uniqBy(
  [...baseColours, ...extraColours, ...moreColours],
  (c) => `${c.name}|${c.formula}`,
);
export const definitions = uniqBy([...baseDefs, ...extraDefs, ...moreDefs], (d) => d.title);
export const notes = uniqBy([...baseNotes, ...extraNotes, ...moreNotes], (n) => n.title);

function mergeQuiz(parts: QuizItem[][]): QuizItem[] {
  return uniqBy(parts.flat(), (q) => q.q);
}

export const quizData: Record<ChapterId, QuizItem[]> = {
  ch1: mergeQuiz([baseQuiz.ch1, extraQuiz.ch1, moreQuiz.ch1, plusQuiz.ch1]),
  ch2: mergeQuiz([baseQuiz.ch2, extraQuiz.ch2, moreQuiz.ch2, plusQuiz.ch2]),
  ch3: mergeQuiz([baseQuiz.ch3, extraQuiz.ch3, moreQuiz.ch3, plusQuiz.ch3]),
  ch4: mergeQuiz([baseQuiz.ch4, extraQuiz.ch4, moreQuiz.ch4, plusQuiz.ch4]),
};

export const chapters = [
  {
    id: "ch1" as const,
    num: "01",
    title: "Chemical Reactions & Equations",
    blurb: "Combination, decomposition, displacement, redox, corrosion and rancidity.",
  },
  {
    id: "ch2" as const,
    title: "Acids, Bases & Salts",
    num: "02",
    blurb: "Indicators, pH, salts, chlor-alkali, bleaching powder, POP and baking soda.",
  },
  {
    id: "ch3" as const,
    title: "Metals & Non-metals",
    num: "03",
    blurb: "Reactivity series, extraction, thermite, roasting, calcination and alloys.",
  },
  {
    id: "ch4" as const,
    title: "Carbon & its Compounds",
    num: "04",
    blurb: "Bonding, combustion, ethanol, ethanoic acid, esters, soaps and micelles.",
  },
];
