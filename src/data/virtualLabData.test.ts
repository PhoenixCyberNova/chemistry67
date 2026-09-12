import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHEMICALS,
  LAB_REACTIONS,
  LAB_RUNTIME,
  canonicalId,
  matchLabReaction,
  traceLabMatch,
} from "./virtualLabData.ts";

const REQUIRED_MIXES: { flask: string[]; id: string }[] = [
  { flask: ["zn", "naoh"], id: "zn-naoh" },
  { flask: ["mg", "h2so4"], id: "mg-h2so4" },
  { flask: ["fe", "h2so4"], id: "fe-h2so4" },
  { flask: ["al", "naoh"], id: "al-naoh" },
  { flask: ["zno", "naoh"], id: "zno-naoh" },
  { flask: ["al2o3", "naoh"], id: "al2o3-naoh" },
];

describe("Virtual Lab matcher", () => {
  it("exports a runtime stamp so stale bundles are detectable", () => {
    assert.equal(LAB_RUNTIME, "chemvault-lab-v4");
  });

  it("keeps every required mix in LAB_REACTIONS", () => {
    for (const { id, flask } of REQUIRED_MIXES) {
      const rxn = LAB_REACTIONS.find((row) => row.id === id);
      assert.ok(rxn, `missing LAB_REACTIONS entry ${id}`);
      assert.deepEqual(
        [...rxn!.reagents].map(canonicalId).sort(),
        [...flask].map(canonicalId).sort(),
      );
      assert.equal(rxn!.needsHeat, false, `${id} must match at room temperature`);
    }
  });

  it("returns the corresponding LAB_REACTIONS entry for each required flask", () => {
    for (const { flask, id } of REQUIRED_MIXES) {
      const room = matchLabReaction(flask, false);
      const heated = matchLabReaction(flask, true);
      assert.equal(room?.id, id, `room-temp ${flask.join("+")} → ${id}`);
      assert.equal(heated?.id, id, `heated ${flask.join("+")} still → ${id}`);
    }
  });

  it("traces flask array, canonical set, equal reagent rows, and the selected reaction", () => {
    for (const { flask, id } of REQUIRED_MIXES) {
      const trace = traceLabMatch(flask, false);
      assert.deepEqual(trace.flask, flask);
      assert.deepEqual(trace.canonical, [...flask].map(canonicalId).sort());
      assert.ok(
        trace.equalSets.some((row) => row.id === id),
        `${id} must be in the equal-set hits for ${flask.join("+")}`,
      );
      assert.equal(trace.selected?.id, id);
    }
  });

  it("canonicalizes trim/case and still matches Zn + NaOH", () => {
    const hit = matchLabReaction([" Zn ", "NaOH"], false);
    assert.equal(hit?.id, "zn-naoh");
  });

  it("matches implied water on amphoteric alkali mixes", () => {
    assert.equal(matchLabReaction(["zn", "naoh", "h2o"], false)?.id, "zn-naoh");
    assert.equal(matchLabReaction(["al", "naoh", "h2o"], false)?.id, "al-naoh");
    assert.equal(matchLabReaction(["zno", "naoh", "h2o"], false)?.id, "zno-naoh");
    assert.equal(matchLabReaction(["al2o3", "naoh", "h2o"], false)?.id, "al2o3-naoh");
  });

  it("does not match when an extra unrelated reagent is in the flask", () => {
    assert.equal(matchLabReaction(["zn", "naoh", "hcl"], false), null);
  });

  it("resolves every chemical id used by the required mixes", () => {
    const ids = new Set(REQUIRED_MIXES.flatMap((row) => row.flask));
    for (const id of ids) {
      assert.ok(
        CHEMICALS.some((c) => canonicalId(c.id) === canonicalId(id)),
        `storage is missing ${id}`,
      );
    }
  });
});
