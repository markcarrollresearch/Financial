import { ArrowRight } from "lucide-react";
import { useLab, type Detail } from "../data/context";
import { cents, normalizeSource, sourceRecord } from "../finance/model";
import { money, shortDate } from "../finance/format";
import { Badge, Dialog, Fields, Notice, SourceFields } from "./UI";
export default function Details({
  detail,
  onClose,
}: {
  detail: Detail;
  onClose: () => void;
}) {
  const { data, m, divisionName, open } = useLab();
  if (detail.kind === "methods")
    return (
      <Dialog
        title="The numbers, explained"
        eyebrow="Method & provenance"
        onClose={onClose}
        wide
      >
        <div className="method-intro">
          <Badge tone="positive">
            15 source tables · {data.rowCount.toLocaleString()} records
          </Badge>
          <p>
            Local, synthetic financial transactions. No live feeds, online AI
            model, database, or external APIs are used by this application.
          </p>
        </div>
        <Fields
          items={[
            [
              "Reporting window",
              "January 1–September 30, 2026 for budget, expenses, receipts and detected exceptions. A/R is a single point-in-time balance at September 30, including open prior-year invoices.",
            ],
            [
              "Budget performance",
              "Budget = sum of FactBudget.BudgetAmount in the reporting window. Expenses = sum of FactGLExpenses.ExpenseAmount by PostingDate in the same window. Variance = budget − expenses. Negative is unfavorable. This is an expense-only subledger, not a balanced GL.",
            ],
            [
              "Cash collections",
              "Gross = CountyRetainedAmount + AgencyPassThroughAmount, validated row by row. Agency pass-through funds are not County-owned revenue.",
            ],
            [
              "Receivables",
              "For each invoice issued by the cutoff: max(0, invoice amount − applications dated on or before the cutoff). No join to cash receipts and no summing monthly A/R snapshots.",
            ],
            [
              "Aging convention",
              "Due on or after September 30 = Not Due. Due earlier = past due. Buckets: 1–30, 31–60, 61–90, and strictly >90 days. Calculated using UTC calendar dates.",
            ],
            [
              "Bank reconciliation",
              "For each Jan–Sep batch: expected receipts − bank amount posted by cutoff. Exclude BankStatus = Pending Not Due from the matured measure. Sum absolute differences per batch to prevent offsetting.",
            ],
            [
              "Cash clearing",
              "Compare expected receipts with the sum of GL cash postings by DepositBatchID, using PostingDate ≤ cutoff. Matured batches have ReceiptDate ≤ September 28. This two-calendar-day buffer is an illustrative assumption, not County policy. Bank and GL stages are never added together.",
            ],
            [
              "Exceptions",
              "Detected in the reporting window and unresolved at cutoff. Priority then amount determines order. AmountUnderReview is not ConfirmedLoss. All supplied exceptions have zero confirmed loss. EX012 uses FactRemittances; navigation maps it to FactAgencyRemittances without changing the CSV.",
            ],
            [
              "Decision Lab",
              "Fixed, openly labeled assumed baseline rates, editable scenario rates, and deterministic multiplication. No empirical forecast, AI prediction, discounting, costs, or collection time horizon.",
            ],
            [
              "Reference figures & service context",
              "Public annual benchmark and service-volume tables remain in the source package. They are not combined with the synthetic financial trends, and unlike service units are not summed.",
            ],
            [
              "Data integrity",
              "The build checks the 15-table manifest, column order and row counts, and records SHA-256 source hashes. Integer-cent calculations are tested against supplied QA values and the A/R snapshot. Original CSVs and the logo are unchanged.",
            ],
            [
              "Scope limits",
              "Independent interview concept, not an official County report. Synthetic customers and transactions. No full governmental accounting, production ledger integration, saved case management, fraud determination, or credit assessment.",
            ],
          ]}
        />
        <details className="source-fields">
          <summary>Source-file SHA-256 audit trail</summary>
          <Fields
            items={Object.entries(data.hashes).map(([key, value]) => [
              key,
              <code key={key}>{value}</code>,
            ])}
          />
        </details>
      </Dialog>
    );
  if (detail.kind === "exception") {
    const e = detail.row,
      source = sourceRecord(data, e),
      table = normalizeSource(e.SourceTable);
    const relatedBatch = m.batches.find((b) => b.id === e.SourceRecordID),
      relatedInvoice = m.invoices.find((i) => i.id === e.SourceRecordID);
    const expenseMatches =
      table === "FactGLExpenses" && source
        ? data.tables.FactGLExpenses.filter(
            (r) =>
              r.VendorCode === source.VendorCode &&
              r.InvoiceReference === source.InvoiceReference &&
              r.PostingDate <= data.asOf,
          )
        : [];
    return (
      <Dialog
        title={e.ExceptionType}
        eyebrow={`${e.ExceptionID} · Control investigation`}
        onClose={onClose}
      >
        <div className="detail-badges">
          <Badge tone="warning">{e.Priority} priority</Badge>
          <Badge>{e.Status}</Badge>
        </div>
        <div className="detail-hero">
          <span>AMOUNT UNDER REVIEW</span>
          <strong>{money(cents(e.AmountUnderReview))}</strong>
          <small>Confirmed loss: {money(cents(e.ConfirmedLoss))}</small>
        </div>
        <Notice tone="warning">
          Under review / no established loss. An exception is a request to
          investigate, not evidence of fraud or a write-off.
        </Notice>
        <Fields
          items={[
            ["Division", divisionName(e.DivisionID)],
            ["Detected", shortDate(e.DetectedDate)],
            ["Accountable owner", e.OwnerRole],
            ["Required action", e.RequiredAction],
            ["Investigation note", e.InvestigationNote],
            [
              "Original source reference",
              <code>
                {e.SourceTable} / {e.SourceRecordID}
              </code>,
            ],
          ]}
        />
        <h3 className="detail-section-title">Source evidence</h3>
        {table !== e.SourceTable && (
          <p className="micro-note">
            Display lookup normalized to {table}; original CSV label preserved
            above.
          </p>
        )}
        {relatedBatch && (
          <button
            className="source-link"
            onClick={() => open({ kind: "batch", batch: relatedBatch })}
          >
            Inspect batch {relatedBatch.id}
            <ArrowRight size={17} />
          </button>
        )}
        {relatedInvoice && (
          <button
            className="source-link"
            onClick={() => open({ kind: "invoice", invoice: relatedInvoice })}
          >
            Inspect invoice & applications
            <ArrowRight size={17} />
          </button>
        )}
        {source ? (
          <SourceFields row={source} />
        ) : (
          <Notice>
            Source record unavailable in this selection. No inferred evidence is
            shown.
          </Notice>
        )}
        {expenseMatches.length > 1 && (
          <>
            <h3 className="detail-section-title">
              Same vendor & invoice reference
            </h3>
            <p className="micro-note">
              Matched records to inspect; this does not establish a duplicate
              payment.
            </p>
            {expenseMatches.map((r) => (
              <SourceFields row={r} key={r.ExpenseEntryID} />
            ))}
          </>
        )}
        <SourceFields row={e} />
      </Dialog>
    );
  }
  if (detail.kind === "invoice") {
    const i = detail.invoice,
      future = data.tables.FactARPaymentApplications.filter(
        (r) => r.InvoiceID === i.id && r.AppliedDate > data.asOf,
      );
    return (
      <Dialog
        title={i.id}
        eyebrow="Invoice & dated applications"
        onClose={onClose}
      >
        <Badge tone={i.balance === 0 ? "positive" : "warning"}>
          {i.balance === 0
            ? "Fully paid"
            : i.applied > 0
              ? "Partially paid"
              : "Unpaid"}{" "}
          · {i.bucket}
        </Badge>
        <div className="detail-hero">
          <span>OUTSTANDING AT SEP 30, 2026</span>
          <strong>{money(i.balance)}</strong>
          <small>{i.days} days past due</small>
        </div>
        <Fields
          items={[
            ["Division", divisionName(i.division)],
            [
              "Simulated customer",
              `${i.source.CustomerCode} · ${i.source.CustomerClass}`,
            ],
            [
              "Issued / due",
              `${shortDate(i.source.InvoiceDate)} / ${shortDate(i.source.DueDate)}`,
            ],
            ["Original invoice", money(i.amount)],
            ["Applied by cutoff", money(i.applied)],
          ]}
        />
        <h3 className="detail-section-title">Payment-application ledger</h3>
        {i.applications.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Application / receipt</th>
                  <th>Applied date</th>
                  <th className="numeric">Amount</th>
                </tr>
              </thead>
              <tbody>
                {i.applications.map((r) => (
                  <tr key={r.ApplicationID}>
                    <td>
                      <strong>{r.ApplicationID}</strong>
                      <small>{r.ReceiptID || "No receipt reference"}</small>
                    </td>
                    <td>{shortDate(r.AppliedDate)}</td>
                    <td className="numeric">{money(cents(r.AppliedAmount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Notice>
            No payment applications dated on or before the cutoff.
          </Notice>
        )}
        {future.length > 0 && (
          <Notice>
            {future.length} future application(s) excluded from this historical
            balance.
          </Notice>
        )}
        <SourceFields row={i.source} />
      </Dialog>
    );
  }
  const b = detail.batch;
  return (
    <Dialog
      title={b.id}
      eyebrow="Deposit batch · source evidence"
      onClose={onClose}
    >
      <div className="detail-badges">
        <Badge>{b.source.BankStatus}</Badge>
        <Badge>{b.glMature ? "GL matured" : "GL timing buffer"}</Badge>
      </div>
      <Fields
        items={[
          ["Division", divisionName(b.source.DivisionID)],
          ["Receipts dated", shortDate(b.source.ReceiptDate)],
          ["Expected bank date", shortDate(b.source.ExpectedBankDate)],
          ["Bank posted", shortDate(b.source.BankPostedDate)],
          ["Bank reference", b.source.BankReference],
          ["Expected from receipts", money(b.expected)],
          ["Banked by cutoff", money(b.bank)],
          ["GL posted by cutoff", money(b.posted)],
          [
            "Bank gap",
            `${money(b.bankGap)} · ${b.bankMature ? "matured control" : "excluded: Pending Not Due"}`,
          ],
          [
            "GL gap",
            `${money(b.glGap)} · ${b.glMature ? "matured control" : "excluded: timing buffer"}`,
          ],
        ]}
      />
      <Notice>
        Positive difference = shortfall; negative = excess. These are separate
        stages and are not additive.
      </Notice>
      <h3 className="detail-section-title">GL cash postings by cutoff</h3>
      {b.postings.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Posting</th>
                <th>Date</th>
                <th className="numeric">Amount</th>
              </tr>
            </thead>
            <tbody>
              {b.postings.map((r) => (
                <tr key={r.GLCashPostingID}>
                  <td>
                    {r.GLCashPostingID}
                    <small>{r.GLAccount}</small>
                  </td>
                  <td>{shortDate(r.PostingDate)}</td>
                  <td className="numeric">{money(cents(r.PostedAmount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Notice>No GL cash postings dated by the cutoff.</Notice>
      )}
      <h3 className="detail-section-title">
        Source receipts · {b.receipts.length}
      </h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Receipt / channel</th>
              <th className="numeric">Gross</th>
              <th className="numeric">Retained</th>
              <th className="numeric">Agency</th>
            </tr>
          </thead>
          <tbody>
            {b.receipts.map((r) => (
              <tr key={r.ReceiptID}>
                <td>
                  {r.ReceiptID}
                  <small>{r.ReceiptChannel}</small>
                </td>
                <td className="numeric">{money(cents(r.GrossAmount))}</td>
                <td className="numeric">
                  {money(cents(r.CountyRetainedAmount))}
                </td>
                <td className="numeric">
                  {money(cents(r.AgencyPassThroughAmount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SourceFields row={b.source} />
    </Dialog>
  );
}
