import { ColorChips } from "@/components/vault/ColorChips";
import type { Reaction } from "@/lib/data/reactions";
import { reactionKey } from "@/lib/reaction-filters";
import { useStudent } from "@/lib/student/store";
import { cn } from "@/lib/utils";
import { BookmarkCheck, Eye, Lightbulb, RotateCcw, Star } from "lucide-react";

function Meta({ k, v, icon }: { k: string; v: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-bg/55 p-3 transition-colors hover:border-border">
      <dt className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">
        {icon}
        {k}
      </dt>
      <dd className="mt-1.5 text-[0.83rem] leading-snug text-fg">{v}</dd>
    </div>
  );
}

export function ReactionCard({ r, index }: { r: Reaction; index: number }) {
  const key = reactionKey(r);
  const starred = useStudent((s) => s.stars.includes(key));
  const flag = useStudent((s) => s.mastery[key] ?? "unset");
  const toggleStar = useStudent((s) => s.toggleStar);
  const setMastery = useStudent((s) => s.setMastery);

  return (
    <article
      className="card-enter glass glass-hover flex flex-col rounded-[1.15rem] p-5"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-display text-[1.15rem] leading-snug text-fg">{r.title}</h3>
        <button
          type="button"
          aria-label={starred ? "Unsave reaction" : "Save reaction"}
          onClick={() => toggleStar(key)}
          className="shrink-0 rounded-lg p-1 text-muted transition-all duration-150 hover:bg-raised hover:text-gold active:scale-90"
        >
          <Star className={cn("size-[1.05rem]", starred && "fill-gold text-gold")} />
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-gold">
          {r.type}
        </span>
        {flag !== "unset" && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wide",
              flag === "learned" ? "bg-ok/15 text-ok" : "bg-gold/15 text-gold",
            )}
          >
            {flag === "learned" ? "✓ Learned" : "⟳ Needs review"}
          </span>
        )}
      </div>

      <pre className="eq mt-4 max-w-full overflow-x-auto rounded-xl border border-primary/20 bg-bg/80 px-3.5 py-3 text-[0.8rem] leading-relaxed text-primary">
        {r.eq}
      </pre>

      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-bg/55 p-3 sm:col-span-2">
          <dt className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">
            <Eye className="size-3" />
            Colour change
          </dt>
          <dd className="mt-1.5 text-[0.83rem] leading-snug text-fg">
            <ColorChips text={r.colour} />
          </dd>
        </div>
        <Meta k="Observation" v={r.obs} />
        <Meta k="Condition" v={r.cond} />
        <div className="rounded-xl border border-gold/25 bg-gold/6 p-3 sm:col-span-2">
          <dt className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-gold">
            <Lightbulb className="size-3" />
            Exam tip
          </dt>
          <dd className="mt-1.5 text-[0.83rem] leading-snug text-fg">{r.tip}</dd>
        </div>
      </dl>

      <p className="mt-4 border-l-2 border-primary/50 pl-3 text-[0.83rem] leading-relaxed text-muted">{r.desc}</p>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <button
          type="button"
          onClick={() => setMastery(key, flag === "learned" ? "unset" : "learned")}
          className={cn(
            "btn h-10 text-xs",
            flag === "learned"
              ? "border border-ok/50 bg-ok/12 text-ok"
              : "border border-border text-muted hover:text-fg",
          )}
        >
          <BookmarkCheck className="size-3.5" />
          Learned
        </button>
        <button
          type="button"
          onClick={() => setMastery(key, flag === "review" ? "unset" : "review")}
          className={cn(
            "btn h-10 text-xs",
            flag === "review"
              ? "border border-gold/50 bg-gold/12 text-gold"
              : "border border-border text-muted hover:text-fg",
          )}
        >
          <RotateCcw className="size-3.5" />
          Review
        </button>
      </div>
    </article>
  );
}
