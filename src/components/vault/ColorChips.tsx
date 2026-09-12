import { chipsFromColour } from "@/lib/color-chips";

export function ColorChips({ text }: { text: string }) {
  const chips = chipsFromColour(text);
  if (!chips.length) return <span>{text}</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <span
          key={c.label}
          title={c.label}
          className="inline-block size-3.5 shrink-0 rounded-md border border-border"
          style={{ background: c.hex }}
        />
      ))}
      <span>{text}</span>
    </span>
  );
}
