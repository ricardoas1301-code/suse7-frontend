// ======================================================================
// Contexto de relatório — produto consolidado (compartilhamento).
// Espelha buildVendasReportContext sem duplicar engine financeira.
// ======================================================================

import { buildVendasReportContext } from "../../vendas/reports/buildVendasReportContext.js";

/**
 * @param {{
 *   productId: string;
 *   productTitle?: string | null;
 *   productSku?: string | null;
 *   summary?: Record<string, unknown> | null;
 *   salesRows?: readonly Record<string, unknown>[];
 *   salesTotal?: number;
 *   truncatedScan?: boolean;
 * }} input
 */
export function buildProductReportContext(input) {
  const productId = String(input.productId ?? "").trim();
  const title = String(input.productTitle ?? "").trim() || "Produto";
  const sku = String(input.productSku ?? "").trim();
  const summary = input.summary ?? null;

  const qtyRaw =
    summary?.items_quantity_sold != null ? summary.items_quantity_sold : summary?.orders_count;
  const qtyN = typeof qtyRaw === "number" ? qtyRaw : Number.parseInt(String(qtyRaw ?? ""), 10);
  const scopeOrdersCount = Number.isFinite(qtyN) ? Math.max(0, qtyN) : 0;

  const salesRows = Array.isArray(input.salesRows) ? input.salesRows : [];
  const salesTotal =
    typeof input.salesTotal === "number" && Number.isFinite(input.salesTotal)
      ? Math.max(0, Math.floor(input.salesTotal))
      : salesRows.length;

  const searchLabel = sku ? `${title} · SKU ${sku}` : title;

  const context = buildVendasReportContext({
    periodPreset: "custom",
    startDate: "",
    endDate: "",
    periodSummaryLabel: "Histórico consolidado",
    marketplaceAccountId: "",
    accountLabel: "Todas as contas",
    listFilterId: "all",
    searchQuery: searchLabel,
    scopeOrdersCount,
    listRowsTotal: salesTotal,
    truncatedScan: Boolean(input.truncatedScan),
    rows: salesRows,
    reportScope: "filters",
    selectedSalesMetrics: null,
    selectedAccountLabel: "Todas as contas",
  });

  return {
    ...context,
    productScope: {
      productId,
      title,
      sku: sku || null,
    },
  };
}
