import { createContext, useContext } from "react";
import type { Batch, Dataset, Invoice, Metrics, Row } from "../finance/model";
export type Detail =
  | { kind: "exception"; row: Row }
  | { kind: "invoice"; invoice: Invoice }
  | { kind: "batch"; batch: Batch }
  | { kind: "methods" };
export interface AppContextValue {
  data: Dataset;
  division: string;
  setDivision: (id: string) => void;
  m: Metrics;
  divisionName: (id: string) => string;
  open: (detail: Detail) => void;
  navigate: (page: string) => void;
}
export const AppContext = createContext<AppContextValue | null>(null);
export function useLab() {
  const context = useContext(AppContext);
  if (!context) throw new Error("Lab context missing");
  return context;
}
