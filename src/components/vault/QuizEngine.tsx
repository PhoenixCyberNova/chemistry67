import { chapters } from "@/lib/data/catalogue";
import { quizBank, quizByChapter, type BankItem } from "@/lib/data/quiz-bank";
import type { ChapterId, QuizKind } from "@/lib/data/quiz";
import { weakestChapter, wrongQuestionIds } from "@/lib/mastery";
import { sessionSeed, shuffle } from "@/lib/shuffle";
import { useStudent } from "@/lib/student/store";
import { cn } from "@/lib/utils";
import {
  AlarmClock,
  ArrowRight,
  BookMarked,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleX,
  Clock,
  Crosshair,
  FlaskConical,
  Gauge,
  ListChecks,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  Target,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Mode = "practice" | "timed" | "exam" | "adaptive" | "retry";
type ChSel = ChapterId | "mix";
type Phase = "setup" | "run" | "done";
type Answered = { picked: number | null; timedOut: boolean };
type Prepared = BankItem & { seed: number };

const MODE_META: Record<Mode, { label: string; desc: string; icon: typeof Play }> = {
  practice: { label: "Practice", desc: "Instant marking with a step-by-step method after each question.", icon: Play },
  timed: { label: "Timed", desc: "45 seconds per question. Trains recall speed for the real paper.", icon: Timer },
  exam: { label: "Exam sim", desc: "20 questions · 12-minute paper. Marking withheld until the end.", icon: AlarmClock },
  adaptive: { label: "Adaptive", desc: "Targets your weakest chapter automatically from quiz history.", icon: Brain },
  retry: { label: "Retry missed", desc: "Only the questions you missed or saved — perfect for the night before.", icon: RotateCcw },
};

const KIND_LABEL: Record<QuizKind, string> = {
  mcq: "MCQ",
  assertion: "Assertion–Reason",
  case: "Case-based",
};

function prepare(items: BankItem[], seed: number): Prepared[] {
  return shuffle(items, seed).map((item, idx) => {
    const order = shuffle(
      item.options.map((text, i) => ({ text, i })),
      seed + idx * 97 + 13,
    );
    return {
      ...item,
      options: order.map((o) => o.text),
      ans: order.findIndex((o) => o.i === item.ans),
      seed,
    };
  });
}

function filterBank(ch: ChSel, kind: QuizKind | "all"): BankItem[] {
  let src = quizByChapter(ch);
  if (kind !== "all") src = src.filter((q) => q.kind === kind);
  return src;
}

function studentSnapshot(s: {
  stars: string[];
  bookQuiz: string[];
  mastery: Record<string, "unset" | "learned" | "review">;
  quizLog: import("@/lib/student/types").QuizLogEntry[];
}) {
  return {
    v: 1 as const,
    updatedAt: 0,
    theme: "dark" as const,
    onboardingDone: true,
    stars: s.stars,
    bookDefs: [] as string[],
    bookNotes: [] as string[],
    bookQuiz: s.bookQuiz,
    mastery: s.mastery,
    quizLog: s.quizLog,
    streak: { count: 0, lastDay: "" },
  };
}

function ScoreRing({ pct, size = 132 }: { pct: number; size?: number }) {
  const r = 54;
  const C = 2 * Math.PI * r;
  const [offset, setOffset] = useState(C);
  useEffect(() => {
    const t = window.setTimeout(() => setOffset(C * (1 - Math.min(100, Math.max(0, pct)) / 100)), 90);
    return () => window.clearTimeout(t);
  }, [pct, C]);
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 128 128" className="size-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-border)" strokeWidth="9" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.2,0,0,1)" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3ce0cb" />
            <stop offset="60%" stopColor="#2fd4c0" />
            <stop offset="100%" stopColor="#e2c284" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="tabular font-display text-3xl font-semibold text-fg">{pct}%</p>
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted">score</p>
      </div>
    </div>
  );
}

export function QuizEngine({
  focusId,
  onConsumedFocus,
}: {
  focusId?: string;
  onConsumedFocus?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [focusMode, setFocusMode] = useState(false);
  const [ch, setCh] = useState<ChSel>("mix");
  const [mode, setMode] = useState<Mode>("practice");
  const [kind, setKind] = useState<QuizKind | "all">("all");
  const [bank, setBank] = useState<Prepared[]>([]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startedAtRef = useRef(0);
  const deadlineRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("setup");
  phaseRef.current = phase;
  const cardRef = useRef<HTMLDivElement>(null);
  const seedRef = useRef(sessionSeed());

  const stars = useStudent((s) => s.stars);
  const bookQuiz = useStudent((s) => s.bookQuiz);
  const mastery = useStudent((s) => s.mastery);
  const quizLog = useStudent((s) => s.quizLog);
  const recordQuiz = useStudent((s) => s.recordQuiz);
  const toggleBook = useStudent((s) => s.toggleBook);

  const retryIds = useMemo(() => {
    const wrong = wrongQuestionIds(studentSnapshot({ stars, bookQuiz, mastery, quizLog }));
    return [...new Set([...wrong, ...bookQuiz])];
  }, [stars, bookQuiz, mastery, quizLog]);

  const counts = useMemo(() => {
    const countFor = (c: ChSel) => {
      const src = filterBank(c, kind);
      return {
        total: src.length,
        mcq: src.filter((q) => q.kind === "mcq").length,
        assertion: src.filter((q) => q.kind === "assertion").length,
        case: src.filter((q) => q.kind === "case").length,
      };
    };
    return {
      sel: countFor(ch),
      per: Object.fromEntries((["ch1", "ch2", "ch3", "ch4"] as ChapterId[]).map((c) => [c, countFor(c)])) as Record<
        ChapterId,
        ReturnType<typeof countFor>
      >,
    };
  }, [ch, kind]);

  const q = bank[i];
  const answered = q ? answers[i] : undefined;
  const examMode = mode === "exam";
  const timedQuestion = mode === "timed";

  const score = useMemo(
    () => answers.reduce((n, a, idx) => n + (a && !a.timedOut && a.picked === bank[idx]?.ans ? 1 : 0), 0),
    [answers, bank],
  );
  const wrongIds = useMemo(
    () =>
      answers.flatMap((a, idx) => {
        if (!a) return [];
        return a.timedOut || a.picked !== bank[idx]?.ans ? [bank[idx]!.id] : [];
      }),
    [answers, bank],
  );

  /* ---------------- stats for the setup screen ---------------- */
  const stats = useMemo(() => {
    const sessions = quizLog.length;
    const acc = sessions
      ? Math.round((100 * quizLog.reduce((s, l) => s + l.score / Math.max(l.total, 1), 0)) / sessions)
      : null;
    const missed = new Set(quizLog.flatMap((l) => l.wrong)).size;
    const minutes = Math.max(1, Math.round(quizLog.reduce((s, l) => s + l.durationMs, 0) / 60000));
    return { sessions, acc, missed, minutes };
  }, [quizLog]);

  const chAccuracy = useMemo(() => {
    const map = new Map<ChapterId, number | null>();
    for (const c of ["ch1", "ch2", "ch3", "ch4"] as ChapterId[]) {
      const rows = quizLog.filter((l) => l.ch === c).slice(-6);
      map.set(
        c,
        rows.length
          ? Math.round((100 * rows.reduce((s, l) => s + l.score / Math.max(l.total, 1), 0)) / rows.length)
          : null,
      );
    }
    return map;
  }, [quizLog]);

  /* ---------------- session control ---------------- */
  const clearAdvance = () => {
    if (advanceTimerRef.current != null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  const finishRef = useRef<() => void>(() => undefined);
  const expireRef = useRef<() => void>(() => undefined);

  const startSession = (items: BankItem[], m: Mode, chapter: ChSel, focused = false) => {
    clearAdvance();
    seedRef.current = sessionSeed();
    const cap = m === "exam" ? 20 : m === "timed" ? 16 : 12;
    const sliced = shuffle(items, seedRef.current).slice(0, Math.min(cap, items.length));
    setCh(chapter);
    setMode(m);
    setBank(prepare(sliced, seedRef.current));
    setAnswers([]);
    setI(0);
    setFocusMode(focused);
    startedAtRef.current = Date.now();
    deadlineRef.current =
      m === "exam" ? Date.now() + 12 * 60 * 1000 : m === "timed" ? Date.now() + 45 * 1000 : null;
    setSecondsLeft(m === "exam" ? 12 * 60 : m === "timed" ? 45 : 0);
    setPhase("run");
  };

  const start = (chapter: ChSel, m: Mode) => {
    if (m === "retry") {
      const source = quizBank.filter((item) => retryIds.includes(item.id));
      if (!source.length) return;
      startSession(source, m, chapter);
      return;
    }
    if (m === "adaptive") {
      const weak = weakestChapter(studentSnapshot({ stars, bookQuiz, mastery, quizLog }));
      startSession(filterBank(weak, kind), m, weak);
      return;
    }
    startSession(filterBank(chapter, kind), m, chapter);
  };

  /* focused single-question session (from search / revision) */
  useEffect(() => {
    if (!focusId) return;
    const item = quizBank.find((x) => x.id === focusId);
    if (item) startSession([item], "practice", item.ch, true);
    onConsumedFocus?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const finish = () => {
    if (phaseRef.current !== "run") return;
    phaseRef.current = "done";
    clearAdvance();
    deadlineRef.current = null;
    setElapsedMs(Date.now() - startedAtRef.current);
    recordQuiz({
      id: `${Date.now()}`,
      at: Date.now(),
      mode,
      ch,
      score,
      total: bank.length,
      wrong: wrongIds,
      durationMs: Date.now() - startedAtRef.current,
    });
    setPhase("done");
  };
  finishRef.current = finish;

  const expireCurrent = () => {
    if (phaseRef.current !== "run" || !q) return;
    deadlineRef.current = null;
    setAnswers((prev) => {
      if (prev[i]) return prev;
      const next = [...prev];
      next[i] = { picked: null, timedOut: true };
      return next;
    });
  };
  expireRef.current = expireCurrent;

  /* wall-clock timer — immune to re-render churn */
  useEffect(() => {
    if (phase !== "run" || (mode !== "exam" && mode !== "timed")) return;
    const iv = window.setInterval(() => {
      const dl = deadlineRef.current;
      if (dl == null) return;
      const remain = Math.max(0, Math.round((dl - Date.now()) / 1000));
      setSecondsLeft(remain);
      if (remain <= 0) {
        if (mode === "exam") finishRef.current();
        else expireRef.current();
      }
    }, 250);
    return () => window.clearInterval(iv);
  }, [phase, mode]);

  useEffect(() => () => clearAdvance(), []);

  /* keep the active question in view when it changes */
  useEffect(() => {
    if (phase !== "run") return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 72 || r.top > window.innerHeight * 0.55) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [i, phase]);

  const goto = (idx: number) => {
    setI(idx);
    if (timedQuestion) {
      deadlineRef.current = Date.now() + 45 * 1000;
      setSecondsLeft(45);
    }
  };

  const next = () => {
    if (phaseRef.current !== "run") return;
    if (i + 1 >= bank.length) {
      finish();
      return;
    }
    goto(i + 1);
  };

  const choose = (idx: number) => {
    if (!q || answers[i]) return;
    if (timedQuestion) deadlineRef.current = null;
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = { picked: idx, timedOut: false };
      return next;
    });
    if (examMode) {
      clearAdvance();
      advanceTimerRef.current = window.setTimeout(() => {
        advanceTimerRef.current = null;
        if (phaseRef.current !== "run") return;
        if (i + 1 >= bank.length) finishRef.current();
        else goto(i + 1);
      }, 420);
    }
  };

  /* keyboard: 1-4 to answer, Enter to advance */
  useEffect(() => {
    if (phase !== "run" || examMode || !q) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length && !answers[i]) {
        choose(n - 1);
        return;
      }
      if (e.key === "Enter" && answers[i]) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, examMode, q, i, answers]);

  const clock =
    mode === "exam"
      ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`
      : timedQuestion
        ? `${secondsLeft}s`
        : null;

  const exitFocus = () => {
    setFocusMode(false);
    clearAdvance();
    deadlineRef.current = null;
    setPhase("setup");
  };

  /* ================================================================
     SETUP
  ================================================================ */
  if (phase === "setup") {
    return (
      <div className="grid gap-5">
        {stats.sessions > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["Sessions", stats.sessions, Target],
                ["Avg accuracy", stats.acc != null ? `${stats.acc}%` : "—", Gauge],
                ["Missed pool", retryIds.length ? `${retryIds.length}` : `${stats.missed}`, RotateCcw],
                ["Minutes practised", stats.minutes, Clock],
              ] as const
            ).map(([label, value, Icon]) => (
              <div key={label} className="glass rounded-2xl px-4 py-3.5">
                <p className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">
                  <Icon className="size-3.5 text-gold" />
                  {label}
                </p>
                <p className="tabular mt-1 font-display text-2xl text-fg">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="eyebrow mb-3">
            <Crosshair className="size-3.5" /> 1 · Choose your mode
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(Object.keys(MODE_META) as Mode[]).map((m) => {
              const meta = MODE_META[m]!;
              const disabled = m === "retry" && retryIds.length === 0;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={disabled}
                  onClick={() => setMode(m)}
                  className={cn("mode-card", mode === m && "on", disabled && "opacity-40")}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid size-8 place-items-center rounded-lg border",
                        mode === m
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border text-muted",
                      )}
                    >
                      <meta.icon className="size-4" />
                    </span>
                    <span className="font-display text-[1.05rem] text-fg">{meta.label}</span>
                    {mode === m && <Check className="ml-auto size-4 text-primary" />}
                  </span>
                  <span className="text-xs leading-relaxed text-muted">
                    {disabled ? "No missed questions yet — appear after your first attempt." : meta.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="eyebrow mb-3">
            <FlaskConical className="size-3.5" /> 2 · Pick the question types
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All types", quizByChapter(ch).length],
                ["mcq", "1-mark MCQ", counts.sel.mcq],
                ["assertion", "Assertion–Reason", counts.sel.assertion],
                ["case", "Case-based", counts.sel.case],
              ] as const
            ).map(([id, label, n]) => (
              <button
                key={id}
                type="button"
                disabled={id !== "all" && n === 0}
                onClick={() => setKind(id)}
                className={cn("chip", kind === id && "chip-gold-on")}
              >
                {label}
                <span className="chip-count">{n}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow mb-3">
            <ListChecks className="size-3.5" /> 3 · Select the chapter & launch
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {chapters.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCh(c.id)}
                className={cn("mode-card", ch === c.id && "on")}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[0.65rem] tracking-[0.22em] text-gold">CH {c.num}</span>
                  <span className="chip-count">{counts.per[c.id]!.total} Q</span>
                </span>
                <span className="font-display text-[1.02rem] leading-snug text-fg">{c.title}</span>
                {chAccuracy.get(c.id) != null && (
                  <span className="text-[0.7rem] font-semibold text-muted">
                    Recent accuracy <span className="tabular text-primary">{chAccuracy.get(c.id)}%</span>
                  </span>
                )}
              </button>
            ))}
            <button type="button" onClick={() => setCh("mix")} className={cn("mode-card", ch === "mix" && "on")}>
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-[0.65rem] tracking-[0.22em] text-gold">MIX</span>
                <span className="chip-count">{quizByChapter("mix").length} Q</span>
              </span>
              <span className="font-display text-[1.02rem] text-fg">Mixed set</span>
              <span className="text-xs text-muted">Full syllabus sampling across all four chapters.</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => start(ch, mode)}
            disabled={mode !== "retry" && counts.sel.total === 0}
            className="btn btn-primary h-12 px-6"
          >
            <Sparkles className="size-4" />
            Start {MODE_META[mode]!.label.toLowerCase()} quiz
            <ArrowRight className="size-4" />
          </button>
          <p className="text-xs text-muted">
            {counts.sel.total > 0
              ? `${Math.min(counts.sel.total, mode === "exam" ? 20 : mode === "timed" ? 16 : 12)} questions · shuffled every run`
              : "No questions match this combination — relax a filter."}
          </p>
        </div>
      </div>
    );
  }

  /* ================================================================
     DONE
  ================================================================ */
  if (phase === "done") {
    const pct = Math.round((score / Math.max(bank.length, 1)) * 100);
    const mins = Math.floor(elapsedMs / 60000);
    const secs = Math.floor((elapsedMs % 60000) / 1000);
    const verdict =
      pct >= 90 ? "Outstanding — board ready." : pct >= 75 ? "Strong run — polish the misses." : pct >= 50 ? "Solid base — revise the misses below." : "Rebuild from the misses below — you'll get there.";
    return (
      <div className="grid gap-5">
        <div className="glass pop-in rounded-[1.35rem] p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-9">
            <ScoreRing pct={pct} />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="eyebrow justify-center sm:justify-start">
                <Trophy className="size-3.5" /> {MODE_META[mode]!.label} · {ch === "mix" ? "Mixed set" : chapters.find((c) => c.id === ch)!.title}
              </p>
              <h3 className="mt-2 font-display text-3xl text-fg">
                <span className="tabular text-primary">{score}</span> / {bank.length} correct
              </h3>
              <p className="mt-1 text-sm text-muted">{verdict}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="chip chip-on">Time {mins}:{String(secs).padStart(2, "0")}</span>
                <span className="chip">{wrongIds.length} missed</span>
                <span className="chip">Saved to revision</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button type="button" onClick={() => startSession(bank.map(({ seed: _s, ...item }) => item), mode, ch)} className="btn btn-primary h-11 px-5">
              <Shuffle className="size-4" /> Reshuffle & retry
            </button>
            {wrongIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const missed = bank.filter((item) => wrongIds.includes(item.id)).map(({ seed: _s, ...item }) => item);
                  startSession(missed, "practice", ch);
                }}
                className="btn btn-gold h-11 px-5"
              >
                <RotateCcw className="size-4" /> Drill the {wrongIds.length} missed
              </button>
            )}
            <button type="button" onClick={() => setPhase("setup")} className="btn btn-ghost h-11 px-5">
              New session
            </button>
          </div>
        </div>

        {bank.length > 0 && (
          <div className="glass overflow-hidden rounded-[1.35rem]">
            <p className="border-b border-border px-5 py-4 font-display text-lg text-fg">Answer review</p>
            <div className="divide-y divide-border/60">
              {bank.map((item, idx) => {
                const a = answers[idx];
                const ok = a && !a.timedOut && a.picked === item.ans;
                return (
                  <details key={item.id} open={!ok} className="group">
                    <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4 transition-colors hover:bg-raised/40 [&::-webkit-details-marker]:hidden">
                      <span
                        className={cn(
                          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                          ok ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger",
                        )}
                      >
                        {ok ? <CheckCircle2 className="size-4" /> : <CircleX className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block whitespace-pre-line text-sm leading-snug text-fg">
                          {item.q.replace(/\n+/g, " ").slice(0, 160)}
                          {item.q.length > 160 ? "…" : ""}
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          {ok ? "Correct" : a?.timedOut ? "Time expired" : `Correct answer: ${item.options[item.ans]}`}
                        </span>
                      </span>
                      <ChevronDown className="mt-1 size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-5 pl-14">
                      {!ok && (
                        <p className="text-xs text-danger">
                          You chose: {a?.timedOut ? "— (ran out of time)" : a?.picked != null ? item.options[a.picked] : "—"}
                        </p>
                      )}
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{item.why}</p>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ================================================================
     RUN
  ================================================================ */
  const showFeedback = !examMode && answered != null;

  return (
    <div className="grid gap-4">
      {/* status row */}
      <div className="flex flex-wrap items-center gap-2">
        {focusMode ? (
          <span className="chip chip-gold-on">
            <Crosshair className="size-3.5" /> Focused question
          </span>
        ) : (
          <span className="chip chip-on">
            <FlaskConical className="size-3.5" /> {MODE_META[mode]!.label} · {ch === "mix" ? "Mixed" : `Ch ${chapters.find((c) => c.id === ch)!.num}`}
          </span>
        )}
        {clock && (
          <span className={cn("chip tabular gap-1.5", secondsLeft <= 10 && secondsLeft > 0 && "timer-low")}>
            <Clock className="size-3.5" />
            {clock}
          </span>
        )}
        <span className="chip tabular">
          {i + 1} / {bank.length}
        </span>
        <div className="ms-auto flex gap-2">
          {focusMode ? (
            <button type="button" onClick={exitFocus} className="btn btn-ghost h-9 px-3 text-xs">
              <X className="size-3.5" /> Exit focus
            </button>
          ) : (
            <button type="button" onClick={exitFocus} className="btn btn-ghost h-9 px-3 text-xs">
              <X className="size-3.5" /> End session
            </button>
          )}
        </div>
      </div>

      {/* segmented progress */}
      {!focusMode && (
        <div className="flex gap-1" aria-hidden>
          {bank.map((item, idx) => {
            const a = answers[idx];
            const reveal = !examMode;
            return (
              <span
                key={item.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  a
                    ? reveal
                      ? a.timedOut || a.picked !== bank[idx]!.ans
                        ? "bg-danger/70"
                        : "bg-ok/80"
                      : "bg-primary/50"
                    : idx === i
                      ? "bg-primary"
                      : "bg-border",
                )}
              />
            );
          })}
        </div>
      )}

      {/* question card */}
      <div ref={cardRef} className="glass scroll-mt-24 rounded-[1.35rem] p-5 sm:p-7">
        {q ? (
          <div key={`${q.id}-${i}`} className="q-enter">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip chip-gold-on h-7 text-[0.7rem]">{KIND_LABEL[q.kind]}</span>
              <span className="chip h-7 text-[0.7rem]">{q.mark}-mark</span>
              <span className="chip h-7 text-[0.7rem]">{chapters.find((c) => c.id === q.ch)?.title}</span>
            </div>
            <p className="mt-4 whitespace-pre-line font-display text-[clamp(1.2rem,3.2vw,1.6rem)] font-medium leading-snug text-fg">
              {q.q}
            </p>

            <div className="mt-6 grid gap-2.5">
              {q.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isPicked = answered != null && answered.picked === idx;
                const isCorrect = idx === q.ans;
                let state = "";
                if (showFeedback || (examMode && answered != null)) {
                  if (isCorrect) state = "opt-correct-state";
                  else if (isPicked) state = "opt-wrong-state opt-wrong";
                  else state = "opt-dim";
                }
                if (isPicked && isCorrect) state += " opt-correct";
                return (
                  <button
                    key={`${idx}-${opt.slice(0, 24)}`}
                    type="button"
                    disabled={answered != null}
                    onClick={() => choose(idx)}
                    aria-live={isPicked ? "polite" : undefined}
                    className={cn("opt", isPicked && state === "" && "opt-picked", state)}
                  >
                    <span className="opt-letter">{letter}</span>
                    <span className="min-w-0">{opt}</span>
                    {state.includes("opt-correct-state") && <CheckCircle2 className="ms-auto mt-0.5 size-4 shrink-0" />}
                    {state.includes("opt-wrong-state") && <CircleX className="ms-auto mt-0.5 size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {answered?.timedOut && (
              <div className="card-enter mt-5 rounded-2xl border border-danger/40 bg-danger/8 p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-danger">
                  <AlarmClock className="size-4" /> Time expired
                </p>
                <p className="mt-2 text-sm text-muted">
                  Correct answer: <span className="font-semibold text-fg">{q.options[q.ans]}</span>. Read the
                  method below — then carry it into the next one.
                </p>
              </div>
            )}

            {showFeedback && (
              <div className="card-enter mt-5 rounded-2xl border border-border bg-bg/60 p-4 sm:p-5">
                <p
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]",
                    answered && !answered.timedOut && answered.picked === q.ans ? "text-ok" : "text-gold",
                  )}
                >
                  {answered && !answered.timedOut && answered.picked === q.ans ? (
                    <>
                      <CheckCircle2 className="size-4" /> Correct
                    </>
                  ) : (
                    <>
                      <CircleX className="size-4" /> Step-by-step method
                    </>
                  )}
                </p>
                {answered && !answered.timedOut && answered.picked !== q.ans && (
                  <p className="mt-2 text-sm text-danger">
                    You chose “{answered.picked != null ? q.options[answered.picked] : "—"}”. Correct answer:{" "}
                    <span className="font-semibold text-fg">{q.options[q.ans]}</span>.
                  </p>
                )}
                <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-fg">{q.why}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleBook("quiz", q.id)}
                    className={cn("btn h-10 px-4 text-xs", bookQuiz.includes(q.id) ? "btn-gold" : "btn-ghost")}
                  >
                    <BookMarked className="size-3.5" />
                    {bookQuiz.includes(q.id) ? "Saved to revision" : "Save to revision"}
                  </button>
                  <button type="button" onClick={next} className="btn btn-primary h-10 px-5 text-xs">
                    {i + 1 >= bank.length ? "Finish & see results" : "Next question"}
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}

            {examMode && answered != null && (
              <p className="mt-5 flex items-center gap-2 text-xs text-muted">
                <span className="pulse-dot size-1.5 rounded-full bg-primary" />
                Answer locked — exam sim reveals marking at the end.
              </p>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted">This question is no longer available.</p>
        )}
      </div>

      {!examMode && answered != null && (
        <div className="flex justify-end">
          <button type="button" onClick={next} className="btn btn-primary h-11 px-6 sm:hidden">
            {i + 1 >= bank.length ? "Finish" : "Next"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
