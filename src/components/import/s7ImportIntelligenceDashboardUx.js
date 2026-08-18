// ======================================================================
// UX Dashboard — importação inteligente (recolher/expandir + resumo compacto)
// ======================================================================

export const DASHBOARD_IMPORT_EXPANDED_KEY = "dashboard.importProgress.expanded";

/** @returns {boolean} */
export function readDashboardImportExpanded() {
  try {
    const value = localStorage.getItem(DASHBOARD_IMPORT_EXPANDED_KEY);
    if (value === "true") return true;
    if (value === "false") return false;
  } catch {
    /* ignore */
  }
  return false;
}

/** @param {boolean} expanded */
export function writeDashboardImportExpanded(expanded) {
  try {
    localStorage.setItem(DASHBOARD_IMPORT_EXPANDED_KEY, expanded ? "true" : "false");
  } catch {
    /* ignore */
  }
}

/**
 * @param {any[]} accounts
 * @param {boolean} isCompleted
 */
export function buildDashboardImportCompactSummary(accounts, isCompleted) {
  if (isCompleted) {
    return {
      primary: "Todas as contas sincronizadas",
      secondary: null,
    };
  }

  const activeAccounts = accounts.filter((a) => String(a.overall || "") !== "done");
  const count = activeAccounts.length > 0 ? activeAccounts.length : accounts.length;
  const primary = count === 1 ? "1 conta sincronizando" : `${count} contas sincronizando`;

  const anyHotIncomplete = accounts.some((a) => a.hot_sync_complete !== true);
  const anyHotRunning = accounts.some(
    (a) => !a.hot_sync_complete && String(a.hot_sync?.status || "").toLowerCase() === "running",
  );

  const pcts = accounts
    .map((a) => Number(a.primary_progress_percent))
    .filter((n) => Number.isFinite(n));
  const avgPct =
    pcts.length > 0 ? Math.round(pcts.reduce((sum, n) => sum + n, 0) / pcts.length) : null;

  let secondary;
  if (anyHotIncomplete && anyHotRunning) {
    secondary = "Camada rápida em execução";
  } else if (avgPct != null) {
    secondary = `${avgPct}% concluído`;
  } else if (anyHotIncomplete) {
    secondary = "Camada rápida em execução";
  } else {
    secondary = "Sincronizando…";
  }

  return { primary, secondary };
}
