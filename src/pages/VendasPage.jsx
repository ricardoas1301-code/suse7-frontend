// ======================================================================
// Página Vendas — cards via GET /api/sales/executive-summary; lista via GET /api/sales.
// ======================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildApiUrl, apiFetch } from "../config/api";
import { useSalesExecutiveSummary } from "../hooks/useSalesExecutiveSummary";
import { fetchMercadoLivreMarketplaceAccounts } from "../services/marketplaceAccountsApi";
import SaleDetailModal from "../components/sales/SaleDetailModal";
import { isExecutiveSummaryEmptyForFilters } from "../components/sales/vendasExecutivePanelUx";
import { useVendasExecutiveKpiDisplay } from "../components/sales/useVendasExecutiveKpiDisplay";
import { isSaleRayxDetailItemId, pickSaleRayxDetailItemId } from "../components/sales/saleRayxDetailItemId";
import S7Icon from "../components/ui/S7Icon";
import { getVendasTableFinancialHealthToneClass } from "../utils/saleHealthUi";
import {
  pickSaleCommissionSecondaryLabel,
  pickSaleInternalTaxBrl,
  pickSaleInternalTaxPercentLabel,
  pickSaleMarketplaceFeeBrl,
  pickSaleOperationalStatusLabel,
} from "../components/sales/saleRayxFinancialPickers";
import S7CatalogAccountCell, {
  S7CatalogChannelCell,
  pickCatalogAccountFields,
} from "../components/catalog/S7CatalogAccountCell.jsx";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../components/ui/S7CopyButton";
import S7CatalogListingHeadline from "../components/catalog/S7CatalogListingHeadline.jsx";
import S7Button from "../components/ui/S7Button";
import QuickProductCostsModal from "../features/listings/components/QuickProductCostsModal.jsx";
import { formatVendasTableTitleCase } from "../features/vendas/utils/vendasTableDisplayFormat.js";
import { resolveSalesRowProductThumbUrl, salesRowThumbCacheKey } from "../utils/resolveSalesRowProductThumbUrl.js";
import { getSaleStatusToneClass } from "../features/vendas/utils/saleStatusToneClass.js";
import VendasFiltersCard from "../features/vendas/filters/VendasFiltersCard.jsx";
import { VendasFiltersProvider, useVendasFilters } from "../features/vendas/filters/VendasFiltersContext.jsx";
import { buildVendasSalesListPeriodQuery } from "../features/vendas/filters/vendasFiltersPeriod.js";
import VendasMobileSaleCard from "../features/vendas/mobile/VendasMobileSaleCard.jsx";
import {
  formatVendasBuyerNameShort,
  pickVendasListingMercadoLivreUrl,
} from "../features/vendas/utils/vendasListRowDisplay.js";
import "../components/Products.css";
import "../components/Anuncios.css";
import "../styles/VendasPage.css";
import "../features/vendas/mobile/VendasMobileSaleCard.css";
import { bindListTableHeadStickyToFilter } from "../styles/s7ListTableHeadStickySync.js";
import {
  buildVendasReportContext,
  canOfferVendasReport,
} from "../features/vendas/reports/buildVendasReportContext.js";
import { buildVendasAggregatedReport } from "../features/vendas/reports/buildVendasAggregatedReport.js";
import VendasGerarRelatorioModal from "../features/vendas/reports/VendasGerarRelatorioModal.jsx";
import { useVendasListSelection } from "../features/vendas/selection/useVendasListSelection.js";
import {
  resolveVendasSelectionAccountLabel,
  buildVendasSelectionAccountDistribution,
} from "../features/vendas/selection/resolveVendasSelectionAccountLabel.js";
import { pickVendasSaleRowId } from "../features/vendas/selection/pickVendasSaleRowId.js";
import { aggregateVendasSelectedSalesMetrics } from "../features/vendas/selection/aggregateVendasSelectedSalesMetrics.js";
import { buildVendasSelectedReportExecutivePreview } from "../features/vendas/selection/buildVendasSelectedReportExecutivePreview.js";
import VendasRowSelectCheckbox from "../features/vendas/selection/VendasRowSelectCheckbox.jsx";

const DASH = "—";
const DEFAULT_PAGE_SIZE = 100;

/** @returns {{ date: string; time: string } | null} */
function formatSaleDateParts(iso) {
  if (iso == null || String(iso).trim() === "") return null;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  return {
    date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

/** @param {{ date: string; time: string } | null} parts */
function formatSaleDateTimeLine(parts) {
  if (!parts) return null;
  return `${parts.date} ${parts.time}`;
}

/** Thumbnail do produto — mesma resolução que catálogo (https + galeria + links + raw ML). */
function VendasSalesProductThumb({ row }) {
  const [src, setSrc] = useState("");
  const [broken, setBroken] = useState(false);
  const cacheKey = useMemo(() => salesRowThumbCacheKey(/** @type {Record<string, unknown>} */ (row)), [row]);

  useEffect(() => {
    let cancelled = false;
    setSrc("");
    setBroken(false);
    (async () => {
      const u = await resolveSalesRowProductThumbUrl(/** @type {Record<string, unknown>} */ (row));
      if (!cancelled) setSrc(u != null && String(u).trim() !== "" ? String(u).trim() : "");
    })();
    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  const showImg = src !== "" && !broken;
  if (showImg) {
    return (
      <span
        className="vendas-page__product-thumb-wrap s7-operational-thumb-frame s7-operational-thumb-frame--circle"
        aria-hidden
      >
        <img
          className="vendas-page__product-thumb s7-operational-thumb"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      </span>
    );
  }
  return <span className="vendas-page__product-thumb-slot" aria-hidden />;
}

/**
 * Título (até 2 linhas) + MLB/SKU na mesma faixa, alinhados à esquerda.
 * @param {{
 *   title: string;
 *   listingMercadoLivreUrl: string | null;
 *   listingId: string;
 *   sku: string;
 * }} props
 */
function VendasProductHeadline({ title, listingMercadoLivreUrl, listingId, sku }) {
  return (
    <S7CatalogListingHeadline
      title={title}
      titleHref={listingMercadoLivreUrl}
      listingId={listingId}
      listingIdCopyValue={listingId}
      sku={sku}
      skuCopyValue={sku}
      stopTitlePropagation
      copyListingFlashKey={`vendas-list-listing-${listingId}`}
      copySkuFlashKey={`vendas-list-sku-${sku}`}
    />
  );
}

/** @param {string | null | undefined} s */
function formatBrlApi(s) {
  if (s == null || String(s).trim() === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Célula de valor BRL com tratamento de estado incompleto (dado ausente vira `—`
 * discreto com dica, sem parecer erro). Não inventa valores: R$ 0,00 segue como zero real.
 * @param {string | null | undefined} s
 */
function renderBrlValueCell(s) {
  const text = formatBrlApi(s);
  if (text === DASH) {
    return (
      <span className="vendas-page__fin-missing" title="Sem dado informado">
        {DASH}
      </span>
    );
  }
  return text;
}

/** @param {string | null | undefined} s */
function formatPctApi(s) {
  if (s == null || String(s).trim() === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/** @type {typeof formatVendasBuyerNameShort} */
const formatBuyerNameShort = formatVendasBuyerNameShort;

/**
 * Célula numérica em duas linhas (valor + detalhe abaixo, sem deslocar a linha principal).
 * @param {{ primary: import("react").ReactNode; secondary?: string | null }} props
 */
function VendasTableNumStack({ primary, secondary }) {
  const sub = secondary != null && String(secondary).trim() !== "" ? String(secondary).trim() : null;
  return (
    <div className="vendas-page__num-stack">
      <span className="vendas-page__num-stack-primary">{primary}</span>
      <span className="vendas-page__num-stack-secondary-slot" aria-hidden={sub ? undefined : true}>
        {sub ? <span className="vendas-page__num-stack-secondary">{sub}</span> : null}
      </span>
    </div>
  );
}

/** @param {{ children: import("react").ReactNode }} props */
function VendasTableNumSingle({ children }) {
  return (
    <div className="vendas-page__num-stack">
      <span className="vendas-page__num-stack-primary">{children}</span>
      <span className="vendas-page__num-stack-secondary-slot" aria-hidden="true" />
    </div>
  );
}

/** @param {string | null | undefined} pctLabel */
function formatVendasTaxSecondaryLabel(pctLabel) {
  const pct = pctLabel != null && String(pctLabel).trim() !== "" ? String(pctLabel).trim() : "";
  if (!pct) return null;
  return `Imposto ${pct}`;
}

/** @param {string} toneClass */
function vendasFinHealthValueClass(toneClass) {
  if (toneClass === "vendas-page__fin--health-critical") return "vendas-page__fin-value--health-critical";
  if (toneClass === "vendas-page__fin--health-warn") return "vendas-page__fin-value--health-warn";
  if (toneClass === "vendas-page__fin--health-healthy") return "vendas-page__fin-value--health-healthy";
  if (toneClass === "vendas-page__fin--empty") return "vendas-page__fin-value--empty";
  return "";
}

/**
 * Indicador compacto de saúde na coluna Lucro (R$): seta ↓ prejuízo, bolinha margem crítica, seta ↑ saudável.
 * @param {{ toneClass: string }} props
 */
function VendasProfitHealthHint({ toneClass }) {
  if (toneClass === "vendas-page__fin--health-critical") {
    return (
      <span
        className="vendas-page__profit-hint vendas-page__profit-hint--down"
        title="Prejuízo"
        aria-label="Prejuízo"
      />
    );
  }
  if (toneClass === "vendas-page__fin--health-warn") {
    return (
      <span
        className="vendas-page__profit-hint vendas-page__profit-hint--dot"
        title="Margem crítica"
        aria-label="Margem crítica"
      />
    );
  }
  if (toneClass === "vendas-page__fin--health-healthy") {
    return (
      <span
        className="vendas-page__profit-hint vendas-page__profit-hint--up"
        title="Saudável"
        aria-label="Saudável"
      />
    );
  }
  return null;
}

/** @param {Record<string, unknown> | null | undefined} a */
function vendasMlAccountLabel(a) {
  if (!a || typeof a !== "object") return "Conta";
  if (a.ml_nickname != null && String(a.ml_nickname).trim() !== "") return String(a.ml_nickname).trim();
  if (a.account_alias != null && String(a.account_alias).trim() !== "") return String(a.account_alias).trim();
  if (a.external_seller_id != null) return String(a.external_seller_id);
  return "Conta";
}

export default function VendasPage() {
  return (
    <VendasFiltersProvider>
      <VendasPageContent />
    </VendasFiltersProvider>
  );
}

function VendasPageContent() {
  const {
    filters: vendasFilters,
    executiveApiParams,
    periodSummaryLabel,
  } = useVendasFilters();

  /** Contas marketplace para o filtro “Conta”. */
  const [mlAccounts, setMlAccounts] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [mlAccountsReady, setMlAccountsReady] = useState(false);

  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalRows, setTotalRows] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [truncatedList, setTruncatedList] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(/** @type {string | null} */ (null));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(/** @type {string | null} */ (null));
  /** @type {[null | { productId: string; sku: string | null; productTitle: string; productImageUrl: string | null }, (v: null | { productId: string; sku: string | null; productTitle: string; productImageUrl: string | null }) => void]} */
  const [costsModal, setCostsModal] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const vendasFiltersRef = useRef(/** @type {HTMLElement | null} */ (null));
  const [reportModalMode, setReportModalMode] = useState(/** @type {"filters" | "selected"} */ ("filters"));
  const selectAllPageRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const {
    selectedCount,
    selectedSales,
    isSelected,
    toggle: toggleSaleSelection,
    toggleAllOnPage,
    clearSelection,
    allPageSelected,
    somePageSelected,
  } = useVendasListSelection(rows);

  useEffect(() => {
    const el = selectAllPageRef.current;
    if (el) el.indeterminate = somePageSelected;
  }, [somePageSelected]);

  useEffect(() => {
    const cardEl = vendasFiltersRef.current;
    const scrollRoot = cardEl?.closest(".page-content");
    if (!cardEl || !scrollRoot) return undefined;
    return bindListTableHeadStickyToFilter(scrollRoot, cardEl);
  }, [vendasFilters.expanded, loading]);

  useEffect(() => {
    clearSelection();
  }, [
    page,
    filter,
    debouncedSearch,
    vendasFilters.periodPreset,
    vendasFilters.startDate,
    vendasFilters.endDate,
    vendasFilters.marketplace,
    vendasFilters.marketplaceAccountId,
    clearSelection,
  ]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 220);
    return () => clearTimeout(t);
  }, [searchInput]);

  const executiveParams = useMemo(
    () => ({
      ...executiveApiParams,
      filter: filter !== "all" ? filter : undefined,
      q: debouncedSearch || undefined,
    }),
    [executiveApiParams, filter, debouncedSearch],
  );

  const executiveQueryEnabled = useMemo(
    () => Boolean(vendasFilters.startDate && vendasFilters.endDate),
    [vendasFilters.startDate, vendasFilters.endDate],
  );

  const {
    data: executiveData,
    summary: executiveSummary,
    health: executiveHealth,
    topListings,
    topProducts,
    distributionByAccount,
    dataQuality,
    period: executivePeriod,
    truncatedScan: executiveTruncated,
    loading: executiveLoading,
    error: executiveError,
  } = useSalesExecutiveSummary(executiveParams, { enabled: executiveQueryEnabled });

  const executivePanelEmpty = useMemo(
    () =>
      !executiveLoading &&
      !executiveError &&
      isExecutiveSummaryEmptyForFilters(executiveSummary),
    [executiveLoading, executiveError, executiveSummary],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchMercadoLivreMarketplaceAccounts();
      if (cancelled) return;
      setMlAccountsReady(true);
      const list =
        res.ok && Array.isArray(res.data?.accounts) ? /** @type {Record<string, unknown>[]} */ (res.data.accounts) : [];
      setMlAccounts(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = useMemo(() => {
    if (!Number.isFinite(totalRows) || totalRows <= 0) return 1;
    return Math.max(1, Math.ceil(totalRows / pageSize));
  }, [totalRows, pageSize]);

  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;
  const load = useCallback(async () => {
    const listBase = buildApiUrl("/api/sales");
    if (!listBase) {
      setErr("Configure VITE_API_BASE_URL para carregar as vendas.");
      setRows([]);
      setLoading(false);
      return;
    }
    const qsList = new URLSearchParams();
    qsList.set("page", String(page));
    qsList.set("page_size", String(pageSize));
    const periodQs = buildVendasSalesListPeriodQuery({
      periodPreset: vendasFilters.periodPreset,
      startDate: vendasFilters.startDate,
      endDate: vendasFilters.endDate,
      marketplace: vendasFilters.marketplace,
      marketplaceAccountId: vendasFilters.marketplaceAccountId,
    });
    periodQs.forEach((value, key) => {
      qsList.set(key, value);
    });
    if (filter && filter !== "all") qsList.set("filter", filter);
    if (debouncedSearch) qsList.set("q", debouncedSearch);
    const listUrl = `${listBase}?${qsList.toString()}`;
    if (import.meta.env.DEV) {
      console.info("[S7][Vendas list query]", {
        periodPreset: vendasFilters.periodPreset,
        contextStartDate: vendasFilters.startDate,
        contextEndDate: vendasFilters.endDate,
        queryStartDate: qsList.get("start_date"),
        queryEndDate: qsList.get("end_date"),
        queryPeriodPreset: qsList.get("period_preset"),
        page,
        pageSize,
        filter: filter !== "all" ? filter : null,
        search: debouncedSearch || null,
        url: listUrl,
      });
    }

    setLoading(true);
    setErr(null);
    const resList = await apiFetch(listUrl, { method: "GET" });
    setLoading(false);

    if (!resList.ok) {
      setErr(resList.error ?? "Não foi possível carregar as vendas.");
      setRows([]);
      setTotalRows(0);
      setTotalSales(0);
      setTruncatedList(false);
    } else {
      const data = resList.data;
      const rowsArr = Array.isArray(data?.rows) ? data.rows : [];
      setRows(rowsArr);
      const rawRowsTotal = data?.pagination?.total ?? data?.total ?? 0;
      const parsedRowsTotal =
        typeof rawRowsTotal === "number" && Number.isFinite(rawRowsTotal)
          ? Math.max(0, Math.floor(rawRowsTotal))
          : Number.parseInt(String(rawRowsTotal ?? ""), 10) || 0;
      setTotalRows(parsedRowsTotal);

      const rawOrdersTotal = data?.pagination?.orders_total ?? data?.orders_total ?? rawRowsTotal;
      const parsedOrdersTotal =
        typeof rawOrdersTotal === "number" && Number.isFinite(rawOrdersTotal)
          ? Math.max(0, Math.floor(rawOrdersTotal))
          : Number.parseInt(String(rawOrdersTotal ?? ""), 10) || 0;
      setTotalSales(parsedOrdersTotal);
      setTruncatedList(Boolean(data?.pagination?.truncated_scan));

      const apiTp = data?.pagination?.total_pages ?? data?.total_pages;
      const derivedTp =
        parsedRowsTotal <= 0 ? 1 : Math.max(1, Math.ceil(parsedRowsTotal / pageSize));
      const tp =
        typeof apiTp === "number" && Number.isFinite(apiTp) && apiTp >= 1 ? Math.floor(apiTp) : derivedTp;
      const hasNext = typeof data?.pagination?.has_next === "boolean" ? data.pagination.has_next : page < tp;
      const hasPrev =
        typeof data?.pagination?.has_previous === "boolean" ? data.pagination.has_previous : page > 1;

      if (import.meta.env.DEV) {
        const firstRow = rowsArr[0] ?? null;
        const lastRow = rowsArr.length > 0 ? rowsArr[rowsArr.length - 1] : null;
        console.info("[S7][/api/sales response]", {
          total_rows: parsedRowsTotal,
          total_sales: parsedOrdersTotal,
          rowsCount: rowsArr.length,
          marketplace: vendasFilters.marketplace.trim() || null,
          marketplace_account_id: vendasFilters.marketplaceAccountId.trim() || null,
          period_preset: executiveApiParams.period_preset ?? null,
          start_date: executiveApiParams.start_date ?? null,
          end_date: executiveApiParams.end_date ?? null,
          filter: filter !== "all" ? filter : null,
          q: debouncedSearch || null,
          firstOrderId: firstRow?.external_order_id ?? firstRow?.sale_display_code ?? null,
          firstItemId: firstRow?.item_id ?? firstRow?.sale_item_id ?? null,
          firstDateCreatedMarketplace: firstRow?.date_created_marketplace ?? null,
          lastDateCreatedMarketplace: lastRow?.date_created_marketplace ?? null,
        });
        console.log("[S7][sales-pagination-debug]", {
          page,
          pageSize,
          totalRows: parsedRowsTotal,
          totalSales: parsedOrdersTotal,
          totalPages: tp,
          hasNext,
          hasPrevious: hasPrev,
          rowsLength: rowsArr.length,
        });
      }
    }
  }, [
    page,
    pageSize,
    vendasFilters.periodPreset,
    vendasFilters.startDate,
    vendasFilters.endDate,
    vendasFilters.marketplace,
    vendasFilters.marketplaceAccountId,
    filter,
    debouncedSearch,
    executiveApiParams.period_preset,
    executiveApiParams.start_date,
    executiveApiParams.end_date,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [
    vendasFilters.periodPreset,
    vendasFilters.startDate,
    vendasFilters.endDate,
    vendasFilters.marketplace,
    vendasFilters.marketplaceAccountId,
    filter,
    debouncedSearch,
  ]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (loading || executiveLoading) return;
    if (totalSales <= 0 && rows.length === 0) return;

    const ordersCount =
      typeof executiveSummary?.orders_count === "number"
        ? executiveSummary.orders_count
        : Number.parseInt(String(executiveSummary?.orders_count ?? ""), 10) || 0;

    if (totalSales > 0 && ordersCount === 0) {
      const firstRow = rows[0] ?? null;
      console.info("[S7][Sales vs ExecutiveSummary compare]", {
        salesList: {
          total_sales: totalSales,
          total_rows: totalRows,
          rowsCount: rows.length,
          marketplace: vendasFilters.marketplace.trim() || null,
          marketplace_account_id: vendasFilters.marketplaceAccountId.trim() || null,
          filter: filter !== "all" ? filter : null,
          q: debouncedSearch || null,
          firstOrderId: firstRow?.external_order_id ?? firstRow?.sale_display_code ?? null,
          firstItemId: firstRow?.item_id ?? firstRow?.sale_item_id ?? null,
        },
        executiveSummary: {
          orders_count: ordersCount,
          listingsCount: topListings.length,
          summary: executiveSummary,
          period: executivePeriod,
          filtersApplied: executiveData?.filters_applied ?? null,
          dataQuality: executiveData?.data_quality ?? null,
        },
      });
    }
  }, [
    loading,
    executiveLoading,
    totalRows,
    totalSales,
    rows,
    executiveSummary,
    topListings,
    executivePeriod,
    executiveData,
    vendasFilters.marketplace,
    vendasFilters.marketplaceAccountId,
    filter,
    debouncedSearch,
  ]);

  const openDetail = useCallback((itemId) => {
    const id = String(itemId ?? "").trim();
    if (!isSaleRayxDetailItemId(id)) {
      if (import.meta.env.DEV) {
        console.warn("[S7 Raio-X] não abre modal: item_id ausente ou inválido (exige UUID de sales_order_items)", {
          itemId: id || null,
        });
      }
      return;
    }
    setSelectedItemId(id);
    setModalOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setModalOpen(false);
    setSelectedItemId(null);
  }, []);

  const { quantityKpi, revenueKpi, netProfitKpi, profitPercentKpi } = useVendasExecutiveKpiDisplay({
    executiveSummary,
    executivePanelEmpty,
  });

  const reportAccountLabel = useMemo(() => {
    const accountId = vendasFilters.marketplaceAccountId
      ? String(vendasFilters.marketplaceAccountId).trim()
      : "";
    if (!accountId) return "Todas as contas";
    const account = mlAccounts.find((a) => (a?.id != null ? String(a.id).trim() : "") === accountId);
    return account ? vendasMlAccountLabel(account) : "Conta selecionada";
  }, [vendasFilters.marketplaceAccountId, mlAccounts]);

  const selectedSalesMetrics = useMemo(
    () => aggregateVendasSelectedSalesMetrics(selectedSales),
    [selectedSales],
  );

  const reportScopeOrdersCount = useMemo(() => {
    if (reportModalMode === "selected") return selectedSalesMetrics.ordersCount;
    return Number.isFinite(totalSales) ? Math.max(0, Math.floor(totalSales)) : 0;
  }, [reportModalMode, selectedSalesMetrics.ordersCount, totalSales]);

  const reportExecutivePreview = useMemo(
    () => ({
      quantityValue: quantityKpi.value,
      revenueValue: revenueKpi.value,
      netProfitValue: netProfitKpi.value,
      marginValue: profitPercentKpi.value,
      marginUnavailable: profitPercentKpi.unavailable,
      lowMarginCount: executiveHealth?.low_margin_count ?? 0,
      negativeCount: executiveHealth?.negative_sales_count ?? 0,
      loading: executiveLoading,
      empty: executivePanelEmpty,
      error: executiveError,
    }),
    [
      quantityKpi,
      revenueKpi,
      netProfitKpi,
      profitPercentKpi,
      executiveHealth,
      executiveLoading,
      executivePanelEmpty,
      executiveError,
    ],
  );

  const selectedReportExecutivePreview = useMemo(
    () => buildVendasSelectedReportExecutivePreview(selectedSalesMetrics),
    [selectedSalesMetrics],
  );

  const selectedReportAccountLabel = useMemo(
    () =>
      resolveVendasSelectionAccountLabel(
        selectedSales,
        mlAccounts,
        vendasMlAccountLabel,
        vendasFilters.marketplaceAccountId,
      ),
    [selectedSales, mlAccounts, vendasFilters.marketplaceAccountId],
  );

  const reportContext = useMemo(
    () =>
      buildVendasReportContext({
        periodPreset: vendasFilters.periodPreset,
        startDate: vendasFilters.startDate,
        endDate: vendasFilters.endDate,
        periodSummaryLabel,
        marketplaceAccountId: vendasFilters.marketplaceAccountId,
        accountLabel: reportAccountLabel,
        listFilterId: filter,
        searchQuery: debouncedSearch,
        scopeOrdersCount: reportScopeOrdersCount,
        listRowsTotal: totalRows,
        truncatedScan: truncatedList || executiveTruncated,
        rows,
        selectedSaleIds: selectedSalesMetrics.selectedSalesIds,
        reportScope: reportModalMode,
        selectedSalesMetrics,
        selectedAccountLabel: selectedReportAccountLabel,
      }),
    [
      vendasFilters.periodPreset,
      vendasFilters.startDate,
      vendasFilters.endDate,
      vendasFilters.marketplaceAccountId,
      periodSummaryLabel,
      reportAccountLabel,
      filter,
      debouncedSearch,
      reportScopeOrdersCount,
      truncatedList,
      executiveTruncated,
      rows,
      totalRows,
      reportModalMode,
      selectedSalesMetrics,
      selectedReportAccountLabel,
    ],
  );

  // Mapa contaId → rótulo (resolução de nome de conta fica só no frontend).
  const accountLabelById = useMemo(() => {
    /** @type {Map<string, string>} */
    const map = new Map();
    for (const account of mlAccounts) {
      const id = account?.id != null ? String(account.id).trim() : "";
      if (id) map.set(id, vendasMlAccountLabel(account));
    }
    return map;
  }, [mlAccounts]);

  // Distribuição por conta da seleção manual (apenas contagem de linhas).
  const selectedAccountDistribution = useMemo(
    () => buildVendasSelectionAccountDistribution(selectedSales, mlAccounts, vendasMlAccountLabel),
    [selectedSales, mlAccounts],
  );

  // Contrato agregado oficial — fonte única consumida pelo modal e pelos
  // futuros canais (WhatsApp, E-mail, Copiar, Imprimir/PDF, Excel/CSV).
  const aggregatedReport = useMemo(
    () =>
      buildVendasAggregatedReport({
        context: reportContext,
        executiveSummary,
        executiveHealth,
        rankingProducts: topProducts,
        selectedMetrics: selectedSalesMetrics,
        distributionByAccount,
        accountLabelById,
        selectedDistribution: selectedAccountDistribution,
      }),
    [
      reportContext,
      executiveSummary,
      executiveHealth,
      topProducts,
      selectedSalesMetrics,
      distributionByAccount,
      accountLabelById,
      selectedAccountDistribution,
    ],
  );

  const reportModalTitle =
    reportModalMode === "selected" ? "Relatório de vendas selecionadas" : "Relatório de vendas";

  const activeReportExecutivePreview =
    reportModalMode === "selected" ? selectedReportExecutivePreview : reportExecutivePreview;

  const openReportModal = useCallback(() => {
    // Relatório principal sempre respeita o recorte oficial de filtros/período
    // (mesma fonte do Dashboard). Seleção manual segue disponível apenas quando
    // houver fluxo explícito dedicado para isso.
    setReportModalMode("filters");
    setReportModalOpen(true);
  }, []);

  const showGerarRelatorio = canOfferVendasReport(vendasFilters);
  const gerarRelatorioDisabled =
    selectedCount <= 0 && executiveLoading && reportScopeOrdersCount === 0;

  return (
    <div className="vendas-page">
      <h1 className="products-catalog__sr-title">Vendas</h1>

      <VendasFiltersCard
        ref={vendasFiltersRef}
        accounts={mlAccounts}
        accountLabel={vendasMlAccountLabel}
        accountsReady={mlAccountsReady}
        listFilter={filter}
        onListFilterChange={setFilter}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        showGerarRelatorio={showGerarRelatorio}
        gerarRelatorioDisabled={gerarRelatorioDisabled}
        onGerarRelatorioClick={openReportModal}
        selectedCount={selectedCount}
      />

      {truncatedList || executiveTruncated ? (
        <p className="vendas-page__scan-note" role="status">
          Atenção: a análise foi limitada (volume alto). Ajuste filtros ou canal para refinar.
        </p>
      ) : null}

      {err ? (
        <p className="vendas-page__error" role="alert">
          {err}
        </p>
      ) : null}

      <div className="vendas-page__table-block vendas-page__table-block--desktop">
        <div className="vendas-page__table-card">
          <div className="vendas-page__table-hscroll">
            <table className="vendas-page__table">
              <thead>
                <tr>
                  <th className="vendas-page__col-select" scope="col">
                    <label
                      className="vendas-page__row-select vendas-page__row-select--head"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={selectAllPageRef}
                        type="checkbox"
                        className="anuncios-catalog__select-checkbox vendas-page__row-select-checkbox"
                        checked={allPageSelected}
                        disabled={loading || rows.length === 0}
                        aria-label="Selecionar todas as vendas da página"
                        onChange={toggleAllOnPage}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </label>
                  </th>
                  <th className="vendas-page__col-venda">Venda</th>
                  <th className="vendas-page__col-product">Anúncio</th>
                  <th className="vendas-page__col-account">Conta</th>
                  <th className="vendas-page__col-channel">Canal</th>
                  <th className="vendas-page__num-col vendas-page__th-nowrap vendas-page__num-col--profit">Lucro (R$)</th>
                  <th className="vendas-page__num-col vendas-page__th-nowrap vendas-page__num-col--margin">
                    Lucro (%)
                  </th>
                  <th className="vendas-page__num-col vendas-page__num-col--sale">Venda</th>
                  <th className="vendas-page__num-col vendas-page__num-col--commission">Comissão</th>
                  <th className="vendas-page__num-col vendas-page__num-col--shipping">Frete</th>
                  <th className="vendas-page__num-col vendas-page__num-col--received">Repasse</th>
                  <th className="vendas-page__num-col vendas-page__num-col--product-cost">Custo</th>
                  <th className="vendas-page__num-col vendas-page__num-col--tax">Imposto</th>
                  <th className="vendas-page__col-sale-status">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={14} className="vendas-page__empty">
                      Carregando…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="vendas-page__empty">
                      Nenhuma venda encontrada para os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, rowIndex) => {
                    const f = r.financials ?? {};
                    const detailItemId = pickSaleRayxDetailItemId(r);
                    const hid =
                      detailItemId ||
                      `${String(r.external_order_id ?? r.sale_display_code ?? "ord")}-${String(r.external_order_item_id ?? r.external_item_id ?? "line")}-${rowIndex}`;
                    const financialHealthTone = getVendasTableFinancialHealthToneClass(f.margin_percent);
                    const financialHealthValueClass = vendasFinHealthValueClass(financialHealthTone);
                    const internalTaxBrl = pickSaleInternalTaxBrl(f);
                    const internalTaxPct = pickSaleInternalTaxPercentLabel(f);
                    const commissionBrl = pickSaleMarketplaceFeeBrl(f);
                    const commissionDetail = pickSaleCommissionSecondaryLabel(f);
                    const saleStatusLabel = pickSaleOperationalStatusLabel(r);
                    const dateParts = formatSaleDateParts(r.sale_date);
                    const buyerName =
                      r.buyer_display_name != null && String(r.buyer_display_name).trim() !== ""
                        ? String(r.buyer_display_name).trim()
                        : "";
                    const buyerNameShort = buyerName ? formatBuyerNameShort(buyerName) : "";
                    const listingIdForMeta =
                      r.listing_id_display != null && String(r.listing_id_display).trim() !== ""
                        ? String(r.listing_id_display).trim()
                        : "";
                    const listingMercadoLivreUrl = pickVendasListingMercadoLivreUrl(
                      /** @type {Record<string, unknown>} */ (r),
                      listingIdForMeta,
                    );
                    const productTitleDisplay =
                      r.product_display_title != null && String(r.product_display_title).trim() !== ""
                        ? String(r.product_display_title).trim()
                        : "Produto não identificado";
                    const skuForMeta =
                      r.sku_display != null && String(r.sku_display).trim() !== ""
                        ? String(r.sku_display).trim()
                        : r.product_sku_line != null && String(r.product_sku_line).trim() !== ""
                          ? String(r.product_sku_line).trim()
                          : "";
                    const accountFields = pickCatalogAccountFields(r);
                    const accountAliasRaw =
                      accountFields.accountAlias != null ? String(accountFields.accountAlias).trim() : "";
                    const accountAliasDisplay = accountAliasRaw
                      ? formatVendasTableTitleCase(accountAliasRaw)
                      : null;
                    const channelLabelRaw =
                      r.marketplace_label != null && String(r.marketplace_label).trim() !== ""
                        ? String(r.marketplace_label).trim()
                        : "";
                    const channelLabelDisplay = channelLabelRaw
                      ? formatVendasTableTitleCase(channelLabelRaw)
                      : null;
                    const buyerNameDisplay = buyerNameShort ? buyerNameShort : "";
                    const selectionId = pickVendasSaleRowId(/** @type {Record<string, unknown>} */ (r));
                    const rowSelected = selectionId ? isSelected(selectionId) : false;
                    const selectionAriaLabel = selectionId
                      ? rowSelected
                        ? `Desmarcar venda ${String(r.sale_display_code ?? selectionId).trim()}`
                        : `Selecionar venda ${String(r.sale_display_code ?? selectionId).trim()}`
                      : "Seleção indisponível";
                    return (
                      <tr
                        key={hid}
                        className={rowSelected ? "vendas-page__row--selected" : undefined}
                        tabIndex={0}
                        onClick={() => detailItemId && openDetail(detailItemId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (detailItemId) openDetail(detailItemId);
                          }
                        }}
                      >
                        <td className="vendas-page__col-select">
                          <VendasRowSelectCheckbox
                            checked={rowSelected}
                            disabled={!selectionId}
                            onChange={() => {
                              if (selectionId) toggleSaleSelection(selectionId);
                            }}
                            ariaLabel={selectionAriaLabel}
                          />
                        </td>
                        <td className="vendas-page__col-venda vendas-page__cell-align-stack">
                          <div className="vendas-page__venda-cell">
                            <div className="vendas-page__venda-id">
                              {r.sale_display_code != null && String(r.sale_display_code).trim() !== "" ? (
                                <span
                                  className="s7-copy-group vendas-page__sale-code-group"
                                  role="presentation"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                                  <span className="vendas-page__sale-code">{String(r.sale_display_code).trim()}</span>
                                  <S7CopyButton
                                    value={String(r.sale_display_code).trim()}
                                    ariaLabel="Copiar pedido"
                                    tooltipText="Copiar pedido"
                                    toastLabel="Pedido"
                                    showToast={true}
                                    iconMode="unicode"
                                    flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                                    flashKey={`vendas-list-sale-${String(r.sale_display_code).trim()}`}
                                    toastEventType="SALE_ORDER_COPIED"
                                    toastFailEventType="SALE_ORDER_COPY_FAILED"
                                    toastEntityType="sale"
                                  />
                                </span>
                              ) : (
                                DASH
                              )}
                            </div>
                            {dateParts ? (
                              <div className="vendas-page__venda-datetime">
                                <span className="vendas-page__venda-datetime-line">
                                  {formatSaleDateTimeLine(dateParts)}
                                </span>
                              </div>
                            ) : (
                              <div className="vendas-page__venda-datetime vendas-page__venda-datetime--empty">
                                <span className="vendas-page__venda-datetime-line">{DASH}</span>
                              </div>
                            )}
                            {buyerName ? (
                              <span
                                className="s7-copy-group vendas-page__buyer-copy-group"
                                role="presentation"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <span className="vendas-page__venda-buyer">{buyerNameDisplay}</span>
                                <S7CopyButton
                                  value={buyerName}
                                  ariaLabel="Copiar nome do comprador"
                                  tooltipText="Copiar nome do comprador"
                                  toastLabel="Comprador"
                                  showToast={true}
                                  iconMode="unicode"
                                  flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                                  flashKey={`vendas-list-buyer-${buyerName}`}
                                  toastEventType="SALE_BUYER_COPIED"
                                  toastFailEventType="SALE_BUYER_COPY_FAILED"
                                  toastEntityType="sale"
                                />
                              </span>
                            ) : (
                              <span className="vendas-page__venda-buyer vendas-page__venda-buyer--empty">{DASH}</span>
                            )}
                          </div>
                        </td>
                        <td className="vendas-page__col-product vendas-page__cell-align-stack">
                          <div className="vendas-page__product-cell">
                            <VendasSalesProductThumb row={r} />
                            <div className="vendas-page__product-text">
                              <VendasProductHeadline
                                title={productTitleDisplay}
                                listingMercadoLivreUrl={listingMercadoLivreUrl}
                                listingId={listingIdForMeta}
                                sku={skuForMeta}
                              />
                              {r.needs_product_completion === true &&
                              r.product_id != null &&
                              String(r.product_id).trim() !== "" ? (
                                <div
                                  className="vendas-page__product-actions"
                                  role="presentation"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                                  <S7Button
                                    type="button"
                                    variant="warning"
                                    size="sm"
                                    className="vendas-page__complete-product-btn"
                                    onClick={async () => {
                                      const productImageUrl =
                                        (await resolveSalesRowProductThumbUrl(/** @type {Record<string, unknown>} */ (r))) ||
                                        null;
                                      setCostsModal({
                                        productId: String(r.product_id).trim(),
                                        sku: skuForMeta || null,
                                        productTitle:
                                          r.product_display_title != null &&
                                          String(r.product_display_title).trim() !== ""
                                            ? String(r.product_display_title).trim()
                                            : "Produto",
                                        productImageUrl: productImageUrl || null,
                                      });
                                    }}
                                  >
                                    Completar cadastro
                                  </S7Button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="vendas-page__col-account vendas-page__cell-align-stack">
                          <S7CatalogAccountCell
                            variant="stacked"
                            stackedAvatarPx={28}
                            marketplaceAccountId={accountFields.marketplaceAccountId}
                            accountAlias={accountAliasDisplay}
                            accountLogoUrl={accountFields.accountLogoUrl}
                          />
                        </td>
                        <td className="vendas-page__col-channel vendas-page__cell-align-stack">
                          <S7CatalogChannelCell
                            variant="stacked"
                            stackedBadgePx={33}
                            marketplace={r.marketplace}
                            marketplaceLabel={channelLabelDisplay}
                          />
                        </td>
                        <td
                          className={`vendas-page__num-cell vendas-page__num-cell--profit vendas-page__cell-align-main ${financialHealthTone}`}
                        >
                          <VendasTableNumSingle>
                            <span className="vendas-page__fin-value-row">
                              <span className={`vendas-page__fin-value ${financialHealthValueClass}`}>
                                {renderBrlValueCell(f.profit_brl)}
                              </span>
                              <VendasProfitHealthHint toneClass={financialHealthTone} />
                            </span>
                          </VendasTableNumSingle>
                        </td>
                        <td
                          className={`vendas-page__num-cell vendas-page__num-cell--margin vendas-page__cell-align-main ${financialHealthTone}`}
                        >
                          <VendasTableNumSingle>
                            <span className="vendas-page__fin-value-row">
                              <span className={`vendas-page__fin-value ${financialHealthValueClass}`}>
                                {formatPctApi(f.margin_percent)}
                              </span>
                              <VendasProfitHealthHint toneClass={financialHealthTone} />
                            </span>
                          </VendasTableNumSingle>
                        </td>
                        <td className="vendas-page__num-cell vendas-page__num-cell--sale vendas-page__cell-align-main">
                          <VendasTableNumSingle>{formatBrlApi(f.sale_price)}</VendasTableNumSingle>
                        </td>
                        <td className="vendas-page__num-cell vendas-page__num-cell--commission vendas-page__cell-align-main">
                          <VendasTableNumStack
                            primary={renderBrlValueCell(commissionBrl ?? f.commission)}
                            secondary={commissionDetail}
                          />
                        </td>
                        <td className="vendas-page__num-cell vendas-page__num-cell--shipping vendas-page__cell-align-main">
                          <VendasTableNumSingle>{renderBrlValueCell(f.shipping_cost)}</VendasTableNumSingle>
                        </td>
                        <td className="vendas-page__num-cell vendas-page__num-cell--received vendas-page__cell-align-main">
                          <VendasTableNumSingle>{renderBrlValueCell(f.net_received)}</VendasTableNumSingle>
                        </td>
                        <td className="vendas-page__num-cell vendas-page__num-cell--product-cost vendas-page__cell-align-main">
                          <VendasTableNumSingle>{renderBrlValueCell(r.product_cost_only_brl)}</VendasTableNumSingle>
                        </td>
                        <td className="vendas-page__num-cell vendas-page__num-cell--tax vendas-page__cell-align-main">
                          <VendasTableNumStack
                            primary={renderBrlValueCell(internalTaxBrl)}
                            secondary={formatVendasTaxSecondaryLabel(internalTaxPct)}
                          />
                        </td>
                        <td className="vendas-page__col-sale-status vendas-page__cell-align-main">
                          <VendasTableNumSingle>
                            <span
                              className={`vendas-page__sale-status-label ${getSaleStatusToneClass(
                                saleStatusLabel,
                              )}`}
                            >
                              {saleStatusLabel ?? "Sem dados"}
                            </span>
                          </VendasTableNumSingle>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="vendas-page__mobile-list" aria-label="Lista de vendas compacta">
        <div className="vendas-page__mobile-list-card">
          {loading ? (
            <p className="vendas-page__mobile-empty">Carregando…</p>
          ) : rows.length === 0 ? (
            <p className="vendas-page__mobile-empty">Nenhuma venda encontrada para os filtros atuais.</p>
          ) : (
            rows.map((r, rowIndex) => {
              const selectionId = pickVendasSaleRowId(/** @type {Record<string, unknown>} */ (r));
              const rowSelected = selectionId ? isSelected(selectionId) : false;
              const saleCode =
                r.sale_display_code != null && String(r.sale_display_code).trim() !== ""
                  ? String(r.sale_display_code).trim()
                  : selectionId ?? "venda";
              return (
              <VendasMobileSaleCard
                key={
                  pickSaleRayxDetailItemId(r) ||
                  `${String(r.external_order_id ?? r.sale_display_code ?? "ord")}-${String(r.external_order_item_id ?? r.external_item_id ?? "line")}-${rowIndex}`
                }
                row={/** @type {Record<string, unknown>} */ (r)}
                onOpenRayx={openDetail}
                selected={rowSelected}
                onToggleSelect={() => {
                  if (selectionId) toggleSaleSelection(selectionId);
                }}
                selectionDisabled={!selectionId}
                selectionAriaLabel={
                  rowSelected ? `Desmarcar venda ${saleCode}` : `Selecionar venda ${saleCode}`
                }
              />
              );
            })
          )}
        </div>
      </div>

      <div className="vendas-page__pagination">
        <span className="vendas-page__pagination-summary">
          Página {page} de {totalPages}
          {totalSales > 0 ? ` · ${totalSales.toLocaleString("pt-BR")} vendas no total` : ""}
        </span>
        <button
          type="button"
          disabled={loading || !hasPreviousPage}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={loading || !hasNextPage}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Próxima
        </button>
      </div>

      <SaleDetailModal open={modalOpen} itemId={selectedItemId} onClose={closeDetail} />

      <QuickProductCostsModal
        open={Boolean(costsModal)}
        productId={costsModal?.productId ?? null}
        sku={costsModal?.sku ?? null}
        productTitle={costsModal?.productTitle ?? "Produto"}
        productImageUrl={costsModal?.productImageUrl ?? null}
        onClose={() => setCostsModal(null)}
        onSaved={async () => {
          await load();
        }}
      />

      <VendasGerarRelatorioModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportContext={reportContext}
        aggregatedReport={aggregatedReport}
        modalTitle={reportModalTitle}
        executivePreview={activeReportExecutivePreview}
      />
    </div>
  );
}
