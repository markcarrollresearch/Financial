import { chromium, expect } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { metrics, scenario, DEFAULT_RATES } from "../src/finance/model.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "docs/handout");
await mkdir(output, { recursive: true });
const data = JSON.parse(
  await readFile(path.join(root, "docs/data.json"), "utf8"),
);
const m = metrics(data);
const baseline = scenario(m.aging, DEFAULT_RATES);
const rates = { ...DEFAULT_RATES, "90+": 50 };
const modeled = scenario(m.aging, rates);
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
};
const site = path.join(root, "docs");
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = path.resolve(
      site,
      "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname),
    );
    if (!file.startsWith(site + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("requestfailed", (request) => errors.push(request.url()));
const shots = [];
async function panel(name) {
  return page
    .locator(".panel")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
}
async function capture(id, title, targets) {
  await page.goto(url + "#" + id);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(page.getByText("$9,615,367.31", { exact: true })).toHaveCount(
    id === "executive" ? 1 : 0,
  );
  if (id === "decision") {
    await page
      .getByLabel("90+ days collection rate", { exact: true })
      .fill("50");
    await expect(page.locator(".kpi").nth(2)).toContainText(
      (modeled.total / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
    );
  }
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("heading", { name: title, exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  const pins = [];
  for (let i = 0; i < targets.length; i++) {
    const locator = await targets[i]();
    const box = await locator.boundingBox();
    if (!box || box.y < 0 || box.y + 12 > 900)
      throw new Error(`Pin ${i + 1} for ${id} falls outside screenshot`);
    pins.push({ number: i + 1, x: box.x + box.width - 16, y: box.y + 16 });
  }
  const filename = `${id}-handout.png`;
  await page.screenshot({ path: path.join(output, filename), fullPage: false });
  shots.push({ id, filename, pins, viewport: { width: 1440, height: 900 } });
}
try {
  await capture("executive", "Executive overview", [
    () => page.locator(".kpi").nth(0),
    () => panel("Budget vs. actual"),
    () => page.locator(".kpi").nth(3),
  ]);
  await capture("revenue", "Revenue assurance", [
    () => panel("Follow the funds"),
    () => panel("Two separate control stages"),
    () => panel("Reconciliation workbench"),
  ]);
  await capture("receivables", "Accounts receivable", [
    () => page.locator(".kpi").nth(0),
    () => panel("Aging of outstanding balances"),
    () => panel("Collection workbench"),
  ]);
  await capture("decision", "Decision Lab", [
    () => panel("Set collection assumptions"),
    () => page.locator(".kpi").nth(2),
    () => page.locator(".kpi").nth(3),
  ]);
  if (errors.length) throw new Error(errors.join("\n"));
  const facts = {
    asOf: data.asOf,
    budget: m.budget,
    actual: m.actual,
    variance: m.variance,
    variancePct: (Math.abs(m.variance) / m.budget) * 100,
    exceptionCount: m.exceptions.length,
    underReview: m.underReview,
    gross: m.gross,
    retained: m.retained,
    passThrough: m.passThrough,
    retainedPct: (m.retained / m.gross) * 100,
    bankGap: m.bankAbs,
    glGap: m.glAbs,
    openAR: m.openAR,
    overdue: m.overdue,
    overduePct: (m.overdue / m.openAR) * 100,
    ar90: m.ar90,
    baseline: baseline.total,
    scenario: modeled.total,
    incremental: modeled.total - baseline.total,
    rates,
  };
  await writeFile(
    path.join(output, "capture.json"),
    JSON.stringify(
      {
        captureSource:
          "Unmodified production website build in docs/, rendered through an internal local HTTP server. Public site direct access is blocked from this cloud session.",
        allDivisions: true,
        facts,
        shots,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Captured four authentic 2x application screenshots and source-derived financial annotations.",
  );
} finally {
  await browser.close();
  server.close();
}
