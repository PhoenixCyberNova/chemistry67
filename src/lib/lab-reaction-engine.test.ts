import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveLabReaction,
  matchLabReactionSmart,
  REACTIVITY_SERIES,
} from "./lab-reaction-engine.ts";
import { matchLabReaction, LAB_REACTIONS } from "../data/virtualLabData.ts";

describe("lab-reaction-engine systematic rules", () => {
  it("preserves catalogue matches for required mixes", () => {
    const mixes = [
      ["zn", "naoh"],
      ["mg", "h2so4"],
      ["fe", "h2so4"],
      ["al", "naoh"],
    ];
    for (const flask of mixes) {
      const smart = matchLabReactionSmart(flask, false);
      const legacy = matchLabReaction(flask, false);
      assert.ok(smart, `smart miss for ${flask}`);
      assert.ok(legacy, `legacy miss for ${flask}`);
      assert.equal(smart!.id, legacy!.id);
    }
  });

  it("metal + dilute acid: Zn / Mg / Fe above H give H2", () => {
    for (const metal of ["zn", "mg", "fe", "al"]) {
      const out = resolveLabReaction([metal, "hcl"], false);
      assert.equal(out.kind, "reaction", metal);
      if (out.kind === "reaction") {
        assert.match(out.reaction.equation, /H₂\(g\)/);
        assert.ok(out.reaction.equation.includes("+"));
      }
    }
  });

  it("metal below H + dilute acid → no_reaction", () => {
    for (const metal of ["cu", "ag"]) {
      const out = resolveLabReaction([metal, "hcl"], false);
      assert.ok(
        out.kind === "no_reaction" ||
          (out.kind === "reaction" && out.reaction.equation === "No reaction"),
      );
      if (out.kind === "no_reaction") {
        assert.match(out.reason, /below hydrogen|cannot displace/i);
      }
    }
  });

  it("acid + carbonate → CO2 evolution", () => {
    const out = resolveLabReaction(["hcl", "caco3"], false);
    assert.equal(out.kind, "reaction");
    if (out.kind === "reaction") {
      assert.match(out.reaction.equation, /CO₂/);
      assert.match(out.reaction.observation, /effervescence|CO₂|lime/i);
    }
  });

  it("acid–base neutralisation", () => {
    const out = resolveLabReaction(["hcl", "naoh"], false);
    assert.equal(out.kind, "reaction");
    if (out.kind === "reaction") {
      assert.match(out.reaction.equation, /H₂O/);
      assert.match(out.reaction.type, /Neutralisation|neutralisation/i);
    }
  });

  it("metal displacement Zn + CuSO4", () => {
    const out = resolveLabReaction(["zn", "cuso4"], false);
    assert.equal(out.kind, "reaction");
    if (out.kind === "reaction") {
      assert.match(out.reaction.equation, /Cu\(s\)/);
    }
  });

  it("cannot displace: Cu + ZnSO4 → no_reaction", () => {
    const out = resolveLabReaction(["cu", "znso4"], false);
    assert.equal(out.kind, "no_reaction");
  });

  it("indicator colour change", () => {
    const out = resolveLabReaction(["phph", "naoh"], false);
    assert.equal(out.kind, "reaction");
    if (out.kind === "reaction") {
      assert.match(out.reaction.observation, /pink|magenta/i);
    }
  });

  it("unsupported exotic mix is explicit", () => {
    const out = resolveLabReaction(["methane", "kmno4"], false);
    assert.equal(out.kind, "unsupported");
    assert.match(out.reason, /not covered|not supported|yet/i);
  });

  it("reactivity series is ordered K most reactive", () => {
    assert.equal(REACTIVITY_SERIES[0], "k");
    assert.ok(REACTIVITY_SERIES.indexOf("zn") < REACTIVITY_SERIES.indexOf("cu"));
    assert.ok(REACTIVITY_SERIES.indexOf("h") < REACTIVITY_SERIES.indexOf("ag"));
  });

  it("generated equations contain arrow and products", () => {
    const cases = [
      ["zn", "hcl"],
      ["hcl", "caco3"],
      ["hcl", "naoh"],
    ];
    for (const flask of cases) {
      const out = resolveLabReaction(flask, false);
      assert.equal(out.kind, "reaction");
      if (out.kind === "reaction") {
        assert.match(out.reaction.equation, /→/);
        assert.ok(out.reaction.equation.length > 10);
      }
    }
  });

  it("catalogue size remains substantial", () => {
    assert.ok(LAB_REACTIONS.length > 40);
  });
});
