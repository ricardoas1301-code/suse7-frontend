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

export { buildDashboardImportCompactSummaryAccountAware as buildDashboardImportCompactSummary } from "./s7ImportIntelligenceAccountVisibility.js";
