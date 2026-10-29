const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const money = (cents: number) => currency.format(cents / 100);
export const compact = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(cents / 100);
export const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
export const shortDate = (date: string) =>
  date
    ? new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Not recorded";
export function downloadCSV(name: string, rows: (string | number)[][]) {
  const content = rows
    .map((row) =>
      row.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
    )
    .join("\r\n");
  // Prefix formula-like text in exports to prevent spreadsheet formula execution.
  const safe = content.replace(/"([=+@])/g, "\"'$1");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + safe], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
