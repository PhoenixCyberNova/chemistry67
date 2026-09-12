import { askChem } from "@/lib/ask-chem";
import { cn } from "@/lib/utils";
import { FlaskConical, MessageCircle, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Why is ZnO yellow when hot?",
  "Difference between roasting and calcination?",
  "Explain esterification with the equation",
  "Why does tooth enamel decay below pH 5.5?",
];

export function AiTutor() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Welcome to your private tutor. Ask any Class 10 Chemistry question — reactions, colours, pH, extraction, ethanol, esters…",
    },
  ]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const send = async (raw?: string) => {
    const message = (raw ?? input).trim();
    if (!message || busy) return;
    setInput("");
    const history = msgs.filter((_, idx) => idx > 0);
    setMsgs((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const res = await askChem({ data: { message, history } });
      const text = res.ok ? res.text : res.error;
      setMsgs((m) => [...m, { role: "assistant", content: text }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Could not reach the tutor. Try again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass overflow-hidden rounded-[1.35rem]">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
        <span className="grid size-8 place-items-center rounded-xl border border-primary/30 bg-primary/12">
          <FlaskConical className="size-4 text-primary" />
        </span>
        <span className="text-sm font-semibold text-fg">ChemVault Tutor</span>
        <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.14em] text-gold">
          GROK
        </span>
        <span className="ms-auto flex items-center gap-1.5 text-[0.65rem] font-semibold text-muted">
          <span className={`size-1.5 rounded-full ${busy ? "bg-gold pulse-dot" : "bg-ok"}`} />
          {busy ? "Thinking" : "Online"}
        </span>
      </div>

      <div ref={box} className="flex h-96 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5">
        {msgs.map((m, idx) => (
          <div
            key={idx}
            className={cn(
              "pop-in max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[0.85rem] leading-relaxed",
              m.role === "user"
                ? "ms-auto rounded-br-md bg-primary text-[var(--color-on-primary)]"
                : "me-auto rounded-bl-md border border-border bg-raised/80 text-fg",
            )}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="me-auto flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md border border-border bg-raised/80 px-4 py-3.5">
            <span className="typing-dot size-1.5 rounded-full bg-primary" />
            <span className="typing-dot size-1.5 rounded-full bg-primary" />
            <span className="typing-dot size-1.5 rounded-full bg-primary" />
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3 sm:px-5">
        <div className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              disabled={busy}
              className="chip h-8 text-[0.72rem] disabled:opacity-40"
            >
              <Sparkles className="size-3 text-gold" />
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            suppressHydrationWarning
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
            placeholder="Ask a chemistry question…"
            className="input h-12"
          />
          <button
            type="button"
            disabled={busy || !input.trim()}
            onClick={() => void send()}
            aria-label="Send message"
            className="btn btn-primary size-12 shrink-0 rounded-xl p-0"
          >
            <Send className="size-4" />
          </button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[0.65rem] text-muted">
          <MessageCircle className="size-3" />
          User-initiated · answers follow NCERT Class 10 language
        </p>
      </div>
    </div>
  );
}
