# AI development record

This log records the work actually performed by the AI coding agent in this session. It does not claim that an AI model runs inside the application or that a human review has already taken place.

## Human direction and governance

The user requested implementation of a complete standalone application with four experiences, correct CSV-driven financial metrics, unchanged Douglas County branding, Samsung landscape presentation support, explicit synthetic/independent disclosures, financial validation, local launch instructions, and a record of AI contributions. The user prohibited modifying the Power BI project or publishing without permission.

The original detailed implementation prompt is preserved in `requirements/CODEX_PROMPT_PASTE.txt`. `SPECIFICATION.md` defines the product and financial controls; `AGENTS.md` supplies the project guardrails. These are human-supplied requirements, not agent-created financial policies. The agent read all three before writing application files. The user subsequently supplied the complete `Douglas_County_Codex_Starter_Kit.zip` after the agent identified missing data/branding/QA files. The agent did not fabricate replacement data.

## What the agent performed

1. Inspected the existing empty Financial checkout and available tooling. Downloaded/read the four requirement attachments, then inspected and safely extracted the later ZIP in a temporary directory. Copied its data, logo, QA scripts, references and interview document into this standalone project. The requirement copies matched those in the ZIP.
2. Read the manifest and expected-values JSON; inspected original CSV schemas, division and exception records, the A/R snapshot and supplied HTML prototype. Visually inspected the supplied logo and design reference.
3. Ran the original standard-library validator: **43 checks passed**, 15 tables, 17,000 rows. Observed and retained its benign EX012 table-label warning.
4. Created a Vite + React + TypeScript project with Recharts, Lucide, custom CSS, Vitest, Playwright and axe-core. Corrected a sandbox npm-cache issue by using a writable cache, then made the project cache path portable. No TLS, package-signature or checksum verification was disabled.
5. Implemented a read-only CSV packager that checks the table manifest, preserves raw field strings, records SHA-256 hashes, and copies the supplied logo unchanged. Created pure TypeScript calculations using integer cents, ID joins and cutoff-aware dated applications/postings. Did not combine diagnostic extracts with the raw facts.
6. Implemented all four views, a shared division filter, a nine-month chart, exact monthly-value table, interactive aging and invoice workbench, separate control stages, source-evidence drawers, partial-payment ledger, search/sort/pagination, assumed-rate scenarios, reset, exports, print styles and in-app methodology.
7. Added **38 financial regression tests** against supplied benchmarks, snapshot balances, division additivity, date cutoffs, maturity rules, no-netting controls, receipt splits, source resolution, bucket boundaries and scenario limits. All passed.
8. Added browser tests for each experience, evidence navigation, exports, shared filters, keyboard focus trapping/restoration and browser history. Initial browser tests exposed an ambiguous filter accessible name and a phone-width overflow caused by an absolutely positioned screen-reader label inside a table. The agent added explicit labels and contained the table labels, then reran the affected suite. Financial tests did not require corrections to the supplied data.
9. Captured actual Chromium screenshots for all four views at **1280×800, 1600×900 and 390×844**. Inspected rendered screens and refined touch targets and layout. Added automated accessibility checks, corrected insufficient contrast on the Decision Lab action numbers, and recorded final results in `VALIDATION.md`.
10. Split the chart and React dependencies into separate built assets, removing the initial build chunk-size warning. Wrote the launch README, demo script, validation record and this AI work log. Built a local delivery ZIP including the compiled app, source, original synthetic data, QA and documentation.

## Agent-authored implementation inventory

- `package.json`, lockfile, TypeScript/Vite/Playwright configs, `.npmrc`, `.gitignore`, `index.html`.
- `scripts/build-data.py`: source packaging and hashing.
- `src/finance/model.ts`, `format.ts`: calculations, provenance navigation and exports.
- `src/data/context.tsx`, `src/App.tsx`, `main.tsx`: local loading, state, routing and error handling.
- `src/components/{UI,Charts,Details}.tsx`: reusable presentation and evidence views.
- `src/pages/{Executive,Revenue,Receivables,Decision}.tsx`: four experiences.
- `src/styles/global.css`: brand palette, tablet/desktop/mobile layout, keyboard focus and print styles.
- `tests/finance.test.ts`, `tests/browser/*.spec.ts`: financial, interaction, responsive and accessibility tests.
- `README.md`, this log, `docs/DEMO_SCRIPT.md`, `docs/VALIDATION.md`, and actual captured screenshots.

Original source CSVs, QA scripts, reference images/HTML, expected-values file, supplied requirement documents and logo were preserved. The separate Power BI project was not present in this workspace and was not accessed or changed. During the original implementation, no public deployment, remote Git push, paid API call or running-app AI integration was performed.

## Reusable cloud setup

The agent verified a frozen-lockfile `npm ci` installation and functional launch through both Vite development and Python serving the compiled app. It saved complete `install_script` and `start_skill` instructions to the cloud environment configuration draft. The save was confirmed; it does not publish an environment snapshot or deploy the web application. Review/save the draft in environment settings and publish the environment separately if you want to reuse the prepared snapshot. No new secrets or network domains were required.

## Human review still to perform

The agent's test results are automated evidence, not a substitute for professional judgment. No human financial or presentation sign-off was observed during implementation. The user can demonstrate governance by reviewing the source-to-metric definitions, one exception's original evidence, one invoice's dated application ledger, the scenario assumptions and the required cent-level benchmarks. Rehearse on the actual Samsung tablet; automated Chromium emulation is not physical-device testing. Obtain approval separately before any public hosting.

## Limitations

The runtime is a static analytical application over fixed synthetic records; it is not a County production accounting system. It does not save case notes, change source transactions, authenticate staff, integrate a ledger or infer fraud/loss. Collection scenarios are assumed arithmetic without an empirical forecast, time horizon or cost model. Public benchmark/service-volume sources are packaged but intentionally excluded from financial aggregation. Local server processes must be restarted after a machine reboot; internet-free operation still requires the local static files and server.

## Delivery retry

Chat download links did not deliver the cloud ZIP to the user. After the GitHub delivery option was discussed and the user requested another attempt, the agent prepared a `financial-lab-delivery` branch in the existing `markcarrollresearch/Financial` repository. It includes the application source and `downloads/financial-lab.zip` (the verified compiled application, data and documentation). No website deployment is part of this delivery. The actual GitHub upload outcome is reported in chat.

## Portable edition requested after the Windows launch problem

The user showed Windows reporting that `py` was not installed and requested an installable or portable application. The agent implemented a self-contained HTML release and an optional Windows x64 GUI launcher. This work reuses the same React screens and financial model; it does not substitute a simplified dashboard or invented figures.

- Added a dataset loader that reads embedded JSON in the portable edition and retains normal fetch behavior for development. The logo is embedded as a data URL using its original PNG bytes.
- Added an esbuild-based IIFE bundle with inline styles and source records, plus a restrictive no-network content policy. The release works without an HTTP server, Python, Node or online services.
- Added a Go launcher that embeds compressed HTML, verifies/reuses a content-addressed per-user cache copy, invokes the Windows default browser and exits. No background server or installer is required. Go was obtained from official HTTPS release metadata and its SHA-256 and size were verified before use; the recorded toolchain is in `desktop/toolchain.json`.
- Added a portable ZIP packager and short end-user instructions. Refreshed the original source ZIP so the earlier download link also contains the easy-open HTML and EXE at its top level. The optional EXE is unsigned, and the HTML is offered as the equivalent fallback if Windows blocks it.
- Added five offline browser checks covering all four views, exact values, source evidence, payment applications, filtering, scenario changes, CSV export, accessible controls and logo-byte integrity. Direct file navigation initially failed because cloud Chromium's managed policy blocks `file:` URLs. That policy was not altered. The harness renders the exact release HTML with networking disabled; direct navigation can be enabled in an unrestricted test browser with `FINANCIAL_TEST_FILE_URL=1`.
- Added four launcher tests for embedded content, spaces/Unicode paths, cache reuse/repair, browser hand-off and error propagation. Native Windows execution and actual Samsung device testing remain unverified; a Linux cross-compiled PE file is not represented as a Windows-tested installer.

The user had already authorized uploading the application and ZIP to the existing GitHub delivery branch. The portable release is a continuation of that approved delivery; no website deployment is involved.

## Browser hosting preparation

After the user reported Windows Security blocking the download and requested a cloud web app, the agent checked the available preview/publishing tools. This session offers no permanent ChatGPT-hosted web URL. The agent prepared a GitHub Pages build in `docs/`, retaining the original source, branding and documentation, and documented the publication steps in `docs/HOSTING.md`. This is a tested static-site preparation, not a claim that a public site has been deployed. Public hosting requires the user's approval separately from the earlier source/ZIP upload permission.

## GitHub Pages selected and nontechnical guide

The user selected GitHub Pages after the separate public-hosting permission question and asked for a nontechnical guide. The agent checked existing authentication names only, reused the injected GitHub CLI binding, and attempted read-only repository/Pages API requests. Both returned `Forbidden`; no credentials were exposed or requested. Native Git reads/pushes remain usable. The agent wrote `docs/GITHUB_PAGES_GUIDE.md` with the direct settings link and exact branch/folder choices, updated the hosting notes, and prepared to upload the website files. Enabling Pages in the user's account and verifying the live address remain distinct from a successful Git upload.
