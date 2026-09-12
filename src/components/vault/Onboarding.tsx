import { useStudent } from "@/lib/student/store";
import { BookMarked, FlaskConical, Search, Sparkles } from "lucide-react";
import { useState } from "react";

const STEPS = [
  {
    title: "Your Class 10 chemistry vault",
    body: "Reactions, colours, definitions, exam notes and a full quiz bank — written in NCERT language, designed like a premium study instrument.",
    icon: FlaskConical,
  },
  {
    title: "Find anything in a second",
    body: "Search HCl, hydrochloric acid, or just “acid”. Aliases, formulae, colours and questions all live in one index. Press ⌘K anywhere.",
    icon: Search,
  },
  {
    title: "Mark it. Master it.",
    body: "Toggle Learned or Needs review on every reaction. Stars, definitions and missed questions collect in My Revision.",
    icon: BookMarked,
  },
  {
    title: "Quiz like the board paper",
    body: "1-mark MCQs, assertion–reason, case-based, timed mode, a full exam simulation and an adaptive engine that targets your weakest chapter.",
    icon: Sparkles,
  },
];

export function Onboarding() {
  const done = useStudent((s) => s.onboardingDone);
  const hydrated = useStudent((s) => s.hydrated);
  const finish = useStudent((s) => s.finishOnboarding);
  const [i, setI] = useState(0);

  if (!hydrated || done) return null;
  const step = STEPS[i]!;
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-bg/70 p-4 backdrop-blur-md sm:place-items-center">
      <div className="modal-enter glass w-full max-w-md rounded-[1.5rem] p-6 shadow-[0_40px_90px_-20px_rgb(0_0_0/0.7)] sm:p-7">
        <div className="grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/12">
          <Icon className="size-5 text-primary" />
        </div>
        <p className="mt-5 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-gold">
          Step {i + 1} / {STEPS.length}
        </p>
        <h2 className="mt-2 font-display text-[1.65rem] leading-snug text-fg">{step.title}</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">{step.body}</p>
        <div className="mt-6 flex gap-1.5">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                idx <= i ? "bg-gradient-to-r from-primary to-gold" : "bg-border"
              }`}
            />
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={() => finish()} className="btn btn-ghost h-11 flex-1">
            Skip
          </button>
          <button
            type="button"
            onClick={() => {
              if (i + 1 >= STEPS.length) finish();
              else setI((n) => n + 1);
            }}
            className="btn btn-primary h-11 flex-[1.4]"
          >
            {i + 1 >= STEPS.length ? "Enter the vault" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
