import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  balanceEquation,
  inspectDraft,
  normalizeText,
  prettyFormula,
} from "./equation-balancer.ts";

function coeffs(eq: string) {
  const r = balanceEquation(eq);
  return {
    left: r.reactants.map((t) => t.coefficient),
    right: r.products.map((t) => t.coefficient),
    verified: r.verified,
    formatted: r.formatted,
    alreadyBalanced: r.alreadyBalanced,
  };
}

describe("normalizeText", () => {
  it("maps arrows, subscripts and hydrate dots", () => {
    assert.equal(normalizeText("H₂O → H2 + O₂"), "H2O -> H2 + O2");
    assert.equal(normalizeText("CuSO4·5H2O"), "CuSO4•5H2O");
  });

  it("repairs 0 typed instead of O except inside numbers", () => {
    assert.equal(normalizeText("Fe + H20"), "Fe + H2O");
    assert.equal(normalizeText("C9H20"), "C9H20");
  });
});

describe("prettyFormula", () => {
  it("subscripts digits and uses a middle dot for hydrates", () => {
    assert.equal(prettyFormula("Ca(OH)2"), "Ca(OH)₂");
    assert.equal(prettyFormula("CuSO4•5H2O"), "CuSO₄·5H₂O");
  });
});

describe("balanceEquation — classic pipelines", () => {
  it("balances water synthesis", () => {
    const r = coeffs("H2 + O2 -> H2O");
    assert.deepEqual(r.left, [2, 1]);
    assert.deepEqual(r.right, [2]);
    assert.equal(r.verified, true);
    assert.equal(r.formatted, "2H2 + O2 → 2H2O");
  });

  it("balances steam on iron", () => {
    const r = coeffs("Fe + H2O -> Fe3O4 + H2");
    assert.deepEqual(r.left, [3, 4]);
    assert.deepEqual(r.right, [1, 4]);
    assert.equal(r.verified, true);
  });

  it("balances KMnO4 + HCl", () => {
    const r = coeffs("KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2");
    assert.deepEqual(r.left, [2, 16]);
    assert.deepEqual(r.right, [2, 2, 8, 5]);
    assert.equal(r.verified, true);
  });

  it("handles parentheses Ca(OH)2", () => {
    const r = coeffs("Ca(OH)2 + HCl -> CaCl2 + H2O");
    assert.deepEqual(r.left, [1, 2]);
    assert.deepEqual(r.right, [1, 2]);
    assert.equal(r.verified, true);
  });

  it("handles hydrates", () => {
    const r = coeffs("CuSO4·5H2O -> CuSO4 + H2O");
    assert.deepEqual(r.left, [1]);
    assert.deepEqual(r.right, [1, 5]);
    assert.equal(r.verified, true);
  });

  it("balances combustion of propane", () => {
    const r = coeffs("C3H8 + O2 -> CO2 + H2O");
    assert.deepEqual(r.left, [1, 5]);
    assert.deepEqual(r.right, [3, 4]);
  });

  it("balances the thermite reaction", () => {
    const r = coeffs("Al + Fe2O3 -> Al2O3 + Fe");
    assert.deepEqual(r.left, [2, 1]);
    assert.deepEqual(r.right, [1, 2]);
  });

  it("strips physical states", () => {
    const r = coeffs("Mg(s) + O2(g) -> MgO(s)");
    assert.deepEqual(r.left, [2, 1]);
    assert.deepEqual(r.right, [2]);
    assert.equal(r.formatted, "2Mg(s) + O2(g) → 2MgO(s)");
  });

  it("ignores already-present coefficients when solving", () => {
    const r = coeffs("2H2 + O2 -> 2H2O");
    assert.deepEqual(r.left, [2, 1]);
    assert.deepEqual(r.right, [2]);
    assert.equal(r.alreadyBalanced, true);
  });

  it("records a conservation table that actually balances", () => {
    const r = balanceEquation("Fe + H2O -> Fe3O4 + H2");
    assert.ok(r.conservation.length >= 2);
    for (const row of r.conservation) {
      assert.equal(row.ok, true, `${row.element}: ${row.left} vs ${row.right}`);
    }
    assert.ok(r.steps.length >= 6);
    assert.ok(r.matrix.rows.length > 0);
  });
});

describe("inspectDraft", () => {
  it("reports imbalance before solving", () => {
    const d = inspectDraft("Fe + H2O -> Fe3O4 + H2");
    assert.equal(d.balanced, false);
    const iron = d.conservation.find((r) => r.element === "Fe");
    assert.equal(iron?.left, 1);
    assert.equal(iron?.right, 3);
    assert.equal(iron?.ok, false);
  });

  it("sees a balanced draft", () => {
    const d = inspectDraft("2H2 + O2 -> 2H2O");
    assert.equal(d.balanced, true);
    assert.ok(d.conservation.every((r) => r.ok));
  });
});

describe("errors", () => {
  it("rejects missing arrows", () => {
    assert.throws(() => balanceEquation("H2 + O2"), /arrow/);
  });

  it("rejects unknown elements", () => {
    assert.throws(() => balanceEquation("Xx + O2 -> XxO"), /Unknown element/);
  });
});
