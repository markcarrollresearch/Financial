import { test, expect } from "@playwright/test";
const disclosure =
  "Independent interview concept · Synthetic financial data · Not an official County report.";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Executive overview", exact: true }),
  ).toBeVisible();
});
test("executive: exact metrics, nine months, division selection and empty states", async ({
  page,
}) => {
  await expect(page.getByText("$9,615,367.31", { exact: true })).toBeVisible();
  await expect(page.getByText("$9,686,931.97", { exact: true })).toBeVisible();
  await expect(page.getByText("-$71,564.66", { exact: true })).toBeVisible();
  await expect(page.getByText(disclosure, { exact: true })).toBeVisible();
  await page.getByText("View monthly amounts", { exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Sep" })).toBeVisible();
  await page.getByLabel("Division", { exact: true }).selectOption("D01");
  await expect(
    page.getByText("No open exceptions for this division.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("$9,615,367.31", { exact: true })).toHaveCount(0);
  await page.getByLabel("Division", { exact: true }).selectOption("All");
  await expect(page.getByText("$9,615,367.31", { exact: true })).toBeVisible();
});
test("revenue: separate control checks, batch evidence, source remittance and queue search", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Revenue assurance", exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Revenue assurance", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("$12,446.44", { exact: true })).toBeVisible();
  await expect(page.getByText("$145,006.39", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "DB20260903D02", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("Source receipts", { exact: false }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "GL clearing differences", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "DB20260902D03", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search exceptions").fill("EX012");
  await page
    .getByRole("button", { name: /Agency remittance variance/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "FactRemittances / RM20260913D03",
  );
  await expect(page.getByRole("dialog")).toContainText("FactAgencyRemittances");
  await page
    .getByText("Inspect original source fields", { exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("RM20260913D03");
});
test("A/R: aging, invoice applications, searching, sorting and export", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Accounts receivable", exact: false })
    .first()
    .click();
  await expect(page.getByText("$407,695.96", { exact: true })).toBeVisible();
  await expect(page.getByText("$242,507.80", { exact: true })).toBeVisible();
  await page.getByLabel("Search invoices").fill("AR-SPECIAL-002");
  await page
    .getByRole("button", { name: "AR-SPECIAL-002", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Partially paid");
  await expect(page.getByRole("dialog")).toContainText(
    "Payment-application ledger",
  );
  await expect(
    page.getByRole("dialog").getByRole("cell", { name: /\$/ }),
  ).not.toHaveCount(0);
  await page.getByRole("button", { name: "Close details" }).click();
  await page.getByLabel("Search invoices").fill("");
  await page
    .getByRole("button", { name: "90+", exact: false })
    .filter({ hasText: "invoices" })
    .click();
  await expect(page.getByLabel("Aging", { exact: true })).toHaveValue("90+");
  await page.getByRole("button", { name: "Remaining", exact: false }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export filtered" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "receivables-as-of-2026-09-30.csv",
  );
});
test("Decision Lab: sliders change deterministic totals, reset and division context", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Decision Lab", exact: false })
    .first()
    .click();
  await expect(
    page.getByText("Your scenario recovery", { exact: true }),
  ).toBeVisible();
  const cards = page.locator(".kpi");
  const baseline = await cards.nth(2).textContent();
  await page
    .getByLabel("90+ days collection rate", { exact: true })
    .fill("100");
  await expect(cards.nth(2)).not.toHaveText(baseline!);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(cards.nth(2)).toHaveText(baseline!);
  for (const bucket of ["1–30", "31–60", "61–90", "90+"])
    await page
      .getByLabel(`${bucket} days collection rate`, { exact: true })
      .fill("100");
  await expect(
    cards.nth(2).getByText("$242,507.80", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Division", { exact: true }).selectOption("D01");
  await expect(
    page.getByText("No open A/R exceptions for this division.", {
      exact: false,
    }),
  ).toBeVisible();
});
test("keyboard dialog traps focus, closes with Escape and restores trigger focus", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "Methods & source notes" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The numbers, explained" }),
  ).toBeVisible();
  for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => document.activeElement?.closest("dialog") !== null,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
test("all pages are local, error free, and do not overflow at tablet, desktop or phone widths", async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4173") &&
      !r.url().startsWith("data:")
    )
      external.push(r.url());
  });
  for (const [width, height] of [
    [1280, 800],
    [1600, 900],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const [id, label] of [
      ["executive", "Executive overview"],
      ["revenue", "Revenue assurance"],
      ["receivables", "Accounts receivable"],
      ["decision", "Decision Lab"],
    ]) {
      await page.goto(`/#${id}`);
      await expect(
        page.getByRole("heading", { name: label, exact: true }),
      ).toBeVisible();
      await expect(page.getByText(disclosure, { exact: true })).toBeVisible();
      await page.locator(".kpi").first().waitFor();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${id} at ${width}`,
      ).toBe(true);
      await page.screenshot({
        path: `docs/screenshots/${id}-${width}.png`,
        fullPage: true,
      });
    }
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test("back/forward navigation and shared division context", async ({
  page,
}) => {
  await page.getByLabel("Division", { exact: true }).selectOption("D03");
  await page
    .getByRole("button", { name: "Accounts receivable", exact: false })
    .first()
    .click();
  await expect(page.getByLabel("Division", { exact: true })).toHaveValue("D03");
  await page
    .getByRole("button", { name: "Decision Lab", exact: false })
    .first()
    .click();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Accounts receivable", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Division", { exact: true })).toHaveValue("D03");
});
