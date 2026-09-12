import { Reveal } from "@/components/vault/Reveal";
import { ColorChips } from "@/components/vault/ColorChips";
import { cn } from "@/lib/utils";
import {
  ALLOY_METALS,
  CHEMICAL_GROUPS,
  CHEMICALS,
  LAB_DEMOS,
  LAB_REACTIONS,
  LAB_RUNTIME,
  canonicalId,
  chemById,
  chemicalsIn,
  matchAlloy,
  matchLabReaction,
  type Alloy,
  type ChemCategory,
  type LabReaction,
} from "@/data/virtualLabData";
import {
  Beaker,
  ChevronDown,
  Droplets,
  Flame,
  FlaskConical,
  Hammer,
  RotateCcw,
  Sparkles,
  Thermometer,
  X,
} from "lucide-react";
import { useId, useMemo, useState } from "react";

type Mode = "lab" | "alloy";
type Phase = "idle" | "running" | "done";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function blendColors(ids: string[], fallback = "#6ec8e8"): string {
  const hexes = ids.map((id) => chemById(id)?.color).filter((c): c is string => Boolean(c));
  if (!hexes.length) return fallback;
  let r = 0;
  let g = 0;
  let b = 0;
  for (const h of hexes) {
    const n = h.replace("#", "");
    r += parseInt(n.slice(0, 2), 16);
    g += parseInt(n.slice(2, 4), 16);
    b += parseInt(n.slice(4, 6), 16);
  }
  const k = hexes.length;
  const to = (v: number) => Math.round(v / k).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function VirtualLab() {
  const [mode, setMode] = useState<Mode>("lab");

  return (
    <section id="simulator" data-lab-runtime={LAB_RUNTIME} className="scroll-mt-24 py-12">
      <Reveal>
        <div className="mb-7">
          <p className="eyebrow">
            <Beaker className="size-3.5" />
            Chem Simulator
          </p>
          <h2 className="mt-2.5 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-tight text-fg">
            Virtual Lab
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Mix Class 10 reagents, heat the flask, or forge an alloy — every result is a board-ready
            equation, observation and NCERT note. Instant, offline, no API key.
          </p>
          <div className="hairline mt-6" />
        </div>
      </Reveal>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("lab")}
          className={cn("mode-card min-h-12 flex-1 px-4 sm:flex-none sm:min-w-[12.5rem]", mode === "lab" && "on")}
        >
          <span className="flex items-center gap-2 font-display text-base text-fg">
            <FlaskConical className="size-4 text-primary" />
            Mixing lab
          </span>
          <span className="text-[0.72rem] text-muted">Acids, metals, indicators, heat</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("alloy")}
          className={cn("mode-card min-h-12 flex-1 px-4 sm:flex-none sm:min-w-[12.5rem]", mode === "alloy" && "on")}
        >
          <span className="flex items-center gap-2 font-display text-base text-fg">
            <Hammer className="size-4 text-gold" />
            Alloy forge
          </span>
          <span className="text-[0.72rem] text-muted">Brass, bronze, steel, amalgam</span>
        </button>
      </div>

      {mode === "lab" ? <MixingLab /> : <AlloyForge />}
    </section>
  );
}

function MixingLab() {
  const [openGroup, setOpenGroup] = useState<ChemCategory | "">("metals");
  const [flask, setFlask] = useState<string[]>([]);
  const [heated, setHeated] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<LabReaction | null>(null);
  const [miss, setMiss] = useState<string | null>(null);

  const inFlask = useMemo(() => new Set(flask.map(canonicalId)), [flask]);

  const addChem = (id: string) => {
    setResult(null);
    setMiss(null);
    setPhase("idle");
    setFlask((prev) => {
      if (prev.some((x) => canonicalId(x) === canonicalId(id))) return prev;
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  };

  const removeChem = (id: string) => {
    setResult(null);
    setMiss(null);
    setPhase("idle");
    setHeated(false);
    setFlask((prev) => prev.filter((x) => x !== id));
  };

  const clearFlask = () => {
    setFlask([]);
    setHeated(false);
    setResult(null);
    setMiss(null);
    setPhase("idle");
  };

  const run = (withHeat: boolean) => {
    if (!flask.length) return;
    const charge = flask.map(canonicalId);
    const nextHeat = withHeat || heated;
    if (withHeat) setHeated(true);
    setPhase("running");
    setMiss(null);
    const delay = prefersReducedMotion() ? 0 : withHeat ? 620 : 320;
    window.setTimeout(() => {
      const hit = matchLabReaction(charge, nextHeat);
      if (hit) {
        setResult(hit);
        setMiss(null);
      } else if (charge.length < 2 && !nextHeat) {
        setResult(null);
        setMiss("Add a second reagent, or use Heat if this substance decomposes on its own.");
      } else if (charge.length < 2 && nextHeat) {
        setResult(null);
        setMiss("No thermal change is recorded for this single reagent in the Class 10 set.");
      } else {
        setResult(null);
        setMiss(
          nextHeat
            ? "No matching heated reaction in the vault. Try a listed pair — Zn + acid, CuSO₄ crystals, or limestone."
            : "No room-temperature reaction matches this mix. Check the reactivity series, or try Heat.",
        );
      }
      setPhase("done");
    }, delay);
  };

  const loadDemo = (ids: string[], heat?: boolean) => {
    setFlask(ids);
    setHeated(Boolean(heat));
    setResult(null);
    setMiss(null);
    setPhase("running");
    const delay = prefersReducedMotion() ? 0 : heat ? 620 : 280;
    window.setTimeout(() => {
      setResult(matchLabReaction(ids, Boolean(heat)));
      setMiss(null);
      setPhase("done");
    }, delay);
  };

  const liquid = result?.flaskColor ?? blendColors(flask);
  const fill = flask.length ? Math.min(0.82, 0.22 + flask.length * 0.12) : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <Reveal>
        <StoragePanel
          openGroup={openGroup}
          onToggle={(id) => setOpenGroup((g) => (g === id ? "" : id))}
          inFlask={inFlask}
          onAdd={addChem}
        />
      </Reveal>

      <div className="grid gap-4 content-start">
        <Reveal delay={60}>
          <div className="glass overflow-hidden rounded-[1.35rem]">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <div>
                <h3 className="font-display text-lg text-fg">Mixing flask</h3>
                <p className="text-[0.72rem] text-muted">
                  {flask.length ? `${flask.length} reagent${flask.length === 1 ? "" : "s"} charged` : "Empty — pick reagents from storage"}
                </p>
              </div>
              {heated && (
                <span className="chip chip-gold-on h-8 text-[0.7rem]">
                  <Flame className="size-3.5" />
                  Heated
                </span>
              )}
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-center">
              <FlaskVisual
                color={liquid}
                fill={fill}
                heated={heated || phase === "running"}
                bubbles={Boolean(result?.effects.bubbles) && phase === "done"}
                steam={Boolean(result?.effects.steam) || heated}
                flame={Boolean(result?.effects.flame) && phase === "done"}
                glow={Boolean(result?.effects.glow) || phase === "running"}
                precipitate={phase === "done" ? result?.effects.precipitate : undefined}
                analyzing={phase === "running"}
              />

              <div className="min-w-0">
                {flask.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                    Storage is on the left. Tap a chemical to charge the flask.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {flask.map((id) => {
                      const c = chemById(id);
                      if (!c) return null;
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => removeChem(id)}
                            className="chip h-9 pr-2"
                            title={`Remove ${c.name}`}
                          >
                            <span className="size-2.5 rounded-full border border-border" style={{ background: c.color }} />
                            <span className="eq text-[0.75rem]">{c.formula}</span>
                            <X className="size-3 opacity-70" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={!flask.length || phase === "running"}
                    onClick={() => run(false)}
                    data-lab-analyze
                    className="btn btn-primary col-span-2 h-11 px-3 sm:col-span-1"
                  >
                    <Sparkles className="size-4" />
                    Analyze
                  </button>
                  <button
                    type="button"
                    disabled={!flask.length || phase === "running"}
                    onClick={() => run(true)}
                    className="btn btn-gold h-11 px-3"
                  >
                    <Thermometer className="size-4" />
                    Heat
                  </button>
                  <button
                    type="button"
                    disabled={!flask.length && !result && !miss}
                    onClick={clearFlask}
                    className="btn btn-ghost h-11 px-3"
                  >
                    <RotateCcw className="size-4" />
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <DemoStrip
          mode="lab"
          onPick={(ids, heat) => loadDemo(ids, heat)}
        />

        {phase === "running" && <AnalyzingCard heated={heated} />}
        {phase === "done" && result && <ReactionResult rxn={result} heated={heated} />}
        {phase === "done" && miss && (
          <div className="glass rounded-[1.35rem] px-5 py-6 text-sm leading-relaxed text-muted" data-lab-miss>
            {miss}
          </div>
        )}
      </div>
    </div>
  );
}

function StoragePanel({
  openGroup,
  onToggle,
  inFlask,
  onAdd,
}: {
  openGroup: ChemCategory | "";
  onToggle: (id: ChemCategory) => void;
  inFlask: Set<string>;
  onAdd: (id: string) => void;
}) {
  return (
    <div className="glass overflow-hidden rounded-[1.35rem]">
      <div className="border-b border-border px-5 py-3.5">
        <h3 className="font-display text-lg text-fg">Chemical storage</h3>
        <p className="text-[0.72rem] text-muted">
          {CHEMICALS.length} Class 10 reagents · {LAB_REACTIONS.length} mixes · nine cabinets
        </p>
      </div>
      <div className="max-h-[36rem] overflow-y-auto lg:max-h-[42rem]">
        {CHEMICAL_GROUPS.map((group) => {
          const items = chemicalsIn(group.id);
          const open = openGroup === group.id;
          return (
            <div key={group.id} className="border-b border-border/60 last:border-b-0">
              <button
                type="button"
                aria-expanded={open}
                data-chem-group={group.id}
                onClick={() => onToggle(group.id)}
                className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised/40"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-bg/50 text-primary">
                  <Droplets className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-fg">{group.label}</span>
                  <span className="block truncate text-[0.7rem] text-muted">{group.blurb}</span>
                </span>
                <span className="chip-count">{items.length}</span>
                <ChevronDown className={cn("size-4 text-muted transition-transform duration-200", open && "rotate-180")} />
              </button>
              {open && (
                <div className="grid gap-1.5 px-3 pb-3 sm:grid-cols-2">
                  {items.map((c) => {
                    const on = inFlask.has(canonicalId(c.id));
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={on}
                        data-chem-id={c.id}
                        onClick={() => onAdd(c.id)}
                        title={on ? `${c.name} is in the flask` : c.hint}
                        className={cn(
                          "flex min-h-11 items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors",
                          on
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border bg-bg/40 hover:border-primary/40 hover:bg-raised/50",
                        )}
                      >
                        <span className="size-2.5 shrink-0 rounded-full border border-border" style={{ background: c.color }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.8rem] font-medium text-fg">{c.name}</span>
                          <span className="eq block truncate text-[0.68rem] text-muted">{c.formula}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FlaskVisual({
  color,
  fill,
  heated,
  bubbles,
  steam,
  flame,
  glow,
  precipitate,
  analyzing,
}: {
  color: string;
  fill: number;
  heated: boolean;
  bubbles: boolean;
  steam: boolean;
  flame: boolean;
  glow: boolean;
  precipitate?: string;
  analyzing: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const clip = `flask-clip-${uid}`;
  const liquidY = 86 + (1 - fill) * 150;
  const liquidH = fill * 150;

  return (
    <div className="relative mx-auto grid h-[280px] w-[200px] place-items-center sm:h-[300px]">
      <div
        className={cn("flask-halo absolute inset-6 rounded-full blur-2xl", (glow || heated) && "opacity-80")}
        style={{ background: heated ? "rgb(226 194 132 / 0.28)" : "rgb(47 212 192 / 0.18)" }}
      />
      {flame && <div className="flask-flame" />}
      <svg viewBox="0 0 200 280" className="relative z-[1] h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(255 255 255 / 0.22)" />
            <stop offset="45%" stopColor="rgb(255 255 255 / 0.04)" />
            <stop offset="100%" stopColor="rgb(47 212 192 / 0.08)" />
          </linearGradient>
          <clipPath id={clip}>
            <path d="M78 38 h44 v52 c0 10 6 22 22 48 18 30 28 52 28 78 0 38-26 62-72 62s-72-24-72-62c0-26 10-48 28-78 16-26 22-38 22-48 z" />
          </clipPath>
        </defs>

        {steam && (
          <g className="flask-steam" opacity="0.55">
            <path d="M92 28 c-6 -18 4 -28 0 -38" fill="none" stroke="currentColor" className="text-muted" strokeWidth="2" />
            <path d="M102 24 c-4 -16 6 -26 2 -36" fill="none" stroke="currentColor" className="text-muted" strokeWidth="2" />
            <path d="M112 28 c-5 -18 5 -28 1 -38" fill="none" stroke="currentColor" className="text-muted" strokeWidth="2" />
          </g>
        )}

        <path
          d="M74 22 h52 v14 H74 z"
          fill={`url(#${uid}-glass)`}
          stroke="color-mix(in oklab, var(--color-primary) 35%, var(--color-border))"
          strokeWidth="1.4"
        />
        <path
          d="M78 36 h44 v54 c0 10 6 22 22 48 18 30 28 52 28 78 0 40-28 64-72 64s-72-24-72-64c0-26 10-48 28-78 16-26 22-38 22-48 z"
          fill={`url(#${uid}-glass)`}
          stroke="color-mix(in oklab, var(--color-primary) 40%, var(--color-border))"
          strokeWidth="1.6"
        />

        <g clipPath={`url(#${clip})`}>
          {fill > 0 && (
            <rect
              x="28"
              y={liquidY}
              width="144"
              height={liquidH + 40}
              fill={color}
              opacity={analyzing ? 0.72 : 0.88}
              className={analyzing ? "flask-swirl" : undefined}
            />
          )}
          {precipitate && fill > 0 && (
            <rect x="40" y="228" width="120" height="22" rx="10" fill={precipitate} opacity="0.92" />
          )}
          {bubbles &&
            [0, 1, 2, 3, 4, 5].map((i) => (
              <circle
                key={i}
                className="flask-bubble"
                cx={70 + (i % 3) * 22}
                cy={200}
                r={2.2 + (i % 3)}
                fill="rgb(255 255 255 / 0.55)"
                style={{ animationDelay: `${i * 0.28}s` }}
              />
            ))}
        </g>

        <path
          d="M86 58 h10 c6 40 -6 70 -14 108"
          fill="none"
          stroke="rgb(255 255 255 / 0.28)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function AnalyzingCard({ heated }: { heated: boolean }) {
  return (
    <div className="glass rounded-[1.35rem] px-5 py-6">
      <p className="flex items-center gap-2 text-sm font-medium text-primary">
        <Sparkles className="size-4" />
        {heated ? "Applying heat and reading the flask…" : "Matching reagents against the NCERT vault…"}
      </p>
      <div className="bar-sweep mt-4 h-1.5 overflow-hidden rounded-full bg-raised" />
    </div>
  );
}

function ReactionResult({ rxn, heated }: { rxn: LabReaction; heated: boolean }) {
  return (
    <article className="glass pop-in rounded-[1.35rem] p-5 sm:p-6" data-lab-result={rxn.id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">
            <FlaskConical className="size-3.5" />
            Reaction result
          </p>
          <h3 className="mt-2 font-display text-xl text-fg">{rxn.title}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {rxn.type.split("·").map((t) => (
            <span key={t} className="chip chip-on h-8 text-[0.7rem]">
              {t.trim()}
            </span>
          ))}
          {rxn.needsHeat && (
            <span className="chip chip-gold-on h-8 text-[0.7rem]">
              <Flame className="size-3" />
              {heated ? "Heat applied" : "Needs heat"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/8 px-4 py-3">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">Balanced equation</p>
        <p className="eq mt-1.5 text-[0.95rem] leading-relaxed text-primary">{rxn.equation}</p>
        {rxn.alternates?.map((alt) => (
          <div key={alt.equation} className="mt-2 border-t border-primary/15 pt-2">
            <p className="eq text-[0.85rem] leading-relaxed text-primary/90">{alt.equation}</p>
            {alt.note ? <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">{alt.note}</p> : null}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-bg/40 px-4 py-3">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">Observation</p>
          <p className="mt-2 text-[0.86rem] leading-relaxed text-fg">
            <ColorChips text={rxn.observation} />
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-bg/40 px-4 py-3">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold">NCERT Class 10</p>
          <p className="mt-2 text-[0.86rem] leading-relaxed text-muted">{rxn.ncert}</p>
        </div>
      </div>
    </article>
  );
}

function AlloyForge() {
  const [picked, setPicked] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Alloy | null>(null);
  const [miss, setMiss] = useState<string | null>(null);

  const toggle = (id: string) => {
    setPhase("idle");
    setResult(null);
    setMiss(null);
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id]));
  };

  const clear = () => {
    setPicked([]);
    setResult(null);
    setMiss(null);
    setPhase("idle");
  };

  const forge = (ids = picked) => {
    if (ids.length < 2) return;
    setPhase("running");
    const delay = prefersReducedMotion() ? 0 : 700;
    window.setTimeout(() => {
      const hit = matchAlloy(ids);
      setResult(hit);
      setMiss(
        hit
          ? null
          : "No named Class 10 alloy for this melt. Try Cu+Zn (brass), Cu+Sn (bronze), Fe+C, Fe+Ni+Cr, Pb+Sn, or Hg + a metal.",
      );
      setPhase("done");
    }, delay);
  };

  const loadDemo = (ids: string[]) => {
    setPicked(ids);
    forge(ids);
  };

  const melt = result?.meltColor ?? blendColors(picked, "#c46a3a");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <Reveal>
        <div className="glass overflow-hidden rounded-[1.35rem]">
          <div className="border-b border-border px-5 py-3.5">
            <h3 className="font-display text-lg text-fg">Metal stock</h3>
            <p className="text-[0.72rem] text-muted">Select two or more metallic elements (carbon counts).</p>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
            {ALLOY_METALS.map((c) => {
              const on = picked.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={cn(
                    "flex min-h-12 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors",
                    on
                      ? "border-gold/55 bg-gold/12 text-gold"
                      : "border-border bg-bg/40 hover:border-gold/40",
                  )}
                >
                  <span className="size-2.5 shrink-0 rounded-full border border-border" style={{ background: c.color }} />
                  <span className="min-w-0">
                    <span className="block truncate text-[0.8rem] font-medium text-fg">{c.name}</span>
                    <span className="eq block text-[0.68rem] text-muted">{c.formula}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      <div className="grid gap-4 content-start">
        <Reveal delay={60}>
          <div className="glass overflow-hidden rounded-[1.35rem]">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <div>
                <h3 className="font-display text-lg text-fg">Crucible</h3>
                <p className="text-[0.72rem] text-muted">
                  {picked.length ? picked.map((id) => chemById(id)?.formula).join(" + ") : "Awaiting charge"}
                </p>
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-center">
              <CrucibleVisual color={melt} active={phase === "running" || Boolean(result)} empty={!picked.length} />
              <div>
                <div className="flex flex-wrap gap-2">
                  {picked.map((id) => {
                    const c = chemById(id);
                    return (
                      <button key={id} type="button" onClick={() => toggle(id)} className="chip chip-gold-on h-9 pr-2">
                        <span className="eq text-[0.75rem]">{c?.formula}</span>
                        <X className="size-3" />
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={picked.length < 2 || phase === "running"}
                    onClick={() => forge()}
                    className="btn btn-gold h-11"
                  >
                    <Hammer className="size-4" />
                    Forge alloy
                  </button>
                  <button type="button" disabled={!picked.length} onClick={clear} className="btn btn-ghost h-11">
                    <RotateCcw className="size-4" />
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <DemoStrip mode="alloy" onPick={(ids) => loadDemo(ids)} />

        {phase === "running" && (
          <div className="glass rounded-[1.35rem] px-5 py-6">
            <p className="flex items-center gap-2 text-sm font-medium text-gold">
              <Flame className="size-4" />
              Melt in progress — reading the forge card…
            </p>
            <div className="bar-sweep mt-4 h-1.5 overflow-hidden rounded-full bg-raised" />
          </div>
        )}
        {phase === "done" && result && <AlloyCard alloy={result} />}
        {phase === "done" && miss && (
          <div className="glass rounded-[1.35rem] px-5 py-6 text-sm leading-relaxed text-muted">{miss}</div>
        )}
      </div>
    </div>
  );
}

function CrucibleVisual({ color, active, empty }: { color: string; active: boolean; empty: boolean }) {
  const uid = useId().replace(/:/g, "");
  return (
    <div className="relative mx-auto grid h-[240px] w-[200px] place-items-center">
      <div
        className="absolute inset-8 rounded-full blur-2xl"
        style={{ background: active ? "rgb(226 194 132 / 0.32)" : "rgb(47 212 192 / 0.1)" }}
      />
      <svg viewBox="0 0 200 220" className="relative z-[1] h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`${uid}-melt`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={empty ? "#1a2230" : color} stopOpacity={empty ? 0.4 : 1} />
            <stop offset="100%" stopColor={empty ? "#0a0e16" : color} />
          </linearGradient>
        </defs>
        <path
          d="M40 70 h120 l-16 110 c-4 22-28 32-44 32s-40-10-44-32 z"
          fill={`url(#${uid}-melt)`}
          stroke="color-mix(in oklab, var(--color-gold) 50%, var(--color-border))"
          strokeWidth="1.8"
        />
        <ellipse
          cx="100"
          cy="70"
          rx="60"
          ry="16"
          fill={empty ? "#111725" : color}
          stroke="color-mix(in oklab, var(--color-gold) 55%, var(--color-border))"
          strokeWidth="1.6"
          opacity={empty ? 0.7 : 0.95}
        />
        {active && !empty && (
          <g className="crucible-spark">
            <circle cx="88" cy="62" r="2.2" fill="#f0d9a8" />
            <circle cx="118" cy="66" r="1.6" fill="#e2c284" />
            <circle cx="102" cy="58" r="1.4" fill="#fff6d8" />
          </g>
        )}
      </svg>
    </div>
  );
}

function AlloyCard({ alloy }: { alloy: Alloy }) {
  return (
    <article className="glass pop-in rounded-[1.35rem] p-5 sm:p-6">
      <p className="eyebrow">
        <Hammer className="size-3.5" />
        Named alloy
      </p>
      <h3 className="mt-2 font-display text-[1.65rem] text-fg">{alloy.name}</h3>
      <p className="mt-1 text-sm text-muted">{alloy.properties}</p>

      <div className="mt-4 grid gap-2">
        {alloy.composition.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="eq font-semibold text-fg">{row.label}</span>
              <span className="tabular text-muted">{row.pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-raised">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-gold"
                style={{ width: `${row.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Spec label="Hardness" value={alloy.hardness} />
        <Spec label="Corrosion" value={alloy.corrosion} />
        <Spec label="Melting" value={alloy.melting} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-bg/40 px-4 py-3">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">Applications</p>
          <p className="mt-2 text-[0.86rem] leading-relaxed text-fg">{alloy.uses}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-bg/40 px-4 py-3">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold">NCERT Class 10</p>
          <p className="mt-2 text-[0.86rem] leading-relaxed text-muted">{alloy.ncert}</p>
        </div>
      </div>
    </article>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-bg/40 px-3 py-2.5">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 text-[0.8rem] leading-snug text-fg">{value}</p>
    </div>
  );
}

function DemoStrip({
  mode,
  onPick,
}: {
  mode: Mode;
  onPick: (ids: string[], heat?: boolean) => void;
}) {
  const items = LAB_DEMOS.filter((d) => d.mode === mode);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">Try</span>
      {items.map((d) => (
        <button
          key={d.label}
          type="button"
          onClick={() => onPick(d.ids, d.heat)}
          className="chip h-8 text-[0.72rem]"
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
