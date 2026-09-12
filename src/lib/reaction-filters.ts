import type { Reaction } from "@/lib/data/reactions";

export const TYPE_BUCKETS = [
  "Combination",
  "Thermal Decomposition",
  "Decomposition",
  "Displacement",
  "Double Displacement",
  "Redox",
  "Neutralisation",
  "Combustion",
  "Electrolysis",
  "Photolysis",
  "Acid + Metal",
  "Esterification",
  "Addition",
  "Substitution",
  "Corrosion",
  "Extraction",
] as const;

export type TypeBucket = (typeof TYPE_BUCKETS)[number];

export function bucketsFor(type: string): TypeBucket[] {
  const t = type.toLowerCase();
  const out: TypeBucket[] = [];
  const add = (b: TypeBucket) => {
    if (!out.includes(b)) out.push(b);
  };
  if (t.includes("double displacement") || t.includes("precipitation")) add("Double Displacement");
  else if (t.includes("displacement")) add("Displacement");
  if (t.includes("thermal decomposition")) add("Thermal Decomposition");
  if (t.includes("photolyt") || t.includes("photochemical")) add("Photolysis");
  if (t.includes("electroly")) add("Electrolysis");
  if (t.includes("decomposition") && !t.includes("thermal") && !t.includes("photolyt") && !t.includes("electroly")) {
    add("Decomposition");
  }
  if (t.includes("combination")) add("Combination");
  if (t.includes("redox") || t.includes("oxidation") || t.includes("reduction")) add("Redox");
  if (t.includes("neutral")) add("Neutralisation");
  if (t.includes("combustion")) add("Combustion");
  if (t.includes("acid + metal") || t.includes("metal + acid")) add("Acid + Metal");
  if (t.includes("ester")) add("Esterification");
  if (t.includes("addition") || t.includes("hydrogenation")) add("Addition");
  if (t.includes("substitution")) add("Substitution");
  if (t.includes("corrosion") || t.includes("rust") || t.includes("galvanis")) add("Corrosion");
  if (t.includes("roast") || t.includes("calcin") || t.includes("extraction") || t.includes("aluminotherm")) {
    add("Extraction");
  }
  return out;
}

export const REAGENTS = [
  { id: "HCl", labels: ["hcl", "hydrochloric"] },
  { id: "H₂SO₄", labels: ["h2so4", "h₂so₄", "sulphuric", "sulfuric"] },
  { id: "NaOH", labels: ["naoh", "sodium hydroxide"] },
  { id: "CuSO₄", labels: ["cuso4", "cuso₄", "copper sulphate", "copper sulfate"] },
  { id: "FeSO₄", labels: ["feso4", "feso₄", "ferrous"] },
  { id: "CaCO₃", labels: ["caco3", "caco₃", "limestone", "marble"] },
  { id: "CaO", labels: ["cao", "quicklime"] },
  { id: "Zn", labels: ["zn", "zinc"] },
  { id: "Fe", labels: ["fe", "iron"] },
  { id: "Al", labels: ["al", "aluminium", "aluminum"] },
  { id: "Cu", labels: ["cu", "copper"] },
  { id: "AgNO₃", labels: ["agno3", "agno₃", "silver nitrate"] },
  { id: "Ethanol", labels: ["ethanol", "c2h5oh", "c₂h₅oh"] },
  { id: "Ethanoic acid", labels: ["ethanoic", "acetic", "ch3cooh", "ch₃cooh"] },
  { id: "NaHCO₃", labels: ["nahco3", "nahco₃", "baking soda"] },
] as const;

export function matchesReagent(r: Reaction, id: string): boolean {
  const spec = REAGENTS.find((x) => x.id === id);
  if (!spec) return false;
  const blob = `${r.title} ${r.eq} ${r.type} ${r.desc} ${r.cond} ${r.tip}`.toLowerCase();
  return spec.labels.some((l) => blob.includes(l));
}

export function reactionKey(r: Pick<Reaction, "ch" | "title">): string {
  return `${r.ch}::${r.title}`;
}
