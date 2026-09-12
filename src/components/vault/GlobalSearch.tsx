import { searchVault, type SearchHit } from "@/lib/vault-search";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CornerDownLeft,
  FlaskConical,
  Lightbulb,
  Palette,
  GraduationCap,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const KIND_META: Record<SearchHit["kind"], { label: string; icon: typeof Search }> = {
  reaction: { label: "Reaction", icon: FlaskConical },
  colour: { label: "Colour", icon: Palette },
  definition: { label: "Definition", icon: BookOpen },
  note: { label: "Note", icon: Lightbulb },
  quiz: { label: "Question", icon: GraduationCap },
  chapter: { label: "Chapter", icon: BookOpen },
};

export function GlobalSearch({
  open,
  query,
  onQuery,
  onClose,
  onPick,
}: {
  open: boolean;
  query: string;
  onQuery: (v: string) => void;
  onClose: () => void;
  onPick: (hit: SearchHit) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursor, setCursor] = useState(0);
  const hits = useMemo(() => searchVault(query, 18), [query]);

  useEffect(() => {
    if (open) {
      setCursor(0);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, hits.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (e.key === "Enter" && hits[cursor]) {
        e.preventDefault();
        onPick(hits[cursor]!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, hits, cursor, onPick]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-bg/70 p-3 pt-[10vh] backdrop-blur-md">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close search" onClick={onClose} />
      <div className="modal-enter glass relative w-full max-w-xl overflow-hidden rounded-[1.35rem] shadow-[0_40px_90px_-20px_rgb(0_0_0/0.7)]">
        <label className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-primary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search reactions, HCl, colours, notes, questions…"
            className="h-14 min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
          <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-[0.6rem] text-muted sm:block">
            ESC
          </kbd>
        </label>
        <div className="max-h-[min(26rem,52vh)] overflow-y-auto p-2">
          {query.trim() && hits.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted">
              No matches. Try a formula or an alias.
            </p>
          ) : (
            hits.map((hit, idx) => {
              const meta = KIND_META[hit.kind]!;
              const Icon = meta.icon;
              return (
                <button
                  key={`${hit.kind}-${hit.id}`}
                  type="button"
                  onClick={() => onPick(hit)}
                  onMouseEnter={() => setCursor(idx)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    idx === cursor ? "bg-primary/10" : "hover:bg-raised/60",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border",
                      idx === cursor
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border text-muted",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-[0.62rem] font-bold uppercase tracking-[0.18em]",
                        idx === cursor ? "text-primary" : "text-muted",
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-medium text-fg">{hit.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{hit.snippet}</span>
                  </span>
                  {idx === cursor && (
                    <kbd className="mt-1 hidden shrink-0 items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 font-mono text-[0.6rem] text-muted sm:flex">
                      <CornerDownLeft className="size-2.5" />
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>
        <p className="border-t border-border px-4 py-2.5 text-[0.68rem] text-muted">
          Aliases work: HCl · blue vitriol · POP · gypsum — navigate with ↑ ↓ and open with ↵
        </p>
      </div>
    </div>
  );
}
