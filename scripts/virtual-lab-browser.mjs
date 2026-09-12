/**
 * Browser regression for the six flask mixes that were missing on production.
 * Usage: node scripts/virtual-lab-browser.mjs http://127.0.0.1:8080/
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8080/";

const MIXES = [
  { ids: ["zn", "naoh"], result: "zn-naoh" },
  { ids: ["mg", "h2so4"], result: "mg-h2so4" },
  { ids: ["fe", "h2so4"], result: "fe-h2so4" },
  { ids: ["al", "naoh"], result: "al-naoh" },
  { ids: ["zno", "naoh"], result: "zno-naoh" },
  { ids: ["al2o3", "naoh"], result: "al2o3-naoh" },
];

const GROUP_FOR = {
  zn: "metals",
  mg: "metals",
  fe: "metals",
  al: "metals",
  h2so4: "acids",
  naoh: "bases",
  zno: "salts",
  al2o3: "salts",
};

async function clickChem(page, id) {
  const group = GROUP_FOR[id];
  const header = page.locator(`[data-chem-group="${group}"]`);
  await header.scrollIntoViewIfNeeded();
  if ((await header.getAttribute("aria-expanded")) !== "true") {
    await header.click();
  }
  const chem = page.locator(`[data-chem-id="${id}"]`);
  await chem.waitFor({ state: "visible", timeout: 8000 });
  await chem.click();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => {
    localStorage.setItem(
      "chemvault-student",
      JSON.stringify({ state: { onboardingDone: true, hydrated: true }, version: 0 }),
    );
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const skip = page.getByRole("button", { name: /^Skip$/ });
  if (await skip.count()) await skip.click();

  const nav = page.getByRole("button", { name: /^Virtual Lab$/i });
  if (await nav.count()) await nav.first().click();
  const sim = page.locator("#simulator");
  await sim.waitFor({ timeout: 10000 });
  await sim.scrollIntoViewIfNeeded();

  const runtime = await sim.getAttribute("data-lab-runtime");
  if (runtime !== "chemvault-lab-v4") {
    throw new Error(`stale lab runtime in the page: ${runtime}`);
  }

  const failures = [];
  for (const mix of MIXES) {
    const clear = sim.getByRole("button", { name: /^Clear$/ });
    if (await clear.isEnabled()) await clear.click();
    await page.waitForTimeout(80);

    for (const id of mix.ids) {
      await clickChem(page, id);
    }
    await page.locator("[data-lab-analyze]").click();
    const result = page.locator(`[data-lab-result="${mix.result}"]`);
    try {
      await result.waitFor({ timeout: 5000 });
    } catch {
      const missText = (await page.locator("[data-lab-miss]").textContent().catch(() => "")) ?? "";
      failures.push(`${mix.ids.join("+")} expected ${mix.result}; miss="${missText.trim()}"`);
    }
  }

  await browser.close();
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log(`ok ${MIXES.length} mixes against ${BASE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
