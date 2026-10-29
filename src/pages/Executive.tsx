import {
  ArrowRight,
  CircleDollarSign,
  Flag,
  Layers3,
  TrendingUp,
} from "lucide-react";
import { useLab } from "../data/context";
import { divisionVariances } from "../finance/model";
import { compact, money, percent } from "../finance/format";
import { ExceptionList, KPI, Notice, Panel } from "../components/UI";
import { TrendChart } from "../components/Charts";
export default function Executive() {
  const { data, m, division, divisionName, setDivision, open, navigate } =
    useLab();
  const divisions = divisionVariances(data),
    max = Math.max(1, ...divisions.map((d) => Math.abs(d.variance)));
  return (
    <>
      <div className="kpi-grid">
        <KPI
          label="YTD budget"
          amount={m.budget}
          note="January–September plan"
          icon={<Layers3 size={16} />}
        />
        <KPI
          label="Actual expenses"
          amount={m.actual}
          note="Comparable-period expenditure"
          icon={<CircleDollarSign size={16} />}
        />
        <KPI
          label="Budget variance"
          amount={m.variance}
          tone={m.variance < 0 ? "warning" : "positive"}
          note={
            m.variance < 0
              ? "Unfavorable · actual above plan"
              : "Favorable · actual below plan"
          }
          icon={<TrendingUp size={16} />}
        />
        <KPI
          label="Open control exceptions"
          value={String(m.exceptions.length)}
          note={`${compact(m.underReview)} under review · no established loss`}
          tone="identity"
          icon={<Flag size={16} />}
        />
      </div>
      <div className="insight-strip">
        <span className="insight-label">THE LEADERSHIP READ</span>
        <p>
          {m.budget ? (
            <>
              Expenses are{" "}
              <strong>
                {percent(Math.abs(m.variance) / m.budget)}{" "}
                {m.variance < 0 ? "above" : "below"} plan.
              </strong>{" "}
              Review the drivers alongside open control items.
            </>
          ) : (
            <>No comparable-period budget for this selection.</>
          )}
        </p>
        <button onClick={() => open({ kind: "methods" })} className="text-link">
          How to read this
          <ArrowRight size={15} />
        </button>
      </div>
      <div className="grid-main">
        <Panel
          title="Budget vs. actual"
          subtitle="Monthly expenditure · Jan–Sep 2026"
          action={<span className="subtle-label">USD</span>}
        >
          <TrendChart data={m.monthly} />
        </Panel>
        <Panel
          title="Division performance"
          subtitle="Budget less actual · select to focus"
        >
          <div className="division-bars">
            {divisions.map((d) => (
              <button
                className={`division-bar ${division === d.id ? "selected" : ""}`}
                key={d.id}
                onClick={() => setDivision(division === d.id ? "All" : d.id)}
                aria-pressed={division === d.id}
              >
                <span className="division-bar-top">
                  <span>{d.name}</span>
                  <strong
                    className={d.variance < 0 ? "negative" : "positive-text"}
                  >
                    {compact(d.variance)}
                  </strong>
                </span>
                <span className="bar-track">
                  <span
                    style={{
                      width: `${Math.max(1, (Math.abs(d.variance) / max) * 100)}%`,
                      background: d.variance < 0 ? "#b44a3e" : "#006225",
                    }}
                  />
                </span>
              </button>
            ))}
          </div>
          <p className="micro-note">
            Negative = expenses above plan. All six divisions shown for
            comparison.
          </p>
        </Panel>
      </div>
      <div className="grid-bottom">
        <Panel
          title="Management attention"
          subtitle="Open issues ranked by priority, then amount"
          action={
            <button className="text-link" onClick={() => navigate("revenue")}>
              Full worklist
              <ArrowRight size={15} />
            </button>
          }
        >
          <ExceptionList
            rows={m.exceptions}
            divisionName={divisionName}
            onOpen={(row) => open({ kind: "exception", row })}
            limit={3}
          />
        </Panel>
        <Panel
          className="decision-callout"
          title="From insight to action"
          subtitle="Explore the collection opportunity"
        >
          <span className="callout-number">{money(m.overdue)}</span>
          <p>
            Outstanding past-due receivables. Test collection assumptions before
            prioritizing outreach.
          </p>
          <button
            className="primary-button"
            onClick={() => navigate("decision")}
          >
            Open Decision Lab
            <ArrowRight size={16} />
          </button>
        </Panel>
      </div>
      <Notice>
        Same-period comparison, not an annual appropriation view. The
        expense-only subledger does not represent a balanced general ledger.
      </Notice>
    </>
  );
}
