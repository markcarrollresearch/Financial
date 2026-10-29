import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  AS_OF,
  BUCKETS,
  DEFAULT_RATES,
  ageBucket,
  cents,
  divisionVariances,
  invoicesAsOf,
  metrics,
  normalizeSource,
  openExceptions,
  reconciliation,
  scenario,
  sourceRecord,
  sum,
  type Dataset,
} from "../src/finance/model";
const data: Dataset = JSON.parse(readFileSync("public/data.json", "utf-8"));
const expected = JSON.parse(readFileSync("qa/expected_values.json", "utf-8"));
const all = metrics(data);
const toCents = (value: number) => Math.round(value * 100);
const fixture = (): Dataset => ({
  asOf: AS_OF,
  rowCount: 0,
  hashes: {},
  tables: {
    FactARInvoices: [],
    FactARPaymentApplications: [],
    FactDepositBatches: [],
    FactGLCashPostings: [],
    FactCashReceipts: [],
    FactExceptions: [],
  },
});
describe("Supplied financial benchmarks, computed from original CSV records", () => {
  const cases: [string, number, string][] = [
    ["YTD budget", all.budget, "2026_ytd_jan_sep_budget"],
    ["YTD expenses", all.actual, "2026_ytd_jan_sep_expenses"],
    ["Variance", all.variance, "2026_ytd_jan_sep_budget_minus_expenses"],
    ["Open A/R", all.openAR, "ar_open_2026_09_30"],
    ["Overdue", all.overdue, "ar_past_due_2026_09_30"],
    ["90+ A/R", all.ar90, "ar_90plus_2026_09_30"],
    ["Under review", all.underReview, "open_exceptions_amount_under_review"],
    ["Matured bank absolute gaps", all.bankAbs, "matured_bank_abs_difference"],
    [
      "Matured GL absolute gaps",
      all.glAbs,
      "matured_gl_cash_clearing_abs_difference",
    ],
  ];
  it.each(cases)("%s matches to the cent", (_name, actual, key) =>
    expect(actual).toBe(toCents(expected[key])),
  );
  it("includes the required 10 open exceptions", () =>
    expect(all.exceptions).toHaveLength(expected.open_exception_count));
  it("keeps annual appropriation separate from YTD", () => {
    const annual = sum(
      data.tables.FactBudget.filter((r) => r.FiscalYear === "2026"),
      "BudgetAmount",
    );
    expect(annual).toBe(toCents(expected["2026_full_year_budget_reference"]));
    expect(annual).not.toBe(all.budget);
  });
  it("has zero confirmed loss across every source exception", () =>
    expect(sum(data.tables.FactExceptions, "ConfirmedLoss")).toBe(0));
  it("verifies 15 tables and 17,000 original rows", () => {
    expect(Object.keys(data.tables)).toHaveLength(15);
    expect(Object.values(data.tables).reduce((s, r) => s + r.length, 0)).toBe(
      17000,
    );
  });
});
describe("Reconciliation and grouping controls", () => {
  it("never nets shortfalls against overages", () => {
    const rows = all.batches.filter((b) => b.bankMature);
    expect(rows.reduce((s, b) => s + Math.abs(b.bankGap), 0)).toBe(all.bankAbs);
    expect(all.bankAbs).toBeGreaterThan(
      Math.abs(rows.reduce((s, b) => s + b.bankGap, 0)),
    );
  });
  it("reconciles every receipt split and every batch expected amount", () => {
    for (const r of data.tables.FactCashReceipts)
      expect(cents(r.GrossAmount)).toBe(
        cents(r.CountyRetainedAmount) + cents(r.AgencyPassThroughAmount),
      );
    for (const b of all.batches)
      expect(sum(b.receipts, "GrossAmount")).toBe(b.expected);
    expect(all.gross).toBe(all.retained + all.passThrough);
  });
  it("excludes Pending Not Due from bank and late batches from GL", () => {
    const pending = all.batches.filter((b) => !b.bankMature);
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.reduce((s, b) => s + b.expected, 0)).toBe(
      toCents(expected.pending_not_due_bank_receipts),
    );
    for (const b of all.batches)
      expect(b.glMature).toBe(b.source.ReceiptDate <= "2026-09-28");
  });
  it("excludes future bank and GL postings from cutoff", () => {
    const d = fixture();
    d.tables.FactDepositBatches = [
      {
        DepositBatchID: "B1",
        DivisionID: "D01",
        ReceiptDate: "2026-09-28",
        ExpectedFromReceipts: "100.00",
        BankAmount: "100.00",
        BankPostedDate: "2026-10-01",
        BankStatus: "Posted",
      },
    ];
    d.tables.FactGLCashPostings = [
      {
        DepositBatchID: "B1",
        PostingDate: "2026-10-01",
        PostedAmount: "100.00",
      },
    ];
    const b = reconciliation(d)[0];
    expect(b.bankGap).toBe(10000);
    expect(b.glGap).toBe(10000);
  });
  it("sums all dated postings per batch, not just the first posting", () => {
    const d = fixture();
    d.tables.FactDepositBatches = [
      {
        DepositBatchID: "B1",
        DivisionID: "D01",
        ReceiptDate: "2026-09-28",
        ExpectedFromReceipts: "100.00",
        BankAmount: "100.00",
        BankPostedDate: "2026-09-29",
        BankStatus: "Posted",
      },
    ];
    d.tables.FactGLCashPostings = [
      {
        DepositBatchID: "B1",
        PostingDate: "2026-09-29",
        PostedAmount: "40.00",
      },
      {
        DepositBatchID: "B1",
        PostingDate: "2026-09-30",
        PostedAmount: "60.00",
      },
    ];
    expect(reconciliation(d)[0].glGap).toBe(0);
  });
  it("has nine months whose totals reconcile exactly", () => {
    expect(all.monthly).toHaveLength(9);
    expect(all.monthly.reduce((s, r) => s + r.budget, 0)).toBe(all.budget);
    expect(all.monthly.reduce((s, r) => s + r.actual, 0)).toBe(all.actual);
  });
  it("division metrics add to all-division totals", () => {
    const divisions = data.tables.DimDivision.map((r) =>
      metrics(data, r.DivisionID),
    );
    for (const key of [
      "budget",
      "actual",
      "variance",
      "openAR",
      "overdue",
      "ar90",
      "underReview",
      "gross",
      "retained",
      "passThrough",
      "bankAbs",
      "glAbs",
    ] as const)
      expect(
        divisions.reduce((s, r) => s + r[key], 0),
        key,
      ).toBe(all[key]);
    expect(divisionVariances(data).reduce((s, r) => s + r.variance, 0)).toBe(
      all.variance,
    );
  });
});
describe("Historical A/R and exact bucket boundaries", () => {
  it.each([
    [0, "Not Due"],
    [1, "1–30"],
    [30, "1–30"],
    [31, "31–60"],
    [60, "31–60"],
    [61, "61–90"],
    [90, "61–90"],
    [91, "90+"],
  ] as const)("%d days belongs to %s", (days, bucket) =>
    expect(ageBucket(days)).toBe(bucket),
  );
  it("reconciles every invoice balance to independently supplied A/R snapshot", () => {
    // The extract has no quoted commas, but use the packaged original JSON-free CSV via a small CSV parser.
    const text = readFileSync(
      "data/analysis_ready/AR_Aging_AsOf_2026-09-30.csv",
      "utf-8",
    )
      .replace(/^\uFEFF/, "")
      .trim();
    const [header, ...lines] = text.split(/\r?\n/);
    const keys = header.split(",");
    const snapshots = new Map(
      lines.map((line) => {
        const cells = line.split(",");
        const row = Object.fromEntries(keys.map((k, i) => [k, cells[i]]));
        return [row.InvoiceID, row];
      }),
    );
    for (const invoice of all.invoices) {
      const snap = snapshots.get(invoice.id)!;
      expect(snap, invoice.id).toBeDefined();
      expect(invoice.balance, invoice.id).toBe(cents(snap.OutstandingAmount));
      expect(invoice.applied, invoice.id).toBe(cents(snap.PaidThroughAsOf));
      if (invoice.balance > 0)
        expect(invoice.bucket.replaceAll("–", "-"), invoice.id).toBe(
          snap.AgingBucket,
        );
    }
  });
  it("subtracts only dated applications, includes older invoices, and clamps balances to zero", () => {
    const d = fixture();
    d.tables.FactARInvoices = [
      {
        InvoiceID: "I1",
        InvoiceDate: "2025-01-01",
        DueDate: "2026-09-30",
        InvoiceAmount: "100.00",
        DivisionID: "D01",
      },
      {
        InvoiceID: "I2",
        InvoiceDate: "2026-10-01",
        DueDate: "2026-10-31",
        InvoiceAmount: "900.00",
        DivisionID: "D01",
      },
    ];
    d.tables.FactARPaymentApplications = [
      { InvoiceID: "I1", AppliedDate: "2026-09-29", AppliedAmount: "25.00" },
      { InvoiceID: "I1", AppliedDate: "2026-10-01", AppliedAmount: "75.00" },
    ];
    expect(invoicesAsOf(d)).toHaveLength(1);
    expect(invoicesAsOf(d)[0].balance).toBe(7500);
    expect(invoicesAsOf(d)[0].bucket).toBe("Not Due");
    d.tables.FactARPaymentApplications.push({
      InvoiceID: "I1",
      AppliedDate: "2026-09-30",
      AppliedAmount: "80.00",
    });
    expect(invoicesAsOf(d)[0].balance).toBe(0);
  });
  it("preserves all A/R in exactly one bucket", () => {
    expect(all.aging.reduce((s, a) => s + a.amount, 0)).toBe(all.openAR);
    expect(all.aging.slice(1).reduce((s, a) => s + a.amount, 0)).toBe(
      all.overdue,
    );
    expect(all.aging.map((a) => a.bucket)).toEqual(BUCKETS);
  });
});
describe("Evidence and scenario safeguards", () => {
  it("every open exception resolves to an original source record", () => {
    for (const e of all.exceptions)
      expect(sourceRecord(data, e), e.ExceptionID).toBeDefined();
  });
  it("normalizes EX012 lookup without rewriting original evidence", () => {
    const row = data.tables.FactExceptions.find(
      (e) => e.ExceptionID === "EX012",
    )!;
    expect(row.SourceTable).toBe("FactRemittances");
    expect(normalizeSource(row.SourceTable)).toBe("FactAgencyRemittances");
    expect(sourceRecord(data, row)?.RemittanceID).toBe(row.SourceRecordID);
  });
  it("excludes future exceptions and resolved-at-cutoff records", () => {
    const d = fixture();
    d.tables.FactExceptions = [
      { DetectedDate: "2026-10-01", Status: "Open", DivisionID: "D01" },
      {
        DetectedDate: "2026-08-01",
        Status: "Resolved",
        ResolvedDate: "2026-09-30",
        DivisionID: "D01",
      },
      {
        DetectedDate: "2026-09-01",
        Status: "Resolved",
        ResolvedDate: "2026-10-01",
        DivisionID: "D01",
      },
    ];
    expect(openExceptions(d)).toHaveLength(1);
  });
  it("baseline deterministic and defaults do not imply observed collection rates", () => {
    const r = scenario(all.aging, DEFAULT_RATES);
    expect(r.total).toBe(
      r.segments.reduce((s, a) => s + Math.round((a.amount * a.rate) / 100), 0),
    );
  });
  it("0% recovers zero and 100% recovers overdue balance only", () => {
    expect(
      scenario(all.aging, { "1–30": 0, "31–60": 0, "61–90": 0, "90+": 0 })
        .total,
    ).toBe(0);
    expect(
      scenario(all.aging, {
        "1–30": 100,
        "31–60": 100,
        "61–90": 100,
        "90+": 100,
      }).total,
    ).toBe(all.overdue);
  });
  it("a change in one bucket affects only that segment", () => {
    const base = scenario(all.aging, DEFAULT_RATES),
      changed = scenario(all.aging, { ...DEFAULT_RATES, "90+": 50 });
    expect(changed.segments.slice(0, 3)).toEqual(base.segments.slice(0, 3));
    expect(changed.total).toBeGreaterThan(base.total);
  });
  it("parses money exactly and rejects malformed source money", () => {
    expect(cents("0.29") + cents("0.01")).toBe(30);
    expect(cents("-71564.66")).toBe(-7156466);
    expect(cents("1.5")).toBe(150);
    expect(() => cents("12,000.00")).toThrow();
    expect(() => cents("1.999")).toThrow();
  });
});
