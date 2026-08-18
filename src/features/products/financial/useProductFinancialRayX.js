// ======================================================================
// Hook — Raio-X financeiro consolidado do produto.
// Fonte única: executive-summary + listagem /api/sales (product_id).
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthBootstrapReady } from "../../../hooks/useAuthBootstrapReady.js";
import { useSalesExecutiveSummary } from "../../../hooks/useSalesExecutiveSummary.js";
import { isExecutiveSummaryEmptyForFilters } from "../../../components/sales/vendasExecutivePanelUx.js";
import { buildProductExecutiveApiParams } from "./buildProductExecutiveApiParams.js";
import {
  buildListingFinancialMetricsLookup,
  fetchProductSalesHistory,
} from "./fetchProductSalesHistory.js";

const SALES_HISTORY_PAGE_SIZE = 20;

/**
 * @param {string | null | undefined} productId
 * @param {{ enabled?: boolean }} [options]
 */
export function useProductFinancialRayX(productId, options = {}) {
  const { enabled = true } = options;
  const authReady = useAuthBootstrapReady();
  const executiveParams = useMemo(() => buildProductExecutiveApiParams(productId), [productId]);
  const queryEnabled = Boolean(enabled && authReady && executiveParams?.product_id);

  const {
    summary,
    health,
    data: executiveData,
    topListings,
    loading: executiveLoading,
    error: executiveError,
    refetch: refetchExecutive,
  } = useSalesExecutiveSummary(executiveParams ?? {}, { enabled: queryEnabled });

  const empty = useMemo(
    () => !executiveLoading && !executiveError && isExecutiveSummaryEmptyForFilters(summary),
    [executiveLoading, executiveError, summary],
  );

  /** Mesma base do KPI Vendas (executive-summary) — badge e paginação do histórico. */
  const salesCountCanonical = useMemo(() => {
    if (empty || !summary) return 0;
    const raw = summary.items_quantity_sold ?? summary.orders_count;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [empty, summary]);

  useEffect(() => {
    if (executiveLoading || executiveError || !summary || !executiveParams?.product_id) return;

    const filtersApplied =
      executiveData?.filters_applied != null && typeof executiveData.filters_applied === "object"
        ? executiveData.filters_applied
        : null;

    console.info("[S7_PRODUCT_PERFORMANCE]", {
      product_id: executiveParams.product_id,
      sku: filtersApplied?.product_sku ?? null,
      listing_count: filtersApplied?.linked_listings_count ?? topListings?.length ?? 0,
      sales_count: summary?.items_quantity_sold ?? summary?.orders_count ?? 0,
      revenue: summary?.gross_sales_brl ?? null,
      profit: summary?.net_profit_brl ?? summary?.contribution_profit_brl ?? null,
      margin: summary?.contribution_margin_percent ?? null,
      source: "frontend-rayx",
    });
  }, [executiveLoading, executiveError, summary, executiveData, executiveParams, topListings]);

  const listingMetricsLookup = useMemo(() => {
    const rankings =
      executiveData?.rankings != null && typeof executiveData.rankings === "object"
        ? executiveData.rankings
        : null;
    return buildListingFinancialMetricsLookup(rankings);
  }, [executiveData]);

  const [salesHistoryPage, setSalesHistoryPage] = useState(1);
  const [salesHistoryRows, setSalesHistoryRows] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [salesHistoryTotal, setSalesHistoryTotal] = useState(0);
  const [salesHistoryTotalPages, setSalesHistoryTotalPages] = useState(1);
  const [salesHistoryLoading, setSalesHistoryLoading] = useState(false);
  const [salesHistoryError, setSalesHistoryError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    setSalesHistoryPage(1);
    setSalesHistoryRows([]);
    setSalesHistoryTotal(0);
    setSalesHistoryTotalPages(1);
    setSalesHistoryError(null);
  }, [productId]);

  const loadSalesHistory = useCallback(
    async (page = 1) => {
      const pid = productId != null ? String(productId).trim() : "";
      if (!pid || !queryEnabled) return;

      setSalesHistoryLoading(true);
      setSalesHistoryError(null);
      const res = await fetchProductSalesHistory({
        productId: pid,
        page,
        pageSize: SALES_HISTORY_PAGE_SIZE,
      });
      setSalesHistoryLoading(false);

      if (!res.ok) {
        setSalesHistoryError(res.error ?? "Erro ao carregar histórico");
        setSalesHistoryRows([]);
        setSalesHistoryTotal(0);
        setSalesHistoryTotalPages(1);
        return;
      }

      setSalesHistoryRows(res.rows);
      setSalesHistoryTotal(res.total);
      setSalesHistoryTotalPages(res.totalPages);
      setSalesHistoryPage(page);
    },
    [productId, queryEnabled],
  );

  useEffect(() => {
    if (!queryEnabled) return;
    void loadSalesHistory(salesHistoryPage);
  }, [queryEnabled, salesHistoryPage, loadSalesHistory]);

  const goSalesHistoryPage = useCallback((page) => {
    setSalesHistoryPage(Math.max(1, page));
  }, []);

  return {
    summary,
    health,
    executiveData,
    topListings,
    listingMetricsLookup,
    executiveLoading,
    executiveError,
    empty,
    salesCountCanonical,
    refetchExecutive,
    salesHistoryRows,
    salesHistoryTotal,
    salesHistoryTotalPages,
    salesHistoryPage,
    salesHistoryLoading,
    salesHistoryError,
    goSalesHistoryPage,
    loadSalesHistory,
  };
}
