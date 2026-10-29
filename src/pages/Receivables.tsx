import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowDownUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useLab } from "../data/context";
import { BUCKETS } from "../finance/model";
import type { Invoice } from "../finance/model";
import { downloadCSV, money, percent, shortDate } from "../finance/format";
import { Badge, Empty, KPI, Notice, Panel } from "../components/UI";
type Sort = "balance" | "days" | "due" | "id";
export default function Receivables() {
  const { m, divisionName, open } = useLab();
  const [query, setQuery] = useState(""),
    [bucket, setBucket] = useState("All"),
    [status, setStatus] = useState("Open"),
    [sort, setSort] = useState<Sort>("balance"),
    [descending, setDescending] = useState(true),
    [page, setPage] = useState(0);
  const filtered = useMemo(
    () =>
      m.invoices
        .filter(
          (i) =>
            (status === "All" ||
              (status === "Open" ? i.balance > 0 : i.balance === 0)) &&
            (bucket === "All" || i.bucket === bucket) &&
            `${i.id} ${i.source.CustomerCode} ${i.source.CustomerClass}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) => {
          const order =
            sort === "balance"
              ? a.balance - b.balance
              : sort === "days"
                ? a.days - b.days
                : sort === "due"
                  ? a.source.DueDate.localeCompare(b.source.DueDate)
                  : a.id.localeCompare(b.id);
          return descending ? -order : order;
        }),
    [m, query, bucket, status, sort, descending],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10)),
    current = Math.min(page, pageCount - 1),
    pageRows = filtered.slice(current * 10, current * 10 + 10),
    max = Math.max(1, ...m.aging.map((a) => a.amount));
  const selectBucket = (value: string) => {
    setBucket(value);
    setPage(0);
  };
  const changeSort = (value: Sort) => {
    if (sort === value) setDescending(!descending);
    else {
      setSort(value);
      setDescending(value === "balance" || value === "days");
    }
    setPage(0);
  };
  const sortHeader = (label: string, value: Sort) => (
    <th
      className={value === "balance" || value === "days" ? "numeric" : ""}
      aria-sort={
        sort === value ? (descending ? "descending" : "ascending") : "none"
      }
    >
      <button className="sort-button" onClick={() => changeSort(value)}>
        {label}
        <ArrowDownUp size={12} />
      </button>
    </th>
  );
  const exportRows = (rows: Invoice[]) =>
    downloadCSV("receivables-as-of-2026-09-30.csv", [
      ["Synthetic financial data — not an official County report"],
      ["As of", "2026-09-30"],
      [
        "Invoice",
        "Division",
        "Customer classification",
        "Due date",
        "Days past due",
        "Invoice amount",
        "Applied by cutoff",
        "Outstanding",
        "Aging bucket",
      ],
      ...rows.map((i) => [
        i.id,
        divisionName(i.division),
        i.source.CustomerClass,
        i.source.DueDate,
        i.days,
        (i.amount / 100).toFixed(2),
        (i.applied / 100).toFixed(2),
        (i.balance / 100).toFixed(2),
        i.bucket,
      ]),
    ]);
  return (
    <>
      <div className="kpi-grid">
        <KPI
          label="Open receivables"
          amount={m.openAR}
          note="Point-in-time · September 30, 2026"
        />
        <KPI
          label="Past-due balance"
          amount={m.overdue}
          note="Positive balance · due before cutoff"
          tone="warning"
        />
        <KPI
          label="90+ days overdue"
          amount={m.ar90}
          note="Strictly more than 90 days past due"
          tone="identity"
        />
        <KPI
          label="Overdue share"
          value={percent(m.openAR ? m.overdue / m.openAR : 0)}
          note="Past-due balance ÷ open receivables"
        />
      </div>
      <div className="grid-main ar-top">
        <Panel
          title="Aging of outstanding balances"
          subtitle="Select an age band to focus the invoice queue"
          action={<span className="badge">AS OF SEP 30</span>}
        >
          <div className="aging-bars">
            {m.aging.map((a) => (
              <button
                key={a.bucket}
                className={`aging-row ${bucket === a.bucket ? "selected" : ""}`}
                aria-pressed={bucket === a.bucket}
                onClick={() =>
                  selectBucket(bucket === a.bucket ? "All" : a.bucket)
                }
              >
                <span>{a.bucket}</span>
                <span className="bar-track">
                  <span
                    style={{
                      width: `${(a.amount / max) * 100}%`,
                      background:
                        a.bucket === "90+"
                          ? "#a8453c"
                          : a.bucket === "Not Due"
                            ? "#006225"
                            : "#baa185",
                    }}
                  />
                </span>
                <strong>{money(a.amount)}</strong>
                <small>{a.count} invoices</small>
              </button>
            ))}
          </div>
        </Panel>
        <Panel
          title="A balance, not a snapshot sum"
          subtitle="Financial definition"
        >
          <div className="formula-block">
            <span>INVOICE AMOUNT</span>
            <b>−</b>
            <span>PAYMENTS APPLIED BY SEP 30</span>
            <b>=</b>
            <strong>Outstanding balance</strong>
          </div>
          <p className="micro-note">
            Balances are bounded at zero. Future applications are excluded;
            prior-year open invoices remain in scope.
          </p>
          <Notice>
            Aging measures days past the due date, not creditworthiness.
            Customers are simulated classifications.
          </Notice>
        </Panel>
      </div>
      <Panel
        title="Collection workbench"
        subtitle="Inspect an invoice to see its dated payment-application ledger"
        action={
          <button
            className="secondary-button"
            onClick={() => exportRows(filtered)}
          >
            <ArrowDownToLine size={15} />
            Export filtered
          </button>
        }
      >
        <div className="table-toolbar">
          <label className="search-input">
            <Search size={17} />
            <input
              aria-label="Search invoices"
              placeholder="Search invoice or simulated customer…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <label className="inline-select">
            Balance
            <select
              aria-label="Balance status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              {["Open", "Paid", "All"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="inline-select">
            Aging
            <select
              aria-label="Aging"
              value={bucket}
              onChange={(e) => selectBucket(e.target.value)}
            >
              <option>All</option>
              {BUCKETS.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">
              Receivables as of September 30, 2026
            </caption>
            <thead>
              <tr>
                {sortHeader("Invoice / customer", "id")}
                {sortHeader("Due date", "due")}
                {sortHeader("Days", "days")}
                <th className="numeric">Invoice</th>
                <th className="numeric">Applied</th>
                {sortHeader("Remaining", "balance")}
                <th>Payment status</th>
                <th>
                  <span className="sr-only">Inspect</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((i) => (
                <tr key={i.id}>
                  <td>
                    <button
                      className="record-link"
                      onClick={() => open({ kind: "invoice", invoice: i })}
                    >
                      {i.id}
                    </button>
                    <small>{i.source.CustomerClass}</small>
                    <small>{divisionName(i.division)}</small>
                  </td>
                  <td>{shortDate(i.source.DueDate)}</td>
                  <td className="numeric">{i.days}</td>
                  <td className="numeric">{money(i.amount)}</td>
                  <td className="numeric">{money(i.applied)}</td>
                  <td className="numeric">
                    <strong>{money(i.balance)}</strong>
                  </td>
                  <td>
                    <Badge
                      tone={
                        i.balance === 0
                          ? "positive"
                          : i.applied > 0
                            ? "neutral"
                            : "warning"
                      }
                    >
                      {i.balance === 0
                        ? "Paid"
                        : i.applied > 0
                          ? "Partial"
                          : "Unpaid"}
                    </Badge>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      onClick={() => open({ kind: "invoice", invoice: i })}
                      aria-label={`Inspect invoice ${i.id}`}
                    >
                      <ArrowRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <Empty>No invoices match. Try another search or age band.</Empty>
          )}
        </div>
        <div className="pagination">
          <span>
            {filtered.length
              ? `${current * 10 + 1}–${Math.min((current + 1) * 10, filtered.length)} of ${filtered.length}`
              : "0"}{" "}
            invoices
          </span>
          <div>
            <button
              className="icon-button"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              aria-label="Previous invoice page"
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              {current + 1} / {pageCount}
            </span>
            <button
              className="icon-button"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
              aria-label="Next invoice page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </Panel>
    </>
  );
}
