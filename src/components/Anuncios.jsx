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
import S7Tooltip from "./ui/S7Tooltip";
import { applyAdsCatalogFilter, getAdsFilterChipsForToolbarOrdered } from "../utils/adsFilterRegistry";
import { filterAdsByCatalogSearch } from "../utils/adsCatalogSearch";
import { marketplaceChipLabel } from "../utils/productCatalogRow";
import "./Products.css";
import "./Anuncios.css";
import { ListingsTable } from "../features/listings/components/ListingsTable";
import { listingsViewConfigs } from "../features/listings/config/listingsViewConfigs";
import { AdsCatalogRow } from "../features/listings/components/AdsCatalogRow.jsx";
import { useListingsCatalogFetch } from "../features/listings/hooks/useListingsCatalogFetch.js";
import { DASH } from "../features/listings/utils/catalogFormatters.js";

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
  const triggerClass = [
    "products-catalog__head-tooltip",
    lines && lines.length === 2 ? "products-catalog__head-tooltip--stacked" : "",
    tipWrap ? "products-catalog__head-tooltip--wide" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const label =
    lines && lines.length === 2 ? (
      <>
        <span className="products-catalog__col-head-line">{lines[0]}</span>
        <span className="products-catalog__col-head-line">{lines[1]}</span>
      </>
    ) : (
      children
    );

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
 * @param {number} current
 * @param {number} total
 * @returns {(number | null)[]}
 */
function buildPaginationItems(current, total) {
  if (total <= 1) return [1];
  const set = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const p = sorted[i];
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  }
  return out;
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

  /** Modal: informar SKU (anúncio sem SKU no ML). */
  const [skuModalListing, setSkuModalListing] = useState(null);
  /** Seleção na página atual (UUID `marketplace_listings.id`). */
  const [selectedListingIds, setSelectedListingIds] = useState(() => new Set());
  const [bulkSkuModalOpen, setBulkSkuModalOpen] = useState(false);
  const bulkSelectAllRef = useRef(null);

  const clearSelectionAfterFetch = useCallback(() => {
    setSelectedListingIds(new Set());
  }, []);

  const { catalogRows, listLoading, listError, setListError, fetchListings } =
    useListingsCatalogFetch({
      onAfterLoad: clearSelectionAfterFetch,
    });

  const filterChips = useMemo(
    () => getAdsFilterChipsForToolbarOrdered(listingsViewConfig.filterToolbar.chipOrder),
    [listingsViewConfig],
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

  const displayRows = useMemo(() => applyAdsCatalogFilter(searchFiltered, adsFilterId), [searchFiltered, adsFilterId]);

  const totalFiltered = displayRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ADS_PAGE_SIZE));

  useEffect(() => {
    setAdsPage(1);
  }, [adsFilterId, adsSearchQuery]);

  useEffect(() => {
    if (adsPage > totalPages) setAdsPage(totalPages);
  }, [adsPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (adsPage - 1) * ADS_PAGE_SIZE;
    return displayRows.slice(start, start + ADS_PAGE_SIZE);
  }, [displayRows, adsPage]);

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

  const paginationItems = useMemo(() => buildPaginationItems(adsPage, totalPages), [adsPage, totalPages]);
  const rangeStart = totalFiltered === 0 ? 0 : (adsPage - 1) * ADS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(adsPage * ADS_PAGE_SIZE, totalFiltered);

  return (
    <div className="anuncios-catalog">
      <SkuInputModal
        open={!!skuModalListing}
        listingId={skuModalListing?.id ?? null}
        listingTitle={skuModalListing?.title ?? ""}
        knownSku={skuModalListing?.knownSku ?? null}
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

      <h1 className="products-catalog__sr-title">{listingsViewConfig.srTitle}</h1>

      {listingsViewConfig.kpiPreset === "pricing_financial" ? (
        <section className="s7-core-kpis anuncios-catalog__kpis" aria-label="Resumo de precificação">
          <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-blue">
            <header className="anuncios-catalog__kpi-head">
              <h2 className="anuncios-catalog__kpi-title">Produtos precificados</h2>
            </header>
            <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
          </article>

          <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-orange">
            <header className="anuncios-catalog__kpi-head">
              <h2 className="anuncios-catalog__kpi-title">Margem média</h2>
            </header>
            <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
          </article>

          <div className="anuncios-catalog__kpi-minis" aria-label="Indicadores de risco e oportunidade">
            <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--profit">
              <div className="anuncios-catalog__kpi-mini-head">
                <h3 className="anuncios-catalog__kpi-mini-title">Preços saudáveis</h3>
              </div>
              <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
            </article>
            <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--warn">
              <div className="anuncios-catalog__kpi-mini-head">
                <h3 className="anuncios-catalog__kpi-mini-title">Em risco</h3>
              </div>
              <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
            </article>
            <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--decline">
              <div className="anuncios-catalog__kpi-mini-head">
                <h3 className="anuncios-catalog__kpi-mini-title">Prejuízo</h3>
              </div>
              <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
            </article>
            <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--sales">
              <div className="anuncios-catalog__kpi-mini-head">
                <h3 className="anuncios-catalog__kpi-mini-title">Oportunidades</h3>
              </div>
              <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
            </article>
          </div>
        </section>
      ) : (
        <section className="s7-core-kpis anuncios-catalog__kpis" aria-label="Resumo de anúncios">
          <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-blue">
            <header className="anuncios-catalog__kpi-head">
              <h2 className="anuncios-catalog__kpi-title">Anúncios ativos</h2>
            </header>
            <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
          </article>

          <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-orange">
            <header className="anuncios-catalog__kpi-head">
              <h2 className="anuncios-catalog__kpi-title">Faturamento dos anúncios</h2>
            </header>
            <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
          </article>

          <div className="anuncios-catalog__kpi-minis" aria-label="Indicadores rápidos">
            {[
              { key: "profit", label: "Lucro", variant: "profit" },
              { key: "sku_pending", label: "SKU pendente", variant: "warn" },
              { key: "decline", label: "Em queda", variant: "decline" },
              { key: "sales", label: "Vendas", variant: "sales" },
            ].map(({ key, label, variant }) => (
              <article
                key={key}
                className={`anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--${variant}`}
              >
                <div className="anuncios-catalog__kpi-mini-head">
                  <h3 className="anuncios-catalog__kpi-mini-title">{label}</h3>
                </div>
                <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="products-catalog__controls s7-sticky-filters s7-catalog-filter-card">
        <div className="products-catalog__controls-top">
          <div className="products-catalog__search-wrap">
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
          </div>
        </div>
        <div className="products-catalog__controls-main">
          <div
            className="products-catalog__filter-row products-catalog__filter-row--spread"
            role="toolbar"
            aria-label={`Filtros rápidos — ${listingsViewConfig.pageTitle}`}
            data-listings-filters={listingsViewConfig.filtersToolbarKey}
          >
            <div className="products-catalog__filter-row-chips">
              {filterChips.map((def) => {
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
              })}
              <button
                type="button"
                className="products-catalog__filter-clear"
                disabled={adsFilterId === "all"}
                title="Remove filtros e volta à listagem padrão"
                onClick={() => setAdsFilterId("all")}
              >
                <S7Icon name="filter_clear" size={14} strokeWidth={1.75} className="products-catalog__filter-clear-icon" />
                <span>Limpar filtros</span>
              </button>
            </div>
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
          </div>
        </div>
      </div>

      {listError ? (
        <div className="products-catalog__filter-empty-card" role="alert">
          <S7EmptyState title={`Erro ao carregar ${listingsViewConfig.pageTitle.toLowerCase()}`} description={listError} />
          <button type="button" className="products-catalog__filter-empty-btn" onClick={() => fetchListings()}>
            Tentar novamente
          </button>
        </div>
      ) : listLoading ? (
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
            if (catalogRows.length === 0 && !hasSearch && adsFilterId === "all") {
              title = noneImported;
              description =
                "Conecte o Mercado Livre em Perfil → Integrações para vincular a conta e disponibilizar seus anúncios no Suse7.";
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
                adsViewMode === "minimal" ? " anuncios-catalog__grid--minimal" : ""
              }${!listingsViewConfig.showPrecificaS7Column ? " anuncios-catalog__grid--no-precifica-col" : ""}${
                listingsViewConfig.columnLayout === "pricing_focus" && adsViewMode === "full"
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
                {adsViewMode === "minimal" ? (
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
              minimal={adsViewMode === "minimal"}
              onInformSku={(r) => openSkuModal(r)}
              onListingsRefresh={fetchListings}
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
          <footer className="products-catalog__pagination" aria-label={`Paginação — ${listingsViewConfig.pageTitle}`}>
            <p className="products-catalog__pagination-meta">
              Mostrando <strong>{rangeStart}</strong>–<strong>{rangeEnd}</strong> de <strong>{totalFiltered}</strong>{" "}
              {totalFiltered === 1
                ? listingsViewConfig.emptyStateNouns.noun
                : listingsViewConfig.emptyStateNouns.nounPlural}
            </p>
            {totalPages > 1 ? (
              <nav className="products-catalog__pagination-nav" aria-label="Páginas">
                <button
                  type="button"
                  className="products-catalog__pagination-btn"
                  disabled={adsPage <= 1}
                  onClick={() => setAdsPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <div className="products-catalog__pagination-pages">
                  {paginationItems.map((item, idx) =>
                    item == null ? (
                      <span key={`e-${idx}`} className="products-catalog__pagination-ellipsis" aria-hidden>
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={`products-catalog__pagination-page${item === adsPage ? " products-catalog__pagination-page--current" : ""}`}
                        aria-current={item === adsPage ? "page" : undefined}
                        onClick={() => setAdsPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
                <button
                  type="button"
                  className="products-catalog__pagination-btn products-catalog__pagination-btn--next"
                  disabled={adsPage >= totalPages}
                  onClick={() => setAdsPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próximo
                </button>
              </nav>
            ) : null}
          </footer>
          }
        />
      )}
    </div>
  );
}
