/**
 * Resumo da execução de sincronização — resolver puro e testável.
 */

/**
 * @param {unknown} status
 * @returns {"completed" | "error" | "running" | "pending"}
 */
export function resolveSyncStepStatusBucket(status) {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "done" || normalized === "completed") return "completed";
  if (normalized === "error" || normalized === "failed") return "error";
  if (normalized === "running" || normalized === "processing") return "running";
  return "pending";
}

/**
 * @param {unknown} status
 * @returns {string}
 */
export function resolveSyncStepStatusLabel(status) {
  const bucket = resolveSyncStepStatusBucket(status);
  if (bucket === "completed") return "Concluído";
  if (bucket === "error") return "Com erro";
  if (bucket === "running") return "Em andamento";
  return "Pendente";
}

/**
 * @param {unknown} iso
 * @returns {string}
 */
export function formatSyncExecutionTimestamp(iso) {
  if (iso == null || String(iso).trim() === "") return "—";
  try {
    return new Date(String(iso)).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

/**
 * @param {Array<{ status?: string; label?: string; key?: string }>} steps
 * @param {{
 *   title?: string | null;
 *   overall?: string | null;
 *   sales_sync_engine?: { last_sales_sync_at?: string | null } | null;
 * } | null | undefined} payload
 * @param {{ last_sync_at?: string | null } | null | undefined} [account]
 * @returns {{
 *   overallSituation: string;
 *   lastUpdated: string;
 *   completedCount: number;
 *   errorCount: number;
 *   pendingCount: number;
 *   runningCount: number;
 *   runningStepLabel: string;
 * }}
 */
export function buildMarketplaceSyncExecutionSummary(steps, payload, account = null) {
  /** @type {{ completed: number; error: number; pending: number; running: number }} */
  const counts = { completed: 0, error: 0, pending: 0, running: 0 };
  let runningStepLabel = "";

  for (const step of steps || []) {
    const bucket = resolveSyncStepStatusBucket(step?.status);
    counts[bucket] += 1;
    if (bucket === "running" && !runningStepLabel) {
      runningStepLabel = String(step?.label || "").trim();
    }
  }

  const presentation =
    payload?.sync_presentation && typeof payload.sync_presentation === "object"
      ? payload.sync_presentation
      : null;

  const serverCounts =
    payload?.step_counts && typeof payload.step_counts === "object" ? payload.step_counts : null;

  const completedCount = serverCounts?.completed ?? counts.completed;
  const errorCount = serverCounts?.error ?? counts.error;
  const pendingCount = serverCounts?.pending ?? counts.pending;
  const runningCount = serverCounts?.running ?? counts.running;
  const resolvedRunningLabel =
    runningCount > 0
      ? String(presentation?.running_step_label || runningStepLabel || "").trim() || "Sincronização"
      : "";

  let overallSituation = "—";
  if (presentation?.sync_summary_label != null && String(presentation.sync_summary_label).trim() !== "") {
    overallSituation = String(presentation.sync_summary_label).trim();
  } else if (payload?.title != null && String(payload.title).trim() !== "") {
    overallSituation = String(payload.title).trim();
  } else if (payload?.overall != null && String(payload.overall).trim() !== "") {
    overallSituation = String(payload.overall).trim();
  }

  if (runningCount > 0 && overallSituation === "Integração Mercado Livre") {
    overallSituation = "Em andamento";
  }

  const lastUpdatedSource =
    payload?.sales_sync_engine?.last_sales_sync_at ?? account?.last_sync_at ?? null;

  return {
    overallSituation,
    lastUpdated: formatSyncExecutionTimestamp(lastUpdatedSource),
    completedCount,
    errorCount,
    pendingCount,
    runningCount,
    runningStepLabel: resolvedRunningLabel || "—",
  };
}
