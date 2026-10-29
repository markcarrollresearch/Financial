# Douglas County | Financial Intelligence & Controls Lab

A standalone, local React + TypeScript application for an independent interview demonstration. All financial transactions and customer records are synthetic. **Not produced by, endorsed by, or an official report of Douglas County.** No Power BI files are read or modified. No online API, AI model, Microsoft account, database, or credentials are required at runtime.

## Use the website — recommended

The browser-hosted version is prepared for GitHub Pages. Follow the [nontechnical setup guide](docs/GITHUB_PAGES_GUIDE.md) to enable the one-time Pages setting in your GitHub account. Select **Deploy from a branch → financial-lab-delivery → /docs → Save**.

After GitHub finishes publishing, the intended address is **https://markcarrollresearch.github.io/Financial/**. Open it on your computer or Samsung tablet; no download, Python, terminal, or software installation is required. Until Pages is enabled and verified, this is the intended address rather than a claim that the site is already live. The hosted version is public and needs internet access.

## Optional portable copy

[Download the portable ZIP](https://github.com/markcarrollresearch/Financial/raw/refs/heads/financial-lab-delivery/downloads/financial-lab-portable.zip).

1. Right-click the downloaded ZIP → **Extract All**.
2. Open the extracted **Financial Lab Portable** folder.
3. Double-click **OPEN FINANCIAL LAB.html**. The complete application opens in your usual browser.

That single HTML file includes the app, source-derived data, charts and unchanged County logo. Copy it to a USB drive if useful. It needs no Python, Node, installation, terminal, local server, internet, or administrator access. Close the browser tab when finished. F11 enters full screen on Windows.

The same folder also includes **Financial Lab.exe**, a portable Windows 10/11 x64 launcher. Double-click it to open the same application in your default browser. It extracts a content-addressed HTML copy to `%LOCALAPPDATA%\DouglasCountyFinancialLab` and exits, leaving no server running. The EXE is unsigned; if Windows blocks it, use the HTML file instead without changing Windows security settings. To remove the generated copy, delete only that application cache folder.

The EXE was cross-compiled and structurally checked in Linux, and its extraction/error-handling logic was tested. Actual Windows execution is not available in this cloud workspace. The HTML's complete functionality was tested with networking disabled using an offline Chromium document harness. Managed cloud Chromium prohibits direct `file:` navigation, so that policy was left unchanged; physical Windows, default-browser association and Samsung testing remain for the presenter. The portable package is a desktop browser application, not an Android installer.

## Develop or serve the web version

The original developer delivery retains its prebuilt `dist/` folder. Developers may run `python -m http.server 8000 --bind 127.0.0.1 --directory dist` to serve it locally. This is optional; the portable HTML above needs no server.

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

Generated `dist/`, `public/data.json`, caches and dependencies are ignored by Git. `npm ci` + `npm run build` reproduces the application from source. The compiled delivery is supplied for offline local use. The source and downloads were uploaded to the existing GitHub repository with the user’s approval; no website hosting has been deployed.

## Rebuild the portable editions

`npm run build:portable` builds and packages the single-file HTML edition. `npm run build:windows` additionally builds the optional Windows launcher; it requires the Go programming-language compiler (1.22+) on the build machine. Set `FINANCIAL_GO_BINARY` if the compiler is not on PATH. End users need none of these build tools.

`npm run test:portable` runs five offline browser checks against the built document. In an unrestricted test browser, set `FINANCIAL_TEST_FILE_URL=1` to exercise direct file navigation. `go test ./...` from `desktop/` tests launcher extraction, cache reuse/repair, browser hand-off and failure handling after building the portable HTML. See `desktop/README.md` for build details.
