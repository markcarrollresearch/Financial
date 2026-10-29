import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("all four pages and investigation dialog pass automated WCAG 2.2 AA checks", async ({
  page,
}) => {
  for (const id of ["executive", "revenue", "receivables", "decision"]) {
    await page.goto(`/#${id}`);
    await page.locator(".kpi").first().waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(
        results.violations.map((v) => ({
          id: v.id,
          description: v.description,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        null,
        2,
      ),
    ).toEqual([]);
  }
  await page.getByRole("button", { name: "Methods & source notes" }).click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
