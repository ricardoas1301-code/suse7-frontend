// ======================================================================
// Contexto unificado de relatório — espelha os filtros da página Concorrência.
// Princípio: o que está filtrado na tela = o que será exportado.
// ======================================================================

import { CONCORRENCIA_FILTER_CHIPS } from "../filters/concorrenciaFilterChips.js";
import { rotuloContaMercadoLivre } from "../filters/concorrenciaFiltersConstants.js";
import { pickConcorrenciaProductRowId } from "../selection/pickConcorrenciaProductRowId.js";

/**
 * @typedef {{
 *   marketplaceAccountId: string | null;
 *   label: string;
 * }} ConcorrenciaReportContextAccount
 */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 * }} ConcorrenciaReportContextOperationalFilter
 */

/**
 * @typedef {{
 *   query: string;
 *   hasQuery: boolean;
 * }} ConcorrenciaReportContextSearch
 */

/**
 * @typedef {{
 *   totalCount: number;
 *   pageItemIds: string[];
 *   selectedIds: string[];
 * }} ConcorrenciaReportContextProducts
 */

/**
 * @typedef {{
 *   version: number;
 *   account: ConcorrenciaReportContextAccount;
 *   operationalFilter: ConcorrenciaReportContextOperationalFilter;
 *   search: ConcorrenciaReportContextSearch;
 *   products: ConcorrenciaReportContextProducts;
 *   reportScope: "filters" | "selected";
 *   selectedProducts: readonly Record<string, unknown>[];
 *   selectedProductIds: string[];
 *   capabilities: readonly string[];
 * }} ConcorrenciaReportContext
 */

export { pickConcorrenciaProductRowId };

/**
 * @param {{
 *   accountId: string;
 *   accountLabel: string;
 *   listFilterId: string;
 *   searchQuery: string;
 *   scopeProductsCount: number;
 *   pageRows: readonly Record<string, unknown>[];
 *   selectedProductIds?: readonly string[];
 *   reportScope?: "filters" | "selected";
 *   selectedProducts?: readonly Record<string, unknown>[];
 *   selectedAccountLabel?: string;
 * }} input
 * @returns {ConcorrenciaReportContext}
 */
export function buildConcorrenciaReportContext(input) {
  const filterId = String(input.listFilterId ?? "all").trim() || "all";
  const chip = CONCORRENCIA_FILTER_CHIPS.find((c) => c.id === filterId);

  const accountId = String(input.accountId ?? "").trim();
  const searchQuery = String(input.searchQuery ?? "").trim();

  const pageItemIds = [];
  for (const row of input.pageRows ?? []) {
    const id = pickConcorrenciaProductRowId(row);
    if (id) pageItemIds.push(id);
  }

  const selectedIds = Array.isArray(input.selectedProductIds)
    ? input.selectedProductIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const reportScope = input.reportScope === "selected" ? "selected" : "filters";
  const selectedProducts =
    reportScope === "selected" && Array.isArray(input.selectedProducts)
      ? /** @type {readonly Record<string, unknown>[]} */ (input.selectedProducts)
      : [];

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
    account,
    operationalFilter,
    search,
    products: {
      totalCount: Math.max(0, Number(input.scopeProductsCount) || 0),
      pageItemIds,
      selectedIds,
    },
    reportScope,
    selectedProducts,
    selectedProductIds: selectedIds,
    capabilities: ["previewModal", "executiveSummary", "multiSelectProducts"],
  };
}

/**
 * Rótulo de conta para contexto do relatório.
 *
 * @param {string} accountId
 * @param {readonly Record<string, unknown>[]} accounts
 */
export function rotuloContaConcorrenciaRelatorio(accountId, accounts) {
  const id = String(accountId ?? "").trim();
  if (!id) return "Todas as contas";
  const account = accounts.find((a) => (a?.id != null ? String(a.id).trim() : "") === id);
  return account ? rotuloContaMercadoLivre(account) : "Conta selecionada";
}

/**
 * Sempre pode oferecer relatório quando há produtos no escopo.
 *
 * @param {number} scopeCount
 */
export function canOfferConcorrenciaReport(scopeCount) {
  return Math.max(0, Number(scopeCount) || 0) > 0;
}
