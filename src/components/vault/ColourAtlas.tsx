import { ColorChips } from "@/components/vault/ColorChips";
import { Reveal } from "@/components/vault/Reveal";
import { colours } from "@/lib/data/catalogue";
import { cn } from "@/lib/utils";
import { LayoutGrid, Rows3, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type ColourRow = (typeof colours)[number];

const FAMILIES = [
  "Clear",
  "White",
  "Grey",
  "Black",
  "Red",
  "Orange",
  "Brown",
  "Yellow",
  "Green",
  "Blue",
  "Purple",
  "Pink",
] as const;
type Family = (typeof FAMILIES)[number];

const FAMILY_DOT: Record<Family, string> = {
  Clear: "#e2e8f0",
  White: "#f8fafc",
  Grey: "#94a3b8",
  Black: "#111827",
  Red: "#ef4444",
  Orange: "#f97316",
  Brown: "#92400e",
  Yellow: "#eab308",
  Green: "#22c55e",
  Blue: "#3b82f6",
  Purple: "#8b5cf6",
  Pink: "#f472b6",
};

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s, l };
}

/** Classify from the written appearance first — exam colour beats the swatch hex. */
function familyFromText(colour: string): Family | null {
  const t = colour;
  if (/colourless|colorless/i.test(t) && !/\bwhite\b|\bmilky\b/i.test(t)) return "Clear";
  if (/\bmilky\b/i.test(t) && /colourless|colorless/i.test(t)) return "White";

  const phrases: [RegExp, Family][] = [
    [/bluish[-\s]?green|greenish[-\s]?blue/i, "Green"],
    [/greenish[-\s]?yellow|yellowish[-\s]?green/i, "Yellow"],
    [/yellowish[-\s]?white/i, "White"],
    [/bluish[-\s]?white/i, "Grey"],
    [/silvery[-\s]?white/i, "Grey"],
    [/reddish[-\s]?brown|yellowish[-\s]?brown/i, "Brown"],
  ];
  for (const [re, fam] of phrases) {
    if (re.test(t)) return fam;
  }

  const words: [RegExp, Family][] = [
    [/\bpink\b/i, "Pink"],
    [/\bpurple\b|\bviolet\b/i, "Purple"],
    [/\borange\b/i, "Orange"],
    [/\bbrown\b/i, "Brown"],
    [/\bblack\b/i, "Black"],
    [/\bgrey\b|\bgray\b/i, "Grey"],
    [/\bgreen\b/i, "Green"],
    [/\byellow\b/i, "Yellow"],
    [/\bred\b/i, "Red"],
    [/\bblue\b/i, "Blue"],
    [/\bwhite\b|\bmilky\b/i, "White"],
  ];
  let best: { idx: number; fam: Family } | null = null;
  for (const [re, fam] of words) {
    const m = re.exec(t);
    if (!m) continue;
    if (!best || m.index < best.idx) best = { idx: m.index, fam };
  }
  return best?.fam ?? null;
}

function familyFromSwatch(swatch: string): Family {
  const { h, s, l } = hexToHsl(swatch);
  // #f8fafc and similar "white" hexes are slightly blue-tinted (high L, moderate S, hue ~210).
  // Treat washed-out near-white as White, not Blue.
  if (l >= 0.9 || (l >= 0.82 && s < 0.5)) return "White";
  if (s < 0.14) {
    if (l >= 0.82) return "White";
    if (l <= 0.22) return "Black";
    return "Grey";
  }
  if (h >= 345 || h < 12) return "Red";
  if (h < 40) return l < 0.5 ? "Brown" : "Orange";
  if (h < 66) return "Yellow";
  if (h < 168) return "Green";
  if (h < 200) return "Green";
  if (h < 258) return "Blue";
  if (h < 300) return "Purple";
  return "Pink";
}

function familyOf(row: ColourRow): Family {
  return familyFromText(row.colour) ?? familyFromSwatch(row.swatch);
}

function luminance(hex: string): number {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const chan = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * chan[0]! + 0.7152 * chan[1]! + 0.0722 * chan[2]!;
}

function SwatchCard({ row, index }: { row: ColourRow; index: number }) {
  const family = familyOf(row);
  const onSwatch = luminance(row.swatch) > 0.45;
  return (
    <Reveal delay={Math.min(index, 8) * 45} className="h-full">
      <article className="swatch-card glass glass-hover group flex h-full flex-col overflow-hidden rounded-[1.15rem]">
        <div className="relative h-[7.5rem] shrink-0 overflow-hidden">
          <div
            className="swatch-zoom absolute inset-0"
            style={{ background: row.swatch }}
          >
            <div className="swatch-gloss absolute inset-0" />
          </div>
          <span
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] backdrop-blur-md"
            style={{
              background: onSwatch ? "rgb(0 0 0 / 0.32)" : "rgb(255 255 255 / 0.22)",
              color: onSwatch ? "rgb(255 255 255 / 0.92)" : "rgb(255 255 255 / 0.95)",
            }}
          >
            <span className="size-1.5 rounded-full" style={{ background: FAMILY_DOT[family] }} />
            {family}
          </span>
          <span
            className="eq absolute bottom-3 left-3 rounded-lg px-2.5 py-1 text-[0.78rem] font-semibold backdrop-blur-md"
            style={{
              background: onSwatch ? "rgb(0 0 0 / 0.34)" : "rgb(255 255 255 / 0.24)",
              color: onSwatch ? "rgb(255 255 255 / 0.95)" : "rgb(255 255 255 / 0.96)",
            }}
          >
            {row.formula}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-[1.05rem] leading-snug text-fg">{row.name}</h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.82rem] text-muted">
            <ColorChips text={row.colour} />
          </p>
          <div className="hairline my-3" />
          <p className="mt-auto flex gap-2 text-xs leading-relaxed text-muted">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold" />
            <span>{row.remarks}</span>
          </p>
        </div>
      </article>
    </Reveal>
  );
}

function SwatchRow({ row }: { row: ColourRow }) {
  return (
    <div className="grid grid-cols-[auto_1.4fr_1fr_2fr] items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-raised/50 sm:px-5">
      <span
        className="size-9 shrink-0 rounded-xl border border-border shadow-inner"
        style={{ background: row.swatch }}
      />
      <span className="min-w-0">
        <span className="block truncate text-fg">{row.name}</span>
        <span className="eq block text-xs text-primary">{row.formula}</span>
      </span>
      <span className="min-w-0 text-xs text-fg">
        <ColorChips text={row.colour} />
      </span>
      <span className="hidden min-w-0 truncate text-xs text-muted md:block">{row.remarks}</span>
    </div>
  );
}

export function ColourAtlas() {
  const [family, setFamily] = useState<Family | "all">("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"swatch" | "rows">("swatch");

  const counts = useMemo(() => {
    const map = new Map<Family, number>();
    for (const row of colours) {
      const f = familyOf(row);
      map.set(f, (map.get(f) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return colours.filter((row) => {
      if (family !== "all" && familyOf(row) !== family) return false;
      if (!needle) return true;
      return `${row.name} ${row.formula} ${row.colour} ${row.remarks}`.toLowerCase().includes(needle);
    });
  }, [family, q]);

  const activeFamilies = FAMILIES.filter((f) => (counts.get(f) ?? 0) > 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          Every appearance the board examiners ask for — rendered as a collector&rsquo;s swatch
          catalogue. Filter by colour family or search a formula.
        </p>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface/70 p-1">
          {(
            [
              ["swatch", "Swatches", LayoutGrid],
              ["rows", "Table", Rows3],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
                view === id ? "bg-primary/15 text-primary" : "text-muted hover:text-fg",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3">
        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search CuSO₄, white, precipitate…"
            className="input pl-10"
          />
        </label>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFamily("all")}
            className={cn("chip", family === "all" && "chip-on")}
          >
            All families
            <span className="chip-count">{colours.length}</span>
          </button>
          {activeFamilies.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFamily(family === f ? "all" : f)}
              className={cn("chip", family === f && "chip-on")}
            >
              <span className="size-2.5 rounded-full" style={{ background: FAMILY_DOT[f] }} />
              {f}
              <span className="chip-count">{counts.get(f)}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-muted">
          No colours match. Clear the search or pick another family.
        </p>
      ) : view === "swatch" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row, i) => (
            <SwatchCard key={`${row.name}|${row.formula}`} row={row} index={i} />
          ))}
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-[1.15rem]">
          <div className="grid grid-cols-[auto_1.4fr_1fr] gap-3 border-b border-border bg-raised/60 px-4 py-3 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted sm:px-5 md:grid-cols-[auto_1.4fr_1fr_2fr]">
            <span className="w-9">Swatch</span>
            <span>Compound</span>
            <span>Appearance</span>
            <span className="hidden md:block">Exam remark</span>
          </div>
          <div className="divide-y divide-border/60">
            {filtered.map((row) => (
              <SwatchRow key={`${row.name}|${row.formula}`} row={row} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
