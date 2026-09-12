import { useStudent } from "@/lib/student/store";
import { overallMastery } from "@/lib/mastery";
import { useMemo } from "react";
import {
  Beaker,
  BookOpen,
  FlaskConical,
  GraduationCap,
  LayoutGrid,
  Lightbulb,
  MessageCircle,
  Palette,
  RotateCcw,
  TestTubes,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

export type Section =
  | "overview"
  | "reactions"
  | "colours"
  | "lab"
  | "simulator"
  | "definitions"
  | "notes"
  | "quiz"
  | "revision"
  | "ai"
  | "credits";

type NavEntry = { id: Section; label: string; icon: ReactNode; hint?: string };
type NavGroup = { label: string; items: NavEntry[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Library",
    items: [
      { id: "overview", label: "Overview", icon: <LayoutGrid className="size-[1.05rem]" /> },
      { id: "reactions", label: "Reactions", icon: <FlaskConical className="size-[1.05rem]" /> },
      { id: "colours", label: "Colour Atlas", icon: <Palette className="size-[1.05rem]" /> },
      { id: "lab", label: "Lab Bench", icon: <TestTubes className="size-[1.05rem]" /> },
      { id: "simulator", label: "Virtual Lab", icon: <Beaker className="size-[1.05rem]" /> },
      { id: "definitions", label: "Definitions", icon: <BookOpen className="size-[1.05rem]" /> },
      { id: "notes", label: "Exam Notes", icon: <Lightbulb className="size-[1.05rem]" /> },
    ],
  },
  {
    label: "Practice",
    items: [
      { id: "quiz", label: "Quiz Arena", icon: <GraduationCap className="size-[1.05rem]" /> },
      { id: "revision", label: "My Revision", icon: <RotateCcw className="size-[1.05rem]" /> },
      { id: "ai", label: "Ask AI", icon: <MessageCircle className="size-[1.05rem]" /> },
    ],
  },
  {
    label: "More",
    items: [{ id: "credits", label: "Credits", icon: <Users className="size-[1.05rem]" /> }],
  },
];


export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="relative grid size-10 shrink-0 place-items-center rounded-[0.85rem] border border-primary/30 bg-gradient-to-br from-primary/25 via-primary/10 to-gold/15 shadow-[0_8px_22px_-8px_rgb(47_212_192/0.5)]">
        <svg viewBox="0 0 24 24" fill="none" className="size-5">
          <path
            d="M9.5 3h5M10.5 3v5.2c0 .9-3 3.4-3 7.3a4.5 4.5 0 0 0 9 0c0-3.9-3-6.4-3-7.3V3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="text-primary"
          />
          <path d="M8 13.6c2.4 1.4 5.6 1.4 8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-gold" />
        </svg>
        <span className="pulse-dot absolute -right-0.5 -top-0.5 size-2 rounded-full bg-gold shadow-[0_0_8px_2px_rgb(226_194_132/0.5)]" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="wordmark block font-display text-[1.35rem] font-semibold tracking-tight">
            ChemVault 10
          </span>
          <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-muted">
            CBSE · Class 10
          </span>
        </span>
      )}
    </span>
  );
}

export function Sidebar({
  section,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  footer,
}: {
  section: Section;
  onNavigate: (id: Section) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  footer?: ReactNode;
}) {
  const streak = useStudent((s) => s.streak);
  const stars = useStudent((s) => s.stars);
  const mastery = useStudent((s) => s.mastery);
  const quizLog = useStudent((s) => s.quizLog);

  const overall = useMemo(
    () =>
      overallMastery({
        v: 1,
        updatedAt: 0,
        theme: "dark",
        onboardingDone: true,
        stars,
        bookDefs: [],
        bookNotes: [],
        bookQuiz: [],
        mastery,
        quizLog,
        streak,
      }),
    [mastery, quizLog, stars, streak],
  );

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <BrandMark />
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
          className="grid size-9 place-items-center rounded-xl border border-border text-muted transition-colors hover:text-fg lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-2.5 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            <div className="relative grid gap-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={section === item.id ? "true" : undefined}
                  className={`nav-item ${section === item.id ? "on" : ""}`}
                >
                  <span className={section === item.id ? "text-primary" : "text-muted"}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {section === item.id && (
                    <svg viewBox="0 0 8 8" className="size-1.5 text-gold" fill="currentColor" aria-hidden>
                      <circle cx="4" cy="4" r="4" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/70 px-4 py-4">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-bg/60 px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted">Mastery</p>
            <p className="tabular font-display text-xl leading-tight text-fg">{overall}%</p>
          </div>
          <div className="text-right">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted">Streak</p>
            <p className="tabular font-display text-xl leading-tight text-primary">
              {streak.count}
              <span className="ml-0.5 text-[0.65rem] font-sans font-medium text-muted">d</span>
            </p>
          </div>
        </div>
        {footer ? <div className="mt-3 flex items-center justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-border/70 bg-surface/70 backdrop-blur-2xl lg:block">
        {body}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[55] lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={onCloseMobile}
          className={`absolute inset-0 bg-bg/70 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-[290px] max-w-[86vw] border-r border-border bg-surface shadow-[0_0_80px_rgb(0_0_0/0.6)] transition-transform duration-300 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {body}
        </aside>
      </div>
    </>
  );
}
