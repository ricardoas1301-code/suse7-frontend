// ======================================================================
// Contexto unificado de relatório — espelha os filtros da página Vendas.
// Princípio: o que está filtrado na tela = o que será exportado.
// ======================================================================

import { SALES_FILTER_CHIPS } from "../../../utils/salesToolbarFilters";
import { formatIsoToBrDate } from "../filters/vendasFiltersPeriod.js";
import { pickVendasSaleRowId } from "../selection/pickVendasSaleRowId.js";

/**
 * @typedef {{
 *   preset: string;
 *   startDate: string;
 *   endDate: string;
 *   label: string;
 *   rangeDisplay: string;
 * }} VendasReportContextPeriod
 */

/**
 * @typedef {{
 *   marketplaceAccountId: string | null;
 *   label: string;
 * }} VendasReportContextAccount
 */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 * }} VendasReportContextOperationalFilter
 */

/**
 * @typedef {{
 *   query: string;
 *   hasQuery: boolean;
 * }} VendasReportContextSearch
 */

/**
 * @typedef {{
 *   totalCount: number;
 *   truncatedScan: boolean;
 *   pageItemIds: string[];
 *   selectedIds: string[];
 * }} VendasReportContextSales
 */

/**
 * @typedef {{
 *   version: number;
 *   period: VendasReportContextPeriod;
 *   account: VendasReportContextAccount;
 *   operationalFilter: VendasReportContextOperationalFilter;
 *   search: VendasReportContextSearch;
 *   sales: VendasReportContextSales;
 *   reportScope: "filters" | "selected";
 *   selectedSales: readonly Record<string, unknown>[];
 *   selectedSalesIds: string[];
 *   selectedSalesMetrics: null | Record<string, unknown>;
 *   capabilities: readonly string[];
 * }} VendasReportContext
 */

export { pickVendasSaleRowId };

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {string | null}
 */
function pickSaleItemIdFromRow(row) {
  return pickVendasSaleRowId(row);
}

/**
 * Consolida filtros e escopo de vendas já carregados na página (sem duplicar estado).
 *
 * @param {{
 *   periodPreset: string;
 *   startDate: string;
 *   endDate: string;
 *   periodSummaryLabel: string;
 *   marketplaceAccountId: string;
 *   accountLabel: string;
 *   listFilterId: string;
 *   searchQuery: string;
 *   scopeOrdersCount: number;
 *   truncatedScan: boolean;
 *   rows: readonly Record<string, unknown>[];
 *   selectedSaleIds?: readonly string[];
 *   reportScope?: "filters" | "selected";
 *   selectedSalesMetrics?: Record<string, unknown> | null;
 *   selectedAccountLabel?: string;
 * }} input
 * @returns {VendasReportContext}
 */
export function buildVendasReportContext(input) {
  const filterId = String(input.listFilterId ?? "all").trim() || "all";
  const chip = SALES_FILTER_CHIPS.find((c) => c.id === filterId);

  const accountId = String(input.marketplaceAccountId ?? "").trim();
  const searchQuery = String(input.searchQuery ?? "").trim();

  const pageItemIds = [];
  for (const row of input.rows ?? []) {
    const id = pickSaleItemIdFromRow(row);
    if (id) pageItemIds.push(id);
  }

  const selectedIds = Array.isArray(input.selectedSaleIds)
    ? input.selectedSaleIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const reportScope = input.reportScope === "selected" ? "selected" : "filters";
  const metrics =
    input.selectedSalesMetrics != null && typeof input.selectedSalesMetrics === "object"
      ? input.selectedSalesMetrics
      : null;
  const selectedSales =
    reportScope === "selected" && metrics && Array.isArray(metrics.selectedSales)
      ? /** @type {readonly Record<string, unknown>[]} */ (metrics.selectedSales)
      : [];

  const startDate = String(input.startDate ?? "").trim();
  const endDate = String(input.endDate ?? "").trim();
  let rangeDisplay = String(input.periodSummaryLabel ?? "").trim() || "Período";
  if (startDate && endDate) {
    rangeDisplay =
      startDate === endDate
        ? formatIsoToBrDate(startDate)
        : `${formatIsoToBrDate(startDate)} até ${formatIsoToBrDate(endDate)}`;
  }

  const period =
    reportScope === "selected"
      ? {
          preset: "",
          startDate: "",
          endDate: "",
          label: "Seleção manual",
          rangeDisplay: "Vendas selecionadas manualmente",
        }
      : {
          preset: String(input.periodPreset ?? "").trim(),
          startDate,
          endDate,
          label: String(input.periodSummaryLabel ?? "").trim() || "Período",
          rangeDisplay,
        };

  const account =
    reportScope === "selected"
      ? {
          marketplaceAccountId: null,
          label: String(input.selectedAccountLabel ?? "").trim() || "—",
        }
      : {
          marketplaceAccountId: accountId || null,
          label: accountId ? String(input.accountLabel ?? "").trim() || "Conta selecionada" : "Todas as contas",
        };

  const operationalFilter =
    reportScope === "selected"
      ? { id: "selected", label: "Seleção manual" }
      : {
          id: filterId,
          label: chip?.label ?? (filterId === "all" ? "Todos" : filterId),
        };

  const search =
    reportScope === "selected"
      ? { query: "", hasQuery: false }
      : { query: searchQuery, hasQuery: Boolean(searchQuery) };

  return {
    version: 1,
    period,
    account,
    operationalFilter,
    search,
    sales: {
      totalCount: Math.max(0, Number(input.scopeOrdersCount) || 0),
      truncatedScan: reportScope === "selected" ? false : Boolean(input.truncatedScan),
      pageItemIds,
      selectedIds,
    },
    reportScope,
    selectedSales,
    selectedSalesIds: selectedIds,
    selectedSalesMetrics: metrics,
    capabilities: ["previewModal", "executiveStub", "multiSelectSales"],
  };
}

/**
 * Período válido para oferecer geração de relatório (mesmo critério da listagem).
 *
 * @param {{ startDate?: string; endDate?: string }} filters
 */
export function canOfferVendasReport(filters) {
  return Boolean(String(filters?.startDate ?? "").trim() && String(filters?.endDate ?? "").trim());
}
