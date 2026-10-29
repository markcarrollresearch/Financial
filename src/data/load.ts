import type { Dataset } from "../finance/model";

/** The portable edition embeds the same immutable source package in its HTML. */
export async function loadDataset(signal: AbortSignal): Promise<Dataset> {
  const embedded = document.getElementById("financial-lab-data");
  if (embedded) return JSON.parse(embedded.textContent || "") as Dataset;

  const response = await fetch(`${import.meta.env.BASE_URL}data.json`, {
    signal,
  });
  if (!response.ok) {
    throw new Error(
      "The local data package could not be loaded. Run npm run data and restart the application.",
    );
  }
  return response.json() as Promise<Dataset>;
}
