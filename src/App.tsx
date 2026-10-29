import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  FileCheck2,
  Landmark,
  LayoutDashboard,
  LoaderCircle,
  Printer,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import { AppContext, type Detail } from "./data/context";
import { metrics, type Dataset } from "./finance/model";
import Details from "./components/Details";
import { loadDataset } from "./data/load";
import Executive from "./pages/Executive";
import Revenue from "./pages/Revenue";
import Receivables from "./pages/Receivables";
import Decision from "./pages/Decision";
const pages = [
  {
    id: "executive",
    label: "Executive overview",
    title: "Executive overview",
    subtitle: "A clear view of performance. A focused path to action.",
    icon: LayoutDashboard,
  },
  {
    id: "revenue",
    label: "Revenue assurance",
    title: "Revenue assurance",
    subtitle:
      "Follow the funds. Reconcile the evidence. Resolve the exceptions.",
    icon: ShieldCheck,
  },
  {
    id: "receivables",
    label: "Accounts receivable",
    title: "Accounts receivable",
    subtitle: "Understand outstanding balances. Make the next contact count.",
    icon: WalletCards,
  },
  {
    id: "decision",
    label: "Decision Lab",
    title: "Decision Lab",
    subtitle:
      "Make your assumptions visible. See what a different decision could mean.",
    icon: SlidersHorizontal,
  },
];
function initialPage() {
  const hash = window.location.hash.slice(1);
  return pages.some((p) => p.id === hash) ? hash : "executive";
}
export default function App() {
  const [data, setData] = useState<Dataset | null>(null),
    [error, setError] = useState(""),
    [division, setDivision] = useState("All"),
    [page, setPage] = useState(initialPage),
    [detail, setDetail] = useState<Detail | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    loadDataset(controller.signal)
      .then((value: Dataset) => {
        if (value.asOf !== "2026-09-30" || !value.tables?.FactBudget)
          throw new Error(
            "The data package does not match the required reporting period.",
          );
        setData(value);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const handler = () => setPage(initialPage());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const m = useMemo(
    () => (data ? metrics(data, division) : null),
    [data, division],
  );
  const navigate = (id: string) => {
    setPage(id);
    window.location.hash = id;
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => heading.current?.focus());
  };
  const active = pages.find((p) => p.id === page) ?? pages[0];
  if (error)
    return (
      <main className="load-state">
        <Landmark size={38} />
        <h1>Local data needs attention</h1>
        <p>{error}</p>
        <button
          className="primary-button"
          onClick={() => window.location.reload()}
        >
          Try again
          <ArrowRight size={16} />
        </button>
        <p className="micro-note">
          Independent interview concept · Synthetic financial data · Not an
          official County report.
        </p>
      </main>
    );
  if (!data || !m)
    return (
      <main className="load-state" aria-live="polite">
        <LoaderCircle size={30} className="loading-icon" />
        <h1>Preparing your financial workspace</h1>
        <p>Reading the local, synthetic source data…</p>
      </main>
    );
  const divisionName = (id: string) =>
    data.tables.DimDivision.find((r) => r.DivisionID === id)?.DivisionName ??
    id;
  return (
    <AppContext.Provider
      value={{
        data,
        division,
        setDivision,
        m,
        divisionName,
        open: setDetail,
        navigate,
      }}
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="app-shell">
        <aside className="sidebar">
          <a
            href="#executive"
            onClick={(e) => {
              e.preventDefault();
              navigate("executive");
            }}
            className="brand"
            aria-label="Douglas County, executive overview"
          >
            <img
              src={
                data.logoDataUrl ||
                `${import.meta.env.BASE_URL}douglas_county_logo.png`
              }
              alt="Douglas County Colorado"
            />
          </a>
          <div className="sidebar-title">
            FINANCIAL INTELLIGENCE<span>& CONTROLS LAB</span>
          </div>
          <div className="nav-label">YOUR WORKSPACE</div>
          <nav aria-label="Main navigation">
            {pages.map((p, i) => (
              <button
                key={p.id}
                className={`nav-item ${page === p.id ? "active" : ""}`}
                aria-current={page === p.id ? "page" : undefined}
                onClick={() => navigate(p.id)}
              >
                <p.icon size={18} />
                <span>{p.label}</span>
                <small>0{i + 1}</small>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="lab-mark">
              <ChartNoAxesCombined size={18} />
              <span>
                Human-directed.
                <br />
                Evidence-led.
              </span>
            </div>
            <p>
              Synthetic financial data
              <br />
              Not an official County report
            </p>
            <button onClick={() => setDetail({ kind: "methods" })}>
              <CircleHelp size={16} />
              Methods & source notes
            </button>
          </div>
        </aside>
        <div className="workspace">
          <div className="topbar">
            <div>
              <span className="breadcrumb">
                Financial Intelligence & Controls Lab
              </span>
              <span className="breadcrumb-divider">/</span>
              <span>{active.label}</span>
            </div>
            <div className="local-status">
              <span />
              SYNTHETIC DATA · INTERVIEW CONCEPT
            </div>
          </div>
          <main id="main-content">
            <header className="page-header">
              <div>
                <div className="eyebrow">DOUGLAS COUNTY · CLERK & RECORDER</div>
                <h1 ref={heading} tabIndex={-1}>
                  {active.title}
                </h1>
                <p>{active.subtitle}</p>
              </div>
              <div className="header-controls">
                <span className="period-pill">
                  <CalendarDays size={15} />
                  {page === "receivables" || page === "decision"
                    ? "AS OF SEP 30, 2026"
                    : "JAN–SEP 2026"}
                </span>
                <label className="division-select">
                  <span className="sr-only">Division</span>
                  <select
                    aria-label="Division"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                  >
                    <option value="All">All divisions</option>
                    {data.tables.DimDivision.map((d) => (
                      <option key={d.DivisionID} value={d.DivisionID}>
                        {d.DivisionName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </header>
            <div className="page-content">
              {page === "executive" ? (
                <Executive />
              ) : page === "revenue" ? (
                <Revenue />
              ) : page === "receivables" ? (
                <Receivables />
              ) : (
                <Decision />
              )}
            </div>
            <footer className="app-footer">
              <div>
                <FileCheck2 size={15} />
                <p>
                  Independent interview concept · Synthetic financial data · Not
                  an official County report.
                </p>
              </div>
              <button onClick={() => window.print()}>
                <Printer size={15} />
                Print view
              </button>
            </footer>
          </main>
        </div>
      </div>
      {detail && <Details detail={detail} onClose={() => setDetail(null)} />}
    </AppContext.Provider>
  );
}
