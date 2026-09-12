import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  EMPTY_STUDENT,
  bumpStreak,
  mergePayload,
  type MasteryFlag,
  type QuizLogEntry,
  type StudentPayload,
  type ThemeName,
} from "@/lib/student/types";

const OLD_STAR_KEY = "chemvault-stars";

function readLegacyStars(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(OLD_STAR_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

type StudentStore = StudentPayload & {
  hydrated: boolean;
  markHydrated: () => void;
  applyRemote: (remote: StudentPayload) => void;
  setTheme: (theme: ThemeName) => void;
  finishOnboarding: () => void;
  toggleStar: (key: string) => void;
  toggleBook: (kind: "def" | "note" | "quiz", key: string) => void;
  setMastery: (key: string, flag: MasteryFlag) => void;
  cycleMastery: (key: string) => void;
  recordQuiz: (entry: QuizLogEntry) => void;
  snapshot: () => StudentPayload;
};

function touch(s: StudentPayload): StudentPayload {
  return { ...s, updatedAt: Date.now() };
}

function toggleIn(list: string[], key: string): string[] {
  return list.includes(key) ? list.filter((x) => x !== key) : [...list, key];
}

export const useStudent = create<StudentStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_STUDENT,
      hydrated: false,
      markHydrated: () => {
        const legacy = readLegacyStars();
        if (legacy.length && get().stars.length === 0) {
          set({ stars: legacy, hydrated: true, updatedAt: Date.now() });
          return;
        }
        set({ hydrated: true });
      },
      applyRemote: (remote) => {
        const merged = mergePayload(get().snapshot(), remote);
        set({ ...merged, hydrated: true });
      },
      setTheme: (theme) => set(touch({ ...get().snapshot(), theme })),
      finishOnboarding: () => set(touch({ ...get().snapshot(), onboardingDone: true })),
      toggleStar: (key) => set(touch({ ...get().snapshot(), stars: toggleIn(get().stars, key) })),
      toggleBook: (kind, key) => {
        const snap = get().snapshot();
        if (kind === "def") set(touch({ ...snap, bookDefs: toggleIn(snap.bookDefs, key) }));
        else if (kind === "note") set(touch({ ...snap, bookNotes: toggleIn(snap.bookNotes, key) }));
        else set(touch({ ...snap, bookQuiz: toggleIn(snap.bookQuiz, key) }));
      },
      setMastery: (key, flag) =>
        set(touch({ ...get().snapshot(), mastery: { ...get().mastery, [key]: flag } })),
      cycleMastery: (key) => {
        const cur = get().mastery[key] ?? "unset";
        const next: MasteryFlag = cur === "unset" ? "learned" : cur === "learned" ? "review" : "unset";
        set(touch({ ...get().snapshot(), mastery: { ...get().mastery, [key]: next } }));
      },
      recordQuiz: (entry) => {
        const snap = get().snapshot();
        set(
          touch({
            ...snap,
            quizLog: [...snap.quizLog, entry].slice(-80),
            streak: bumpStreak(snap.streak),
          }),
        );
      },
      snapshot: () => {
        const s = get();
        return {
          v: 1,
          updatedAt: s.updatedAt,
          theme: s.theme,
          onboardingDone: s.onboardingDone,
          stars: s.stars,
          bookDefs: s.bookDefs,
          bookNotes: s.bookNotes,
          bookQuiz: s.bookQuiz,
          mastery: s.mastery,
          quizLog: s.quizLog,
          streak: s.streak,
        };
      },
    }),
    {
      name: "chemvault-student",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        v: s.v,
        updatedAt: s.updatedAt,
        theme: s.theme,
        onboardingDone: s.onboardingDone,
        stars: s.stars,
        bookDefs: s.bookDefs,
        bookNotes: s.bookNotes,
        bookQuiz: s.bookQuiz,
        mastery: s.mastery,
        quizLog: s.quizLog,
        streak: s.streak,
      }),
      skipHydration: true,
    },
  ),
);
