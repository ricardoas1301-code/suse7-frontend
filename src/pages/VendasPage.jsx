// ======================================================================
// Página Vendas — cards via GET /api/sales/executive-summary; lista via GET /api/sales.
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildApiUrl, apiFetch } from "../config/api";
import { useSalesExecutiveSummary } from "../hooks/useSalesExecutiveSummary";
import { formatBrlFromApiString, formatPercentFromApiString } from "../features/listings/utils/catalogFormatters";
import { fetchMercadoLivreMarketplaceAccounts } from "../services/marketplaceAccountsApi";
import SaleDetailModal from "../components/sales/SaleDetailModal";
import SalesTopRankingCard from "../components/sales/SalesTopRankingCard";
import VendasExecutiveKpiCard from "../components/sales/VendasExecutiveKpiCard";
import { formatExecutivePeriodLabel } from "../components/sales/salesTopRankingUtils";
import {
  EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
  EXECUTIVE_PANEL_ERROR_MESSAGE,
  isExecutiveSummaryEmptyForFilters,
} from "../components/sales/vendasExecutivePanelUx";
import { isSaleRayxDetailItemId, pickSaleRayxDetailItemId } from "../components/sales/saleRayxDetailItemId";
import S7Icon from "../components/ui/S7Icon";
import { getSaleHealthUi } from "../utils/saleHealthUi";
import S7CatalogAccountCell, {
  S7CatalogChannelCell,
  pickCatalogAccountFields,
} from "../components/catalog/S7CatalogAccountCell.jsx";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../components/ui/S7CopyButton";
import S7Button from "../components/ui/S7Button";
import QuickProductCostsModal from "../features/listings/components/QuickProductCostsModal.jsx";
import { resolveSalesRowProductThumbUrl, salesRowThumbCacheKey } from "../utils/resolveSalesRowProductThumbUrl.js";
import VendasFiltersCard from "../features/vendas/filters/VendasFiltersCard.jsx";
import { VendasFiltersProvider, useVendasFilters } from "../features/vendas/filters/VendasFiltersContext.jsx";
import { buildVendasSalesListPeriodQuery } from "../features/vendas/filters/vendasFiltersPeriod.js";
import "../components/Products.css";
import "../components/Anuncios.css";
import "../styles/VendasPage.css";

const DASH = "—";
const DEFAULT_PAGE_SIZE = 50;

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

/** @param {string | undefined} name */
function buyerInitials(name) {
  const s = name != null ? String(name).trim() : "";
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Avatar comprador: foto ML ou iniciais; se a URL falhar, cai para iniciais. */
function VendasBuyerAvatarStack({ photoUrl, displayName }) {
  const [broken, setBroken] = useState(false);
  const photo = photoUrl != null && String(photoUrl).trim() !== "" ? String(photoUrl).trim() : "";
  useEffect(() => {
    setBroken(false);
  }, [photo]);
  const showPhoto = photo !== "" && !broken;
  if (showPhoto) {
    return (
      <img
        className="vendas-page__buyer-avatar"
        src={photo}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className="vendas-page__buyer-avatar vendas-page__buyer-avatar--initials" aria-hidden>
      {buyerInitials(displayName || undefined)}
    </span>
  );
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
      <img
        className="vendas-page__product-thumb"
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }
  return <span className="vendas-page__product-thumb-slot" aria-hidden />;
}

/**
 * Segunda linha: [copiar] número do anúncio · SKU valor [copiar] — hover no trecho revela o botão.
 * @param {{ listingId: string; sku: string }} props
 */
function VendasProductIdSkuLine({ listingId, sku }) {
  const lid = listingId != null && String(listingId).trim() !== "" ? String(listingId).trim() : "";
  const sk = sku != null && String(sku).trim() !== "" ? String(sku).trim() : "";
  if (!lid && !sk) {
    return <span className="vendas-page__product-meta--muted">—</span>;
  }
  return (
    <div className="vendas-page__product-meta">
      {lid ? (
        <span className="s7-copy-group vendas-page__product-meta-ad">
          <span className="vendas-page__meta-value vendas-page__meta-value--listing">{lid}</span>
          <S7CopyButton
            value={lid}
            ariaLabel="Copiar ID do anúncio"
            tooltipText="Copiar ID do anúncio"
            toastLabel="ID do anúncio"
            showToast={true}
            iconMode="unicode"
            flashMs={S7_COPY_OFFICIAL_FLASH_MS}
            flashKey={`vendas-list-listing-${lid}`}
            toastEventType="LISTING_ID_COPIED"
            toastFailEventType="LISTING_ID_COPY_FAILED"
            toastEntityType="marketplace_listing"
          />
        </span>
      ) : null}
      {sk ? (
        <span className="s7-copy-group vendas-page__product-meta-sku">
          <span className="anuncios-ad-sku-label">SKU</span>
          <span className="anuncios-ad-sku-value">{sk}</span>
          <S7CopyButton
            value={sk}
            ariaLabel="Copiar SKU"
            tooltipText="Copiar SKU"
            toastLabel="SKU"
            showToast={true}
            iconMode="unicode"
            flashMs={S7_COPY_OFFICIAL_FLASH_MS}
            flashKey={`vendas-list-sku-${sk}`}
            toastEventType="LISTING_SKU_COPIED"
            toastFailEventType="LISTING_SKU_COPY_FAILED"
            toastEntityType="marketplace_listing"
          />
        </span>
      ) : null}
    </div>
  );
}

/** @param {string | null | undefined} s */
function formatBrlApi(s) {
  if (s == null || String(s).trim() === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** @param {number | string | null | undefined} value */
function formatExecutiveCount(value) {
  if (value == null) return "0";
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("pt-BR");
}

/** @param {Record<string, unknown> | null | undefined} summary */
function formatExecutiveConversion(summary) {
  if (!summary) return DASH;
  const status = summary.conversion_data_status != null ? String(summary.conversion_data_status) : "unavailable";
  if (status === "unavailable") return DASH;
  return formatPercentFromApiString(
    summary.sales_conversion_rate_percent != null ? String(summary.sales_conversion_rate_percent) : null,
  );
}

/** @param {string | null | undefined} s */
function formatPctApi(s) {
  if (s == null || String(s).trim() === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/** Cabeçalho em duas linhas (título composto) — reduz largura da coluna. */
function VendasThStack({ className = "", line1, line2 }) {
  return (
    <th className={className}>
      <span className="vendas-page__th-stack">
        <span className="vendas-page__th-stack-row">{line1}</span>
        <span className="vendas-page__th-stack-row vendas-page__th-stack-row--sub">{line2}</span>
      </span>
    </th>
  );
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
  } = useVendasFilters();

  /** Contas marketplace para o filtro “Conta”. */
  const [mlAccounts, setMlAccounts] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [mlAccountsReady, setMlAccountsReady] = useState(false);

  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
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
    topListings,
    topListingsByQuantity,
    topListingsByGrossRevenue,
    topListingsByNetProfit,
    topProducts,
    dataQuality,
    period: executivePeriod,
    truncatedScan: executiveTruncated,
    loading: executiveLoading,
    error: executiveError,
  } = useSalesExecutiveSummary(executiveParams, { enabled: executiveQueryEnabled });

  const executivePeriodLabel = useMemo(
    () => formatExecutivePeriodLabel(executivePeriod),
    [executivePeriod],
  );

  const executivePanelEmpty = useMemo(
    () =>
      !executiveLoading &&
      !executiveError &&
      isExecutiveSummaryEmptyForFilters(executiveSummary),
    [executiveLoading, executiveError, executiveSummary],
  );

  const executivePanelError = executiveError ? EXECUTIVE_PANEL_ERROR_MESSAGE : null;

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
    if (!Number.isFinite(total) || total <= 0) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

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

    setLoading(true);
    setErr(null);
    const resList = await apiFetch(`${listBase}?${qsList.toString()}`, { method: "GET" });
    setLoading(false);

    if (!resList.ok) {
      setErr(resList.error ?? "Não foi possível carregar as vendas.");
      setRows([]);
      setTotal(0);
      setTruncatedList(false);
    } else {
      const data = resList.data;
      const rowsArr = Array.isArray(data?.rows) ? data.rows : [];
      setRows(rowsArr);
      const rawTotal = data?.pagination?.total ?? data?.total ?? 0;
      const t =
        typeof rawTotal === "number" && Number.isFinite(rawTotal)
          ? Math.max(0, Math.floor(rawTotal))
          : Number.parseInt(String(rawTotal ?? ""), 10) || 0;
      setTotal(t);
      setTruncatedList(Boolean(data?.pagination?.truncated_scan));

      const apiTp = data?.pagination?.total_pages ?? data?.total_pages;
      const derivedTp = t <= 0 ? 1 : Math.max(1, Math.ceil(t / pageSize));
      const tp =
        typeof apiTp === "number" && Number.isFinite(apiTp) && apiTp >= 1 ? Math.floor(apiTp) : derivedTp;
      const hasNext = typeof data?.pagination?.has_next === "boolean" ? data.pagination.has_next : page < tp;
      const hasPrev =
        typeof data?.pagination?.has_previous === "boolean" ? data.pagination.has_previous : page > 1;

      if (import.meta.env.DEV) {
        const firstRow = rowsArr[0] ?? null;
        console.info("[S7][/api/sales response]", {
          total: t,
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
        });
        console.log("[S7][sales-pagination-debug]", {
          page,
          pageSize,
          total: t,
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
    if (total <= 0 && rows.length === 0) return;

    const ordersCount =
      typeof executiveSummary?.orders_count === "number"
        ? executiveSummary.orders_count
        : Number.parseInt(String(executiveSummary?.orders_count ?? ""), 10) || 0;

    if (total > 0 && ordersCount === 0) {
      const firstRow = rows[0] ?? null;
      console.info("[S7][Sales vs ExecutiveSummary compare]", {
        salesList: {
          total,
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
    total,
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

  const quantityKpi = useMemo(() => {
    if (executivePanelEmpty) {
      return { value: EXECUTIVE_PANEL_EMPTY_KPI_VALUE, subtitle: null };
    }
    const qty =
      executiveSummary?.items_quantity_sold != null
        ? executiveSummary.items_quantity_sold
        : executiveSummary?.orders_count;
    const count = formatExecutiveCount(qty);
    return { value: `${count} vendas`, subtitle: null };
  }, [executivePanelEmpty, executiveSummary]);

  const revenueKpi = useMemo(() => {
    if (executivePanelEmpty) {
      return { value: EXECUTIVE_PANEL_EMPTY_KPI_VALUE, subtitle: null };
    }
    const raw =
      executiveSummary?.gross_sales_brl != null ? String(executiveSummary.gross_sales_brl) : "0.00";
    return { value: formatBrlFromApiString(raw), subtitle: null };
  }, [executivePanelEmpty, executiveSummary]);

  const netProfitKpi = useMemo(() => {
    if (executivePanelEmpty) {
      return { value: EXECUTIVE_PANEL_EMPTY_KPI_VALUE, subtitle: null };
    }
    const raw =
      executiveSummary?.contribution_profit_brl != null
        ? String(executiveSummary.contribution_profit_brl)
        : executiveSummary?.net_profit_brl != null
          ? String(executiveSummary.net_profit_brl)
          : "0.00";
    return { value: formatBrlFromApiString(raw), subtitle: null };
  }, [executivePanelEmpty, executiveSummary]);

  const conversionKpi = useMemo(() => {
    if (executivePanelEmpty) {
      return { value: EXECUTIVE_PANEL_EMPTY_KPI_VALUE, subtitle: null, unavailable: false };
    }
    const status =
      executiveSummary?.conversion_data_status != null
        ? String(executiveSummary.conversion_data_status)
        : "unavailable";
    if (status === "unavailable") {
      return {
        value: "—",
        subtitle: "Visitas ainda indisponíveis",
        unavailable: true,
      };
    }
    return {
      value: formatExecutiveConversion(executiveSummary),
      subtitle: null,
      unavailable: false,
    };
  }, [executivePanelEmpty, executiveSummary]);

  return (
    <div className="vendas-page">
      <h1 className="products-catalog__sr-title">Vendas</h1>

      {executiveError ? (
        <p className="vendas-page__kpi-note vendas-page__kpi-note--error" role="status">
          Resumo executivo indisponível. A listagem de vendas abaixo continua disponível.
        </p>
      ) : null}
      <section
        className="s7-core-kpis anuncios-catalog__kpis vendas-page__kpis--executive"
        aria-label="Painel executivo de vendas"
        data-rankings-products-count={topProducts.length}
      >
        <article className="vendas-page__executive-rank-slot">
          <SalesTopRankingCard
            title="Top 10 mais vendidos"
            metric="quantity"
            listings={/** @type {Record<string, unknown>[]} */ (topListingsByQuantity)}
            loading={executiveLoading}
            error={executivePanelError}
            periodLabel={executivePeriodLabel}
          />
        </article>

        <article className="vendas-page__executive-rank-slot">
          <SalesTopRankingCard
            title="Top 10 maior faturamento"
            metric="gross_revenue"
            listings={/** @type {Record<string, unknown>[]} */ (topListingsByGrossRevenue)}
            loading={executiveLoading}
            error={executivePanelError}
            periodLabel={executivePeriodLabel}
          />
        </article>

        <article className="vendas-page__executive-rank-slot">
          <SalesTopRankingCard
            title="Top 10 com mais lucro"
            metric="net_profit"
            listings={/** @type {Record<string, unknown>[]} */ (topListingsByNetProfit)}
            loading={executiveLoading}
            error={executivePanelError}
            periodLabel={executivePeriodLabel}
          />
        </article>

        <div className="vendas-page__executive-kpi-row" aria-label="Indicadores executivos do período">
          <VendasExecutiveKpiCard
            title="Quantidade de vendas"
            tone="quantity"
            value={quantityKpi.value}
            loading={executiveLoading}
            error={executivePanelError}
            empty={executivePanelEmpty}
          />
          <VendasExecutiveKpiCard
            title="Vendas em R$"
            tone="revenue"
            value={revenueKpi.value}
            loading={executiveLoading}
            error={executivePanelError}
            empty={executivePanelEmpty}
          />
          <VendasExecutiveKpiCard
            title="Lucro líquido"
            tone="profit"
            value={netProfitKpi.value}
            loading={executiveLoading}
            error={executivePanelError}
            empty={executivePanelEmpty}
          />
          <VendasExecutiveKpiCard
            title="Conversão"
            tone="conversion"
            value={conversionKpi.value}
            subtitle={conversionKpi.subtitle}
            unavailable={conversionKpi.unavailable}
            loading={executiveLoading}
            error={executivePanelError}
            empty={executivePanelEmpty}
          />
        </div>
      </section>

      <VendasFiltersCard
        accounts={mlAccounts}
        accountLabel={vendasMlAccountLabel}
        accountsReady={mlAccountsReady}
        listFilter={filter}
        onListFilterChange={setFilter}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
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

      <div className="vendas-page__table-block">
        <div className="vendas-page__table-card">
          <div className="vendas-page__table-hscroll">
            <table className="vendas-page__table">
              <thead>
                <tr>
                  <th className="vendas-page__col-venda">Venda</th>
                  <th className="vendas-page__col-product">Produto</th>
                  <th className="vendas-page__col-account">Conta</th>
                  <th className="vendas-page__col-channel">Canal</th>
                  <th className="vendas-page__col-buyer">Comprador</th>
                  <VendasThStack line1="Valor" line2="da venda" />
                  <VendasThStack line1="Custo" line2="do produto" />
                  <th>Comissão</th>
                  <th>Frete</th>
                  <th>Impostos</th>
                  <VendasThStack line1="Valor" line2="recebido" />
                  <VendasThStack line1="Lucro" line2="(R$)" />
                  <VendasThStack line1="Margem" line2="(%)" />
                  <VendasThStack line1="Saúde" line2="da venda" />
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
                    const healthUi = getSaleHealthUi(f);
                    const dateParts = formatSaleDateParts(r.sale_date);
                    const buyerName =
                      r.buyer_display_name != null && String(r.buyer_display_name).trim() !== ""
                        ? String(r.buyer_display_name).trim()
                        : "";
                    const listingIdForMeta =
                      r.listing_id_display != null && String(r.listing_id_display).trim() !== ""
                        ? String(r.listing_id_display).trim()
                        : "";
                    const skuForMeta =
                      r.sku_display != null && String(r.sku_display).trim() !== ""
                        ? String(r.sku_display).trim()
                        : r.product_sku_line != null && String(r.product_sku_line).trim() !== ""
                          ? String(r.product_sku_line).trim()
                          : "";
                    const accountFields = pickCatalogAccountFields(r);
                    return (
                      <tr
                        key={hid}
                        tabIndex={0}
                        onClick={() => detailItemId && openDetail(detailItemId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (detailItemId) openDetail(detailItemId);
                          }
                        }}
                      >
                        <td className="vendas-page__col-venda">
                          <div className="vendas-page__venda-cell">
                            <div className="vendas-page__venda-id">
                              {r.sale_display_code != null && String(r.sale_display_code).trim() !== "" ? (
                                <span className="s7-copy-group vendas-page__sale-code-group">
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
                                <span className="vendas-page__venda-date">{dateParts.date}</span>
                                <span className="vendas-page__venda-time">{dateParts.time}</span>
                              </div>
                            ) : (
                              <div className="vendas-page__venda-datetime vendas-page__venda-datetime--empty">
                                <span className="vendas-page__venda-date">{DASH}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="vendas-page__col-product">
                          <div className="vendas-page__product-cell">
                            <VendasSalesProductThumb row={r} />
                            <div className="vendas-page__product-text">
                              <span className="vendas-page__product-title">
                                {r.product_display_title != null && String(r.product_display_title).trim() !== ""
                                  ? String(r.product_display_title)
                                  : "Produto não identificado"}
                              </span>
                              <VendasProductIdSkuLine listingId={listingIdForMeta} sku={skuForMeta} />
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
                        <td className="vendas-page__col-account">
                          <S7CatalogAccountCell
                            variant="stacked"
                            marketplaceAccountId={accountFields.marketplaceAccountId}
                            accountAlias={accountFields.accountAlias}
                            accountLogoUrl={accountFields.accountLogoUrl}
                          />
                        </td>
                        <td className="vendas-page__col-channel">
                          <S7CatalogChannelCell
                            variant="stacked"
                            marketplace={r.marketplace}
                            marketplaceLabel={r.marketplace_label != null && String(r.marketplace_label).trim() !== "" ? String(r.marketplace_label) : null}
                          />
                        </td>
                        <td className="vendas-page__col-buyer">
                          <div className="vendas-page__buyer-cell vendas-page__buyer-cell--stacked">
                            <VendasBuyerAvatarStack
                              photoUrl={r.buyer_thumbnail_url}
                              displayName={buyerName || undefined}
                            />
                            <span className="vendas-page__buyer-name">{buyerName || DASH}</span>
                          </div>
                        </td>
                        <td>{formatBrlApi(f.sale_price)}</td>
                        <td>{formatBrlApi(r.product_cost_only_brl)}</td>
                        <td>{formatBrlApi(f.commission)}</td>
                        <td>{formatBrlApi(f.shipping_cost)}</td>
                        <td>{formatBrlApi(f.taxes)}</td>
                        <td>{formatBrlApi(f.net_received)}</td>
                        <td>{formatBrlApi(f.profit_brl)}</td>
                        <td>{formatPctApi(f.margin_percent)}</td>
                        <td>
                          <span className={`vendas-health-badge ${healthUi.badgeClass}`}>
                            {healthUi.showDot ? <span className="vendas-health-badge-dot" aria-hidden /> : null}
                            <span className="vendas-health-badge-text">{healthUi.label}</span>
                          </span>
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

      <div className="vendas-page__pagination">
        <span>
          Página {page} de {totalPages}
          {total > 0 ? ` · ${total} linha(s)` : ""}
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
    </div>
  );
}
