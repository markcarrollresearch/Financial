/** Source values remain unchanged. Money is computed in integer cents. */
export type Row = Record<string, string>;
export interface Dataset {
  asOf: string;
  logoDataUrl?: string;
  tables: Record<string, Row[]>;
  hashes: Record<string, string>;
  rowCount: number;
}
export const AS_OF = "2026-09-30";
export const START = "2026-01-01";
export const CLEARING_CUTOFF = "2026-09-28";
export const BUCKETS = ["Not Due", "1–30", "31–60", "61–90", "90+"] as const;
export type Bucket = (typeof BUCKETS)[number];
export type Rates = Record<Exclude<Bucket, "Not Due">, number>;
export const DEFAULT_RATES: Rates = {
  "1–30": 80,
  "31–60": 60,
  "61–90": 40,
  "90+": 20,
};
export function cents(value: string | undefined): number {
  if (!value) return 0;
  if (!/^-?\d+(\.\d{1,2})?$/.test(value))
    throw new Error(`Invalid money: ${value}`);
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result))
    throw new Error("Money exceeds safe integer range");
  return negative ? -result : result;
}
export const sum = (rows: Row[], field: string) =>
  rows.reduce((s, r) => s + cents(r[field]), 0);
export const inPeriod = (date: string, start = START, end = AS_OF) =>
  !!date && date >= start && date <= end;
export const matchesDivision = (row: Row, division: string) =>
  division === "All" || row.DivisionID === division;
const priorityOrder: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};
export function openExceptions(
  data: Dataset,
  division = "All",
  cutoff = AS_OF,
) {
  // Status at cutoff, including subsequently resolved records if applicable.
  return data.tables.FactExceptions.filter(
    (r) =>
      matchesDivision(r, division) &&
      inPeriod(r.DetectedDate, START, cutoff) &&
      (!r.ResolvedDate || r.ResolvedDate > cutoff) &&
      (r.Status === "Open" || !!r.ResolvedDate),
  ).sort(
    (a, b) =>
      (priorityOrder[a.Priority] ?? 4) - (priorityOrder[b.Priority] ?? 4) ||
      cents(b.AmountUnderReview) - cents(a.AmountUnderReview),
  );
}
export interface Invoice {
  source: Row;
  id: string;
  division: string;
  amount: number;
  applied: number;
  balance: number;
  days: number;
  bucket: Bucket;
  applications: Row[];
}
export function ageBucket(days: number): Bucket {
  return days <= 0
    ? "Not Due"
    : days <= 30
      ? "1–30"
      : days <= 60
        ? "31–60"
        : days <= 90
          ? "61–90"
          : "90+";
}
export function invoicesAsOf(
  data: Dataset,
  division = "All",
  cutoff = AS_OF,
): Invoice[] {
  const apps = new Map<string, Row[]>();
  for (const r of data.tables.FactARPaymentApplications) {
    if (r.AppliedDate <= cutoff) {
      const list = apps.get(r.InvoiceID) ?? [];
      list.push(r);
      apps.set(r.InvoiceID, list);
    }
  }
  return data.tables.FactARInvoices.filter(
    (r) => matchesDivision(r, division) && r.InvoiceDate <= cutoff,
  ).map((r) => {
    const applications = (apps.get(r.InvoiceID) ?? []).sort((a, b) =>
      a.AppliedDate.localeCompare(b.AppliedDate),
    );
    const amount = cents(r.InvoiceAmount),
      applied = sum(applications, "AppliedAmount");
    const days = Math.max(
      0,
      Math.round(
        (Date.parse(cutoff + "T00:00:00Z") -
          Date.parse(r.DueDate + "T00:00:00Z")) /
          86400000,
      ),
    );
    return {
      source: r,
      id: r.InvoiceID,
      division: r.DivisionID,
      amount,
      applied,
      balance: Math.max(0, amount - applied),
      days,
      bucket: ageBucket(days),
      applications,
    };
  });
}
export interface Batch {
  source: Row;
  id: string;
  expected: number;
  bank: number;
  posted: number;
  bankGap: number;
  glGap: number;
  bankMature: boolean;
  glMature: boolean;
  postings: Row[];
  receipts: Row[];
}
export function reconciliation(data: Dataset, division = "All"): Batch[] {
  const postMap = new Map<string, Row[]>(),
    receiptMap = new Map<string, Row[]>();
  for (const r of data.tables.FactGLCashPostings)
    if (r.PostingDate <= AS_OF) {
      const list = postMap.get(r.DepositBatchID) ?? [];
      list.push(r);
      postMap.set(r.DepositBatchID, list);
    }
  for (const r of data.tables.FactCashReceipts)
    if (r.ReceiptDate <= AS_OF) {
      const list = receiptMap.get(r.DepositBatchID) ?? [];
      list.push(r);
      receiptMap.set(r.DepositBatchID, list);
    }
  return data.tables.FactDepositBatches.filter(
    (r) => matchesDivision(r, division) && inPeriod(r.ReceiptDate),
  ).map((r) => {
    const postings = postMap.get(r.DepositBatchID) ?? [],
      receipts = receiptMap.get(r.DepositBatchID) ?? [];
    const expected = cents(r.ExpectedFromReceipts),
      bank =
        r.BankPostedDate && r.BankPostedDate <= AS_OF ? cents(r.BankAmount) : 0,
      posted = sum(postings, "PostedAmount");
    return {
      source: r,
      id: r.DepositBatchID,
      expected,
      bank,
      posted,
      bankGap: expected - bank,
      glGap: expected - posted,
      bankMature: r.BankStatus !== "Pending Not Due",
      glMature: r.ReceiptDate <= CLEARING_CUTOFF,
      postings,
      receipts,
    };
  });
}
export function metrics(data: Dataset, division = "All") {
  const t = data.tables,
    budgetRows = t.FactBudget.filter(
      (r) => matchesDivision(r, division) && inPeriod(r.MonthStart),
    ),
    expenses = t.FactGLExpenses.filter(
      (r) => matchesDivision(r, division) && inPeriod(r.PostingDate),
    );
  const receipts = t.FactCashReceipts.filter(
    (r) => matchesDivision(r, division) && inPeriod(r.ReceiptDate),
  );
  const budget = sum(budgetRows, "BudgetAmount"),
    actual = sum(expenses, "ExpenseAmount");
  const exceptions = openExceptions(data, division),
    invoices = invoicesAsOf(data, division),
    batches = reconciliation(data, division);
  const aging = BUCKETS.map((bucket) => ({
    bucket,
    amount: invoices
      .filter((r) => r.bucket === bucket)
      .reduce((s, r) => s + r.balance, 0),
    count: invoices.filter((r) => r.bucket === bucket && r.balance > 0).length,
  }));
  const monthly = Array.from({ length: 9 }, (_, i) => {
    const prefix = `2026-${String(i + 1).padStart(2, "0")}`;
    return {
      month: new Date(Date.UTC(2026, i, 1)).toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC",
      }),
      budget: sum(
        budgetRows.filter((r) => r.MonthStart.startsWith(prefix)),
        "BudgetAmount",
      ),
      actual: sum(
        expenses.filter((r) => r.PostingDate.startsWith(prefix)),
        "ExpenseAmount",
      ),
    };
  });
  return {
    budget,
    actual,
    variance: budget - actual,
    exceptions,
    underReview: sum(exceptions, "AmountUnderReview"),
    gross: sum(receipts, "GrossAmount"),
    retained: sum(receipts, "CountyRetainedAmount"),
    passThrough: sum(receipts, "AgencyPassThroughAmount"),
    invoices,
    aging,
    openAR: invoices.reduce((s, r) => s + r.balance, 0),
    overdue: invoices
      .filter((r) => r.days > 0)
      .reduce((s, r) => s + r.balance, 0),
    ar90: aging[4].amount,
    batches,
    bankAbs: batches
      .filter((b) => b.bankMature)
      .reduce((s, b) => s + Math.abs(b.bankGap), 0),
    glAbs: batches
      .filter((b) => b.glMature)
      .reduce((s, b) => s + Math.abs(b.glGap), 0),
    monthly,
  };
}
export type Metrics = ReturnType<typeof metrics>;
export function divisionVariances(data: Dataset) {
  return data.tables.DimDivision.map((r) => {
    const budget = sum(
        data.tables.FactBudget.filter(
          (x) => x.DivisionID === r.DivisionID && inPeriod(x.MonthStart),
        ),
        "BudgetAmount",
      ),
      actual = sum(
        data.tables.FactGLExpenses.filter(
          (x) => x.DivisionID === r.DivisionID && inPeriod(x.PostingDate),
        ),
        "ExpenseAmount",
      );
    return {
      id: r.DivisionID,
      name: r.DivisionName,
      budget,
      actual,
      variance: budget - actual,
    };
  }).sort((a, b) => a.variance - b.variance);
}
export function scenario(aging: Metrics["aging"], rates: Rates) {
  const segments = aging
    .filter((a) => a.bucket !== "Not Due")
    .map((a) => ({
      ...a,
      rate: rates[a.bucket as keyof Rates],
      collection: Math.round((a.amount * rates[a.bucket as keyof Rates]) / 100),
    }));
  return { segments, total: segments.reduce((s, r) => s + r.collection, 0) };
}
export const normalizeSource = (source: string) =>
  source === "FactRemittances" ? "FactAgencyRemittances" : source;
export function sourceRecord(data: Dataset, exception: Row): Row | undefined {
  const table = normalizeSource(exception.SourceTable);
  const keys: Record<string, string> = {
    FactDepositBatches: "DepositBatchID",
    FactGLExpenses: "ExpenseEntryID",
    FactARInvoices: "InvoiceID",
    FactAgencyRemittances: "RemittanceID",
  };
  const key = keys[table];
  return key
    ? data.tables[table]?.find((r) => r[key] === exception.SourceRecordID)
    : undefined;
}
