# Douglas County | Codex Web-App Starter Kit

**Goal:** Ask Codex to build a premium, standalone "Financial Intelligence & Controls Lab" as a complement/fallback to an independently created Power BI interview demo. The app is based on simulated transaction data, not actual County financial results.

## Start in Codex (Windows desktop)

1. Extract this ZIP to a new folder such as `C:\DouglasCounty\FinancialControlsLab`.
2. Open **Codex** in the ChatGPT desktop app and select this exact local project folder. Use a local task with access to the folder.
3. Open `CODEX_PROMPT_PASTE.txt`, copy its whole contents, and paste as your first Codex request. `AGENTS.md` and `SPECIFICATION.md` are already here so the agent can read them.
4. Authorize local reads/edits and local build commands as appropriate. **Do not approve deployment or paid services** until you review the result.
5. When Codex finishes, follow the new application's README. For a Vite project this will usually be `npm install`, `npm run dev`, then open its localhost address. Ask Codex to verify the exact commands.
6. Show the final web app in landscape on the Samsung tablet using a local-network server or a static host **only with your permission**, or use a laptop browser fallback. Test the connection and keep an offline contingency.

## Files
- `CODEX_PROMPT_PASTE.txt` — full pasteable task prompt; includes the design and numerical acceptance checks.
- `SPECIFICATION.md` — complete requirements, business definitions and QA acceptance criteria.
- `AGENTS.md` — lasting implementation guardrails read by Codex.
- `data/csv/` — 15 original raw data tables, 17,000 rows, all financial transactions synthetic.
- `data/analysis_ready/` — 2 cross-check extracts; do not double-count against raw facts.
- `data/INPUT_MANIFEST.json` — table/column and row-count inventory.
- `qa/validate_source_data.py` — standard-library validation script. Run `python qa/validate_source_data.py data`.
- `qa/expected_values.json` — exact financial benchmarks for regression testing.
- `assets/douglas_county_logo.png` — supplied County logo image, unchanged.
- `reference/Existing_Interactive_Prototype.html` — working offline reference for design and interactions, not a substitute for the new app.
- `reference/Executive_Design_Reference.png` — visual direction.
- `docs/INTERVIEW_DEMO.md` — demonstration and AI-development explanation.

The web app uses CSVs directly; it does not need to read or modify your existing `.pbix` or `.pbip` files. The `.pbip` file alone typically points at nearby project folders and is not a standalone report.

**Critical financial distinction:** this is an independent interview exercise, not an official Douglas County report. Some published annual references are separately sourced in `FactPublishedBenchmarks.csv`; the detailed accounting and operational records are simulated. Each page needs that disclosure.
