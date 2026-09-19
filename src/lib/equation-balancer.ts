// Chemical equation balancer reconstructed from Zperiod's equationBalancer.js
// (Zhilips/Zperiod, MIT-style open source). Pipeline:
//   parse → stoichiometric matrix → exact BigInt RREF / nullspace
//   → minimal positive integers → independent atom-conservation check.

export type AtomMap = Record<string, number>;

export type CompoundTerm = {
  formula: string;
  coefficient: number;
  atoms: AtomMap;
};

export type ConservationRow = {
  element: string;
  left: number;
  right: number;
  ok: boolean;
};

export type MatrixView = {
  headers: string[];
  rows: { label: string; cells: string[] }[];
};

export type BalanceStep = {
  title: string;
  body: string;
  matrix?: MatrixView;
};

export type DraftInspection = {
  raw: string;
  hasArrow: boolean;
  reactants: CompoundTerm[];
  products: CompoundTerm[];
  leftAtoms: AtomMap;
  rightAtoms: AtomMap;
  conservation: ConservationRow[];
  balanced: boolean;
  parseError: string | null;
};

export type BalanceResult = {
  reactants: CompoundTerm[];
  products: CompoundTerm[];
  formatted: string;
  pretty: string;
  elements: string[];
  matrix: MatrixView;
  rref: MatrixView;
  conservation: ConservationRow[];
  verified: boolean;
  alreadyBalanced: boolean;
  steps: BalanceStep[];
};

export class FormulaError extends Error {
  code: string;
  constructor(message: string, code = "INVALID_FORMULA") {
    super(message);
    this.name = "FormulaError";
    this.code = code;
  }
}

export class EquationError extends Error {
  code: string;
  constructor(message: string, code = "INVALID_EQUATION") {
    super(message);
    this.name = "EquationError";
    this.code = code;
  }
}

const VALID_ELEMENTS = new Set([
  "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
  "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
  "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
  "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr",
  "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn",
  "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd",
  "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb",
  "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg",
  "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th",
  "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm",
  "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds",
  "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og",
]);

const SUBSCRIPT_FROM: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
};

const SUBSCRIPT_TO: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
};

export function normalizeText(input: string): string {
  let s = String(input).replace(/[₀-₉]/g, (ch) => SUBSCRIPT_FROM[ch] ?? ch);

  // Digit 0 is only valid as a continuation of a multi-digit number.
  // Everywhere else it is almost always the letter O (H2O typed as H20, Fe2O3 as Fe203).
  let result = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "0") {
      const prev = i > 0 ? s[i - 1] : "";
      result += /[0-9]/.test(prev) ? "0" : "O";
    } else {
      result += s[i];
    }
  }

  s = result.replace(/\bH20\b/g, "H2O");

  return s
    .replace(/[→⟶⟹⇌⟷]/g, "->")
    .replace(/=>/g, "->")
    .replace(/=/g, "->")
    .replace(/[·•*]/g, "•")
    .replace(/\s+/g, " ")
    .trim();
}

export function prettyFormula(formula: string): string {
  return String(formula)
    .replace(/•/g, "·")
    .replace(/([A-Za-z)\]}])(\d+)/g, (_, prefix: string, digits: string) =>
      prefix +
      digits
        .split("")
        .map((d) => SUBSCRIPT_TO[d] ?? d)
        .join(""),
    );
}

export function prettyTerm(coefficient: number, formula: string): string {
  const body = prettyFormula(formula);
  return coefficient === 1 ? body : `${coefficient}${body}`;
}

function gcdBigInt(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

function lcmBigInt(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  return (a / gcdBigInt(a, b)) * b;
}

function cloneCountMap(map: AtomMap): AtomMap {
  const out: AtomMap = {};
  for (const [k, v] of Object.entries(map)) out[k] = v;
  return out;
}

function mergeCounts(target: AtomMap, source: AtomMap, multiplier = 1): AtomMap {
  for (const [el, count] of Object.entries(source)) {
    target[el] = (target[el] || 0) + count * multiplier;
  }
  return target;
}

function scaleCounts(source: AtomMap, multiplier: number): AtomMap {
  const out: AtomMap = {};
  for (const [el, count] of Object.entries(source)) out[el] = count * multiplier;
  return out;
}

function sumCounts(terms: CompoundTerm[]): AtomMap {
  const out: AtomMap = {};
  for (const term of terms) mergeCounts(out, term.atoms, 1);
  return out;
}

function stripTrailingState(formula: string): string {
  return formula.replace(/\s*\((aq|s|l|g)\)\s*$/i, "").trim();
}

function hasUnsupportedChargeNotation(formula: string): boolean {
  return /(\^?\d*[+-]$)|([A-Za-z0-9)\]}][+-](?![A-Za-z]))/.test(formula);
}

class Fraction {
  n: bigint;
  d: bigint;
  constructor(n: bigint | number, d: bigint | number = 1n) {
    if (d === 0n || d === 0) throw new Error("Division by zero in Fraction");
    let nn = typeof n === "bigint" ? n : BigInt(n);
    let dd = typeof d === "bigint" ? d : BigInt(d);
    if (dd < 0n) {
      nn = -nn;
      dd = -dd;
    }
    const g = gcdBigInt(nn, dd);
    this.n = nn / g;
    this.d = dd / g;
  }
  static zero() {
    return new Fraction(0n, 1n);
  }
  static one() {
    return new Fraction(1n, 1n);
  }
  isZero() {
    return this.n === 0n;
  }
  add(other: Fraction) {
    return new Fraction(this.n * other.d + other.n * this.d, this.d * other.d);
  }
  sub(other: Fraction) {
    return new Fraction(this.n * other.d - other.n * this.d, this.d * other.d);
  }
  mul(other: Fraction) {
    return new Fraction(this.n * other.n, this.d * other.d);
  }
  div(other: Fraction) {
    if (other.n === 0n) throw new Error("Division by zero Fraction");
    return new Fraction(this.n * other.d, this.d * other.n);
  }
  neg() {
    return new Fraction(-this.n, this.d);
  }
  toString() {
    if (this.d === 1n) return this.n.toString();
    return `${this.n}/${this.d}`;
  }
}

function parseFormulaStrict(rawFormula: string): AtomMap {
  if (!rawFormula || !String(rawFormula).trim()) {
    throw new FormulaError("Formula is empty.");
  }

  let formula = normalizeText(rawFormula);
  formula = stripTrailingState(formula);

  if (!formula) {
    throw new FormulaError("Formula is empty after removing state symbols.");
  }

  if (hasUnsupportedChargeNotation(formula)) {
    throw new FormulaError(
      `Charged species / ionic notation is not supported: "${rawFormula}".`,
      "IONIC_NOT_SUPPORTED",
    );
  }

  if (/->/.test(formula)) {
    throw new FormulaError(`Formula should be a single compound, not a whole equation: "${rawFormula}".`);
  }

  if (formula.includes("•")) {
    const parts = formula.split("•").map((s) => s.trim()).filter(Boolean);
    if (parts.length < 2) {
      throw new FormulaError(`Invalid hydrate notation: "${rawFormula}".`);
    }
    const combined: AtomMap = {};
    for (const part of parts) mergeCounts(combined, parseHydratePart(part), 1);
    return combined;
  }

  return parseSingleFormula(formula);
}

function parseHydratePart(part: string): AtomMap {
  const m = part.match(/^(\d+)([A-Za-z([{].*)$/);
  if (m) {
    const multiplier = Number.parseInt(m[1]!, 10);
    const inner = m[2]!.trim();
    if (multiplier <= 0) throw new FormulaError(`Invalid hydrate multiplier in "${part}".`);
    return scaleCounts(parseSingleFormula(inner), multiplier);
  }
  return parseSingleFormula(part);
}

function parseSingleFormula(formula: string): AtomMap {
  let i = 0;
  const len = formula.length;
  const stack: { type: string; counts: AtomMap }[] = [{ type: "root", counts: {} }];
  const openToClose: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const closeToOpen: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

  const currentCounts = () => stack[stack.length - 1]!.counts;

  const parseNumber = () => {
    const start = i;
    while (i < len && /\d/.test(formula[i]!)) i += 1;
    if (start === i) return 1;
    const value = Number(formula.slice(start, i));
    if (!Number.isInteger(value) || value <= 0) {
      throw new FormulaError(`Invalid subscript in "${formula}".`);
    }
    return value;
  };

  while (i < len) {
    const ch = formula[i]!;

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (openToClose[ch]) {
      stack.push({ type: ch, counts: {} });
      i += 1;
      continue;
    }

    if (closeToOpen[ch]) {
      if (stack.length === 1) {
        throw new FormulaError(`Unmatched closing bracket "${ch}" in "${formula}".`);
      }
      const group = stack.pop()!;
      if (group.type !== closeToOpen[ch]) {
        throw new FormulaError(`Mismatched brackets in "${formula}".`);
      }
      i += 1;
      mergeCounts(currentCounts(), group.counts, parseNumber());
      continue;
    }

    if (/[A-Z]/.test(ch)) {
      let symbol = ch;
      i += 1;
      if (i < len && /[a-z]/.test(formula[i]!)) {
        symbol += formula[i]!;
        i += 1;
      }
      if (!VALID_ELEMENTS.has(symbol)) {
        throw new FormulaError(`Unknown element symbol "${symbol}" in "${formula}".`);
      }
      const counts = currentCounts();
      counts[symbol] = (counts[symbol] || 0) + parseNumber();
      continue;
    }

    if (/\d/.test(ch)) {
      throw new FormulaError(
        `Unexpected number at position ${i + 1} in "${formula}". Numbers must follow an element or a closed group.`,
      );
    }

    throw new FormulaError(`Invalid character "${ch}" in "${formula}".`);
  }

  if (stack.length !== 1) {
    throw new FormulaError(`Unclosed bracket in "${formula}".`);
  }

  const result = stack[0]!.counts;
  if (Object.keys(result).length === 0) {
    throw new FormulaError(`No elements found in "${formula}".`);
  }
  return result;
}

function extractLeading(token: string): { userCoeff: number; formula: string } {
  const t = token.trim();
  if (!t) throw new FormulaError("Empty compound.");
  if (/^\d+$/.test(t)) {
    throw new FormulaError(`"${t}" is not a valid compound formula.`);
  }
  if (/^\d+\s+/.test(t)) {
    throw new FormulaError("Remove the space after a coefficient (write 2H2O, not 2 H2O).");
  }
  const match = t.match(/^(\d+)(.*)$/);
  if (match) {
    const formula = match[2]!.trim();
    if (!formula) throw new FormulaError(`"${t}" is not a valid compound formula.`);
    return { userCoeff: Number.parseInt(match[1]!, 10), formula };
  }
  return { userCoeff: 1, formula: t };
}

function splitSide(sideText: string, label: string): string[] {
  const rawParts = sideText
    .split("+")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const p of rawParts) {
    if (p === "+" || p === "->") throw new EquationError(`Invalid ${label} side syntax.`);
  }
  return rawParts;
}

function parseTerm(raw: string): CompoundTerm {
  const { userCoeff, formula } = extractLeading(raw);
  const unit = parseFormulaStrict(formula);
  return {
    formula,
    coefficient: userCoeff,
    atoms: scaleCounts(unit, userCoeff),
  };
}

function splitEquationSides(rawEquation: string): { left: string; right: string } {
  const eq = normalizeText(rawEquation);
  const parts = eq.split("->");
  if (parts.length !== 2) {
    throw new EquationError(`Equation must contain exactly one arrow "->": "${rawEquation}"`);
  }
  const left = parts[0]!.trim();
  const right = parts[1]!.trim();
  if (!left || !right) {
    throw new EquationError("Equation must have at least one reactant and one product.");
  }
  if (left.startsWith("+") || left.endsWith("+") || /\+\s*\+/.test(left)) {
    throw new EquationError("Remove the extra \"+\" on the reactant side.");
  }
  if (right.startsWith("+") || right.endsWith("+") || /\+\s*\+/.test(right)) {
    throw new EquationError("Remove the extra \"+\" on the product side.");
  }
  return { left, right };
}

function conservationTable(left: AtomMap, right: AtomMap): ConservationRow[] {
  const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
  return keys.map((element) => {
    const l = left[element] || 0;
    const r = right[element] || 0;
    return { element, left: l, right: r, ok: l === r };
  });
}

export function inspectDraft(input: string): DraftInspection {
  const raw = String(input ?? "");
  const normalized = normalizeText(raw);
  const hasArrow = normalized.includes("->");
  const empty: DraftInspection = {
    raw,
    hasArrow,
    reactants: [],
    products: [],
    leftAtoms: {},
    rightAtoms: {},
    conservation: [],
    balanced: false,
    parseError: null,
  };
  if (!normalized) return empty;

  try {
    let leftText = normalized;
    let rightText = "";
    if (hasArrow) {
      const parts = normalized.split("->");
      if (parts.length !== 2) {
        return { ...empty, parseError: "Use exactly one arrow between reactants and products." };
      }
      leftText = parts[0]!.trim();
      rightText = parts[1]!.trim();
    }

    const reactants = leftText ? splitSide(leftText, "reactant").map(parseTerm) : [];
    const products = rightText ? splitSide(rightText, "product").map(parseTerm) : [];
    const leftAtoms = sumCounts(reactants);
    const rightAtoms = sumCounts(products);
    const conservation = conservationTable(leftAtoms, rightAtoms);
    const balanced =
      hasArrow &&
      reactants.length > 0 &&
      products.length > 0 &&
      conservation.length > 0 &&
      conservation.every((row) => row.ok);

    return {
      raw,
      hasArrow,
      reactants,
      products,
      leftAtoms,
      rightAtoms,
      conservation,
      balanced,
      parseError: null,
    };
  } catch (err) {
    return { ...empty, parseError: err instanceof Error ? err.message : "Could not parse this equation." };
  }
}

function rref(matrix: Fraction[][]): { rrefMatrix: Fraction[][]; pivotCols: number[] } {
  const m = matrix.map((row) => row.map((x) => new Fraction(x.n, x.d)));
  const rows = m.length;
  const cols = m[0]!.length;
  let lead = 0;
  const pivotCols: number[] = [];

  for (let r = 0; r < rows; r++) {
    if (lead >= cols) break;
    let i = r;
    while (i < rows && m[i]![lead]!.isZero()) i += 1;
    if (i === rows) {
      lead += 1;
      r -= 1;
      continue;
    }
    if (i !== r) {
      const tmp = m[i]!;
      m[i] = m[r]!;
      m[r] = tmp;
    }
    const pivot = m[r]![lead]!;
    for (let c = 0; c < cols; c++) m[r]![c] = m[r]![c]!.div(pivot);
    for (let rr = 0; rr < rows; rr++) {
      if (rr === r) continue;
      if (m[rr]![lead]!.isZero()) continue;
      const factor = m[rr]![lead]!;
      for (let c = 0; c < cols; c++) {
        m[rr]![c] = m[rr]![c]!.sub(factor.mul(m[r]![c]!));
      }
    }
    pivotCols.push(lead);
    lead += 1;
  }

  return { rrefMatrix: m, pivotCols };
}

function reduceBigIntVector(ints: bigint[]): bigint[] {
  let g = 0n;
  for (const v of ints) {
    const abs = v < 0n ? -v : v;
    if (abs !== 0n) g = g === 0n ? abs : gcdBigInt(g, abs);
  }
  if (g === 0n) return ints;
  return ints.map((v) => v / g);
}

function fractionsToMinimalIntegers(fracs: Fraction[]): bigint[] | null {
  if (!fracs.length) return null;
  let commonDen = 1n;
  for (const f of fracs) commonDen = lcmBigInt(commonDen, f.d);
  const ints = fracs.map((f) => f.n * (commonDen / f.d));
  if (ints.every((v) => v === 0n)) return null;
  return reduceBigIntVector(ints);
}

function solveNullspace(matrix: Fraction[][]): bigint[] {
  const cols = matrix[0]!.length;
  const { rrefMatrix, pivotCols } = rref(matrix);
  const pivotSet = new Set(pivotCols);
  const freeCols: number[] = [];
  for (let c = 0; c < cols; c++) {
    if (!pivotSet.has(c)) freeCols.push(c);
  }
  if (freeCols.length === 0) {
    throw new EquationError("No non-trivial balancing solution exists.", "NO_SOLUTION");
  }

  for (const chosenFree of freeCols) {
    const sol = Array.from({ length: cols }, () => Fraction.zero());
    sol[chosenFree] = Fraction.one();
    for (let r = pivotCols.length - 1; r >= 0; r--) {
      const pivotCol = pivotCols[r]!;
      let sum = Fraction.zero();
      for (let c = pivotCol + 1; c < cols; c++) {
        if (!rrefMatrix[r]![c]!.isZero()) {
          sum = sum.add(rrefMatrix[r]![c]!.mul(sol[c]!));
        }
      }
      sol[pivotCol] = sum.neg();
    }
    const ints = fractionsToMinimalIntegers(sol);
    if (ints && ints.every((v) => v > 0n)) return ints;
    const flipped = ints ? ints.map((v) => -v) : null;
    if (flipped && flipped.every((v) => v > 0n)) return reduceBigIntVector(flipped);
  }

  throw new EquationError(
    "Could not derive a strictly positive integer solution. This may be an unsupported or invalid equation.",
    "NO_SOLUTION",
  );
}

function matrixView(elements: string[], labels: string[], matrix: Fraction[][]): MatrixView {
  return {
    headers: labels,
    rows: elements.map((el, i) => ({
      label: el,
      cells: matrix[i]!.map((cell) => cell.toString()),
    })),
  };
}

function formatEquation(reactants: CompoundTerm[], products: CompoundTerm[], pretty: boolean): string {
  const fmt = (t: CompoundTerm) =>
    pretty ? prettyTerm(t.coefficient, t.formula) : t.coefficient === 1 ? t.formula : `${t.coefficient}${t.formula}`;
  return `${reactants.map(fmt).join(" + ")} → ${products.map(fmt).join(" + ")}`;
}

function verifyBalanced(parsed: AtomMap[], reactantCount: number, coeffs: number[]): boolean {
  const left: AtomMap = {};
  const right: AtomMap = {};
  for (let i = 0; i < parsed.length; i++) {
    const target = i < reactantCount ? left : right;
    const coeff = coeffs[i]!;
    for (const [el, count] of Object.entries(parsed[i]!)) {
      target[el] = (target[el] || 0) + count * coeff;
    }
  }
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const k of keys) {
    if ((left[k] || 0) !== (right[k] || 0)) return false;
  }
  return true;
}

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : "We couldn't parse this equation.";
  if (/Invalid character:\s*[a-z]/.test(message)) {
    return "Element symbols must start with a capital letter (Na, not na; H2O, not water).";
  }
  if (/(unmatched|mismatched).*bracket/i.test(message) || /unclosed/i.test(message)) {
    return "Mismatched brackets. Close every group, e.g. Ca(OH)2.";
  }
  const special = message.match(/Invalid character:\s*([^A-Za-z0-9\s])/);
  if (special) {
    return `The character '${special[1]}' isn't allowed. Use formulas and + between compounds.`;
  }
  return message;
}

export function balanceEquation(input: string): BalanceResult {
  const { left, right } = splitEquationSides(input);
  const reactantTokens = splitSide(left, "reactant");
  const productTokens = splitSide(right, "product");
  if (reactantTokens.length === 0 || productTokens.length === 0) {
    throw new EquationError("Equation must have at least one reactant and one product.");
  }

  const reactantParts = reactantTokens.map(extractLeading);
  const productParts = productTokens.map(extractLeading);
  const reactantFormulas = reactantParts.map((p) => p.formula);
  const productFormulas = productParts.map((p) => p.formula);
  const allFormulas = [...reactantFormulas, ...productFormulas];
  const parsed = allFormulas.map(parseFormulaStrict);

  const elementSet = new Set<string>();
  for (const obj of parsed) for (const el of Object.keys(obj)) elementSet.add(el);
  const elements = Array.from(elementSet).sort();
  if (elements.length === 0) throw new EquationError("No elements found in equation.");

  const labels = allFormulas.map((f, i) => `x${i + 1} ${prettyFormula(f)}`);
  const matrix = elements.map((el) => {
    const row: Fraction[] = [];
    for (let i = 0; i < reactantFormulas.length; i++) {
      row.push(new Fraction(BigInt(parsed[i]![el] || 0)));
    }
    for (let i = reactantFormulas.length; i < allFormulas.length; i++) {
      row.push(new Fraction(BigInt(-(parsed[i]![el] || 0))));
    }
    return row;
  });

  const { rrefMatrix, pivotCols } = rref(matrix);
  const coeffsBig = solveNullspace(matrix);
  const coeffs = coeffsBig.map((n) => Number(n));
  if (!verifyBalanced(parsed, reactantFormulas.length, coeffs)) {
    throw new EquationError("Internal verification failed: equation did not balance correctly.");
  }

  const reactants: CompoundTerm[] = reactantFormulas.map((formula, i) => ({
    formula,
    coefficient: coeffs[i]!,
    atoms: scaleCounts(parsed[i]!, coeffs[i]!),
  }));
  const products: CompoundTerm[] = productFormulas.map((formula, i) => {
    const idx = reactantFormulas.length + i;
    return {
      formula,
      coefficient: coeffs[idx]!,
      atoms: scaleCounts(parsed[idx]!, coeffs[idx]!),
    };
  });

  const leftAtoms = sumCounts(reactants);
  const rightAtoms = sumCounts(products);
  const conservation = conservationTable(leftAtoms, rightAtoms);

  let alreadyBalanced = true;
  for (let i = 0; i < reactantParts.length; i++) {
    if (reactantParts[i]!.userCoeff !== reactants[i]!.coefficient) alreadyBalanced = false;
  }
  for (let i = 0; i < productParts.length; i++) {
    if (productParts[i]!.userCoeff !== products[i]!.coefficient) alreadyBalanced = false;
  }

  const conservationLines = elements
    .map((el) => {
      const counts = allFormulas
        .map((f, i) => {
          const n = parsed[i]![el] || 0;
          const side = i < reactantFormulas.length ? "+" : "−";
          return n === 0 ? null : `${side}${n}·x${i + 1}`;
        })
        .filter(Boolean);
      return `${el}: ${counts.join(" ")} = 0`;
    })
    .join("\n");

  const freeCols = labels
    .map((_, c) => c)
    .filter((c) => !pivotCols.includes(c))
    .map((c) => `x${c + 1}`);

  const steps: BalanceStep[] = [
    {
      title: "1. Parse every formula",
      body: `Each compound is read atom-by-atom, including parentheses such as Ca(OH)₂ and hydrates such as CuSO₄·5H₂O. Physical states (s), (l), (g), (aq) are ignored. Never change a subscript — only the coefficients in front of formulas may change.`,
    },
    {
      title: "2. Conservation equations",
      body: `Atoms cannot appear or vanish. For each element we write one linear equation: (atoms on the left) − (atoms on the right) = 0.\n\n${conservationLines}`,
    },
    {
      title: "3. Stoichiometric matrix",
      body: "Rows are elements, columns are compounds. Reactants are positive, products are negative — a standard trick that turns balancing into “find the nullspace”.",
      matrix: matrixView(elements, labels, matrix),
    },
    {
      title: "4. Exact RREF (Gaussian elimination)",
      body: `Using BigInt rational arithmetic (no floating-point rounding), the matrix is reduced to row-echelon form. Pivot columns: ${
        pivotCols.map((c) => `x${c + 1}`).join(", ") || "none"
      }. Free variable${freeCols.length === 1 ? "" : "s"}: ${freeCols.join(", ") || "none"}.`,
      matrix: matrixView(elements, labels, rrefMatrix),
    },
    {
      title: "5. Nullspace → smallest integers",
      body: `Set each free variable to 1, back-substitute, clear denominators with the LCM, then divide by the GCD. The unique (up to scale) positive integer solution is:\n\n${labels
        .map((lab, i) => `${lab.replace(/x\d+\s/, "")} → ${coeffs[i]}`)
        .join("\n")}`,
    },
    {
      title: "6. Independent verification",
      body: conservation.every((row) => row.ok)
        ? `Recounting atoms on both sides confirms the law of conservation of mass. ${conservation
            .map((row) => `${row.element}: ${row.left} = ${row.right}`)
            .join(", ")}.`
        : "Verification failed — this should never happen.",
    },
  ];

  return {
    reactants,
    products,
    formatted: formatEquation(reactants, products, false),
    pretty: formatEquation(reactants, products, true),
    elements,
    matrix: matrixView(elements, labels, matrix),
    rref: matrixView(elements, labels, rrefMatrix),
    conservation,
    verified: conservation.every((row) => row.ok),
    alreadyBalanced,
    steps,
  };
}
