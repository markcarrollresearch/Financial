# Douglas County | Financial Intelligence & Controls Lab

## Product mission
Build a **standalone, responsive local web application** that complements the interview Power BI report and also works as a fallback if publishing or internet access fails. This is a demonstration of AI-directed analytical development, financial judgment, and operational decision support—not merely a visual mockup. The source transactions are synthetic; the end product is neither produced by nor endorsed by Douglas County.

### Presentation and intended audience
- **CFO / Chief Deputy:** see same-period financial plan/actual performance, variances, exceptions and decisions.
- **Accounting:** drill to dated invoice applications, deposits, source batches and actionable exception worklists.
- **Deputy Director:** integrate finance and operational oversight, compare options and explain governance and controls.
- **Panel:** understand the user directed an AI coding agent and independently reviewed the underlying financial definitions and tests.

## Deliverable priority / scope
**MVP 1 (required):** self-contained responsive executive overview with correct CSV-driven metrics, division filter, January–September 2026 monthly trend, budget vs actual and exception drawer. The app must already run locally.

**MVP 2 (required):** Revenue Assurance and A/R Workbench connected to the original data with correct financial logic. Include real interactive investigation, not only decorative charts.

**MVP 3 (distinctive enhancement):** Decision Lab with a user-editable collection scenario and prioritized actions. A visualization of changing assumptions is useful; do not pretend it is a predictive AI model. Add download/print export or PWA offline install if core screens are complete.

The first 3 pages should be completed before elaborate animations, external hosting, sign-in or optional APIs. Do not attempt to replicate a complete governmental finance/GAAP system from incomplete source ledgers.

## Architecture
Recommended: Vite + React + TypeScript. Charts: Recharts or another lightweight accessible library. Icons: Lucide. Styling: custom CSS variables and reusable components (avoid a generic default dashboard). Processing: small standard-library Python or TypeScript ETL converts CSVs to typed JSON. Runtime should require no online API, keys, Azure tenant, database or Power BI license. All values must be produced from source CSVs. No embedded illustrative financial numbers in operational code except validated QA assertions and UI labels.

Suggested structure:

```
  src/
    components/           # AppShell, FilterBar, KpiCard, TrendChart, DataTable, DetailDrawer
    pages/                # Executive, RevenueAssurance, AccountsReceivable, DecisionLab
    data/                 # generated JSON / typed model / data loaders
    finance/              # pure financial calculations and testing utilities
    styles/               # theme variables and global styles
  scripts/build-data.*    # transforms packaged csv source, validates manifest
  tests/                 # key calculation checks and one smoke test per page
  public/                # if needed for app manifest or static assets
  docs/AI_DEVELOPMENT_LOG.md
  docs/DEMO_SCRIPT.md
```

If the environment can't install dependencies, prioritize a fully functioning dependency-light single-page app; never spend the available implementation time on npm/package troubleshooting alone.

## Design system
- Actual user-supplied logo: `assets/douglas_county_logo.png`—**use unchanged**, ideally on white/off-white as image lettering is dark and PNG is transparent. Do not draw a fake seal.
- Burgundy `#762123` for identity/nav; green `#006225` for positive/primary analysis; warm white `#FAFAF8` and true white surfaces; text `#2B2D2C`; restrained neutral `#59645E`; differentiate warnings/red from normal burgundy identity.
- Professional civic-finance design: generous whitespace, meaningful card titles, high-quality charts, strong typographic hierarchy, precise dollar formatting; no stock photos, spinning gauges or neon charts.
- Responsive landscape Samsung tablet around 1280 x 800 or 1600 x 900; minimum ~44px tap targets, no clipped KPIs or horizontal viewport scroll. Also work on laptop/desktop. Prefer 16:9 or near equivalent layout. Ensure proper focus indicators and useful keyboard interaction.
- Always render: `Independent interview concept · Synthetic financial data · Not an official County report.` Clearly label independently published service/budget reference points when displayed.
- Provide concise in-app method note: source type, as-of date 2026-09-30, 2026 YTD window Jan-Sep, and limits of sample data.
- `reference/Existing_Interactive_Prototype.html` is **design inspiration**, not authoritative calculation logic. Rebuild as maintainable, accessible components with CSV-derived metrics.

## Source-to-metric contract
Primary CSVs in `data/csv/`:

| Question | Primary sources | Rule |
|---|---|---|
| Budget YTD | FactBudget + DimDivision | Sum BudgetAmount with MonthStart Jan 1 to Sep 30, 2026. |
| Expenses YTD | FactGLExpenses | Sum ExpenseAmount by PostingDate, comparable Jan-Sep 2026. Expense-only subledger, not a balanced GL. |
| Budget variance | Both above | Budget - expenses; negative is unfavorable. |
| Cash collected | FactCashReceipts | Sum GrossAmount, CountyRetainedAmount, AgencyPassThroughAmount in comparable date window; gross=retained+pass through row-by-row. |
| A/R as-of | FactARInvoices + FactARPaymentApplications | For invoices InvoiceDate <= cutoff: max(0, InvoiceAmount - SUM(AppliedAmount where AppliedDate <= cutoff)); no summing monthly A/R snapshots. |
| Overdue A/R | Same | For open positive balances, DueDate < cutoff; 90+ = days past due >90, confirm snapshot bucket definition. |
| Bank reconciliation | FactDepositBatches | Per batch ExpectedFromReceipts - BankAmount, exclude BankStatus 'Pending Not Due' from matured check as-of Sep 30. Keep differences by batch (abs before aggregating). |
| GL cash clearing | FactDepositBatches + FactGLCashPostings | Sum postings by DepositBatchID; compare expected receipts to postings only on batches with ReceiptDate <= 2026-09-28 (illustrative 2-day maturity buffer). |
| Exceptions | FactExceptions | Open records only; AmountUnderReview ≠ ConfirmedLoss; SourceRecordID should connect to correct source detail. |
| Service context | FactServiceVolumes + DimServiceMetric | ServiceMetricID-specific counts; never sum unlike measures (e.g., pages and transactions). |
| Public reference figures | FactPublishedBenchmarks | Clearly display year/source URL, not mixed with synthetic monthly trends. |

Extra join rules: InvoiceID -> PaymentApplications.InvoiceID; DepositBatchID -> Receipts and CashPostings; DivisionID -> DimDivision. Use ID-based joins rather than labels. A receipt's InvoiceID may be blank, which is normal. Do not join payment applications to receipts unless required and one-to-many issues are tested.

**Important cutoff:** transactions include dates beyond 2026-09-30 in some 2026 budget periods. DO NOT infer actuals or exceptions later than reference as-of date. Distinguish annual budget baseline ($13.567695M) from January–September YTD ($9.61536731M). `data/analysis_ready/Executive_Monthly_Starter.csv` duplicates source sums and is allowed only as a separately labeled diagnostic comparison, never combined with raw facts. `data/analysis_ready/AR_Aging_AsOf_2026-09-30.csv` is a **single snapshot** and may verify or power a fixed-date A/R view, but not cross-month additive totals.

## Screen 1 — Executive Financial Overview
- Large header, subtle month range label, County logo, division selector (All, 6 divisions), clear synthetic-data disclosure.
- Cards: YTD Budget, YTD Actual Expenses, Variance (green if favorable, warning if unfavorable), Open Control Exceptions.
- Budget vs actual chart with monthly amounts for Jan-Sep 2026, tooltips, readable axes.
- Ranked division variances, with expense category optional if time.
- Management Attention cards/table: top open exceptions by priority and amount, click to open detail with original SourceRecordID, RequiredAction, OwnerRole, InvestigationNote and a clear "under review / no established loss" message.
- Nice empty states for divisions without exceptions; filtering should change all relevant visual numbers.

## Screen 2 — Revenue Assurance & Reconciliation
- Gross receipts, retained collections, agency pass-through and open issues by selected division + Jan–Sep window.
- Chart illustrating retained/pass-through split. Never label agency pass-through as owned County revenue or profit.
- Side-by-side matured bank and mature cash-clearing checks (don't add them together; they are different control stages).
- Grouped list of problematic bank batches and GL posting discrepancies; statuses distinct: Posted, Pending Not Due, missing, timing, under investigation. Show sample source batch and recorded date, banked amount, posted amount, shortfall/excess.
- Filterable exception queue; select row to show evidence and proposed follow-up from dataset. Do not claim fraud, write off, or actual loss.

## Screen 3 — A/R Workbench
- Point-in-time Sep 30 2026 open A/R, past-due A/R, 90+ aging and overdue share; honor selected division.
- Aging distribution: Not Due / 1–30 / 31–60 / 61–90 / 90+ by **outstanding** balance. Dataset's stored AgingBucket can be used for verifying static snapshot if bucket thresholds differ; document the exact convention.
- Searchable sortable invoice table with InvoiceID, simulated customer classification, due date, days past due, invoice amount, applied amount and remaining balance.
- Clicking an invoice opens a payment-application ledger with date, amount and original invoice; distinguish full/partial payments.
- As-of selector OPTIONAL; if present it must recalculate using AppliedDate ≤ selected cutoff. Otherwise clearly freeze A/R as of Sep 30 rather than incorrectly applying the report month slicer to its snapshot.

## Screen 4 — Decision Lab (complement to Power BI)
A well-designed, **deterministic** scenario comparison is the unique differentiator. Show sliders or clearly labeled inputs for assumed collectability of overdue A/R buckets (e.g., 1-30, 31-60, 61-90, 90+) and optionally the cost of handling a case. Calculate projected collections as SUM(open bucket balance × scenario collection rate), then show baseline, scenario, incremental recovery and priority segments. Defaults should be plainly marked assumed demonstration inputs, NOT verified empirical recovery rates or real forecast. Ability to reset defaults and inspect formulas. Include a small "Next actions" board, grounded in the source's required actions; avoid hallucinated investigative conclusions.

## Development evidence
Create `docs/AI_DEVELOPMENT_LOG.md` during implementation with the actual prompt, files created/changed, data transformations, financial tests run, screenshots captured and unresolved limitations. Distinguish human product requirements/governance from agent-generated implementation. Be truthful; do not claim you used a deployed predictive AI model, Copilot, or an LLM agent inside the running app unless an actual integration exists. This application is demonstrably **AI-developed with human-defined controls**, even if it runs deterministically.

## Quality gates / acceptance criteria
1. Run `python qa/validate_source_data.py data`; expect all 43 checks pass. Existing source has a benign exception SourceTable text mismatch: EX012 says `FactRemittances` instead of `FactAgencyRemittances`; normalize display lookup only.
2. All unfiltered Jan–Sep 2026 and 2026-09-30 as-of results match `qa/expected_values.json` **to the cent**, including: budget $9,615,367.31; expenses $9,686,931.97; variance -$71,564.66; A/R $407,695.96; overdue $242,507.80; 90+ $115,248.39; 10 open exceptions; $188,892.83 under review; bank matured abs $12,446.44; cash-clearing matured abs $145,006.39. Assert computed values, not hardcoded labels.
3. Charts, cards and tables respond coherently when switching division; empty states don't crash. Details crosslink to valid source IDs. No known duplicate / cross-stage financial summing.
4. `npm run build` succeeds (when using Node stack), test script exits 0. If screenshot/browser tooling available, inspect 1280x800 and desktop views; otherwise document manual check remaining.
5. Logo unchanged, no other consulting brand, prominent synthetic/proof-of-concept disclosure on every page, accessible contrast/keyboard focus, responsive layout.
6. No hosting, publishing, external accounts, data uploads or paid API calls without explicit user approval.
7. If time is short, prefer 3 polished, accurate pages + one working scenario over 10 half-finished features.
