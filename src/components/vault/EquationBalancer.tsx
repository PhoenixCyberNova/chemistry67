import { Reveal } from "@/components/vault/Reveal";
import {
  balanceEquation,
  friendlyError,
  inspectDraft,
  prettyFormula,
  prettyTerm,
  type BalanceResult,
  type ConservationRow,
  type DraftInspection,
} from "@/lib/equation-balancer";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Eraser,
  Scale,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const EXAMPLES: { label: string; eq: string }[] = [
  { label: "Steam on iron", eq: "Fe + H2O -> Fe3O4 + H2" },
  { label: "KMnO₄ + HCl", eq: "KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2" },
  { label: "Propane", eq: "C3H8 + O2 -> CO2 + H2O" },
  { label: "Ca(OH)₂", eq: "Ca(OH)2 + HCl -> CaCl2 + H2O" },
  { label: "Hydrate", eq: "CuSO4·5H2O -> CuSO4 + H2O" },
  { label: "Thermite", eq: "Al + Fe2O3 -> Al2O3 + Fe" },
];

function totalAtoms(map: Record<string, number>): number {
  return Object.values(map).reduce((a, b) => a + b, 0);
}

function tiltFrom(draft: DraftInspection): number {
  const left = totalAtoms(draft.leftAtoms);
  const right = totalAtoms(draft.rightAtoms);
  if (left === 0 && right === 0) return 0;
  const angle = (right - left) * 2.2;
  return Math.max(-18, Math.min(18, angle));
}

export function EquationBalancer() {
  const [value, setValue] = useState("Fe + H2O -> Fe3O4 + H2");
  const [result, setResult] = useState<BalanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);

  const draft = useMemo(() => inspectDraft(value), [value]);
  const angle = tiltFrom(draft);

  useEffect(() => {
    setResult(null);
    setError(null);
    setCopied(false);
  }, [value]);

  const runBalance = () => {
    try {
      const next = balanceEquation(value);
      setResult(next);
      setError(null);
      setStepsOpen(true);
    } catch (err) {
      setResult(null);
      setError(friendlyError(err));
    }
  };

  const conservation = result?.conservation ?? draft.conservation;
  const isBalanced = result?.verified ?? draft.balanced;

  return (
    <section id="balancer" className="scroll-mt-24 py-12">
      <Reveal>
        <div className="mb-7">
          <p className="eyebrow">
            <Scale className="size-3.5" />
            Stoichiometry engine
          </p>
          <h2 className="mt-2.5 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-tight text-fg">
            Equation balancer
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Type any unbalanced Class 10 equation. The engine parses formulas, builds an atom-count
            matrix, and solves it with exact rational Gaussian elimination — then proves both sides
            conserve every element.
          </p>
          <div className="hairline mt-6" />
        </div>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal className="min-w-0">
          <div className="glass rounded-[1.35rem] p-5 sm:p-6">
            <label className="block">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted">
                Unbalanced equation
              </span>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runBalance();
                  }
                }}
                placeholder="Fe + H2O -> Fe3O4 + H2"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className="input eq mt-2 h-14 text-[0.95rem]"
                aria-label="Chemical equation"
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.eq}
                  type="button"
                  onClick={() => setValue(ex.eq)}
                  className={cn("chip", value === ex.eq && "chip-on")}
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button type="button" onClick={runBalance} className="btn btn-primary h-12 px-5">
                <WandSparkles className="size-4" />
                Auto-balance
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  setResult(null);
                  setError(null);
                }}
                className="btn btn-ghost h-12 px-5"
              >
                <Eraser className="size-4" />
                Clear
              </button>
            </div>

            {error ? (
              <p
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            ) : null}

            {result ? (
              <div className="mt-5 rounded-[1.15rem] border border-ok/30 bg-ok/8 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ok">
                    {result.alreadyBalanced ? "Already balanced" : "Minimal integer coefficients"}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(result.pretty);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1600);
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-muted transition-colors hover:text-fg"
                  >
                    {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="eq mt-3 text-[1.05rem] leading-relaxed text-fg sm:text-[1.15rem]">
                  {result.reactants.map((t, i) => (
                    <span key={`r-${t.formula}-${i}`}>
                      {i > 0 ? <span className="text-muted"> + </span> : null}
                      <Coeff n={t.coefficient} />
                      {prettyFormula(t.formula)}
                    </span>
                  ))}
                  <span className="mx-2 text-gold">→</span>
                  {result.products.map((t, i) => (
                    <span key={`p-${t.formula}-${i}`}>
                      {i > 0 ? <span className="text-muted"> + </span> : null}
                      <Coeff n={t.coefficient} />
                      {prettyFormula(t.formula)}
                    </span>
                  ))}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted">
                {draft.parseError
                  ? draft.parseError
                  : draft.hasArrow
                    ? isBalanced
                      ? "Both sides already conserve atoms — press Auto-balance to confirm coefficients."
                      : "The scale is live. Press Auto-balance to find the smallest integer coefficients."
                    : "Add an arrow (→ or ->) and the products to weigh both pans."}
              </p>
            )}
          </div>
        </Reveal>

        <Reveal delay={80} className="min-w-0">
          <BalanceScale
            angle={result?.verified ? 0 : angle}
            balanced={isBalanced && (Boolean(result) || draft.balanced)}
            leftLabel={draft.reactants.map((t) => prettyTerm(t.coefficient, t.formula)).join(" + ") || "Reactants"}
            rightLabel={draft.products.map((t) => prettyTerm(t.coefficient, t.formula)).join(" + ") || "Products"}
          />
        </Reveal>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Reveal delay={40}>
          <ConservationCard
            title="Reactants"
            rows={conservation}
            side="left"
            empty={!draft.reactants.length && !result}
          />
        </Reveal>
        <Reveal delay={90}>
          <ConservationCard
            title="Products"
            rows={conservation}
            side="right"
            empty={!draft.products.length && !result}
          />
        </Reveal>
      </div>

      {result ? (
        <Reveal delay={60}>
          <div className="mt-4 glass overflow-hidden rounded-[1.35rem]">
            <button
              type="button"
              onClick={() => setStepsOpen((v) => !v)}
              className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-4 text-left"
              aria-expanded={stepsOpen}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="size-4 text-gold" />
                <span className="font-display text-lg text-fg">How the matrix balanced it</span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted transition-transform duration-200",
                  stepsOpen && "rotate-180",
                )}
              />
            </button>
            {stepsOpen ? (
              <div className="border-t border-border px-5 pb-6 pt-2">
                <ol className="grid gap-4">
                  {result.steps.map((step) => (
                    <li key={step.title} className="rounded-2xl border border-border/70 bg-bg/50 p-4">
                      <p className="font-display text-[1.05rem] text-fg">{step.title}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{step.body}</p>
                      {step.matrix ? <MatrixTable matrix={step.matrix} /> : null}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </Reveal>
      ) : null}
    </section>
  );
}

function Coeff({ n }: { n: number }) {
  if (n === 1) return null;
  return <span className="mr-0.5 font-bold text-gold">{n}</span>;
}

function ConservationCard({
  title,
  rows,
  side,
  empty,
}: {
  title: string;
  rows: ConservationRow[];
  side: "left" | "right";
  empty: boolean;
}) {
  return (
    <div className="glass rounded-[1.35rem] p-5">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted">{title}</p>
      <h3 className="mt-1 font-display text-xl text-fg">Atom count</h3>
      {empty || rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No atoms parsed yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[16rem] text-left text-sm">
            <thead>
              <tr className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">
                <th className="pb-2 pr-3 font-bold">Element</th>
                <th className="pb-2 pr-3 font-bold">Atoms</th>
                <th className="pb-2 font-bold">Match</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const n = side === "left" ? row.left : row.right;
                return (
                  <tr key={`${side}-${row.element}`} className="border-t border-border/60">
                    <td className="py-2.5 pr-3 font-mono text-fg">{row.element}</td>
                    <td className="tabular py-2.5 pr-3 text-fg">{n}</td>
                    <td className="py-2.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
                          row.ok ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger",
                        )}
                      >
                        {row.ok ? "Conserved" : "Unequal"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MatrixTable({ matrix }: { matrix: { headers: string[]; rows: { label: string; cells: string[] }[] } }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-border/70">
      <table className="w-full min-w-[22rem] text-left text-xs">
        <thead>
          <tr className="bg-raised/60 text-muted">
            <th className="px-3 py-2 font-bold">El</th>
            {matrix.headers.map((h) => (
              <th key={h} className="px-3 py-2 font-mono font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => (
            <tr key={row.label} className="border-t border-border/60">
              <td className="px-3 py-2 font-mono text-gold">{row.label}</td>
              {row.cells.map((cell, i) => (
                <td key={`${row.label}-${i}`} className="tabular px-3 py-2 text-fg">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BalanceScale({
  angle,
  balanced,
  leftLabel,
  rightLabel,
}: {
  angle: number;
  balanced: boolean;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div
      className={cn(
        "glass relative overflow-hidden rounded-[1.35rem] px-4 pb-5 pt-4",
        balanced && "shadow-glow",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted">Balance scale</p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.65rem] font-bold",
            balanced ? "bg-ok/15 text-ok" : "bg-gold/12 text-gold",
          )}
        >
          {balanced ? "Level — conserved" : "Tilted — unequal atoms"}
        </span>
      </div>

      <div className="relative mx-auto h-[250px] w-full max-w-[28rem]">
        <div className="absolute bottom-3 left-1/2 h-[58%] w-2.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/70 via-primary/25 to-raised" />
        <div className="absolute bottom-2 left-1/2 h-4 w-28 -translate-x-1/2 rounded-full border border-border bg-raised" />

        <div
          className="absolute left-1/2 top-[22%] w-[86%] max-w-[24rem] -translate-x-1/2"
          style={{
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transformOrigin: "center center",
            transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div className="relative h-2.5 rounded-full bg-gradient-to-r from-gold/30 via-fg/55 to-gold/30">
            <span className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-raised" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-2.5 flex justify-between px-1">
            <Pan hanging={leftLabel} side="left" angle={-angle} />
            <Pan hanging={rightLabel} side="right" angle={-angle} />
          </div>
        </div>

        <div className="absolute left-1/2 top-[18%] size-9 -translate-x-1/2 rounded-full border border-gold/40 bg-gradient-to-br from-gold/40 to-raised shadow-[0_8px_20px_-8px_rgb(226_194_132/0.55)]">
          <span
            className="absolute left-1/2 top-1 h-4 w-0.5 origin-bottom rounded-full bg-danger"
            style={{
              transform: `translateX(-50%) rotate(${angle}deg)`,
              transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Pan({ hanging, side, angle }: { hanging: string; side: "left" | "right"; angle: number }) {
  return (
    <div
      className="flex w-[46%] flex-col items-center"
      style={{
        transform: `rotate(${angle}deg)`,
        transformOrigin: "top center",
        transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <span className="h-8 w-px bg-border" />
      <div className="w-full rounded-b-[1.4rem] rounded-t-md border border-primary/25 bg-bg/80 px-2 py-2 text-center">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-muted">
          {side === "left" ? "Left pan" : "Right pan"}
        </p>
        <p className="eq mt-1 line-clamp-3 text-[0.68rem] leading-snug text-fg">{hanging}</p>
      </div>
    </div>
  );
}
