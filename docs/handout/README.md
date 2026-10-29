# Interview handout

The four-page PDF is `../Financial-Lab-Interview-Guide.pdf`. It is also available in the repository's `downloads/` folder.

## Print

- Paper: **US Letter (8½ × 11 inches)**.
- Orientation: **Landscape**.
- Size: **Actual size / 100%**.
- For two sheets: print double-sided and **flip on the short edge**.
- Color is recommended; written labels and values also support grayscale reading.

Each page pairs one authentic application screenshot with three numbered interpretations, a leadership takeaway, a guardrail, and a QR code/link to the hosted app. Screenshots show the top viewport; additional workbench detail is available by scrolling in the actual application. The images are not AI-generated mockups. No source financial CSV or original logo was edited.

## The scenario shown

The Decision Lab screenshot deliberately changes only the 90+ collection assumption from 20% to 50%. Other assumed rates remain 80%, 60%, and 40%. Baseline recovery is $115,876.44; the scenario is $150,450.96; the difference is $34,574.52. These values are calculated from the source balances using the application's own financial functions. They are illustration assumptions, not empirical rates or forecasts.

## Presenter cues

1. **Overview:** “Are we on plan? Which division or control issue deserves attention?”
2. **Revenue:** “Whose money is it, and can we trace it from receipt to bank and ledger?”
3. **Receivables:** “What is still owed at the cutoff, and which balance needs the next contact?”
4. **Decision Lab:** “What changes under explicit assumptions, and what evidence should govern the decision?”

Introduce the handout as an independent interview concept using synthetic transactions. Explain that you supplied requirements and financial definitions, while the AI agent implemented the software and automated validation. Do not claim human financial sign-off or an AI forecasting model unless that work has actually occurred.

## Reproduce the handout

On the build machine, install `scripts/handout-requirements.txt` into an appropriate Python environment, then run `npm run build:handout`. The script uses Playwright and the application's model to capture the production website build already stored in `docs/`; a public-site connection is not required. Source measurements and marker positions are retained in `capture.json`, and paragraph measurements are in `layout.json`.

ReportLab embeds Liberation Sans regular and bold. The default font directory is `/usr/share/fonts/truetype/liberation`; `FINANCIAL_HANDOUT_FONT_DIR` can specify another directory containing those fonts. PyMuPDF/pypdf support document inspection; they are not required to read or print the finished PDF.

The public website's direct connection remains blocked by this cloud session's network policy. Captures came from the unmodified production build served internally, not a direct public URL request. The user reported the hosted app working. PDF geometry, link targets, text bounds, visible disclosures and source figures were checked; all four pages were rendered and visually inspected. Physical printing and QR scanning have not been performed.
