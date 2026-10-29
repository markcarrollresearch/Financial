import { useEffect, useRef, type ReactNode } from "react";
import { ArrowUpRight, Check, ChevronRight, CircleHelp, X } from "lucide-react";
import { cents, type Row } from "../finance/model";
import { compact, money } from "../finance/format";
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function KPI({
  label,
  value,
  amount,
  note,
  tone = "neutral",
  icon,
}: {
  label: string;
  value?: string;
  amount?: number;
  note: string;
  tone?: string;
  icon?: ReactNode;
}) {
  return (
    <article className={`kpi ${tone}`}>
      <div className="kpi-label">
        {label}
        {icon}
      </div>
      <div className="kpi-value">
        {amount !== undefined ? compact(amount) : value}
      </div>
      {amount !== undefined && <div className="kpi-exact">{money(amount)}</div>}
      <p>{note}</p>
    </article>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Empty({
  children = "No records match these filters.",
}: {
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Check size={22} />
      <p>{children}</p>
    </div>
  );
}
export function Notice({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`notice ${tone}`}>
      <CircleHelp size={16} />
      <div>{children}</div>
    </div>
  );
}
export function ExceptionList({
  rows,
  divisionName,
  onOpen,
  limit,
}: {
  rows: Row[];
  divisionName: (id: string) => string;
  onOpen: (r: Row) => void;
  limit?: number;
}) {
  return (
    <div className="exception-list">
      {rows.length ? (
        rows.slice(0, limit).map((r) => (
          <button
            key={r.ExceptionID}
            className="exception-row"
            onClick={() => onOpen(r)}
          >
            <span className={`priority-dot ${r.Priority.toLowerCase()}`} />
            <span className="exception-name">
              <strong>{r.ExceptionType}</strong>
              <small>
                {divisionName(r.DivisionID)} · {r.SourceRecordID}
              </small>
            </span>
            <span className="exception-amount">
              {money(cents(r.AmountUnderReview))}
              <small>{r.Priority} priority</small>
            </span>
            <ChevronRight size={17} />
          </button>
        ))
      ) : (
        <Empty>No open exceptions for this division.</Empty>
      )}
    </div>
  );
}
export function Dialog({
  title,
  eyebrow,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const d = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    d?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d?.close();
      document.body.style.overflow = before;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`drawer ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeRef.current();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="drawer-head">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 id="dialog-title">{title}</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close details"
        >
          <X size={22} />
        </button>
      </div>
      <div className="drawer-body">{children}</div>
      <div className="drawer-footer">
        Independent interview concept · Synthetic financial data
      </div>
    </dialog>
  );
}
export function Fields({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="fields">
      {items.map(([name, value]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>{value || "Not recorded"}</dd>
        </div>
      ))}
    </dl>
  );
}
export function SourceFields({ row }: { row: Row }) {
  return (
    <details className="source-fields">
      <summary>Inspect original source fields</summary>
      <Fields items={Object.entries(row)} />
    </details>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowUpRight size={15} />
    </button>
  );
}
