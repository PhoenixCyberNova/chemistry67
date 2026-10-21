/**
 * Systematic Virtual Lab reaction engine.
 * Complements the curated LAB_REACTIONS catalogue with rule-based matching
 * for Class 10 chemistry (reactivity series, acids/bases, precipitation, indicators).
 *
 * Outcomes:
 *  - reaction     → full LabReaction (from catalogue or generated)
 *  - no_reaction  → chemically expected to do nothing under the given conditions
 *  - unsupported  → combination is outside the simulator's rule set
 */

import {
  type LabReaction,
  CHEMICALS,
  LAB_REACTIONS,
  canonicalId,
  chemById,
} from "@/data/virtualLabData";

// ─── Reactivity series (most reactive → least). H is the acid-cutoff. ─────────
export const REACTIVITY_SERIES = [
  "k", "na", "ca", "mg", "al", "zn", "fe", "sn", "pb", "h", "cu", "ag", "hg",
] as const;

const SERIES_INDEX = new Map(REACTIVITY_SERIES.map((id, i) => [id, i]));

function seriesRank(id: string): number {
  return SERIES_INDEX.get(canonicalId(id) as (typeof REACTIVITY_SERIES)[number]) ?? 999;
}

function isAboveHydrogen(metalId: string): boolean {
  return seriesRank(metalId) < seriesRank("h");
}

function canDisplace(activeMetal: string, passiveMetal: string): boolean {
  return seriesRank(activeMetal) < seriesRank(passiveMetal);
}

// ─── Chemical role helpers ───────────────────────────────────────────────────
const ACID_IDS = new Set(["hcl", "h2so4", "hno3", "ch3cooh", "ethanoic"]);
const BASE_IDS = new Set(["naoh", "koh", "caoh2", "nh4oh", "mgo", "cao"]);
const CARBONATE_IDS = new Set(["caco3", "nahco3", "na2co3", "k2co3"]);
const HYDROGENCARBONATE_IDS = new Set(["nahco3"]);
const INDICATOR_IDS = new Set(["phph", "methylorange", "universal"]);
const METAL_IDS = new Set(
  CHEMICALS.filter((c) => c.category === "metals").map((c) => canonicalId(c.id)),
);
const SALT_SOLUTION_IDS = new Set([
  "cuso4", "agno3", "baso4", "znso4", "nacl", "kcl", "fecl3", "pbno3",
]);

function isAcid(id: string) {
  return ACID_IDS.has(canonicalId(id));
}
function isBase(id: string) {
  return BASE_IDS.has(canonicalId(id));
}
function isCarbonate(id: string) {
  return CARBONATE_IDS.has(canonicalId(id)) || HYDROGENCARBONATE_IDS.has(canonicalId(id));
}
function isIndicator(id: string) {
  return INDICATOR_IDS.has(canonicalId(id));
}
function isMetal(id: string) {
  return METAL_IDS.has(canonicalId(id));
}

function formulaOf(id: string): string {
  return chemById(id)?.formula ?? id.toUpperCase();
}

function nameOf(id: string): string {
  return chemById(id)?.name ?? id;
}

// ─── Result type ─────────────────────────────────────────────────────────────
export type EngineOutcome =
  | { kind: "reaction"; reaction: LabReaction; source: "catalogue" | "rule" }
  | { kind: "no_reaction"; reason: string; ncert?: string }
  | { kind: "unsupported"; reason: string };

// ─── Catalogue first (preserves existing exact matches) ──────────────────────
function catalogueMatch(ids: string[], heated: boolean): LabReaction | null {
  const flask = new Set(ids.map(canonicalId));
  const hits = LAB_REACTIONS.filter((rxn) => {
    const exact =
      setsEqual(new Set(rxn.reagents.map(canonicalId)), flask) ||
      (rxn.also ?? []).some((alt) => setsEqual(new Set(alt.map(canonicalId)), flask));
    return exact;
  });
  if (!hits.length) return null;
  if (heated) {
    return hits.find((h) => h.needsHeat) ?? hits.find((h) => !h.needsHeat) ?? null;
  }
  return hits.find((h) => !h.needsHeat) ?? null;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

// ─── Rule generators ─────────────────────────────────────────────────────────

function genId(parts: string[]): string {
  return "rule-" + parts.map(canonicalId).sort().join("-");
}

function metalAcidRule(ids: string[], _heated: boolean): EngineOutcome | null {
  const list = ids.map(canonicalId);
  if (list.length < 2 || list.length > 3) return null;
  const metals = list.filter(isMetal);
  const acids = list.filter(isAcid);
  const others = list.filter((id) => !isMetal(id) && !isAcid(id) && id !== "h2o");
  if (metals.length !== 1 || acids.length !== 1 || others.length > 0) return null;

  const metal = metals[0]!;
  const acid = acids[0]!;

  if (!isAboveHydrogen(metal)) {
    return {
      kind: "no_reaction",
      reason: `${nameOf(metal)} is below hydrogen in the reactivity series, so it cannot displace H₂ from dilute ${nameOf(acid)}.`,
      ncert: "Ch 3 — metals below hydrogen do not liberate hydrogen from dilute acids.",
    };
  }

  const saltMap: Record<string, Record<string, string>> = {
    hcl: {
      k: "KCl", na: "NaCl", ca: "CaCl₂", mg: "MgCl₂", al: "AlCl₃",
      zn: "ZnCl₂", fe: "FeCl₂", sn: "SnCl₂", pb: "PbCl₂",
    },
    h2so4: {
      k: "K₂SO₄", na: "Na₂SO₄", ca: "CaSO₄", mg: "MgSO₄", al: "Al₂(SO₄)₃",
      zn: "ZnSO₄", fe: "FeSO₄", sn: "SnSO₄", pb: "PbSO₄",
    },
    hno3: {},
    ch3cooh: {
      k: "CH₃COOK", na: "CH₃COONa", ca: "(CH₃COO)₂Ca", mg: "(CH₃COO)₂Mg",
      zn: "(CH₃COO)₂Zn", fe: "(CH₃COO)₂Fe", al: "(CH₃COO)₃Al",
    },
    ethanoic: {
      k: "CH₃COOK", na: "CH₃COONa", ca: "(CH₃COO)₂Ca", mg: "(CH₃COO)₂Mg",
      zn: "(CH₃COO)₂Zn", fe: "(CH₃COO)₂Fe", al: "(CH₃COO)₃Al",
    },
  };

  const acidKey = acid === "ethanoic" ? "ethanoic" : acid;
  const salt = saltMap[acidKey]?.[metal];
  if (!salt) {
    if (acid === "hno3") {
      return {
        kind: "unsupported",
        reason: "Dilute/conc. nitric acid reactions are redox-complex and not fully modelled for every metal yet.",
      };
    }
    return null;
  }

  const metalF = formulaOf(metal);
  const acidF = formulaOf(acid);
  const equation = `${metalF}(s) + ${acidF}(aq) → ${salt}(aq) + H₂(g)`;
  const needsWarm = metal === "al" || metal === "fe" || metal === "sn" || metal === "pb";

  const reaction: LabReaction = {
    id: genId([metal, acid]),
    reagents: [metal, acid],
    needsHeat: false,
    title: `${nameOf(metal)} + ${nameOf(acid)}`,
    equation,
    observation: `Hydrogen gas evolved${needsWarm ? " (may be slow; warming helps)" : ""}; colourless salt solution of ${salt}.`,
    type: "Displacement · Acid + metal",
    ncert: "Ch 3 — metals above hydrogen displace H₂ from dilute acids. Reactivity series decides rate and feasibility.",
    flaskColor: "#dce8f0",
    effects: { bubbles: true },
  };
  return { kind: "reaction", reaction, source: "rule" };
}

function acidCarbonateRule(ids: string[]): EngineOutcome | null {
  const list = ids.map(canonicalId);
  if (list.length < 2 || list.length > 3) return null;
  const acids = list.filter(isAcid);
  const carbonates = list.filter(isCarbonate);
  const others = list.filter((id) => !isAcid(id) && !isCarbonate(id) && id !== "h2o");
  if (acids.length !== 1 || carbonates.length !== 1 || others.length > 0) return null;

  const acid = acids[0]!;
  const carb = carbonates[0]!;
  const acidF = formulaOf(acid);
  const carbF = formulaOf(carb);
  const isBicarb = HYDROGENCARBONATE_IDS.has(carb);

  const saltHint =
    carb === "caco3"
      ? acid === "hcl"
        ? "CaCl₂"
        : acid === "h2so4"
          ? "CaSO₄"
          : "calcium salt"
      : carb === "nahco3" || carb === "na2co3"
        ? acid === "hcl"
          ? "NaCl"
          : "sodium salt"
        : "salt";

  const equation = isBicarb
    ? `${carbF}(s/aq) + ${acidF}(aq) → ${saltHint}(aq) + H₂O(l) + CO₂(g)`
    : `${carbF}(s) + ${acidF}(aq) → ${saltHint}(aq) + H₂O(l) + CO₂(g)`;

  const reaction: LabReaction = {
    id: genId([acid, carb]),
    reagents: [acid, carb],
    needsHeat: false,
    title: `${nameOf(acid)} + ${nameOf(carb)}`,
    equation,
    observation: "Brisk effervescence of CO₂; gas turns lime water milky.",
    type: "Acid + carbonate / hydrogencarbonate",
    ncert: "Ch 2 — acids liberate CO₂ from carbonates and hydrogencarbonates. Lime-water test confirms CO₂.",
    flaskColor: "#e8f4ea",
    effects: { bubbles: true, steam: true },
  };
  return { kind: "reaction", reaction, source: "rule" };
}

function neutralisationRule(ids: string[]): EngineOutcome | null {
  const list = ids.map(canonicalId);
  if (list.length < 2 || list.length > 3) return null;
  const acids = list.filter(isAcid);
  const bases = list.filter(isBase);
  const others = list.filter((id) => !isAcid(id) && !isBase(id) && id !== "h2o");
  if (acids.length !== 1 || bases.length !== 1 || others.length > 0) return null;

  const acid = acids[0]!;
  const base = bases[0]!;
  const acidF = formulaOf(acid);
  const baseF = formulaOf(base);

  const salt =
    acid === "hcl" && base === "naoh"
      ? "NaCl"
      : acid === "h2so4" && base === "naoh"
        ? "Na₂SO₄"
        : acid === "hcl" && base === "koh"
          ? "KCl"
          : acid === "hcl" && (base === "caoh2" || base === "cao")
            ? "CaCl₂"
            : acid === "h2so4" && (base === "caoh2" || base === "cao")
              ? "CaSO₄"
              : "salt";

  const equation = `${acidF}(aq) + ${baseF}(aq) → ${salt}(aq) + H₂O(l)`;

  const reaction: LabReaction = {
    id: genId([acid, base]),
    reagents: [acid, base],
    needsHeat: false,
    title: `Neutralisation · ${nameOf(acid)} + ${nameOf(base)}`,
    equation,
    observation: "Mixture warms (exothermic). Salt and water form; solution approaches neutral pH.",
    type: "Acid–base neutralisation",
    ncert: "Ch 2 — acid + base → salt + water. Heat is evolved; indicators confirm end-point.",
    flaskColor: "#f0f4f8",
    effects: { steam: true },
  };
  return { kind: "reaction", reaction, source: "rule" };
}

function displacementRule(ids: string[]): EngineOutcome | null {
  const list = ids.map(canonicalId);
  if (list.length !== 2) return null;
  const saltId = list.find((id) => ["cuso4", "agno3", "znso4", "fecl3", "pbno3"].includes(id));
  const metalId = list.find((id) => isMetal(id) && id !== saltId);
  if (!metalId || !saltId) return null;

  const passiveFromSalt: Record<string, string> = {
    cuso4: "cu",
    agno3: "ag",
    znso4: "zn",
    fecl3: "fe",
    pbno3: "pb",
  };
  const passive = passiveFromSalt[saltId];
  if (!passive) return null;

  if (!canDisplace(metalId, passive)) {
    return {
      kind: "no_reaction",
      reason: `${nameOf(metalId)} is less reactive than ${nameOf(passive)}, so it cannot displace ${nameOf(passive)} from its salt solution.`,
      ncert: "Ch 3 — a more reactive metal displaces a less reactive metal from its salt solution.",
    };
  }

  const activeF = formulaOf(metalId);
  const saltF = formulaOf(saltId);
  const passiveF = formulaOf(passive);
  const productSalt =
    saltId === "cuso4"
      ? metalId === "zn"
        ? "ZnSO₄"
        : metalId === "fe"
          ? "FeSO₄"
          : `${activeF}SO₄`
      : saltId === "agno3"
        ? `${activeF}NO₃`
        : "salt";

  const equation = `${activeF}(s) + ${saltF}(aq) → ${productSalt}(aq) + ${passiveF}(s)`;
  const colourNote =
    passive === "cu"
      ? "Blue solution fades; reddish-brown copper deposits."
      : passive === "ag"
        ? "Grey-white silver deposits form."
        : "Displacement of the less reactive metal is observed.";

  const reaction: LabReaction = {
    id: genId([metalId, saltId]),
    reagents: [metalId, saltId],
    needsHeat: false,
    title: `Displacement · ${nameOf(metalId)} + ${nameOf(saltId)}`,
    equation,
    observation: colourNote,
    type: "Metal displacement",
    ncert: "Ch 3 — reactivity series: more reactive metal displaces less reactive metal from salt solution.",
    flaskColor: passive === "cu" ? "#c46a3a" : "#e8edf2",
    effects: { precipitate: passive === "cu" ? "#c46a3a" : "#d0d4d8" },
  };
  return { kind: "reaction", reaction, source: "rule" };
}

function indicatorRule(ids: string[]): EngineOutcome | null {
  const list = ids.map(canonicalId);
  if (list.length !== 2) return null;
  const ind = list.find(isIndicator);
  const other = list.find((id) => id !== ind);
  if (!ind || !other) return null;

  const acid = isAcid(other);
  const base = isBase(other);
  if (!acid && !base) return null;

  let observation = "";
  let flaskColor = "#f0f0f0";
  const equation = "Colour change (indicator)";

  if (ind === "phph") {
    if (acid) {
      observation = "Phenolphthalein remains colourless in acid.";
      flaskColor = "#f8f4f6";
    } else {
      observation = "Phenolphthalein turns pink / magenta in base.";
      flaskColor = "#f4c4d4";
    }
  } else if (ind === "methylorange") {
    if (acid) {
      observation = "Methyl orange is red in acid.";
      flaskColor = "#e05a4a";
    } else {
      observation = "Methyl orange is yellow in base.";
      flaskColor = "#e8d44a";
    }
  } else if (ind === "universal") {
    if (acid) {
      observation = "Universal indicator shows red / orange (acidic pH).";
      flaskColor = "#e05a4a";
    } else {
      observation = "Universal indicator shows blue / purple (alkaline pH).";
      flaskColor = "#6a5acd";
    }
  }

  const reaction: LabReaction = {
    id: genId([ind, other]),
    reagents: [ind, other],
    needsHeat: false,
    title: `Indicator · ${nameOf(ind)} in ${nameOf(other)}`,
    equation,
    observation,
    type: "Indicator colour change",
    ncert: "Ch 2 — indicators show different colours in acidic and basic media.",
    flaskColor,
    effects: {},
  };
  return { kind: "reaction", reaction, source: "rule" };
}

function precipitationRule(ids: string[]): EngineOutcome | null {
  const set = new Set(ids.map(canonicalId));
  const pairs: { a: string; b: string; colour: string; eq: string; obs: string }[] = [
    {
      a: "agno3",
      b: "nacl",
      colour: "#f4f1ea",
      eq: "AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)",
      obs: "White curdy precipitate of AgCl; soluble in NH₄OH.",
    },
    {
      a: "agno3",
      b: "kcl",
      colour: "#f4f1ea",
      eq: "AgNO₃(aq) + KCl(aq) → AgCl(s) + KNO₃(aq)",
      obs: "White curdy precipitate of AgCl.",
    },
  ];

  if (set.has("agno3") && (set.has("nacl") || set.has("kcl"))) {
    const halide = set.has("nacl") ? "nacl" : "kcl";
    const pair = pairs.find((p) => p.a === "agno3" && p.b === halide)!;
    const reaction: LabReaction = {
      id: genId(["agno3", halide]),
      reagents: ["agno3", halide],
      needsHeat: false,
      title: "Precipitation of AgCl",
      equation: pair.eq,
      observation: pair.obs,
      type: "Precipitation",
      ncert: "Ch 1 / Ch 2 — Ag⁺ + Cl⁻ → AgCl↓ (white ppt).",
      flaskColor: "#f4f1ea",
      effects: { precipitate: pair.colour },
    };
    return { kind: "reaction", reaction, source: "rule" };
  }

  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Resolve a flask mixture.
 * 1. Exact catalogue match (preserves all curated NCERT notes).
 * 2. Systematic rules (metal+acid, carbonate, neutralisation, displacement, indicator, ppt).
 * 3. Explicit no-reaction when chemistry forbids it.
 * 4. Unsupported when the combination is outside the model.
 */
export function resolveLabReaction(ids: string[], heated: boolean): EngineOutcome {
  if (!ids.length) {
    return { kind: "unsupported", reason: "Empty flask — add reagents." };
  }

  const catalogue = catalogueMatch(ids, heated);
  if (catalogue) {
    if (catalogue.equation === "No reaction" || catalogue.type === "No reaction") {
      return {
        kind: "no_reaction",
        reason: catalogue.observation,
        ncert: catalogue.ncert,
      };
    }
    return { kind: "reaction", reaction: catalogue, source: "catalogue" };
  }

  const rules: Array<() => EngineOutcome | null> = [
    () => metalAcidRule(ids, heated),
    () => acidCarbonateRule(ids),
    () => neutralisationRule(ids),
    () => displacementRule(ids),
    () => indicatorRule(ids),
    () => precipitationRule(ids),
  ];

  for (const rule of rules) {
    const out = rule();
    if (out) return out;
  }

  if (ids.length === 1 && heated) {
    return {
      kind: "unsupported",
      reason: "No thermal decomposition is recorded for this single reagent in the Class 10 set.",
    };
  }

  if (ids.length === 1) {
    return {
      kind: "unsupported",
      reason: "Add a second reagent, or use Heat if this substance decomposes on its own.",
    };
  }

  return {
    kind: "unsupported",
    reason:
      "This combination is not covered by the curated catalogue or the systematic Class 10 rules yet. Try a metal + dilute acid, acid + carbonate, acid + base, displacement pair, or an indicator.",
  };
}

/** Backwards-compatible wrapper used by VirtualLab UI. */
export function matchLabReactionSmart(ids: string[], heated: boolean): LabReaction | null {
  const out = resolveLabReaction(ids, heated);
  return out.kind === "reaction" ? out.reaction : null;
}

export function engineMessage(out: EngineOutcome, _heated: boolean): string {
  if (out.kind === "reaction") return "";
  if (out.kind === "no_reaction") {
    return `No reaction under these conditions. ${out.reason}${out.ncert ? ` (${out.ncert})` : ""}`;
  }
  return out.reason;
}
