# Douglas County | Financial Intelligence & Controls Lab

A standalone, local React + TypeScript application for an independent interview demonstration. All financial transactions and customer records are synthetic. **Not produced by, endorsed by, or an official report of Douglas County.** No Power BI files are read or modified. No online API, AI model, Microsoft account, database, or credentials are required at runtime.

## Open the finished application

The delivery ZIP includes the prebuilt `dist/` folder. After extracting it, open a terminal in the project folder and run:

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open **http://127.0.0.1:8000** in a browser on the same computer. On Windows, `py` can replace `python`. Keep the terminal open; press Ctrl+C to stop. Internet is unnecessary for this prebuilt version. Serve the directory rather than double-clicking `index.html`: browsers restrict loading local JSON over `file://`.

For development or a source checkout (requires Node.js 22.12+ and Python 3.10+):

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. To compile and serve the release:

```sh
npm run build
npm run preview
```

The preview uses **http://127.0.0.1:4173**. These servers bind to loopback by default. No public deployment has been performed. A tablet connecting to a different computer needs a separately configured local-network connection; device firewall/connectivity and physical Samsung hardware remain to be tested by the presenter. Do not assume a tablet can access the computer's loopback address. For an internet-free interview, rehearse on the presentation device and retain a laptop fallback.

## What works

- **Executive overview:** Jan–Sep budget, comparable expenses, favorable/unfavorable variance, nine-month chart with exact-value table, interactive division ranking, and priority-ranked control investigations.
- **Revenue assurance:** retained versus agency funds; independent bank and GL-clearing controls; batch workbench with separate pending/timing items; exception search and priority filter; original receipt, GL posting, remittance and expense evidence.
- **Accounts receivable:** Sep 30 point-in-time balances reconstructed from dated applications; interactive aging filters; searchable, sortable, paginated invoice queue; partial/full payment detail and application ledger.
- **Decision Lab:** editable overdue collection assumptions, explicit assumed baseline, reset, deterministic segment results, and source-grounded next actions. These are simulations, not forecasts or AI predictions.
- Shared six-division filter, keyboard-accessible native dialogs, source/method notes, CSV exports and print styling. The application is read-only; there is no saved case-management workflow or backend.

## Validation

```sh
npm run test:source
npm test
npm run build
npm run test:e2e
```

The supplied Python validator passes **43/43** source checks. The additional TypeScript suite passes **38** tests, including all required cent-level benchmarks and every A/R snapshot balance. The only supplied source warning is EX012's `FactRemittances` label: it is normalized **only for display/navigation** to `FactAgencyRemittances`.

Browser tests use Playwright and Chromium. In this cloud workspace, Chromium is `/usr/bin/chromium`. On another machine, install the test browser with `npx playwright install chromium`; the configuration falls back to Playwright’s installed Chromium when the system path is absent. `PLAYWRIGHT_CHROMIUM_PATH` can override the executable if needed. No browser is needed to run the app, unit tests, or build beyond a normal user browser for viewing.

See [QA evidence](docs/VALIDATION.md), [AI development log](docs/AI_DEVELOPMENT_LOG.md), and the [two-minute demo](docs/DEMO_SCRIPT.md). Screenshots are in `docs/screenshots/`.

## Financial boundaries

All monetary calculations use **integer cents**, sourced from `data/csv/`. No illustrative operational amounts are hardcoded. The full-year budget is not the Jan–Sep plan. Expenses are an expense-only subledger. Agency pass-through is not owned County revenue. A/R is a single point-in-time balance, with due-date buckets and future applications excluded. Reconciliation uses absolute gaps **per batch**; bank and cash-clearing stages are never added together. Under-review amounts are not established losses.

The fixed cutoff is **2026-09-30**. GL maturity uses batches through **2026-09-28**, an illustrative two-calendar-day buffer. The in-app Methods panel explains the exact definitions. The baseline scenario rates (80%, 60%, 40%, 20%) are plainly assumed demonstration inputs, not empirical recovery rates.

## Source integrity and project structure

`scripts/build-data.py` reads the immutable 15-table inventory, verifies column names and row counts against `data/INPUT_MANIFEST.json`, packages the original records into `public/data.json`, and copies the supplied logo byte for byte. The package includes SHA-256 hashes, viewable in the app. `data/analysis_ready/` is used for tests only, never combined with raw financial facts. Public annual reference figures and service-volume tables are retained but not mixed into synthetic financial charts.

```text
src/pages/          Four interconnected experiences
src/components/     Shared panels, dialogs, charts, source evidence
src/finance/        Pure integer-cent financial logic and formatting
src/data/           Shared application context
scripts/            Manifest-checked local CSV packaging
qa/                 Original supplied validator and reference values
tests/             Financial regression and browser/accessibility tests
assets/             Original supplied County logo
data/               Original immutable CSVs, snapshot checks, inventory
reference/          Supplied design inspiration, unchanged
requirements/       Original user prompt and starter-kit instructions
docs/               AI work log, demo script, validation and screenshots
```

Generated `dist/`, `public/data.json`, caches and dependencies are ignored by Git. `npm ci` + `npm run build` reproduces the application from source. The compiled delivery is supplied for offline local use; no public hosting or repository push has occurred.
