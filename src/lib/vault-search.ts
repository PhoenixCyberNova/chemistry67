import { chapters, colours, definitions, notes, reactions } from "@/lib/data/catalogue";
import { quizBank } from "@/lib/data/quiz-bank";
import { expandAliases } from "@/lib/data/aliases";
import { reactionKey } from "@/lib/reaction-filters";

export type SearchKind = "reaction" | "colour" | "definition" | "note" | "quiz" | "chapter" | "tool";

export type SearchHit = {
  id: string;
  kind: SearchKind;
  title: string;
  snippet: string;
  href: string;
  score: number;
};

function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(c)] ?? c)
    .replace(/[·•]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fuzzy(hay: string, needle: string): number {
  if (!needle) return 0;
  const h = fold(hay);
  const n = fold(needle);
  if (!h || !n) return 0;
  if (h === n) return 100;
  if (h.startsWith(n)) return 92;
  if (h.includes(` ${n} `) || h.includes(` ${n}`) || h.startsWith(`${n} `)) return 84;
  if (h.includes(n)) return 72;
  const parts = n.split(" ").filter(Boolean);
  if (parts.length > 1 && parts.every((p) => h.includes(p))) return 64;
  // subsequence
  let i = 0;
  for (const ch of h) {
    if (ch === n[i]) i += 1;
    if (i >= n.length) return Math.max(28, 48 - Math.min(20, h.length - n.length));
  }
  return 0;
}

function bestScore(blob: string, needles: string[]): number {
  let m = 0;
  for (const n of needles) m = Math.max(m, fuzzy(blob, n));
  return m;
}

export function searchVault(query: string, limit = 24): SearchHit[] {
  const q = query.trim();
  if (q.length < 1) return [];
  const needles = [q, ...expandAliases(q)].slice(0, 12);
  const hits: SearchHit[] = [];

  const toolScore = bestScore(
    "equation balancer balance chemical equation stoichiometry coefficients matrix gaussian rref conservation of mass",
    needles,
  );
  if (toolScore >= 28) {
    hits.push({
      id: "balancer",
      kind: "tool",
      title: "Chemical equation balancer",
      snippet: "Exact rational matrix solver with atom-conservation check and a live balance scale.",
      href: "balancer",
      score: toolScore + 8,
    });
  }

  for (const ch of chapters) {
    const score = bestScore(`${ch.title} ${ch.blurb} chapter ${ch.num} ${ch.id}`, needles);
    if (score >= 28) {
      hits.push({
        id: ch.id,
        kind: "chapter",
        title: `Chapter ${ch.num} · ${ch.title}`,
        snippet: ch.blurb,
        href: "chapter-map",
        score: score + 4,
      });
    }
  }

  for (const r of reactions) {
    const blob = `${r.title} ${r.eq} ${r.type} ${r.colour} ${r.obs} ${r.cond} ${r.tip} ${r.desc} ${r.ch}`;
    const score = bestScore(blob, needles);
    if (score >= 28) {
      hits.push({
        id: reactionKey(r),
        kind: "reaction",
        title: r.title,
        snippet: `${r.type} · ${r.eq}`,
        href: "reactions",
        score,
      });
    }
  }

  for (const c of colours) {
    const score = bestScore(`${c.name} ${c.formula} ${c.colour} ${c.remarks}`, needles);
    if (score >= 28) {
      hits.push({
        id: `${c.name}|${c.formula}`,
        kind: "colour",
        title: c.name,
        snippet: `${c.formula} · ${c.colour}`,
        href: "colours",
        score,
      });
    }
  }

  for (const d of definitions) {
    const score = bestScore(`${d.title} ${d.body}`, needles);
    if (score >= 28) {
      hits.push({
        id: d.title,
        kind: "definition",
        title: d.title,
        snippet: d.body.slice(0, 140),
        href: "definitions",
        score,
      });
    }
  }

  for (const n of notes) {
    const score = bestScore(`${n.title} ${n.body}`, needles);
    if (score >= 28) {
      hits.push({
        id: n.title,
        kind: "note",
        title: n.title,
        snippet: n.body.replace(/\s+/g, " ").slice(0, 140),
        href: "notes",
        score,
      });
    }
  }

  for (const item of quizBank) {
    const score = bestScore(`${item.q} ${item.options.join(" ")} ${item.why}`, needles);
    if (score >= 28) {
      hits.push({
        id: item.id,
        kind: "quiz",
        title: item.q.replace(/\n/g, " ").slice(0, 110),
        snippet: `Chapter ${item.ch.slice(2)} · ${item.mark}-mark ${item.kind}`,
        href: "quiz",
        score,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const h of hits) {
    const k = `${h.kind}:${h.id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}
