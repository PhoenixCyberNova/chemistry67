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
  Scale,
  TestTubes,
  Users,
  X,
  Atom,
} from "lucide-react";
import type { ReactNode } from "react";

export type Section =
  | "overview"
  | "reactions"
  | "balancer"
  | "colours"
  | "lab"
  | "simulator"
  | "molecules"
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
      { id: "balancer", label: "Balancer", icon: <Scale className="size-[1.05rem]" /> },
      { id: "colours", label: "Colour Atlas", icon: <Palette className="size-[1.05rem]" /> },
      { id: "lab", label: "Lab Bench", icon: <TestTubes className="size-[1.05rem]" /> },
      { id: "simulator", label: "Virtual Lab", icon: <Beaker className="size-[1.05rem]" /> },
      { id: "molecules", label: "3D Molecules", icon: <Atom className="size-[1.05rem]" /> },
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
            d="M9.5 3h5M10.5 3v5.2c0 .9-.4 1.8-1.1 2.6L7 14.5c-.6.7-.9 1.5-.9 2.4 0 2.1 1.7 3.8 3.8 3.8h4.2c2.1 0 3.8-1.7 3.8-3.8 0-.9-.3-1.7-.9-2.4L14.6 10.8c-.7-.8-1.1-1.7-1.1-2.6V3"
            stroke="currentColor"
            className="text-primary"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate font-display text-base font-semibold leading-tight text-fg">
            ChemVault
          </span>
          <span className="block truncate text-[0.68rem] text-muted">Class 10 · NCERT aligned</span>
        </span>
      )}
    </span>
  );
}

export function Sidebar({
  section,
  onNavigate,
  open,
  onClose,
}: {
  section: Section;
  onNavigate: (id: Section) => void;
  open?: boolean;
  onClose?: () => void;
}) {
  const mastery = useStudent((s) => s.mastery);
  const pct = useMemo(() => overallMastery(mastery), [mastery]);

  return (
    <aside
      className={
        "sidebar-shell fixed inset-y-0 left-0 z-40 flex w-[16.5rem] flex-col border-r border-border bg-bg/95 backdrop-blur-md transition-transform lg:static lg:translate-x-0 " +
        (open ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
      }
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
        <BrandMark />
        <button
          type="button"
          className="btn btn-ghost size-9 p-0 lg:hidden"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="nav-group-label">{group.label}</p>
            <ul className="mt-1 space-y-0.5">
              {group.items.map((item) => {
                const on = section === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-nav={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose?.();
                      }}
                      className={
                        "nav-item flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors " +
                        (on ? "nav-item-on" : "text-muted hover:bg-raised/50 hover:text-fg")
                      }
                    >
                      <span className="grid size-8 place-items-center rounded-lg border border-border/70 bg-bg/40 text-primary">
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="text-[0.68rem] text-muted">Mastery</p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-[0.72rem] font-medium text-fg">{pct}% board-ready</p>
      </div>
    </aside>
  );
}
