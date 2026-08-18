// ======================================================================
// ⚠️ Esta página consome o Suse7 Pricing Protocol v1. Não inferir promo/payout no front.
// ADR: suse7-backend/docs/adr/ADR-0001-pricing-contract-v1.md · Protocolo: …/SUSE7_PRICING_PROTOCOL_V1.md
// ======================================================================
// PÁGINA: listagem ML — agregador (KPIs, filtros, tabela). Linha + Raio-x: `features/listings/components/AdsCatalogRow.jsx`.
// Fonte: GET /api/ml/listings — fetch compartilhado: `useListingsCatalogFetch`.
// ======================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";
import SkuInputModal from "./SkuInputModal";
import S7Button from "./ui/S7Button";
import S7EmptyState from "./ui/S7EmptyState";
import S7Icon from "./ui/S7Icon";
import S7Input from "./ui/S7Input";
import S7Pagination from "./ui/S7Pagination";
import S7SectionJumpButton from "./ui/S7SectionJumpButton.jsx";
import { applyAdsCatalogFilter, getAdsFilterChipsForToolbarOrdered } from "../utils/adsFilterRegistry";
import { filterAdsByCatalogSearch } from "../utils/adsCatalogSearch";
import { applyAnunciosCatalogFilters } from "../features/listings/filters/applyAnunciosCatalogFilters.js";
import { applyPrecificacoesCatalogFilters } from "../features/listings/filters/applyPrecificacoesCatalogFilters.js";
import {
  ANUNCIOS_QUICK_FILTER_OPTIONS,
  ANUNCIOS_QUICK_FILTER_SECTION_LABELS,
  findAnunciosQuickFilterOption,
} from "../features/listings/filters/anunciosQuickFiltersConfig.js";
import {
  PRECIFICACOES_QUICK_FILTER_OPTIONS,
  PRECIFICACOES_QUICK_FILTER_SECTION_LABELS,
  findPrecificacoesQuickFilterOption,
  resolverRotuloBotaoFiltroRapidoPrecificacoes,
} from "../features/listings/filters/precificacoesQuickFiltersConfig.js";
import {
  normalizarIdFiltroRapidoAnuncios,
} from "../features/listings/domain/health/listingHealthListClassifiers.js";
import {
  normalizarIdFiltroRapidoPrecificacoes,
} from "../features/listings/domain/pricingHealth/pricingHealthListClassifiers.js";
import { buildListingQualityOpenSnapshot } from "../features/listings/domain/health/listingQualityHydration.js";
import { ANUNCIOS_QUICK_FILTER_NEUTRAL_ID } from "../features/listings/domain/health/listingHealthConstants.js";
import { PRECIFICACOES_QUICK_FILTER_NEUTRAL_ID } from "../features/listings/domain/pricingHealth/pricingHealthConstants.js";
import { marketplaceChipLabel } from "../utils/productCatalogRow";
import { enrichListingRowAccountVisual } from "../features/listings/utils/enrichListingRowAccountVisual.js";
import "./Products.css";
import "./Anuncios.css";
import "../features/listings/layout/AnunciosCatalogGridAlign.css";
import "./S7OperationalRowCard.css";
import "./catalog/S7CatalogListingHeadline.css";
import "../features/listings/layout/PrecificacoesCatalogGridAlign.css";
import { ANUNCIOS_COL } from "../features/listings/layout/anunciosCatalogColumns.js";
import { PRECIFICACOES_COL } from "../features/listings/layout/precificacoesCatalogColumns.js";
import { ListingsTable } from "../features/listings/components/ListingsTable";
import { listingsViewConfigs } from "../features/listings/config/listingsViewConfigs";
import { AdsCatalogRow } from "../features/listings/components/AdsCatalogRow.jsx";
import ListingRayXModal from "../features/listings/components/ListingRayXModal.jsx";
import { useListingsCatalogFetch } from "../features/listings/hooks/useListingsCatalogFetch.js";
import { DASH } from "../features/listings/utils/catalogFormatters.js";
import { rotuloCabecalhoListaUnicaLinha } from "../utils/rotuloCabecalhoLista.js";
import { fetchMercadoLivreMarketplaceAccounts } from "../services/marketplaceAccountsApi";
import { PricingIntelligenceModal } from "./pricing/PricingIntelligenceModal.jsx";
import ListingsGerarRelatorioModal from "../features/listings/reports/ListingsGerarRelatorioModal.jsx";
import {
  S7AccountSelect,
  S7ClearFiltersAction,
  S7QuickFiltersDropdown,
  S7SearchFiltersCard,
  S7SelectionCounter,
} from "./searchFilters";
import { buildPrecificacoesListAuditPayload, buildPrecificacoesListModalParityAuditPayload } from "../features/listings/utils/resolvePrecificacoesListCellMetrics.js";
import {
  fetchListingCatalogPricingHealthBuckets,
  invalidateListingCatalogPricingHealthBucketsCache,
  mergeListingCatalogPricingHealthBucketsRow,
} from "../services/listingCatalogPricingHealthBucketsApi.js";
import { notifyPricingHealthSummaryRefresh } from "../features/dashboard/api/pricingHealthSummaryRefreshEvents.js";
import { ADS_PAGE_MODE, PRICING_PAGE_MODE } from "../features/listings/config/listingsPageModes.js";

/** Rótulo de exibição de uma conta marketplace (nickname → alias → seller id). */
function listingsAccountLabel(a) {
  if (!a || typeof a !== "object") return "Conta";
  if (a.ml_nickname != null && String(a.ml_nickname).trim() !== "") return String(a.ml_nickname).trim();
  if (a.account_alias != null && String(a.account_alias).trim() !== "") return String(a.account_alias).trim();
  if (a.external_seller_id != null && String(a.external_seller_id).trim() !== "") return String(a.external_seller_id).trim();
  return "Conta";
}

const ADS_PAGE_SIZE = 25;

/**
 * Cabeçalho de coluna — rótulo estático (sem tooltip; título já é autoexplicativo).
 * @param {{ columnClass: string; dataCol?: string; lines?: [string, string]; children?: import("react").ReactNode }} props
 */
function AdsCatalogHeadCell({ columnClass, dataCol, lines, children = null }) {
  const tituloCompacto = lines && lines.length === 2 ? rotuloCabecalhoListaUnicaLinha(lines) : null;
  const label = tituloCompacto ?? children;

  return (
    <div
      className={`products-catalog__cell ${columnClass} products-catalog__col-head`}
      data-col={dataCol}
      role="columnheader"
    >
      {label}
    </div>
  );
}

/**
 * Container de listagem ML (fonte: GET /api/ml/listings).
 * Recebe `listingsWorkspaceMode` via `ListingsWorkspace` para alternar UX Anúncios vs Precificações sem duplicar fetch.
 *
 * @param {{
 *   listingsWorkspaceMode?: "anuncios" | "precificacoes";
 *   listingsViewConfig?: (typeof listingsViewConfigs)["anuncios"];
 *   filtersSectionRef?: import("react").RefObject<HTMLElement | null>;
 *   sectionJumpUpTargetRef?: import("react").RefObject<Element | null>;
 *   sectionJumpUpAriaLabel?: string;
 * }} [props]
 */
export default function Anuncios({
  listingsWorkspaceMode = "anuncios",
  listingsViewConfig: listingsViewConfigProp,
  filtersSectionRef = null,
  sectionJumpUpTargetRef = null,
  sectionJumpUpAriaLabel = "Voltar para o resumo da página",
} = {}) {
  const listingsViewConfig = listingsViewConfigProp ?? listingsViewConfigs[listingsWorkspaceMode];
  const { addNotification } = useNotifications();
  const [adsFilterId, setAdsFilterId] = useState("top_sales");
  const [adsSearchQuery, setAdsSearchQuery] = useState("");
  const [adsPage, setAdsPage] = useState(1);
  /** Vista simples (default): só capa + nº; vista completa: todas as colunas operacionais. */
  const [adsViewMode, setAdsViewMode] = useState(/** @type {"minimal" | "full"} */ (listingsViewConfig.defaultViewMode));

  useEffect(() => {
    setAdsViewMode(listingsViewConfig.defaultViewMode);
  }, [listingsWorkspaceMode, listingsViewConfig.defaultViewMode]);

  /** Card de busca e filtros — linha única permanente (Precificações / Anúncios). */
  const filtersCollapsible = listingsViewConfig.filtersStartCollapsed === true;

  /** Itens por página por modo (Precificações = 50). Apenas fatiamento client-side. */
  const pageSize = listingsViewConfig.pageSize ?? ADS_PAGE_SIZE;

  /** Modos com card recolhível: layout padronizado Buscar + Conta (linha 1) e Filtros rápidos (linha 2). */
  const isPricingFilters = filtersCollapsible;
  /** Filtro de Conta (client-side por `marketplaceAccountId`; mesma fonte do select de Vendas). */
  const showAccountFilter = listingsViewConfig.showAccountFilter === true;
  const [mlAccounts, setMlAccounts] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [mlAccountFilter, setMlAccountFilter] = useState("");

  useEffect(() => {
    if (!showAccountFilter) return undefined;
    let cancelled = false;
    (async () => {
      const res = await fetchMercadoLivreMarketplaceAccounts();
      if (cancelled) return;
      const list =
        res.ok && Array.isArray(res.data?.accounts)
          ? /** @type {Record<string, unknown>[]} */ (res.data.accounts)
          : [];
      setMlAccounts(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [showAccountFilter]);

  /**
   * Vista oficial efetiva: quando o modo não permite alternância (Precificações),
   * a visualização fica travada na `defaultViewMode` (Vista Simples) — impossível ir para Vista Completa.
   */
  const effectiveViewMode =
    listingsViewConfig.allowViewModeToggle === false ? listingsViewConfig.defaultViewMode : adsViewMode;

  /** Modal: informar SKU (anúncio sem SKU no ML). */
  const [skuModalListing, setSkuModalListing] = useState(null);
  /** Seleção na página atual (UUID `marketplace_listings.id`). */
  const [selectedListingIds, setSelectedListingIds] = useState(() => new Set());
  const [reportModalOpen, setReportModalOpen] = useState(false);
  /** PI.2.11A — modal espelho da Precificação Inteligente (Precificações). */
  const [pricingIntelligenceModalRow, setPricingIntelligenceModalRow] = useState(null);
  const [listingRayXRow, setListingRayXRow] = useState(null);
  const bulkSelectAllRef = useRef(null);

  const isAnunciosPage = listingsWorkspaceMode === ADS_PAGE_MODE;
  const isPrecificacoesPage = listingsWorkspaceMode === PRICING_PAGE_MODE;

  const normalizedAdsFilterId = useMemo(() => {
    if (isAnunciosPage) return normalizarIdFiltroRapidoAnuncios(adsFilterId);
    if (isPrecificacoesPage) return normalizarIdFiltroRapidoPrecificacoes(adsFilterId);
    return adsFilterId;
  }, [adsFilterId, isAnunciosPage, isPrecificacoesPage]);

  const showReportsCentral = listingsViewConfig.showReportsCentral === true;

  const handleAdsFilterChange = useCallback(
    (nextFilterId) => {
      if (isAnunciosPage) {
        setAdsFilterId(normalizarIdFiltroRapidoAnuncios(nextFilterId));
        return;
      }
      if (isPrecificacoesPage) {
        setAdsFilterId(normalizarIdFiltroRapidoPrecificacoes(nextFilterId));
        return;
      }
      setAdsFilterId(nextFilterId);
    },
    [isAnunciosPage, isPrecificacoesPage],
  );

  const clearSelectionAfterFetch = useCallback(() => {
    setSelectedListingIds(new Set());
  }, []);

  const { catalogRows, listLoading, listError, listSyncWarning, authWaiting, setListError, fetchListings } =
    useListingsCatalogFetch({
      onAfterLoad: clearSelectionAfterFetch,
    });

  const [pricingHealthBucketMaps, setPricingHealthBucketMaps] = useState(() => ({
    byMarketplaceListingId: {},
    byExternalListingId: {},
  }));
  const pricingHealthBucketsFetchGenRef = useRef(0);

  useEffect(() => {
    if (!isPrecificacoesPage || authWaiting) return undefined;

    const generation = ++pricingHealthBucketsFetchGenRef.current;
    void (async () => {
      const res = await fetchListingCatalogPricingHealthBuckets();
      if (generation !== pricingHealthBucketsFetchGenRef.current) return;
      if (!res.ok) return;
      setPricingHealthBucketMaps({
        byMarketplaceListingId: res.byMarketplaceListingId ?? {},
        byExternalListingId: res.byExternalListingId ?? {},
      });
    })();

    return () => {
      pricingHealthBucketsFetchGenRef.current += 1;
    };
  }, [isPrecificacoesPage, authWaiting, catalogRows.length]);

  const reloadPricingHealthBuckets = useCallback(async () => {
    invalidateListingCatalogPricingHealthBucketsCache();
    const res = await fetchListingCatalogPricingHealthBuckets({ refresh: true });
    if (!res.ok) return;
    setPricingHealthBucketMaps({
      byMarketplaceListingId: res.byMarketplaceListingId ?? {},
      byExternalListingId: res.byExternalListingId ?? {},
    });
  }, []);

  const handleListingsRefreshAfterCosts = useCallback(async () => {
    await fetchListings();
    if (!isPrecificacoesPage) return;
    await reloadPricingHealthBuckets();
    notifyPricingHealthSummaryRefresh();
  }, [fetchListings, isPrecificacoesPage, reloadPricingHealthBuckets]);

  const filterChips = useMemo(
    () => getAdsFilterChipsForToolbarOrdered(listingsViewConfig.filterToolbar.chipOrder),
    [listingsViewConfig],
  );

  /**
   * Precificações: oculta visualmente "Todos" (redundante com "Limpar filtros") e
   * "Mercado Livre" (canal único integrado). Sem remover lógica/definições.
   */
  const visibleFilterChips = useMemo(() => {
    if (!isPricingFilters) return filterChips;
    return filterChips.filter((def) => def.id !== "all" && def.id !== "mercadolivre");
  }, [filterChips, isPricingFilters]);

  const hasActiveFilters =
    (isAnunciosPage
      ? normalizedAdsFilterId !== ANUNCIOS_QUICK_FILTER_NEUTRAL_ID
      : isPrecificacoesPage
        ? normalizedAdsFilterId !== PRECIFICACOES_QUICK_FILTER_NEUTRAL_ID
        : adsFilterId !== "top_sales") ||
    adsSearchQuery.trim() !== "" ||
    (showAccountFilter && mlAccountFilter !== "");

  const handleClearFilters = useCallback(() => {
    setAdsFilterId(
      isAnunciosPage
        ? ANUNCIOS_QUICK_FILTER_NEUTRAL_ID
        : isPrecificacoesPage
          ? PRECIFICACOES_QUICK_FILTER_NEUTRAL_ID
          : "top_sales",
    );
    setAdsSearchQuery("");
    setMlAccountFilter("");
  }, [isAnunciosPage, isPrecificacoesPage]);

  const quickFilterItems = useMemo(() => {
    if (isAnunciosPage) {
      return ANUNCIOS_QUICK_FILTER_OPTIONS.map((option) => ({
        key: option.id,
        label: option.label,
        icon: option.icon,
        iconTone: option.iconTone,
        active: normalizedAdsFilterId === option.id,
        title: option.title,
        section: option.section,
        sectionLabel: ANUNCIOS_QUICK_FILTER_SECTION_LABELS[option.section],
        onSelect: () => handleAdsFilterChange(option.id),
      }));
    }

    if (isPrecificacoesPage) {
      return PRECIFICACOES_QUICK_FILTER_OPTIONS.map((option) => ({
        key: option.id,
        label: option.label,
        buttonLabel: option.buttonLabel,
        icon: option.icon,
        iconTone: option.iconTone,
        active: normalizedAdsFilterId === option.id,
        title: option.title,
        section: option.section,
        sectionLabel: PRECIFICACOES_QUICK_FILTER_SECTION_LABELS[option.section],
        onSelect: () => handleAdsFilterChange(option.id),
      }));
    }

    return visibleFilterChips.map((def) => ({
      key: def.id,
      label: def.label,
      icon: def.icon,
      iconTone: def.iconTone,
      active: adsFilterId === def.id,
      disabled: !def.enabled,
      title: def.description,
      onSelect: () => {
        if (!def.enabled) return;
        handleAdsFilterChange(def.id);
      },
    }));
  }, [
    isAnunciosPage,
    isPrecificacoesPage,
    normalizedAdsFilterId,
    handleAdsFilterChange,
    visibleFilterChips,
    adsFilterId,
  ]);

  /** Chip de filtro reutilizável (layout legado não recolhível). */
  const renderFilterChip = (def) => {
    const isActive = adsFilterId === def.id;
    return (
      <button
        key={def.id}
        type="button"
        className={`products-catalog__filter-chip${isActive ? " products-catalog__filter-chip--active" : ""}${def.enabled ? "" : " products-catalog__filter-chip--disabled"}`}
        aria-pressed={def.enabled ? isActive : undefined}
        disabled={!def.enabled}
        title={def.description}
        onClick={() => {
          if (!def.enabled) return;
          setAdsFilterId(def.id);
        }}
      >
        <span
          className={`products-catalog__filter-chip-icon products-catalog__filter-chip-icon--${def.iconTone}`}
          aria-hidden
        >
          <S7Icon name={def.icon} size={15} strokeWidth={1.65} />
        </span>
        <span className="products-catalog__filter-chip-label">{def.label}</span>
      </button>
    );
  };

  /** Botão "Limpar filtros" (ação oficial — substitui o chip "Todos"). */
  const clearFiltersButton = (
    <button
      type="button"
      className="products-catalog__filter-clear"
      disabled={!hasActiveFilters}
      aria-label="Limpar filtros"
      onClick={handleClearFilters}
    >
      <S7Icon name="filter_clear" size={14} strokeWidth={1.75} className="products-catalog__filter-clear-icon" />
      <span>Limpar filtros</span>
    </button>
  );

  /** Campo de busca (compartilhado entre os layouts). */
  const searchFieldNode = (
    <div className="products-catalog__search-field">
      <span className="products-catalog__search-icon" aria-hidden>
        <S7Icon name="search" size={15} strokeWidth={1.85} />
      </span>
      <S7Input
        label=""
        name="ads-catalog-search"
        value={adsSearchQuery}
        onChange={(e) => setAdsSearchQuery(e.target.value)}
        placeholder={listingsViewConfig.search.placeholder}
        className="products-catalog__search-s7"
        inputClassName="products-catalog__search-input-field s7-search-filters-card__search-input-field"
        autoComplete="off"
        aria-label={listingsViewConfig.search.ariaLabel}
        rightElement={
          adsSearchQuery ? (
            <button
              type="button"
              className="products-catalog__search-clear"
              onClick={(e) => {
                e.preventDefault();
                setAdsSearchQuery("");
              }}
              aria-label="Limpar busca"
            >
              <S7Icon name="close" size={16} strokeWidth={2} />
            </button>
          ) : null
        }
      />
    </div>
  );

  const openSkuModal = useCallback((row) => {
    const knownSku = row.sku != null && String(row.sku).trim() !== "" ? String(row.sku).trim() : null;
    setSkuModalListing({
      id: String(row.id),
      title: row.adTitle && row.adTitle !== DASH ? String(row.adTitle) : "",
      externalListingId: row.externalId || row.listingNumber || null,
      imageUrl: row.coverThumbnailUrl || null,
      knownSku,
    });
  }, []);

  const closeSkuModal = useCallback(() => {
    setSkuModalListing(null);
  }, []);

  const handleSkuSaved = useCallback(async () => {
    addNotification({
      event_type: "LISTING_SKU_SAVED",
      entity_type: "marketplace_listing",
      title: "SKU vinculado com sucesso",
      message: "O anúncio foi associado ao produto e a lista foi atualizada.",
      severity: NOTIFICATION_SEVERITY.INFO,
    });
    await fetchListings();
  }, [addNotification, fetchListings]);

  useEffect(() => {
    setSelectedListingIds(new Set());
  }, [adsSearchQuery, adsPage]);

  const rowsWithLabels = useMemo(
    () =>
      catalogRows.map((r) => {
        const withAccount = showAccountFilter ? enrichListingRowAccountVisual(r, mlAccounts) : r;
        const withLabel = {
          ...withAccount,
          marketplaceLabel: marketplaceChipLabel(withAccount.marketplaceSlug),
        };
        if (!isPrecificacoesPage) return withLabel;
        return mergeListingCatalogPricingHealthBucketsRow(withLabel, pricingHealthBucketMaps);
      }),
    [catalogRows, mlAccounts, showAccountFilter, isPrecificacoesPage, pricingHealthBucketMaps],
  );

  const searchFiltered = useMemo(
    () => filterAdsByCatalogSearch(rowsWithLabels, adsSearchQuery),
    [rowsWithLabels, adsSearchQuery]
  );

  const displayRows = useMemo(() => {
    const base = isAnunciosPage
      ? applyAnunciosCatalogFilters(searchFiltered, normalizedAdsFilterId)
      : isPrecificacoesPage
        ? applyPrecificacoesCatalogFilters(searchFiltered, normalizedAdsFilterId)
        : applyAdsCatalogFilter(searchFiltered, adsFilterId);
    if (!showAccountFilter || !mlAccountFilter) return base;
    return base.filter((r) => String(r.marketplaceAccountId ?? "") === mlAccountFilter);
  }, [
    searchFiltered,
    isAnunciosPage,
    isPrecificacoesPage,
    normalizedAdsFilterId,
    adsFilterId,
    showAccountFilter,
    mlAccountFilter,
  ]);

  const totalFiltered = displayRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const reportNoun = listingsWorkspaceMode === "precificacoes" ? "oferta" : "anúncio";

  const reportActiveFilters = useMemo(() => {
    const tags = [];
    if (
      isAnunciosPage
        ? normalizedAdsFilterId !== ANUNCIOS_QUICK_FILTER_NEUTRAL_ID
        : isPrecificacoesPage
          ? normalizedAdsFilterId !== PRECIFICACOES_QUICK_FILTER_NEUTRAL_ID
          : adsFilterId !== "top_sales"
    ) {
      const activeOption = isAnunciosPage
        ? findAnunciosQuickFilterOption(normalizedAdsFilterId)
        : isPrecificacoesPage
          ? findPrecificacoesQuickFilterOption(normalizedAdsFilterId)
          : filterChips.find((chip) => chip.id === adsFilterId);
      const activeLabel = isPrecificacoesPage
        ? resolverRotuloBotaoFiltroRapidoPrecificacoes(normalizedAdsFilterId) ?? activeOption?.label
        : activeOption?.label;
      if (activeLabel) tags.push(activeLabel);
    }
    if (showAccountFilter && mlAccountFilter) {
      const acc = mlAccounts.find((a) => String(a.id ?? "").trim() === String(mlAccountFilter).trim());
      if (acc) tags.push(`Conta: ${listingsAccountLabel(acc)}`);
    }
    const query = adsSearchQuery.trim();
    if (query) tags.push(`Busca: "${query}"`);
    return tags;
  }, [
    isAnunciosPage,
    isPrecificacoesPage,
    normalizedAdsFilterId,
    adsFilterId,
    filterChips,
    showAccountFilter,
    mlAccountFilter,
    mlAccounts,
    adsSearchQuery,
  ]);

  const reportExecutivo = useMemo(() => {
    const total = totalFiltered;
    const comSku = displayRows.filter((row) => String(row.sku ?? "").trim() !== "").length;
    const comHistoricoVendas = displayRows.filter((row) => {
      const vendas = Number(row.sales ?? row.salesCount ?? row.sold_quantity ?? 0);
      return Number.isFinite(vendas) && vendas > 0;
    }).length;
    const skuPendente = applyAdsCatalogFilter(displayRows, "sku_pending_ml").length;
    const emAtencao = applyAdsCatalogFilter(displayRows, "needs_attention").length;
    const emPrejuizo = applyAdsCatalogFilter(displayRows, "loss").length;
    const saudavel = Math.max(0, total - Math.max(emAtencao, emPrejuizo));

    const formatCount = (value) =>
      `${Number(value).toLocaleString("pt-BR")} ${Number(value) === 1 ? reportNoun : `${reportNoun}s`}`;

    return {
      cards: [
        { id: "escopo", label: "Itens no escopo", value: formatCount(total), accent: "green", icon: "check" },
        { id: "sku", label: "Com SKU vinculado", value: formatCount(comSku), accent: "blue", icon: "package" },
        {
          id: "vendas",
          label: "Com histórico de vendas",
          value: formatCount(comHistoricoVendas),
          accent: "gray",
          icon: "eye",
        },
      ],
      operacionais: [
        { id: "saudavel", label: "Saúde saudável", value: formatCount(saudavel), accent: "green", icon: "clipboard" },
        { id: "sku-pendente", label: "SKU pendente", value: formatCount(skuPendente), accent: "orange", icon: "warn" },
        {
          id: "prejuizo",
          label: listingsWorkspaceMode === "precificacoes" ? "Lucro em prejuízo" : "Precisam atenção",
          value: formatCount(listingsWorkspaceMode === "precificacoes" ? emPrejuizo : emAtencao),
          accent: "gold",
          icon: "trend_down",
        },
      ],
    };
  }, [totalFiltered, displayRows, reportNoun, listingsWorkspaceMode]);

  useEffect(() => {
    setAdsPage(1);
  }, [adsFilterId, adsSearchQuery, mlAccountFilter]);

  useEffect(() => {
    if (adsPage > totalPages) setAdsPage(totalPages);
  }, [adsPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (adsPage - 1) * pageSize;
    return displayRows.slice(start, start + pageSize);
  }, [displayRows, adsPage, pageSize]);

  const pricingListAuditKeyRef = useRef("");

  useEffect(() => {
    if (listingsWorkspaceMode !== PRICING_PAGE_MODE || catalogRows.length === 0) return;
    const auditKey = `${catalogRows.length}:${catalogRows[0]?.id ?? ""}:${catalogRows[catalogRows.length - 1]?.id ?? ""}`;
    if (pricingListAuditKeyRef.current === auditKey) return;
    pricingListAuditKeyRef.current = auditKey;

    const sample = catalogRows.slice(0, Math.min(25, catalogRows.length));
    const homologRow = catalogRows.find(
      (row) =>
        String(row.listingNumber ?? row.externalId ?? "").trim() === "MLB6415546858" ||
        String(row.externalId ?? "").trim() === "MLB6415546858" ||
        String(row.listingNumber ?? row.externalId ?? "").trim() === "MLB6086602390" ||
        String(row.externalId ?? "").trim() === "MLB6086602390",
    );
    const auditRows = homologRow && !sample.some((row) => row.id === homologRow.id)
      ? [...sample, homologRow]
      : sample;

    for (const row of auditRows) {
      console.info("[S7_PRICING_LIST_CURRENT_STATE_AUDIT]", buildPrecificacoesListAuditPayload(row));
      console.info("[S7_PRICING_LIST_MODAL_PARITY_AUDIT]", buildPrecificacoesListModalParityAuditPayload(row));
    }
  }, [catalogRows, listingsWorkspaceMode]);

  const toggleRowSelected = useCallback((listingId) => {
    setSelectedListingIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
  }, []);

  const allPageSelected = useMemo(
    () => paginatedRows.length > 0 && paginatedRows.every((r) => selectedListingIds.has(r.id)),
    [paginatedRows, selectedListingIds],
  );

  useEffect(() => {
    const el = bulkSelectAllRef.current;
    if (!el) return;
    const some = paginatedRows.some((r) => selectedListingIds.has(r.id));
    el.indeterminate = some && !allPageSelected;
  }, [paginatedRows, selectedListingIds, allPageSelected]);

  const toggleAllPageSelected = useCallback(() => {
    setSelectedListingIds((prev) => {
      const next = new Set(prev);
      const ids = paginatedRows.map((r) => r.id);
      const allSel = ids.length > 0 && ids.every((id) => next.has(id));
      if (allSel) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [paginatedRows]);

  const selectedCount = selectedListingIds.size;

  const openPricingIntelligenceModal = useCallback((row) => {
    setPricingIntelligenceModalRow(row);
  }, []);

  const closePricingIntelligenceModal = useCallback(() => {
    setPricingIntelligenceModalRow(null);
  }, []);

  const openListingRayXModal = useCallback((row) => {
    const accountId =
      row?.marketplaceAccountId != null && String(row.marketplaceAccountId).trim() !== ""
        ? String(row.marketplaceAccountId).trim()
        : row?.marketplace_account_id != null && String(row.marketplace_account_id).trim() !== ""
          ? String(row.marketplace_account_id).trim()
          : "";
    const accountMatch =
      accountId !== ""
        ? mlAccounts.find((a) => String(a?.id ?? "").trim() === accountId) ?? null
        : null;
    const enrichedRow =
      accountMatch && typeof accountMatch === "object"
        ? {
            ...row,
            marketplace_account_id: row?.marketplace_account_id ?? row?.marketplaceAccountId ?? accountId,
            account_alias: row?.account_alias ?? row?.accountAlias ?? accountMatch.account_alias ?? accountMatch.ml_nickname ?? null,
            account_logo_url:
              row?.account_logo_url ??
              row?.accountLogoUrl ??
              accountMatch.account_logo_url ??
              accountMatch.account_avatar_url ??
              accountMatch.avatar_url ??
              accountMatch.profile_image ??
              accountMatch.store_logo ??
              accountMatch.company_logo_url ??
              accountMatch.seller_company_logo_url ??
              null,
            marketplace_account_logo_url:
              row?.marketplace_account_logo_url ?? accountMatch.marketplace_account_logo_url ?? null,
            company_logo_url: row?.company_logo_url ?? accountMatch.company_logo_url ?? null,
            seller_company_logo_url: row?.seller_company_logo_url ?? accountMatch.seller_company_logo_url ?? null,
            account_avatar_url: row?.account_avatar_url ?? accountMatch.account_avatar_url ?? accountMatch.avatar_url ?? null,
            profile_image: row?.profile_image ?? accountMatch.profile_image ?? null,
            seller_logo_url: row?.seller_logo_url ?? accountMatch.seller_logo_url ?? null,
            store_logo: row?.store_logo ?? accountMatch.store_logo ?? null,
            account: {
              id: accountMatch.id ?? null,
              account_logo_url:
                accountMatch.account_logo_url ??
                accountMatch.account_avatar_url ??
                accountMatch.avatar_url ??
                accountMatch.profile_image ??
                accountMatch.store_logo ??
                accountMatch.company_logo_url ??
                accountMatch.seller_company_logo_url ??
                null,
              avatar_url: accountMatch.avatar_url ?? accountMatch.account_avatar_url ?? null,
              profile_image: accountMatch.profile_image ?? null,
              account_alias: accountMatch.account_alias ?? accountMatch.ml_nickname ?? null,
            },
          }
        : row;
    const qualityOpenSnapshot = buildListingQualityOpenSnapshot(enrichedRow);
    const enrichedWithQuality =
      qualityOpenSnapshot != null
        ? {
            ...enrichedRow,
            initialQualitySnapshot: qualityOpenSnapshot,
            score_percent:
              enrichedRow?.listingQualityScorePercent ??
              enrichedRow?.listingQualityScore ??
              qualityOpenSnapshot.score_percent,
          }
        : enrichedRow;
    setListingRayXRow(enrichedWithQuality);
  }, [mlAccounts]);

  const closeListingRayXModal = useCallback(() => {
    setListingRayXRow(null);
  }, []);

  return (
    <div className="anuncios-catalog">
      <SkuInputModal
        open={!!skuModalListing}
        listingId={skuModalListing?.id ?? null}
        listingTitle={skuModalListing?.title ?? ""}
        externalListingId={skuModalListing?.externalListingId ?? null}
        listingImageUrl={skuModalListing?.imageUrl ?? null}
        knownSku={skuModalListing?.knownSku ?? null}
        onClose={closeSkuModal}
        onSaved={handleSkuSaved}
      />

      <PricingIntelligenceModal
        open={pricingIntelligenceModalRow != null}
        row={pricingIntelligenceModalRow}
        onClose={closePricingIntelligenceModal}
        onApplied={fetchListings}
        catalogRefreshing={listLoading}
      />

      <ListingRayXModal
        open={listingRayXRow != null}
        listing={listingRayXRow}
        onClose={closeListingRayXModal}
      />

      {showReportsCentral ? (
        <ListingsGerarRelatorioModal
          open={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          mode={listingsWorkspaceMode}
          scopeLabel={listingsWorkspaceMode === "precificacoes" ? "Catálogo de precificações" : "Catálogo de anúncios"}
          totalLabel={`${Number(totalFiltered).toLocaleString("pt-BR")} ${totalFiltered === 1 ? reportNoun : `${reportNoun}s`}`}
          activeFilters={reportActiveFilters}
          resumoExecutivo={reportExecutivo}
        />
      ) : null}

      <div className="anuncios-catalog__operacao-stack">
      <h1 className="products-catalog__sr-title">{listingsViewConfig.srTitle}</h1>

      <ListingsTable
          stickyFilters={
            filtersCollapsible ? (
              <S7SearchFiltersCard
                ref={filtersSectionRef}
                className={["anuncios-catalog__filters", "anuncios-catalog__filters--single-row"].join(" ")}
                layout="catalog"
                actions={
                  <>
                    {showReportsCentral ? (
                      <S7Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        iconName="reports"
                        className="anuncios-catalog__filters-report-btn"
                        onClick={() => setReportModalOpen(true)}
                      >
                        Gerar relatório
                      </S7Button>
                    ) : null}
                    {sectionJumpUpTargetRef ? (
                      <S7SectionJumpButton
                        direction="up"
                        targetRef={sectionJumpUpTargetRef}
                        ariaLabel={sectionJumpUpAriaLabel}
                      />
                    ) : null}
                  </>
                }
                ariaLabel={`Busca e filtros — ${listingsViewConfig.pageTitle}`}
              >
                <div className="s7-search-filters-card__field s7-search-filters-card__field--search">
                  <div className="products-catalog__search-wrap anuncios-catalog__filters-search">
                    {searchFieldNode}
                  </div>
                </div>

                {showAccountFilter ? (
                  <div className="s7-search-filters-card__field s7-search-filters-card__field--account">
                    <S7AccountSelect
                      id="anuncios-catalog-account"
                      accounts={mlAccounts}
                      value={mlAccountFilter}
                      onChange={setMlAccountFilter}
                      accountLabel={listingsAccountLabel}
                    />
                  </div>
                ) : null}

                <div className="s7-search-filters-card__field s7-search-filters-card__field--quick">
                  <S7QuickFiltersDropdown
                    id="anuncios-catalog-quick-filters"
                    items={quickFilterItems}
                  />
                </div>

                <div className="s7-search-filters-card__field s7-search-filters-card__field--clear">
                  <S7ClearFiltersAction disabled={!hasActiveFilters} onClick={handleClearFilters} />
                </div>

                {selectedCount > 0 ? (
                  <div className="s7-search-filters-card__field s7-search-filters-card__field--selection">
                    <S7SelectionCounter
                      count={selectedCount}
                      singularLabel={listingsViewConfig.bulkBarLabels.selectedOne}
                      pluralLabel={listingsViewConfig.bulkBarLabels.selectedMany}
                    />
                  </div>
                ) : null}
              </S7SearchFiltersCard>
            ) : (
            <div
              ref={filtersSectionRef}
              className={[
                "products-catalog__controls",
                "s7-sticky-filters",
                "s7-catalog-filter-card",
                !filtersCollapsible && sectionJumpUpTargetRef ? "s7-section-jump-host" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {!filtersCollapsible && sectionJumpUpTargetRef ? (
                <S7SectionJumpButton
                  direction="up"
                  targetRef={sectionJumpUpTargetRef}
                  ariaLabel={sectionJumpUpAriaLabel}
                  className="s7-section-jump-button--overlay"
                />
              ) : null}
              <div
                id="anuncios-catalog-filters-panel"
                className="anuncios-catalog__filters-panel"
              >
                    <div className="products-catalog__controls-top">
                      <div className="products-catalog__search-wrap">{searchFieldNode}</div>
                    </div>
                    <div className="products-catalog__controls-main">
                      <div
                        className="products-catalog__filter-row products-catalog__filter-row--spread"
                        role="toolbar"
                        aria-label={`Filtros rápidos — ${listingsViewConfig.pageTitle}`}
                        data-listings-filters={listingsViewConfig.filtersToolbarKey}
                      >
                        <div className="products-catalog__filter-row-chips">
                          {filterChips.map(renderFilterChip)}
                          {clearFiltersButton}
                        </div>
                        {listingsViewConfig.allowViewModeToggle !== false ? (
                          <div className="products-catalog__filter-row-end">
                            <button
                              type="button"
                              className={`products-catalog__filter-chip${adsViewMode === "full" ? " products-catalog__filter-chip--active" : ""}`}
                              title={
                                adsViewMode === "minimal"
                                  ? "Mostra preço, vendas, métricas e demais colunas (mesmo endpoint)."
                                  : "Mostra só capa e número do anúncio (diagnóstico)."
                              }
                              aria-pressed={adsViewMode === "full"}
                              onClick={() => setAdsViewMode((m) => (m === "minimal" ? "full" : "minimal"))}
                            >
                              <span className="products-catalog__filter-chip-label">
                                {adsViewMode === "minimal" ? "Vista completa" : "Vista simples"}
                              </span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
              </div>
            </div>
            )
          }
          listOperationalPrefix={
            <>
              {listSyncWarning ? (
                <div className="products-catalog__filter-empty-card products-catalog__sync-warning" role="status">
                  <p>{listSyncWarning}</p>
                </div>
              ) : null}

              {listError ? (
                <div className="products-catalog__filter-empty-card" role="alert">
                  <S7EmptyState
                    title={`Erro ao carregar ${listingsViewConfig.pageTitle.toLowerCase()}`}
                    description={listError}
                  />
                  <button type="button" className="products-catalog__filter-empty-btn" onClick={() => fetchListings()}>
                    Tentar novamente
                  </button>
                </div>
              ) : listLoading || authWaiting ? (
                <div className="products-catalog__filter-empty-card" role="status">
                  <p>Carregando {listingsViewConfig.pageTitle.toLowerCase()}…</p>
                </div>
              ) : displayRows.length === 0 ? (
                <div className="products-catalog__filter-empty-card" role="status">
                  {(() => {
                    const hasSearch = adsSearchQuery.trim().length > 0;
                    const { nounPlural } = listingsViewConfig.emptyStateNouns;
                    const { noneInFilter, noneFound, noneImported } = listingsViewConfig.emptyStateTitles;
                    let title = noneInFilter;
                    let description = "Ajuste os filtros ou limpe para ver a listagem completa.";
                    const trulyEmptyCatalog =
                      catalogRows.length === 0 && !hasSearch && adsFilterId === "top_sales" && !listError;
                    if (trulyEmptyCatalog) {
                      title = noneImported;
                      description =
                        "Importe ou vincule anúncios pelo Mercado Livre. Se já importou, aguarde a sincronização ou tente recarregar.";
                    } else if (hasSearch && searchFiltered.length === 0) {
                      title = noneFound;
                      description = "Nenhum item corresponde à busca. Tente outro termo ou limpe o campo.";
                    } else if (hasSearch && searchFiltered.length > 0) {
                      description = `Nenhum item corresponde à combinação de busca e filtros nesta visão de ${nounPlural}.`;
                    }
                    return (
                      <>
                        <S7EmptyState title={title} description={description} />
                        <button
                          type="button"
                          className="products-catalog__filter-empty-btn"
                          onClick={() => {
                            setAdsFilterId("top_sales");
                            setAdsSearchQuery("");
                          }}
                        >
                          Mostrar todos
                        </button>
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </>
          }
          bulkSelectionBar={null}
          tableHead={
            <div
              className={`anuncios-catalog__grid anuncios-catalog__grid--head anuncios-catalog--dense${
                effectiveViewMode === "minimal" ? " anuncios-catalog__grid--minimal" : ""
              }${!listingsViewConfig.showPrecificaS7Column ? " anuncios-catalog__grid--no-precifica-col" : ""}${
                effectiveViewMode === "minimal" && listingsWorkspaceMode === "anuncios"
                  ? " anuncios-catalog__grid--anuncios-analytic anuncios-catalog__grid--anuncios-analytic--no-scroll"
                  : ""
              }${
                effectiveViewMode === "minimal" && listingsWorkspaceMode === "precificacoes"
                  ? " anuncios-catalog__grid--precificacoes-minimal anuncios-catalog__grid--precificacoes-analytic--no-scroll"
                  : ""
              }${
                listingsViewConfig.columnLayout === "pricing_focus" && effectiveViewMode === "full"
                  ? " anuncios-catalog__grid--pricing-columns"
                  : ""
              }`}
              data-listings-columns={listingsViewConfig.columnsPresetKey}
            >
                <div
                  className="products-catalog__cell anuncios-catalog__cell--select products-catalog__col-head"
                  data-col={
                    listingsWorkspaceMode === "precificacoes" ? PRECIFICACOES_COL.select : ANUNCIOS_COL.select
                  }
                  role="columnheader"
                >
                  <span className="products-catalog__sr-only">Selecionar</span>
                  <input
                    ref={bulkSelectAllRef}
                    type="checkbox"
                    className="anuncios-catalog__select-checkbox"
                    checked={allPageSelected}
                    disabled={listLoading || paginatedRows.length === 0}
                    onChange={toggleAllPageSelected}
                    aria-label={`Selecionar todos os itens visíveis nesta página (${listingsViewConfig.pageTitle})`}
                  />
                </div>
                {listingsViewConfig.showPrecificaS7Column ? (
                  <AdsCatalogHeadCell
                    columnClass="anuncios-catalog__cell--precifica-s7"
                    lines={["Precifica", "S7"]}
                  />
                ) : null}
                <AdsCatalogHeadCell
                  columnClass="anuncios-catalog__cell--thumb"
                  dataCol={listingsWorkspaceMode === "precificacoes" ? PRECIFICACOES_COL.cover : ANUNCIOS_COL.cover}
                >
                  <span className="products-catalog__sr-only">Capa</span>
                </AdsCatalogHeadCell>
                {effectiveViewMode === "minimal" ? (
                  listingsWorkspaceMode === "precificacoes" ? (
                    <>
                      <AdsCatalogHeadCell
                        columnClass="anuncios-catalog__cell--minimal-listing"
                        dataCol={PRECIFICACOES_COL.listing}
                      >
                        Anúncio
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="anuncios-catalog__cell--listing-type"
                        dataCol={PRECIFICACOES_COL.listingType}
                      >
                        Tipo anúncio
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="anuncios-catalog__cell--account"
                        dataCol={PRECIFICACOES_COL.account}
                      >
                        Loja
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="anuncios-catalog__cell--channel"
                        dataCol={PRECIFICACOES_COL.channel}
                      >
                        Canal
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="products-catalog__cell--num"
                        dataCol={PRECIFICACOES_COL.sales}
                      >
                        Vendas
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="products-catalog__cell--money anuncios-catalog__cell--precificacoes-result"
                        dataCol={PRECIFICACOES_COL.profitBrl}
                      >
                        Lucro R$
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="products-catalog__cell--pct"
                        dataCol={PRECIFICACOES_COL.profitPercent}
                      >
                        Lucro %
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="products-catalog__cell--money"
                        dataCol={PRECIFICACOES_COL.currentPrice}
                      >
                        Preço atual
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="products-catalog__cell--money"
                        dataCol={PRECIFICACOES_COL.commission}
                      >
                        Comissão
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell columnClass="products-catalog__cell--money" dataCol={PRECIFICACOES_COL.shipping}>
                        Frete
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell columnClass="products-catalog__cell--money" dataCol={PRECIFICACOES_COL.payout}>
                        Repasse
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell columnClass="products-catalog__cell--money" dataCol={PRECIFICACOES_COL.cost}>
                        Custo
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell columnClass="products-catalog__cell--money" dataCol={PRECIFICACOES_COL.tax}>
                        Imposto
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="products-catalog__cell--num"
                        dataCol={PRECIFICACOES_COL.competitors}
                      >
                        Concorrentes
                      </AdsCatalogHeadCell>
                    </>
                  ) : (
                    <>
                      <AdsCatalogHeadCell
                        columnClass="anuncios-catalog__cell--minimal-listing"
                        dataCol={ANUNCIOS_COL.listing}
                      >
                        Anúncio
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="anuncios-catalog__cell--listing-type"
                        dataCol={ANUNCIOS_COL.listingType}
                        lines={["Tipo", "anúncio"]}
                      />
                      <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--account" dataCol={ANUNCIOS_COL.account}>
                        Loja
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--channel" dataCol={ANUNCIOS_COL.channel}>
                        Canal
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="products-catalog__cell--money"
                        dataCol={ANUNCIOS_COL.profitBrl}
                        lines={["Lucro", "(R$)"]}
                      />
                      <AdsCatalogHeadCell columnClass="products-catalog__cell--pct" dataCol={ANUNCIOS_COL.profitPercent}>
                        Lucro (%)
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell columnClass="products-catalog__cell--money" dataCol={ANUNCIOS_COL.salePrice}>
                        Preço
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell columnClass="products-catalog__cell--num" dataCol={ANUNCIOS_COL.sales}>
                        Vendas
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="products-catalog__cell--money"
                        dataCol={ANUNCIOS_COL.revenue}
                        lines={["Fatura-", "mento"]}
                      />
                      <AdsCatalogHeadCell
                        columnClass="products-catalog__cell--money"
                        dataCol={ANUNCIOS_COL.avgTicket}
                        lines={["Ticket", "Médio"]}
                      />
                      <AdsCatalogHeadCell columnClass="products-catalog__cell--money" dataCol={ANUNCIOS_COL.payout}>
                        Repasse
                      </AdsCatalogHeadCell>
                      <AdsCatalogHeadCell
                        columnClass="anuncios-catalog__cell--quality"
                        dataCol={ANUNCIOS_COL.quality}
                      >
                        Qualidade
                      </AdsCatalogHeadCell>
                    </>
                  )
                ) : (
                  <>
                    <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--listing-no">
                      Nº
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--title">
                      Anúncio
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--product">
                      Produto
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--account">
                      Loja
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--channel">
                      Canal
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="products-catalog__cell--money">
                      Preço
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="products-catalog__cell--num">
                      Vendas
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell
                      columnClass="products-catalog__cell--money"
                      lines={["Fatura-", "mento"]}
                    />
                    <AdsCatalogHeadCell
                      columnClass="products-catalog__cell--money"
                      lines={["Você", "recebe"]}
                    />
                    <AdsCatalogHeadCell
                      columnClass="products-catalog__cell--pct"
                      lines={["Com.", "%"]}
                    />
                    <AdsCatalogHeadCell
                      columnClass="products-catalog__cell--money"
                      lines={["Com.", "R$"]}
                    />
                    <AdsCatalogHeadCell columnClass="products-catalog__cell--money">
                      Frete
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="products-catalog__cell--money">
                      Promoção
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="products-catalog__cell--num">
                      Visitas
                    </AdsCatalogHeadCell>
                    {listingsViewConfig.columnLayout !== "pricing_focus" ? (
                      <>
                        <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--metric">
                          Qualidade
                        </AdsCatalogHeadCell>
                        <AdsCatalogHeadCell
                          columnClass="anuncios-catalog__cell--metric"
                          lines={["Experi-", "ência"]}
                        />
                        <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--status">
                          Status
                        </AdsCatalogHeadCell>
                        <AdsCatalogHeadCell columnClass="products-catalog__cell--health">
                          Saúde
                        </AdsCatalogHeadCell>
                      </>
                    ) : null}
                  </>
                )}
              </div>
          }
          tableBody={
            displayRows.length > 0
              ? paginatedRows.map((row) => (
                  <AdsCatalogRow
                    key={row.id}
                    row={row}
                    minimal={effectiveViewMode === "minimal"}
                    onInformSku={(r) => openSkuModal(r)}
                    onListingsRefresh={handleListingsRefreshAfterCosts}
                    onOpenPricingIntelligence={openPricingIntelligenceModal}
                    onOpenListingRayX={openListingRayXModal}
                    selected={selectedListingIds.has(row.id)}
                    onToggleSelected={toggleRowSelected}
                    selectionDisabled={listLoading}
                    listingsWorkspaceMode={listingsWorkspaceMode}
                    rowClickAction={listingsViewConfig.rowClickAction}
                    catalogColumnLayout={listingsViewConfig.columnLayout}
                    showPrecificaS7Column={listingsViewConfig.showPrecificaS7Column}
                  />
                ))
              : null
          }
          paginationFooter={
            displayRows.length > 0 ? (
              <S7Pagination
                page={adsPage}
                totalPages={totalPages}
                total={totalFiltered}
                noun={listingsViewConfig.emptyStateNouns.nounPlural}
                ariaLabel={`Paginação — ${listingsViewConfig.pageTitle}`}
                onPrevious={() => setAdsPage((p) => Math.max(1, p - 1))}
                onNext={() => setAdsPage((p) => Math.min(totalPages, p + 1))}
              />
            ) : null
          }
        />
      </div>
    </div>
  );
}
