# Two-minute demonstration script and evidence checklist

**0:00–0:20 — What is this?** "I wanted to demonstrate a decision-support system rather than another collection of charts. This is a self-contained, independently developed concept using clearly labeled simulated financial transactions and a few separately cited annual public figures."

**0:20–0:45 — Executive oversight.** Open Executive Overview and show same-period YTD budget vs expense. Explain that an annual budget cannot be compared directly to nine months of actual expenditure. Filter by division.

**0:45–1:15 — Controls.** Open Revenue Assurance, separate pass-through funds from County-retained amounts, and select the seeded $975.25 bank shortfall. Emphasize that a flagged control item is not a proven loss and that normal settlement lag is excluded.

**1:15–1:35 — A/R.** Open A/R Workbench, choose an overdue invoice and view its payment applications. Explain that a balance is reconstructed as of September 30, not summed from monthly snapshots.

**1:35–1:50 — Decision Lab.** Change an assumed recovery rate and demonstrate a transparent scenario. Explicitly say this is a user-defined scenario, not an actual forecast.

**1:50–2:00 — AI authorship.** "I defined the financial logic, evidence requirements, controls, user journeys and acceptance tests. I used an AI coding agent to implement and iterate on the application, and I held it accountable to validated source totals. The point is not to outsource judgment; it's to accelerate execution without sacrificing it."

### Evidence to capture from the actual Codex run
- Original prompt and `SPECIFICATION.md` requirements.
- Actual files Codex created and edited.
- Exact data tests and `npm run build` result.
- Before/after screenshots or screen recording if available.
- Items the human reviewed, corrected or rejected.
- Anything untested or dependent on local machine configuration.

Never invent an agent history or claim the application includes an LLM if it runs only deterministic calculations.
