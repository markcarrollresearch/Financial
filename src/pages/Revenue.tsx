import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowRight, Search } from "lucide-react";
import { useLab } from "../data/context";
import {
  compact,
  downloadCSV,
  money,
  percent,
  shortDate,
} from "../finance/format";
import {
  Badge,
  Empty,
  ExceptionList,
  KPI,
  Notice,
  Panel,
} from "../components/UI";
export default function Revenue() {
  const { m, divisionName, open } = useLab();
  const [stage, setStage] = useState("bank"),
    [query, setQuery] = useState(""),
    [priority, setPriority] = useState("All");
  const batches = useMemo(
    () =>
      m.batches
        .filter((b) =>
          stage === "bank"
            ? b.bankMature && b.bankGap !== 0
            : stage === "clearing"
              ? b.glMature && b.glGap !== 0
              : !b.bankMature || !b.glMature,
        )
        .sort(
          (a, b) =>
            Math.abs(stage === "clearing" ? b.glGap : b.bankGap) -
            Math.abs(stage === "clearing" ? a.glGap : a.bankGap),
        ),
    [m, stage],
  );
  const exceptions = m.exceptions.filter(
    (r) =>
      (priority === "All" || r.Priority === priority) &&
      `${r.ExceptionID} ${r.SourceRecordID} ${r.ExceptionType} ${r.OwnerRole}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const exportBatches = () =>
    downloadCSV("reconciliation-2026-09-30.csv", [
      ["Synthetic financial data — not an official County report"],
      ["Stage", stage],
      [
        "Batch",
        "Receipt date",
        "Expected",
        "Banked as of cutoff",
        "GL posted as of cutoff",
        "Bank difference",
        "GL difference",
        "Bank status",
      ],
      ...batches.map((b) => [
        b.id,
        b.source.ReceiptDate,
        (b.expected / 100).toFixed(2),
        (b.bank / 100).toFixed(2),
        (b.posted / 100).toFixed(2),
        (b.bankGap / 100).toFixed(2),
        (b.glGap / 100).toFixed(2),
        b.source.BankStatus,
      ]),
    ]);
  return (
    <>
      <div className="kpi-grid">
        <KPI
          label="Gross cash receipts"
          amount={m.gross}
          note="All funds received · Jan–Sep"
        />
        <KPI
          label="County retained"
          amount={m.retained}
          note="Retained share of gross receipts"
          tone="positive"
        />
        <KPI
          label="Agency pass-through"
          amount={m.passThrough}
          note="Third-party funds · not County revenue"
        />
        <KPI
          label="Open control issues"
          value={String(m.exceptions.length)}
          note={`${compact(m.underReview)} under review · all stages`}
          tone="identity"
        />
      </div>
      <div className="grid-main revenue-top">
        <Panel
          title="Follow the funds"
          subtitle="Gross receipts = retained + agency pass-through"
        >
          <div className="fund-flow">
            <div className="flow-total">
              <span>GROSS COLLECTIONS</span>
              <strong>{compact(m.gross)}</strong>
            </div>
            <ArrowRight size={24} />
            <div className="flow-parts">
              <div>
                <i className="swatch green" />
                <span>County retained</span>
                <strong>{percent(m.gross ? m.retained / m.gross : 0)}</strong>
              </div>
              <div>
                <i className="swatch sand" />
                <span>Agency pass-through</span>
                <strong>
                  {percent(m.gross ? m.passThrough / m.gross : 0)}
                </strong>
              </div>
            </div>
          </div>
          <div
            className="receipt-stack"
            role="img"
            aria-label={`${money(m.retained)} retained; ${money(m.passThrough)} agency pass-through`}
          >
            <span
              style={{
                width: `${m.gross ? (m.retained / m.gross) * 100 : 0}%`,
              }}
            />
            <span style={{ flex: 1 }} />
          </div>
          <p className="micro-note">
            Simulated allocation. Pass-through funds are a liability to other
            agencies, not profit.
          </p>
        </Panel>
        <Panel
          title="Two separate control stages"
          subtitle="Absolute differences per batch · not additive"
        >
          <div className="control-amount">
            <div>
              <strong>Receipts → bank</strong>
              <small>Excludes Pending Not Due</small>
            </div>
            <span>{money(m.bankAbs)}</span>
          </div>
          <div className="control-amount">
            <div>
              <strong>Receipts → GL clearing</strong>
              <small>Batches through Sep 28 only</small>
            </div>
            <span>{money(m.glAbs)}</span>
          </div>
          <p className="micro-note">
            Differences are control signals. The same funds may appear in both
            stages.
          </p>
        </Panel>
      </div>
      <Panel
        title="Reconciliation workbench"
        subtitle="Inspect source batches, receipts, and ledger postings"
        action={
          <button className="secondary-button" onClick={exportBatches}>
            <ArrowDownToLine size={15} />
            Export
          </button>
        }
      >
        <div className="tabs" role="group" aria-label="Reconciliation stage">
          {[
            ["bank", "Bank differences"],
            ["clearing", "GL clearing differences"],
            ["timing", "Pending / timing"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={stage === id}
              className={stage === id ? "active" : ""}
              onClick={() => setStage(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">
              {stage} reconciliation batches
            </caption>
            <thead>
              <tr>
                <th>Source batch / received</th>
                <th>Status at cutoff</th>
                <th className="numeric">Expected</th>
                <th className="numeric">Banked</th>
                <th className="numeric">GL posted</th>
                <th className="numeric">
                  {stage === "clearing" ? "GL" : "Bank"} gap
                </th>
                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td>
                    <button
                      className="record-link"
                      onClick={() => open({ kind: "batch", batch: b })}
                    >
                      {b.id}
                    </button>
                    <small>
                      {shortDate(b.source.ReceiptDate)} ·{" "}
                      {divisionName(b.source.DivisionID)}
                    </small>
                  </td>
                  <td>
                    <Badge tone={stage === "timing" ? "neutral" : "warning"}>
                      {stage === "timing"
                        ? !b.bankMature
                          ? "Pending Not Due"
                          : "GL timing buffer"
                        : stage === "clearing"
                          ? b.postings.length
                            ? "Posting variance"
                            : "Missing posting"
                          : b.source.BankStatus}
                    </Badge>
                  </td>
                  <td className="numeric">{money(b.expected)}</td>
                  <td className="numeric">{money(b.bank)}</td>
                  <td className="numeric">{money(b.posted)}</td>
                  <td className="numeric negative">
                    {money(stage === "clearing" ? b.glGap : b.bankGap)}
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      onClick={() => open({ kind: "batch", batch: b })}
                      aria-label={`Inspect batch ${b.id}`}
                    >
                      <ArrowRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!batches.length && (
            <Empty>No differences at this control stage.</Empty>
          )}
        </div>
        <div className="table-footer">
          {batches.length} batches · positive gap = shortfall; negative gap =
          excess. Timing items are excluded from their respective matured stage.
        </div>
      </Panel>
      <Panel
        title="Exception investigation queue"
        subtitle="All open control issues for this division"
      >
        <div className="table-toolbar">
          <label className="search-input">
            <Search size={17} />
            <input
              aria-label="Search exceptions"
              placeholder="Search issue, source ID, or owner…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="inline-select">
            Priority
            <select
              aria-label="Exception priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {["All", "Critical", "High", "Medium", "Low"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <ExceptionList
          rows={exceptions}
          divisionName={divisionName}
          onOpen={(row) => open({ kind: "exception", row })}
        />
      </Panel>
      <Notice>
        The GL maturity buffer is a demonstration assumption of two calendar
        days, not County policy. No discrepancy is labeled a confirmed loss.
      </Notice>
    </>
  );
}
