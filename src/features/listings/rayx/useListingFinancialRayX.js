import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthBootstrapReady } from "../../../hooks/useAuthBootstrapReady.js";
import { useSalesExecutiveSummary } from "../../../hooks/useSalesExecutiveSummary.js";
import { isExecutiveSummaryEmptyForFilters } from "../../../components/sales/vendasExecutivePanelUx.js";
import { buildListingExecutiveApiParams } from "./buildListingExecutiveApiParams.js";
import { fetchListingSalesHistory } from "./fetchListingSalesHistory.js";
import { resolverListingIdCompleto } from "./listingIdentity.js";
import {
  buildListingFinancialTruthContract,
  buildListingRayXSummaryFromContract,
} from "./listingFinancialTruthEngine.js";

const SALES_HISTORY_PAGE_SIZE = 20;

/**
 * @param {Record<string, unknown> | null | undefined} listing
 * @param {{
 *   enabled?: boolean;
 *   executiveEnabled?: boolean;
 *   historyEnabled?: boolean;
 * }} [options]
 */
export function useListingFinancialRayX(listing, options = {}) {
  const { enabled = true, executiveEnabled = enabled, historyEnabled = enabled } = options;
  const authReady = useAuthBootstrapReady();

  const marketplace = useMemo(
    () =>
      listing?.marketplaceRaw != null && String(listing.marketplaceRaw).trim() !== ""
        ? String(listing.marketplaceRaw).trim()
        : listing?.marketplaceSlug != null
          ? String(listing.marketplaceSlug).trim()
          : "",
    [listing],
  );

  const marketplaceAccountId = useMemo(() => {
    const candidatos = [
      listing?.marketplaceAccountId,
      listing?.marketplace_account_id,
      listing?.accountId,
    ];
    for (const bruto of candidatos) {
      if (bruto == null) continue;
      const texto = String(bruto).trim();
      if (texto) return texto;
    }
    return "";
  }, [listing]);

  const listingId = useMemo(
    () =>
      resolverListingIdCompleto(
        listing,
        listing?.listingNumberDisplay != null ? String(listing.listingNumberDisplay) : "",
      ),
    [listing],
  );

  const executiveParams = useMemo(
    () =>
      buildListingExecutiveApiParams({
        listingId,
        marketplace,
        marketplaceAccountId,
      }),
    [listingId, marketplace, marketplaceAccountId],
  );
  const executiveQueryEnabled = Boolean(executiveEnabled && authReady && executiveParams?.q);
  const historyQueryEnabled = Boolean(historyEnabled && authReady && listingId);

  const {
    summary,
    health,
    data: executiveData,
    topListings,
    loading: executiveLoading,
    error: executiveError,
    refetch: refetchExecutive,
  } = useSalesExecutiveSummary(executiveParams ?? {}, { enabled: executiveQueryEnabled });

  const financialTruthContract = useMemo(
    () => buildListingFinancialTruthContract(listing, executiveData),
    [listing, executiveData],
  );

  const summaryForDisplay = useMemo(
    () => buildListingRayXSummaryFromContract(summary, financialTruthContract),
    [summary, financialTruthContract],
  );

  const empty = useMemo(
    () => !executiveLoading && !executiveError && isExecutiveSummaryEmptyForFilters(summaryForDisplay),
    [executiveLoading, executiveError, summaryForDisplay],
  );

  const salesCountCanonical = useMemo(() => {
    if (empty || !summaryForDisplay) return 0;
    const raw = summaryForDisplay.items_quantity_sold ?? summaryForDisplay.units_sold_display;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [empty, summaryForDisplay]);

  const [salesHistoryPage, setSalesHistoryPage] = useState(1);
  const [salesHistoryRows, setSalesHistoryRows] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [salesHistoryTotal, setSalesHistoryTotal] = useState(0);
  const [salesHistoryTotalPages, setSalesHistoryTotalPages] = useState(1);
  const [salesHistoryLoading, setSalesHistoryLoading] = useState(false);
  const [salesHistoryError, setSalesHistoryError] = useState(/** @type {string | null} */ (null));
  const [salesHistoryResolved, setSalesHistoryResolved] = useState(false);
  const historyFetchInFlightRef = useRef(false);
  const historyPrimeiraPaginaCarregadaRef = useRef(false);

  useEffect(() => {
    setSalesHistoryPage(1);
    setSalesHistoryRows([]);
    setSalesHistoryTotal(0);
    setSalesHistoryTotalPages(1);
    setSalesHistoryError(null);
    setSalesHistoryResolved(false);
    historyPrimeiraPaginaCarregadaRef.current = false;
  }, [listingId]);

  const loadSalesHistory = useCallback(
    async (page = 1) => {
      if (!historyQueryEnabled) return;
      if (!listingId) return;
      if (historyFetchInFlightRef.current) return;

      historyFetchInFlightRef.current = true;
      setSalesHistoryLoading(true);
      setSalesHistoryError(null);
      try {
        const res = await fetchListingSalesHistory({
          listingId,
          marketplace,
          marketplaceAccountId,
          page,
          pageSize: SALES_HISTORY_PAGE_SIZE,
        });

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
        if (page === 1) {
          historyPrimeiraPaginaCarregadaRef.current = true;
        }
      } finally {
        historyFetchInFlightRef.current = false;
        setSalesHistoryLoading(false);
        setSalesHistoryResolved(true);
      }
    },
    [historyQueryEnabled, listingId, marketplace, marketplaceAccountId],
  );

  useEffect(() => {
    if (!historyQueryEnabled) return;
    if (salesHistoryPage === 1 && historyPrimeiraPaginaCarregadaRef.current) return;
    void loadSalesHistory(salesHistoryPage);
  }, [historyQueryEnabled, salesHistoryPage, loadSalesHistory]);

  const goSalesHistoryPage = useCallback((page) => {
    setSalesHistoryPage(Math.max(1, page));
  }, []);

  return {
    summary: summaryForDisplay,
    health,
    executiveData,
    financialTruthContract,
    topListings,
    listingMetricsLookup: new Map(),
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
    salesHistoryResolved,
    goSalesHistoryPage,
    loadSalesHistory,
  };
}
