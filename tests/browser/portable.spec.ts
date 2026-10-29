import { expect, test } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";

const url = pathToFileURL(resolve("portable/OPEN FINANCIAL LAB.html")).href;

test.beforeEach(async ({ context, page }) => {
  await context.setOffline(true);
  // Cloud Chromium blocks file: URLs by managed policy. Do not alter that policy.
  // Render the exact release HTML with networking disabled; Windows can opt into
  // direct file navigation with FINANCIAL_TEST_FILE_URL=1.
  if (process.env.FINANCIAL_TEST_FILE_URL === "1") await page.goto(url);
  else
    await page.setContent(
      readFileSync(resolve("portable/OPEN FINANCIAL LAB.html"), "utf8"),
    );
  await expect(
    page.getByRole("heading", { name: "Executive overview", exact: true }),
  ).toBeVisible();
});

test("portable document renders entirely offline, with exact totals and unchanged logo", async ({
  page,
}) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  if (process.env.FINANCIAL_TEST_FILE_URL === "1") await page.reload();
  else
    await page.setContent(
      readFileSync(resolve("portable/OPEN FINANCIAL LAB.html"), "utf8"),
    );
  await expect(page.getByText("$9,615,367.31", { exact: true })).toBeVisible();
  await expect(page.getByText("$9,686,931.97", { exact: true })).toBeVisible();
  const logo = await page
    .getByRole("img", { name: "Douglas County Colorado", exact: true })
    .getAttribute("src");
  expect(logo).toMatch(/^data:image\/png;base64,/);
  const actual = Buffer.from(logo!.split(",")[1], "base64");
  expect(createHash("sha256").update(actual).digest("hex")).toBe(
    createHash("sha256")
      .update(readFileSync("assets/douglas_county_logo.png"))
      .digest("hex"),
  );
  expect(requests.filter((request) => !request.startsWith("file:"))).toEqual(
    [],
  );
  expect(errors).toEqual([]);
});

test("all four views, source evidence, and payment applications work offline", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Revenue assurance", exact: false })
    .first()
    .click();
  await expect(page.getByText("$12,446.44", { exact: true })).toBeVisible();
  await expect(page.getByText("$145,006.39", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "DB20260903D02", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Source receipts");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Accounts receivable", exact: false })
    .first()
    .click();
  await expect(page.getByText("$407,695.96", { exact: true })).toBeVisible();
  await page.getByLabel("Search invoices").fill("AR-SPECIAL-002");
  await page
    .getByRole("button", { name: "AR-SPECIAL-002", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Partially paid");
  await expect(page.getByRole("dialog")).toContainText(
    "Payment-application ledger",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Decision Lab", exact: false })
    .first()
    .click();
  const scenario = page.locator(".kpi").nth(2);
  const before = await scenario.textContent();
  await page
    .getByLabel("90+ days collection rate", { exact: true })
    .fill("100");
  await expect(scenario).not.toHaveText(before!);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(scenario).toHaveText(before!);
});

test("shared division filtering and responsive layout work without a server", async ({
  page,
}) => {
  await page.getByLabel("Division", { exact: true }).selectOption("D01");
  await expect(
    page.getByText("No open exceptions for this division.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Decision Lab", exact: false })
    .first()
    .click();
  await expect(page.getByLabel("Division", { exact: true })).toHaveValue("D01");
  for (const [width, height] of [
    [1280, 800],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("CSV export works from the embedded document while offline", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Accounts receivable", exact: false })
    .first()
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export filtered", exact: true })
    .click();
  const exported = await download;
  expect(exported.suggestedFilename()).toBe("receivables-as-of-2026-09-30.csv");
  const path = await exported.path();
  const csv = readFileSync(path!, "utf8");
  expect(csv).toContain("Synthetic financial data");
  expect(csv).toContain("AR-SPECIAL-001");
});

test("portable document retains accessible controls", async ({ page }) => {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  const trigger = page.getByRole("button", { name: "Methods & source notes" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
