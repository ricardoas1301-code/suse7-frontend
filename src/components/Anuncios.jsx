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
import AnunciosBulkSkuModal from "./AnunciosBulkSkuModal";
import S7Button from "./ui/S7Button";
import S7EmptyState from "./ui/S7EmptyState";
import S7Icon from "./ui/S7Icon";
import S7Input from "./ui/S7Input";
import S7Pagination from "./ui/S7Pagination";
import S7Tooltip from "./ui/S7Tooltip";
import { applyAdsCatalogFilter, getAdsFilterChipsForToolbarOrdered } from "../utils/adsFilterRegistry";
import { filterAdsByCatalogSearch } from "../utils/adsCatalogSearch";
import { marketplaceChipLabel } from "../utils/productCatalogRow";
import "./Products.css";
import "./Anuncios.css";
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

/** Rótulo de exibição de uma conta marketplace (nickname → alias → seller id). */
function listingsAccountLabel(a) {
  if (!a || typeof a !== "object") return "Conta";
  if (a.ml_nickname != null && String(a.ml_nickname).trim() !== "") return String(a.ml_nickname).trim();
  if (a.account_alias != null && String(a.account_alias).trim() !== "") return String(a.account_alias).trim();
  if (a.external_seller_id != null && String(a.external_seller_id).trim() !== "") return String(a.external_seller_id).trim();
  return "Conta";
}

const ADS_PAGE_SIZE = 25;

const ADS_COLUMN_TOOLTIPS = {
  cover: "Imagem principal do anúncio importada do marketplace.",
  listingNo:
    "Número do anúncio no Mercado Livre (exibido sem o prefixo MLB, como no painel). O id técnico completo continua no banco. Clique para copiar o número exibido.",
  adTitle: "Título público do anúncio no marketplace.",
  product: "Produto interno vinculado ao anúncio.",
  account: "Conta do vendedor no marketplace (alias / logo), vinculada ao CNPJ no Suse7.",
  channel: "Canal = marketplace (Mercado Livre, Shopee, etc.). Distinto da coluna Conta.",
  marketplace: "Canal de venda onde o anúncio está publicado.",
  price: "Preço de catálogo (listing_price_brl) — ver também coluna de promoção e effective_sale_price_brl na API.",
  sales: "Unidades vendidas via este anúncio (métricas importadas).",
  revenue: "Faturamento bruto associado ao anúncio.",
  netReceive:
    "Repasse líquido unitário do marketplace (campo net_proceeds). Não usar totais de vendas importadas nesta célula.",
  commissionPct:
    "Percentual de comissão do marketplace (sale_fee_details no sync). Passe o mouse para ver o tipo do anúncio (Clássico/Premium).",
  commissionBrl: "Valor monetário estimado da comissão (sale_fee_details), quando informado pelo marketplace.",
  shipping: "Custo de frete explícito no anúncio, quando a API retornar.",
  promotion: "Preço promocional efetivo quando há original_price acima do preço atual.",
  visits: "Total de visitas ao anúncio (API de visitas do ML, quando disponível).",
  listingQuality: "Nível ou score de qualidade da publicação (endpoint performance/health do ML).",
  buyingExperience: "Indicador de experiência de compra quando retornado pelo ML.",
  status: "Status operacional no marketplace.",
  adHealth: "Indicador de saúde numérica do anúncio no payload do item (ML).",
  sellPor:
    "Preço de venda no anúncio (preço de tabela quando há promoção), preço promocional, atacado quando a API expõe, e valor líquido estimado (você recebe) com detalhamento de tarifa e frete.",
};

/**
 * @param {{ columnClass: string; tip?: string; tipWrap?: boolean; lines?: [string, string]; children?: import("react").ReactNode }} props
 */
function AdsCatalogHeadCell({ columnClass, tip, tipWrap = false, lines, children = null }) {
  const tituloCompacto = lines && lines.length === 2 ? rotuloCabecalhoListaUnicaLinha(lines) : null;
  const triggerClass = [
    "products-catalog__head-tooltip",
    tituloCompacto ? "products-catalog__head-tooltip--compact" : "",
    tipWrap ? "products-catalog__head-tooltip--wide" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const label = tituloCompacto ?? children;

  return (
    <div className={`products-catalog__cell ${columnClass} products-catalog__col-head`} role="columnheader">
      {tip ? (
        <span className={triggerClass} data-tooltip={tip} tabIndex={0}>
          {label}
        </span>
      ) : (
        label
      )}
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
 * }} [props]
 */
export default function Anuncios({ listingsWorkspaceMode = "anuncios", listingsViewConfig: listingsViewConfigProp } = {}) {
  const listingsViewConfig = listingsViewConfigProp ?? listingsViewConfigs[listingsWorkspaceMode];
  const { addNotification } = useNotifications();
  const [adsFilterId, setAdsFilterId] = useState("all");
  const [adsSearchQuery, setAdsSearchQuery] = useState("");
  const [adsPage, setAdsPage] = useState(1);
  /** Vista simples (default): só capa + nº; vista completa: todas as colunas operacionais. */
  const [adsViewMode, setAdsViewMode] = useState(/** @type {"minimal" | "full"} */ (listingsViewConfig.defaultViewMode));

  useEffect(() => {
    setAdsViewMode(listingsViewConfig.defaultViewMode);
  }, [listingsWorkspaceMode, listingsViewConfig.defaultViewMode]);

  /** Card de busca e filtros recolhível (Precificações abre recolhido, igual Vendas). */
  const filtersCollapsible = listingsViewConfig.filtersStartCollapsed === true;
  const [filtersExpanded, setFiltersExpanded] = useState(!filtersCollapsible);

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
  const [bulkSkuModalOpen, setBulkSkuModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  /** PI.2.11A — modal espelho da Precificação Inteligente (Precificações). */
  const [pricingIntelligenceModalRow, setPricingIntelligenceModalRow] = useState(null);
  const [listingRayXRow, setListingRayXRow] = useState(null);
  const bulkSelectAllRef = useRef(null);

  const showReportsCentral = listingsViewConfig.showReportsCentral === true;

  const clearSelectionAfterFetch = useCallback(() => {
    setSelectedListingIds(new Set());
  }, []);

  const { catalogRows, listLoading, listError, listSyncWarning, authWaiting, setListError, fetchListings } =
    useListingsCatalogFetch({
      onAfterLoad: clearSelectionAfterFetch,
    });

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
    adsFilterId !== "all" ||
    adsSearchQuery.trim() !== "" ||
    (showAccountFilter && mlAccountFilter !== "");

  const handleClearFilters = useCallback(() => {
    setAdsFilterId("all");
    setAdsSearchQuery("");
    setMlAccountFilter("");
  }, []);

  /** Resumo dos filtros ativos exibido no cabeçalho quando o card está recolhido. */
  const filtersSummaryText = useMemo(() => {
    /* Precificações — paridade com o resumo recolhido da Vendas:
       Conta/Todas as contas · Filtro: [label] · Busca (quando houver). */
    if (isPricingFilters) {
      const parts = [];

      if (showAccountFilter) {
        const accountId = mlAccountFilter ? String(mlAccountFilter).trim() : "";
        if (accountId) {
          const acc = mlAccounts.find((a) => String(a.id ?? "").trim() === accountId);
          parts.push(`Conta: ${acc ? listingsAccountLabel(acc) : "Conta selecionada"}`);
        } else {
          parts.push("Todas as contas");
        }
      }

      const activeChip = filterChips.find((c) => c.id === adsFilterId);
      parts.push(`Filtro: ${activeChip?.label ?? "Todos"}`);

      const query = adsSearchQuery.trim();
      if (query) parts.push(`Busca: "${query}"`);

      return parts.join(" · ");
    }

    const parts = [];
    if (adsFilterId !== "all") {
      const chip = filterChips.find((c) => c.id === adsFilterId);
      if (chip) parts.push(chip.label);
    }
    if (showAccountFilter && mlAccountFilter) {
      const acc = mlAccounts.find((a) => String(a.id ?? "") === mlAccountFilter);
      parts.push(acc ? `Conta ${listingsAccountLabel(acc)}` : "Conta selecionada");
    }
    if (adsSearchQuery.trim() !== "") parts.push(`"${adsSearchQuery.trim()}"`);
    return parts.length > 0 ? parts.join(" • ") : "Nenhum filtro ativo";
  }, [
    isPricingFilters,
    adsFilterId,
    filterChips,
    showAccountFilter,
    mlAccountFilter,
    mlAccounts,
    adsSearchQuery,
  ]);

  /** Chip de filtro reutilizável (mesmo visual em Anúncios e Precificações). */
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
      title="Remove os filtros aplicados"
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
        <S7Icon name="search" size={18} strokeWidth={1.85} />
      </span>
      <S7Input
        label=""
        name="ads-catalog-search"
        value={adsSearchQuery}
        onChange={(e) => setAdsSearchQuery(e.target.value)}
        placeholder={listingsViewConfig.search.placeholder}
        className="products-catalog__search-s7"
        inputClassName="products-catalog__search-input-field"
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
  }, [adsSearchQuery, adsFilterId, adsPage]);

  const rowsWithLabels = useMemo(
    () =>
      catalogRows.map((r) => ({
        ...r,
        marketplaceLabel: marketplaceChipLabel(r.marketplaceSlug),
      })),
    [catalogRows]
  );

  const searchFiltered = useMemo(
    () => filterAdsByCatalogSearch(rowsWithLabels, adsSearchQuery),
    [rowsWithLabels, adsSearchQuery]
  );

  const displayRows = useMemo(() => {
    const base = applyAdsCatalogFilter(searchFiltered, adsFilterId);
    if (!showAccountFilter || !mlAccountFilter) return base;
    return base.filter((r) => String(r.marketplaceAccountId ?? "") === mlAccountFilter);
  }, [searchFiltered, adsFilterId, showAccountFilter, mlAccountFilter]);

  const totalFiltered = displayRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const reportNoun = listingsWorkspaceMode === "precificacoes" ? "oferta" : "anúncio";

  const reportActiveFilters = useMemo(() => {
    const tags = [];
    if (adsFilterId !== "all") {
      const activeChip = filterChips.find((chip) => chip.id === adsFilterId);
      if (activeChip?.label) tags.push(activeChip.label);
    }
    if (showAccountFilter && mlAccountFilter) {
      const acc = mlAccounts.find((a) => String(a.id ?? "").trim() === String(mlAccountFilter).trim());
      if (acc) tags.push(`Conta: ${listingsAccountLabel(acc)}`);
    }
    const query = adsSearchQuery.trim();
    if (query) tags.push(`Busca: "${query}"`);
    return tags;
  }, [adsFilterId, filterChips, showAccountFilter, mlAccountFilter, mlAccounts, adsSearchQuery]);

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

  /** SKU visível idêntico em todos os anúncios selecionados (na página atual) — hint do modal bulk. */
  const bulkSkuInitialHint = useMemo(() => {
    const rows = displayRows.filter((r) => selectedListingIds.has(r.id));
    const skus = rows
      .map((r) => (r.sku != null && String(r.sku).trim() !== "" ? String(r.sku).trim() : null))
      .filter((s) => s != null);
    if (skus.length === 0) return null;
    const first = skus[0];
    if (skus.every((s) => s === first)) return first;
    return null;
  }, [displayRows, selectedListingIds]);

  const getBulkListingIds = useCallback(() => [...selectedListingIds], [selectedListingIds]);

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
    setListingRayXRow(enrichedRow);
  }, [mlAccounts]);

  const closeListingRayXModal = useCallback(() => {
    setListingRayXRow(null);
  }, []);

  const handleBulkSkuCompleted = useCallback(
    async (result) => {
      const sev =
        result.kind === "success"
          ? NOTIFICATION_SEVERITY.INFO
          : result.kind === "warning"
            ? NOTIFICATION_SEVERITY.WARNING
            : NOTIFICATION_SEVERITY.CRITICAL;
      addNotification({
        event_type: "LISTING_BULK_SKU",
        entity_type: "marketplace_listing",
        title: result.title,
        message: result.message,
        severity: sev,
      });
      setSelectedListingIds(new Set());
      if (result.kind !== "error") {
        await fetchListings();
      }
    },
    [addNotification, fetchListings],
  );

  return (
    <div className="anuncios-catalog">
      <SkuInputModal
        open={!!skuModalListing}
        listingId={skuModalListing?.id ?? null}
        listingTitle={skuModalListing?.title ?? ""}
        knownSku={skuModalListing?.knownSku ?? null}
        requireExistingProductConfirm
        onClose={closeSkuModal}
        onSaved={handleSkuSaved}
      />

      <AnunciosBulkSkuModal
        open={bulkSkuModalOpen}
        selectedCount={selectedCount}
        marketplace={listingsViewConfig.marketplaceScopeKey}
        getListingIds={getBulkListingIds}
        initialSkuHint={bulkSkuInitialHint}
        onClose={() => setBulkSkuModalOpen(false)}
        onCompleted={handleBulkSkuCompleted}
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

      <h1 className="products-catalog__sr-title">{listingsViewConfig.srTitle}</h1>

      <div
        className={`products-catalog__controls s7-sticky-filters s7-catalog-filter-card${
          filtersCollapsible ? " anuncios-catalog__filters--collapsible" : ""
        }${filtersCollapsible && !filtersExpanded ? " anuncios-catalog__filters--collapsed" : ""}`}
      >
        {filtersCollapsible ? (
          <button
            type="button"
            className="anuncios-catalog__filters-toggle"
            onClick={() => setFiltersExpanded((v) => !v)}
            aria-expanded={filtersExpanded}
            aria-controls="anuncios-catalog-filters-panel"
          >
            <span className="anuncios-catalog__filters-toggle-main">
              <span className="anuncios-catalog__filters-toggle-icon" aria-hidden>
                <S7Icon name="search" size={18} strokeWidth={1.85} />
              </span>
              <span className="anuncios-catalog__filters-toggle-text">
                <span className="anuncios-catalog__filters-toggle-title">Busca e filtros</span>
                {!filtersExpanded ? (
                  <span className="anuncios-catalog__filters-toggle-summary">{filtersSummaryText}</span>
                ) : null}
              </span>
            </span>
            <span className="anuncios-catalog__filters-toggle-actions">
              {showReportsCentral ? (
                <S7Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  iconName="reports"
                  className="anuncios-catalog__filters-toggle-report-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReportModalOpen(true);
                  }}
                >
                  Relatórios
                </S7Button>
              ) : null}
              <span
                className={`anuncios-catalog__filters-toggle-chevron${
                  filtersExpanded ? " anuncios-catalog__filters-toggle-chevron--open" : ""
                }`}
                aria-hidden
              >
                <S7Icon name="chevron_down" size={18} strokeWidth={2} />
              </span>
            </span>
          </button>
        ) : null}
        <div
          id="anuncios-catalog-filters-panel"
          className="anuncios-catalog__filters-panel"
          aria-hidden={filtersCollapsible ? !filtersExpanded : undefined}
        >
        {isPricingFilters ? (
          <div className="anuncios-catalog__filters-stack">
            <div className="anuncios-catalog__filters-row anuncios-catalog__filters-row--search-account">
              <div className="anuncios-catalog__filters-group anuncios-catalog__filters-group--search">
                <span className="anuncios-catalog__filters-group-label">Buscar</span>
                <div className="products-catalog__search-wrap anuncios-catalog__filters-search">
                  {searchFieldNode}
                </div>
              </div>

              {showAccountFilter ? (
                <div className="anuncios-catalog__filters-group anuncios-catalog__filters-group--account">
                  <span className="anuncios-catalog__filters-group-label">Conta</span>
                  <select
                    className="anuncios-catalog__filters-select"
                    value={mlAccountFilter}
                    onChange={(e) => setMlAccountFilter(e.target.value)}
                    aria-label="Filtrar por conta do marketplace"
                  >
                    <option value="">Todas as contas</option>
                    {mlAccounts.map((a) => {
                      const id = a.id != null ? String(a.id).trim() : "";
                      if (!id) return null;
                      return (
                        <option key={id} value={id}>
                          {listingsAccountLabel(a)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : null}
            </div>

            <div className="anuncios-catalog__filters-row anuncios-catalog__filters-row--chips">
              <span className="anuncios-catalog__filters-group-label">Filtros rápidos</span>
              <div
                className="products-catalog__filter-row-chips anuncios-catalog__filters-chip-row"
                role="toolbar"
                aria-label={`Filtros rápidos — ${listingsViewConfig.pageTitle}`}
                data-listings-filters={listingsViewConfig.filtersToolbarKey}
              >
                {visibleFilterChips.map(renderFilterChip)}
                {clearFiltersButton}
              </div>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
        </div>
      </div>

      {listSyncWarning ? (
        <div className="products-catalog__filter-empty-card products-catalog__sync-warning" role="status">
          <p>{listSyncWarning}</p>
        </div>
      ) : null}

      {listError ? (
        <div className="products-catalog__filter-empty-card" role="alert">
          <S7EmptyState title={`Erro ao carregar ${listingsViewConfig.pageTitle.toLowerCase()}`} description={listError} />
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
              catalogRows.length === 0 && !hasSearch && adsFilterId === "all" && !listError;
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
                    setAdsFilterId("all");
                    setAdsSearchQuery("");
                  }}
                >
                  Mostrar todos
                </button>
              </>
            );
          })()}
        </div>
      ) : (
        <ListingsTable
          bulkSelectionBar={
            selectedCount > 0 ? (
              <div
                className="anuncios-catalog__bulk-bar"
                role="region"
                aria-label={`Seleção em massa — ${listingsViewConfig.pageTitle}`}
              >
              <span className="anuncios-catalog__bulk-bar-count">
                <strong>{selectedCount}</strong>{" "}
                {selectedCount === 1
                  ? listingsViewConfig.bulkBarLabels.selectedOne
                  : listingsViewConfig.bulkBarLabels.selectedMany}
              </span>
              <div className="anuncios-catalog__bulk-bar-actions">
                <S7Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={listLoading}
                  onClick={() => setBulkSkuModalOpen(true)}
                >
                  Vincular selecionados
                </S7Button>
                <button
                  type="button"
                  className="anuncios-catalog__bulk-bar-clear"
                  disabled={listLoading}
                  onClick={() => setSelectedListingIds(new Set())}
                >
                  Limpar seleção
                </button>
              </div>
            </div>
            ) : null
          }
          tableHead={
            <div
              className={`anuncios-catalog__grid anuncios-catalog__grid--head anuncios-catalog--dense${
                effectiveViewMode === "minimal" ? " anuncios-catalog__grid--minimal" : ""
              }${!listingsViewConfig.showPrecificaS7Column ? " anuncios-catalog__grid--no-precifica-col" : ""}${
                listingsViewConfig.columnLayout === "pricing_focus" && effectiveViewMode === "full"
                  ? " anuncios-catalog__grid--pricing-columns"
                  : ""
              }`}
              data-listings-columns={listingsViewConfig.columnsPresetKey}
            >
                <div
                  className="products-catalog__cell anuncios-catalog__cell--select products-catalog__col-head"
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
                    tip="Simular cenário e publicar preço no marketplace (Precificação inteligente S7)."
                    lines={["Precifica", "S7"]}
                  />
                ) : null}
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--thumb" tip={ADS_COLUMN_TOOLTIPS.cover}>
                  Capa
                </AdsCatalogHeadCell>
                {effectiveViewMode === "minimal" ? (
                  <>
                    <AdsCatalogHeadCell
                      columnClass="anuncios-catalog__cell--minimal-listing"
                      tip="Número do anúncio, título (link ao ML), marketplace, vínculo com produto quando pendente, SKU e vendas/visitas importadas."
                      tipWrap
                    >
                      Anúncio
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell
                      columnClass="anuncios-catalog__cell--minimal-sell"
                      tip={ADS_COLUMN_TOOLTIPS.sellPor}
                      tipWrap
                      lines={["Você", "vende por"]}
                    />
                  </>
                ) : (
                  <>
                    <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--listing-no" tip={ADS_COLUMN_TOOLTIPS.listingNo}>
                      Nº
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--title" tip={ADS_COLUMN_TOOLTIPS.adTitle}>
                      Anúncio
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--product" tip={ADS_COLUMN_TOOLTIPS.product}>
                      Produto
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--account" tip={ADS_COLUMN_TOOLTIPS.account}>
                      Conta
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--channel" tip={ADS_COLUMN_TOOLTIPS.channel}>
                      Canal
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="products-catalog__cell--money" tip={ADS_COLUMN_TOOLTIPS.price}>
                      Preço
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="products-catalog__cell--num" tip={ADS_COLUMN_TOOLTIPS.sales}>
                      Vendas
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell
                      columnClass="products-catalog__cell--money"
                      tip={ADS_COLUMN_TOOLTIPS.revenue}
                      lines={["Fatura-", "mento"]}
                    />
                    <AdsCatalogHeadCell
                      columnClass="products-catalog__cell--money"
                      tip={ADS_COLUMN_TOOLTIPS.netReceive}
                      lines={["Você", "recebe"]}
                    />
                    <AdsCatalogHeadCell
                      columnClass="products-catalog__cell--pct"
                      tip={ADS_COLUMN_TOOLTIPS.commissionPct}
                      lines={["Com.", "%"]}
                    />
                    <AdsCatalogHeadCell
                      columnClass="products-catalog__cell--money"
                      tip={ADS_COLUMN_TOOLTIPS.commissionBrl}
                      lines={["Com.", "R$"]}
                    />
                    <AdsCatalogHeadCell columnClass="products-catalog__cell--money" tip={ADS_COLUMN_TOOLTIPS.shipping}>
                      Frete
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="products-catalog__cell--money" tip={ADS_COLUMN_TOOLTIPS.promotion}>
                      Promoção
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell columnClass="products-catalog__cell--num" tip={ADS_COLUMN_TOOLTIPS.visits}>
                      Visitas
                    </AdsCatalogHeadCell>
                    {listingsViewConfig.columnLayout !== "pricing_focus" ? (
                      <>
                        <AdsCatalogHeadCell
                          columnClass="anuncios-catalog__cell--metric"
                          tip={ADS_COLUMN_TOOLTIPS.listingQuality}
                        >
                          Qualidade
                        </AdsCatalogHeadCell>
                        <AdsCatalogHeadCell
                          columnClass="anuncios-catalog__cell--metric"
                          tip={ADS_COLUMN_TOOLTIPS.buyingExperience}
                          lines={["Experi-", "ência"]}
                        />
                        <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--status" tip={ADS_COLUMN_TOOLTIPS.status}>
                          Status
                        </AdsCatalogHeadCell>
                        <AdsCatalogHeadCell columnClass="products-catalog__cell--health" tip={ADS_COLUMN_TOOLTIPS.adHealth}>
                          Saúde
                        </AdsCatalogHeadCell>
                      </>
                    ) : null}
                  </>
                )}
              </div>
          }
          tableBody={paginatedRows.map((row) => (
            <AdsCatalogRow
              key={row.id}
              row={row}
              minimal={effectiveViewMode === "minimal"}
              onInformSku={(r) => openSkuModal(r)}
              onListingsRefresh={fetchListings}
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
          ))}
          paginationFooter={
            /* Paginação padrão Suse7 (modelo Vendas): "Página X de Y · Z {anúncios/precificações} no total" */
            <S7Pagination
              page={adsPage}
              totalPages={totalPages}
              total={totalFiltered}
              noun={listingsViewConfig.emptyStateNouns.nounPlural}
              ariaLabel={`Paginação — ${listingsViewConfig.pageTitle}`}
              onPrevious={() => setAdsPage((p) => Math.max(1, p - 1))}
              onNext={() => setAdsPage((p) => Math.min(totalPages, p + 1))}
            />
          }
        />
      )}
    </div>
  );
}
