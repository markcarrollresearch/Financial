# Validation evidence

These results were produced in the actual cloud workspace using the supplied starter-kit data. All required checks completed; there are no unresolved financial or application test failures.

| Check                                    | Actual outcome                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `python qa/validate_source_data.py data` | **43 / 43 passed**, 15 original tables, 17,000 rows                                                                                   |
| `npm test`                               | **38 / 38 passed** in Vitest, no skipped tests                                                                                        |
| `npm run build`                          | Passed strict TypeScript checks and Vite production compilation; no oversized-chunk warning after splitting chart dependencies        |
| `npm run test:e2e`                       | **8 / 8 passed** in Chromium, including automated accessibility checks                                                                |
| Responsive browser checks                | All four pages at **1280×800**, **1600×900**, **390×844**; no horizontal viewport overflow                                            |
| Runtime behavior                         | No uncaught page errors or external network requests in the multi-viewport browser test                                               |
| Source integrity                         | **27** original supplied files verified byte for byte against the original ZIP; public and compiled logos also match the original PNG |

The source validator emits one known, benign warning: EX012 names `FactRemittances`; the actual table is `FactAgencyRemittances`. The CSV remains unchanged. Navigation maps that label only when looking up the original source record.

## Exact all-division financial benchmarks

These are computed values tested against `qa/expected_values.json`, not embedded dashboard constants.

| Measure                                  | Verified result |
| ---------------------------------------- | --------------: |
| Jan–Sep 2026 budget                      |   $9,615,367.31 |
| Jan–Sep 2026 expenses                    |   $9,686,931.97 |
| Budget minus expenses                    |     −$71,564.66 |
| Open A/R at September 30                 |     $407,695.96 |
| Past-due A/R                             |     $242,507.80 |
| Strictly >90-day overdue A/R             |     $115,248.39 |
| Open exceptions                          |              10 |
| Open amount under review                 |     $188,892.83 |
| All-source confirmed loss                |           $0.00 |
| Matured bank absolute differences        |      $12,446.44 |
| Matured GL clearing absolute differences |     $145,006.39 |
| Separate full-year budget reference      |  $13,567,695.00 |

Additional financial checks verify every original receipt split, each deposit's expected receipt sum, every reconstructed invoice against the supplied static A/R extract, nine-month additivity, six-division additivity, cutoff dates, two-day maturity, bucket boundaries, no netting of overages/shortfalls, correct EX012 resolution, future-application exclusion, partial/overapplied payments, and deterministic 0%/100% scenarios.

## Browser and accessibility evidence

Automated interactions exercise:

- Executive exact metrics, monthly detail, division selection and a no-exception empty state.
- Bank and GL workbenches, batch source evidence, searchable exceptions and EX012 remittance navigation.
- Invoice search, dated payment-application ledger, partial-payment status, aging filtering, sort controls and CSV download.
- Scenario rate changes, 100% recovery boundary, reset and shared division context.
- Dialog focus trapping, Escape-to-close, trigger-focus restoration and browser back navigation.
- All four pages at the three viewport sizes with disclosure text, no viewport overflow, no page errors and no external requests.
- axe-core checks tagged WCAG 2 A/AA, 2.1 AA and 2.2 AA on every page and the Methods dialog: **zero automated violations** in the final run. This is not an accessibility certification or a substitute for manual screen-reader testing.

Actual screenshots are in `docs/screenshots/`: each page has `-1280.png`, `-1600.png` and `-390.png` versions. The agent visually inspected rendered executive, revenue, receivables and scenario screens. Initial browser failures were corrected (filter labeling, phone-width containment and action-number contrast) before the final passing run.

## Practical limits

A physical Samsung tablet, its browser rendering, touch behavior and local-network connectivity were not directly tested. Chromium viewport tests are the available evidence. Rehearse on the actual presentation device. Workbenches scroll vertically; horizontal scrolling is confined to data tables on narrow screens. There is no public deployment, external data integration, saved case management, AI forecast or service worker/PWA install. Runtime assets and financial records are local static files.
