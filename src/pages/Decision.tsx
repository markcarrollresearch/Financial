import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useLab } from "../data/context";
import { DEFAULT_RATES, scenario } from "../finance/model";
import type { Rates } from "../finance/model";
import { compact, downloadCSV, money, percent } from "../finance/format";
import { Empty, KPI, Notice, Panel } from "../components/UI";
const keys = Object.keys(DEFAULT_RATES) as (keyof Rates)[];
export default function Decision() {
  const { m, division, divisionName, open } = useLab();
  const [rates, setRates] = useState<Rates>({ ...DEFAULT_RATES });
  const baseline = useMemo(() => scenario(m.aging, DEFAULT_RATES), [m.aging]),
    result = useMemo(() => scenario(m.aging, rates), [m.aging, rates]);
  const delta = result.total - baseline.total,
    max = Math.max(1, ...result.segments.map((s) => s.amount));
  const actions = m.exceptions.filter(
    (e) => e.SourceTable === "FactARInvoices",
  );
  const exportScenario = () =>
    downloadCSV("collection-scenario-2026-09-30.csv", [
      [
        "Assumed demonstration scenario — not a forecast or official County report",
      ],
      ["As of", "2026-09-30"],
      [
        "Division",
        division === "All" ? "All divisions" : divisionName(division),
      ],
      [
        "Bucket",
        "Outstanding",
        "Assumed rate (%)",
        "Scenario collection",
        "Baseline rate (%)",
      ],
      ...result.segments.map((s) => [
        s.bucket,
        (s.amount / 100).toFixed(2),
        s.rate,
        (s.collection / 100).toFixed(2),
        DEFAULT_RATES[s.bucket as keyof Rates],
      ]),
      ["Total scenario", (result.total / 100).toFixed(2)],
      ["Baseline", (baseline.total / 100).toFixed(2)],
      ["Incremental", (delta / 100).toFixed(2)],
    ]);
  return (
    <>
      <div className="scenario-banner">
        <SlidersHorizontal size={19} />
        <div>
          <strong>A decision tool. An explicit set of assumptions.</strong>
          <span>
            Change collection rates to compare outcomes. This is deterministic
            arithmetic, not an AI prediction or a verified forecast.
          </span>
        </div>
        <span className="badge">SIMULATION</span>
      </div>
      <div className="kpi-grid">
        <KPI
          label="Overdue starting balance"
          amount={m.overdue}
          note="Source-derived · excludes not-due A/R"
        />
        <KPI
          label="Assumed baseline recovery"
          amount={baseline.total}
          note="Default assumed rates · not historical"
        />
        <KPI
          label="Your scenario recovery"
          amount={result.total}
          note={`${percent(m.overdue ? result.total / m.overdue : 0)} of overdue balance`}
          tone="positive"
        />
        <KPI
          label="Incremental vs. baseline"
          amount={delta}
          note="Scenario recovery less assumed baseline"
          tone={delta >= 0 ? "positive" : "warning"}
        />
      </div>
      <div className="grid-scenario">
        <Panel
          title="Set collection assumptions"
          subtitle="Assumed rates · no empirical calibration"
          action={
            <button
              className="secondary-button"
              onClick={() => setRates({ ...DEFAULT_RATES })}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          }
        >
          <div className="scenario-inputs">
            {keys.map((key) => (
              <div className="scenario-input" key={key}>
                <div>
                  <label htmlFor={`rate-${key}`}>{key} days overdue</label>
                  <strong>
                    {rates[key]}
                    <span>%</span>
                  </strong>
                </div>
                <input
                  id={`rate-${key}`}
                  aria-label={`${key} days collection rate`}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={rates[key]}
                  onChange={(e) =>
                    setRates({ ...rates, [key]: Number(e.target.value) })
                  }
                />
                <small>
                  {money(m.aging.find((a) => a.bucket === key)?.amount ?? 0)}{" "}
                  eligible · baseline assumption {DEFAULT_RATES[key]}%
                </small>
              </div>
            ))}
          </div>
          <Notice>
            Changing assumptions does not change the source balances or imply
            that a collection action has occurred.
          </Notice>
        </Panel>
        <Panel
          title="The recovery opportunity"
          subtitle="Projected collections within each overdue balance"
          action={
            <button className="secondary-button" onClick={exportScenario}>
              <ArrowDownToLine size={15} />
              Export scenario
            </button>
          }
        >
          <div className="chart-legend">
            <span>
              <i style={{ background: "#006225" }} />
              Scenario recovery
            </span>
            <span>
              <i style={{ background: "#e7e9e2" }} />
              Unrecovered balance
            </span>
          </div>
          <div className="scenario-bars">
            {result.segments.map((s) => (
              <div key={s.bucket}>
                <div className="scenario-bar-top">
                  <strong>{s.bucket} days</strong>
                  <span>
                    {money(s.collection)} <small>of {compact(s.amount)}</small>
                  </span>
                </div>
                <div
                  className="scenario-track"
                  style={{ width: `${Math.max(1, (s.amount / max) * 100)}%` }}
                >
                  <div style={{ width: `${s.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="scenario-result">
            <span>Estimated remaining overdue</span>
            <strong>{money(m.overdue - result.total)}</strong>
          </div>
          <details className="chart-data">
            <summary>Inspect the calculation & baseline assumptions</summary>
            <p>
              For each overdue bucket: outstanding cents × assumed collection
              rate ÷ 100, rounded to the nearest cent. Sum the four rounded
              bucket results. Not-due balances are excluded. Incremental =
              scenario − baseline.
            </p>
            <p>
              Baseline inputs:{" "}
              {keys.map((k) => `${k} days: ${DEFAULT_RATES[k]}%`).join("; ")}.
              These are assumed demonstration inputs, not observed recovery
              rates. No costs, time horizon, or behavioral effects are modeled.
            </p>
          </details>
        </Panel>
      </div>
      <Panel
        title="A grounded next-action board"
        subtitle="Source-provided follow-up actions · investigate before concluding"
      >
        <div className="action-board">
          {actions.length ? (
            actions.map((e, i) => (
              <button
                key={e.ExceptionID}
                onClick={() => open({ kind: "exception", row: e })}
              >
                <span className="action-number">0{i + 1}</span>
                <div>
                  <span className="eyebrow">{divisionName(e.DivisionID)}</span>
                  <h3>{e.ExceptionType}</h3>
                  <p>{e.RequiredAction}</p>
                  <span className="text-link">
                    Inspect {e.SourceRecordID}
                    <ArrowRight size={14} />
                  </span>
                </div>
              </button>
            ))
          ) : (
            <Empty>
              No open A/R exceptions for this division. Use the invoice
              workbench to identify overdue balances.
            </Empty>
          )}
        </div>
      </Panel>
    </>
  );
}
