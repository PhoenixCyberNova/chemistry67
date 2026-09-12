import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === ".vercel" || name === "dist") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

describe("Virtual Lab source uniqueness", () => {
  it("has exactly one virtualLabData module", () => {
    const hits = walk(ROOT).filter((p) => /virtualLabData\.(ts|js|mjs|cjs)$/.test(p));
    const rel = hits.map((p) => relative(ROOT, p)).sort();
    assert.deepEqual(rel, ["src/data/virtualLabData.ts"]);
  });

  it("has exactly one matchLabReaction implementation", () => {
    const files = walk(ROOT).filter((p) => /\.(ts|tsx|js|mjs)$/.test(p) && !p.includes(".test."));
    const defs = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (/export function matchLabReaction\s*\(/.test(text)) {
        defs.push(relative(ROOT, file));
      }
    }
    assert.deepEqual(defs, ["src/data/virtualLabData.ts"]);
  });

  it("does not import lab matching from a generated/static duplicate", () => {
    const files = walk(join(ROOT, "src")).filter(
      (p) => /\.(ts|tsx)$/.test(p) && !p.includes(".test."),
    );
    const imports = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const re = /from\s+["']([^"']*virtualLab[^"']*)["']/g;
      let m;
      while ((m = re.exec(text))) {
        imports.push(`${relative(ROOT, file)} -> ${m[1]}`);
      }
    }
    assert.ok(imports.length > 0, "VirtualLab must import the data module");
    for (const line of imports) {
      assert.match(line, /@\/data\/virtualLabData$/);
    }
  });
});
