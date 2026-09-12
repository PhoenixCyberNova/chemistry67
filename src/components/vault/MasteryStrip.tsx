import { Reveal } from "@/components/vault/Reveal";
import { chapters } from "@/lib/data/catalogue";
import { overallMastery, topicMastery } from "@/lib/mastery";
import { useStudent } from "@/lib/student/store";
import { Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function useAnimatedValue(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function ChapterRing({ pct }: { pct: number }) {
  const r = 26;
  const C = 2 * Math.PI * r;
  const [offset, setOffset] = useState(C);
  useEffect(() => {
    const t = window.setTimeout(() => setOffset(C * (1 - pct / 100)), 120);
    return () => window.clearTimeout(t);
  }, [pct, C]);
  return (
    <div className="relative grid size-16 shrink-0 place-items-center">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-border)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.2,0,0,1)" }}
        />
      </svg>
      <span className="tabular absolute text-[0.72rem] font-bold text-fg">{pct}%</span>
    </div>
  );
}

export function MasteryStrip() {
  const mastery = useStudent((s) => s.mastery);
  const quizLog = useStudent((s) => s.quizLog);
  const streak = useStudent((s) => s.streak);
  const stars = useStudent((s) => s.stars);

  const snap = useMemo(
    () => ({
      v: 1 as const,
      updatedAt: 0,
      theme: "dark" as const,
      onboardingDone: true,
      stars,
      bookDefs: [] as string[],
      bookNotes: [] as string[],
      bookQuiz: [] as string[],
      mastery,
      quizLog,
      streak,
    }),
    [mastery, quizLog, stars, streak],
  );
  const overall = overallMastery(snap);
  const animated = useAnimatedValue(overall);

  return (
    <Reveal>
      <div className="glass rounded-[1.35rem] p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="eyebrow">Command centre</p>
            <p className="tabular mt-2 font-display text-[2.6rem] font-semibold leading-none text-fg">
              {animated}
              <span className="text-xl text-muted">%</span>
            </p>
            <p className="mt-2 max-w-md text-[0.83rem] leading-relaxed text-muted">
              Overall mastery — blended from learned reactions, review flags and recent quiz
              accuracy, computed per chapter.
            </p>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl border border-gold/30 bg-gold/8 px-4 py-3">
            <Flame className="size-5 text-gold" />
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted">Day streak</p>
              <p className="tabular font-display text-2xl leading-tight text-gold">{streak.count}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {chapters.map((ch) => {
            const m = topicMastery(ch.id, snap);
            return (
              <div
                key={ch.id}
                className="group flex items-center gap-3.5 rounded-2xl border border-border/70 bg-bg/55 p-3.5 transition-colors hover:border-primary/40"
              >
                <ChapterRing pct={m.pct} />
                <div className="min-w-0">
                  <p className="truncate font-display text-[0.95rem] text-fg">{ch.title}</p>
                  <p className="mt-0.5 text-[0.7rem] text-muted">
                    {m.learned}/{m.total} learned · quiz {m.quizPct}%
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-raised">
                    <div
                      className="bar-sweep h-full rounded-full bg-gradient-to-r from-primary to-primary-deep transition-[width] duration-700"
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
}
