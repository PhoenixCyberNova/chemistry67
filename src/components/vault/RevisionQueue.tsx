import { definitions, notes, reactions } from "@/lib/data/catalogue";
import { quizBank } from "@/lib/data/quiz-bank";
import { reactionKey } from "@/lib/reaction-filters";
import { useStudent } from "@/lib/student/store";
import { cn } from "@/lib/utils";
import { BookOpen, Lightbulb, Play, RotateCcw, Star } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function RevisionQueue({ onOpenQuiz }: { onOpenQuiz: (id?: string) => void }) {
  const stars = useStudent((s) => s.stars);
  const mastery = useStudent((s) => s.mastery);
  const bookDefs = useStudent((s) => s.bookDefs);
  const bookNotes = useStudent((s) => s.bookNotes);
  const bookQuiz = useStudent((s) => s.bookQuiz);
  const quizLog = useStudent((s) => s.quizLog);
  const toggleStar = useStudent((s) => s.toggleStar);
  const toggleBook = useStudent((s) => s.toggleBook);

  const starredRx = reactions.filter((r) => stars.includes(reactionKey(r)));
  const reviewRx = reactions.filter((r) => mastery[reactionKey(r)] === "review");
  const defs = definitions.filter((d) => bookDefs.includes(d.title));
  const noteRows = notes.filter((n) => bookNotes.includes(n.title));
  const wrongIds = [...new Set(quizLog.flatMap((l) => l.wrong))];
  const questions = quizBank.filter((q) => bookQuiz.includes(q.id) || wrongIds.includes(q.id));

  const empty =
    starredRx.length + reviewRx.length + defs.length + noteRows.length + questions.length === 0;

  if (empty) {
    return (
      <div className="glass rounded-[1.35rem] px-6 py-16 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-gold/30 bg-gold/10">
          <Star className="size-5 text-gold" />
        </div>
        <p className="mt-4 font-display text-xl text-fg">Your revision shelf is empty</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Star a reaction, flag one for review, save a definition — or miss a quiz question. It all
          lands here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {reviewRx.length > 0 && (
        <Block title="Needs review" count={reviewRx.length} icon={<RotateCcw className="size-4 text-gold" />}>
          {reviewRx.map((r) => (
            <li key={reactionKey(r)} className="rounded-xl border border-border/60 bg-bg/55 px-4 py-3">
              <p className="text-sm text-fg">{r.title}</p>
              <p className="eq mt-1 text-xs text-primary">{r.eq}</p>
            </li>
          ))}
        </Block>
      )}
      {starredRx.length > 0 && (
        <Block title="Starred reactions" count={starredRx.length} icon={<Star className="size-4 text-gold" />}>
          {starredRx.map((r) => (
            <li
              key={reactionKey(r)}
              className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-bg/55 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-fg">{r.title}</p>
                <p className="eq mt-1 truncate text-xs text-primary">{r.eq}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 text-[0.7rem] font-semibold text-muted transition-colors hover:text-danger"
                onClick={() => toggleStar(reactionKey(r))}
              >
                Remove
              </button>
            </li>
          ))}
        </Block>
      )}
      {defs.length > 0 && (
        <Block title="Saved definitions" count={defs.length} icon={<BookOpen className="size-4 text-primary" />}>
          {defs.map((d) => (
            <li
              key={d.title}
              className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-bg/55 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg">{d.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{d.body}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 text-[0.7rem] font-semibold text-muted transition-colors hover:text-danger"
                onClick={() => toggleBook("def", d.title)}
              >
                Remove
              </button>
            </li>
          ))}
        </Block>
      )}
      {noteRows.length > 0 && (
        <Block title="Saved notes" count={noteRows.length} icon={<Lightbulb className="size-4 text-gold" />}>
          {noteRows.map((n) => (
            <li
              key={n.title}
              className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-bg/55 px-4 py-3"
            >
              <p className="text-sm text-fg">{n.title}</p>
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 text-[0.7rem] font-semibold text-muted transition-colors hover:text-danger"
                onClick={() => toggleBook("note", n.title)}
              >
                Remove
              </button>
            </li>
          ))}
        </Block>
      )}
      {questions.length > 0 && (
        <Reveal className="lg:col-span-2">
          <div className="glass rounded-[1.35rem] p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-lg text-fg">
              <Play className="size-4 text-primary" />
              Questions to retry
              <span className="chip-count ms-1 bg-primary/15 text-primary">{questions.length}</span>
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-bg/55 px-4 py-3"
                >
                  <p className="line-clamp-2 text-sm text-fg">{q.q.replace(/\n/g, " ")}</p>
                  <button
                    type="button"
                    className="btn btn-primary h-8 shrink-0 rounded-lg px-3 text-[0.7rem]"
                    onClick={() => onOpenQuiz(q.id)}
                  >
                    Retry
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}

function Block({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <div className="glass h-full rounded-[1.35rem] p-5">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg text-fg">
          {icon}
          {title}
          <span className={cn("chip-count ms-1")}>{count}</span>
        </h3>
        <ul className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1">{children}</ul>
      </div>
    </Reveal>
  );
}
