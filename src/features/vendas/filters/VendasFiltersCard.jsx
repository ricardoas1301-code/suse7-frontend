// ======================================================================
// Card premium de busca e filtros — página Vendas (P_2.2).
// ======================================================================

import { forwardRef, useCallback, useMemo, useState } from "react";
import S7Icon from "../../../components/ui/S7Icon";
import S7Input from "../../../components/ui/S7Input";
import { SALES_FILTER_CHIPS } from "../../../utils/salesToolbarFilters";
import { formatVendasSelectionCountLabel } from "../selection/aggregateVendasSelectedSalesMetrics.js";
import { useVendasFilters } from "./VendasFiltersContext";
import {
  getVendasMarketplaceOptionsForUi,
  VENDAS_ORIGEM_VENDA_OPTIONS,
  VENDAS_STATUS_VENDA_OPTIONS,
  VENDAS_TIPO_ENTREGA_OPTIONS,
} from "./vendasFiltersConstants";
import VendasPeriodRangePicker from "./VendasPeriodRangePicker";
import S7Button from "../../../components/ui/S7Button";
import S7SectionJumpButton from "../../../components/ui/S7SectionJumpButton.jsx";
import "./VendasFiltersCard.css";

/**
 * @param {{
 *   accounts?: readonly Record<string, unknown>[];
 *   accountLabel: (account: Record<string, unknown>) => string;
 *   accountsReady?: boolean;
 *   listFilter?: string;
 *   onListFilterChange?: (filterId: string) => void;
 *   searchInput?: string;
 *   onSearchInputChange?: (value: string) => void;
 *   showGerarRelatorio?: boolean;
 *   gerarRelatorioDisabled?: boolean;
 *   onGerarRelatorioClick?: () => void;
 *   selectedCount?: number;
 *   sectionJumpUpTargetRef?: import("react").RefObject<Element | null>;
 *   sectionJumpUpAriaLabel?: string;
 * }} props
 */
const VendasFiltersCard = forwardRef(function VendasFiltersCard(
  {
  accounts = [],
  accountLabel,
  accountsReady = true,
  listFilter = "all",
  onListFilterChange,
  searchInput = "",
  onSearchInputChange,
  showGerarRelatorio = false,
  gerarRelatorioDisabled = false,
  onGerarRelatorioClick,
  selectedCount = 0,
  sectionJumpUpTargetRef = null,
  sectionJumpUpAriaLabel = "Voltar para o resumo da página",
  },
  ref,
) {
  const {
    filters,
    periodSummaryLabel,
    toggleExpanded,
    applyPeriod,
    setMarketplace,
    setMarketplaceAccountId,
  } = useVendasFilters();

  const hasActiveCatalogFilters = useMemo(() => {
    const hasChip = listFilter && listFilter !== "all";
    const hasSearch = String(searchInput ?? "").trim() !== "";
    const hasAccount = String(filters.marketplaceAccountId ?? "").trim() !== "";
    return hasChip || hasSearch || hasAccount;
  }, [listFilter, searchInput, filters.marketplaceAccountId]);

  const limparFiltrosCatalogo = useCallback(() => {
    onListFilterChange?.("all");
    onSearchInputChange?.("");
    setMarketplaceAccountId("");
  }, [onListFilterChange, onSearchInputChange, setMarketplaceAccountId]);

  const expanded = filters.expanded;

  // P_2.2 — filtros operacionais visuais (estado local; sem integração backend nesta fase).
  const [statusVenda, setStatusVenda] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState("");
  const [origemVenda, setOrigemVenda] = useState("");

  // P_2.X M08 — resumo do card recolhido: Período · Conta · Filtro · Busca.
  // Não inclui filtros ocultos/futuros (Marketplace, Status, Tipo de entrega, Origem).
  const collapsedSummary = useMemo(() => {
    const parts = [periodSummaryLabel];

    const accountId = filters.marketplaceAccountId
      ? String(filters.marketplaceAccountId).trim()
      : "";
    if (accountId) {
      const account = accounts.find((a) => (a?.id != null ? String(a.id).trim() : "") === accountId);
      const name = account ? accountLabel(account) : "Conta selecionada";
      parts.push(`Conta: ${name}`);
    } else {
      parts.push("Todas as contas");
    }

    const activeChip = SALES_FILTER_CHIPS.find((c) => c.id === listFilter);
    parts.push(`Filtro: ${activeChip?.label ?? "Todos"}`);

    const query = String(searchInput ?? "").trim();
    if (query) parts.push(`Busca: "${query}"`);

    return parts.filter(Boolean).join(" · ");
  }, [periodSummaryLabel, filters.marketplaceAccountId, accounts, accountLabel, listFilter, searchInput]);

  return (
    <section
      ref={ref}
      className={[
        "vendas-filters-card",
        "s7-sticky-filters",
        "s7-catalog-filter-card",
        expanded ? "vendas-filters-card--expanded" : "vendas-filters-card--collapsed",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Busca e filtros de vendas"
    >
      <button
        type="button"
        className="vendas-filters-card__header"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls="vendas-filters-card-panel"
      >
        <span className="vendas-filters-card__header-main">
          <span className="vendas-filters-card__header-icon" aria-hidden>
            <S7Icon name="search" size={18} strokeWidth={1.85} />
          </span>
          <span className="vendas-filters-card__header-text">
            <span className="vendas-filters-card__title">Busca e filtros</span>
            {!expanded ? (
              <span className="vendas-filters-card__summary">
                {collapsedSummary}
                {selectedCount > 0 ? (
                  <>
                    {" · "}
                    <span className="vendas-filters-card__summary-selected">
                      {formatVendasSelectionCountLabel(selectedCount)}
                    </span>
                  </>
                ) : null}
              </span>
            ) : null}
          </span>
        </span>
        <span className="vendas-filters-card__header-actions">
          {sectionJumpUpTargetRef ? (
            <S7SectionJumpButton
              direction="up"
              targetRef={sectionJumpUpTargetRef}
              ariaLabel={sectionJumpUpAriaLabel}
            />
          ) : null}
          {/* P_2.8.12F — contador também no header expandido (recolhido já exibe no resumo). */}
          {expanded && selectedCount > 0 ? (
            <span className="vendas-filters-card__header-selected">
              {formatVendasSelectionCountLabel(selectedCount)}
            </span>
          ) : null}
          {showGerarRelatorio ? (
            <S7Button
              type="button"
              variant="secondary"
              size="sm"
              iconName="reports"
              className="vendas-filters-card__report-btn"
              disabled={gerarRelatorioDisabled}
              title="Gerar relatório com os filtros atuais"
              onClick={(e) => {
                e.stopPropagation();
                onGerarRelatorioClick?.();
              }}
            >
              Gerar relatório
            </S7Button>
          ) : null}
          <span
            className={[
              "vendas-filters-card__chevron",
              expanded ? "vendas-filters-card__chevron--open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden
          >
            <S7Icon name="chevron_down" size={18} strokeWidth={2} />
          </span>
        </span>
      </button>

      <div id="vendas-filters-card-panel" className="vendas-filters-card__collapse" aria-hidden={!expanded}>
        <div className="vendas-filters-card__body">
          <div className="vendas-filters-card__row vendas-filters-card__row--primary">
            <div className="vendas-filters-card__field vendas-filters-card__field--period">
              <VendasPeriodRangePicker
                periodPreset={filters.periodPreset}
                startDate={filters.startDate}
                endDate={filters.endDate}
                onApply={applyPeriod}
              />
            </div>

            <div className="vendas-filters-card__field vendas-filters-card__field--search">
              <label className="vendas-filters-card__label" htmlFor="vendas-filters-search">
                Buscar
              </label>
              <div className="products-catalog__search-wrap vendas-filters-card__search-wrap">
                <div className="products-catalog__search-field">
                  <span className="products-catalog__search-icon" aria-hidden>
                    <S7Icon name="search" size={18} strokeWidth={1.85} />
                  </span>
                  <S7Input
                    label=""
                    name="vendas-filters-search"
                    value={searchInput}
                    onChange={(e) => onSearchInputChange?.(e.target.value)}
                    placeholder="Buscar por título, comprador, SKU, código da venda ou rastreio"
                    className="products-catalog__search-s7"
                    inputClassName="products-catalog__search-input-field"
                    autoComplete="off"
                    aria-label="Buscar vendas por título, comprador, SKU, código ou rastreio"
                    rightElement={
                      searchInput ? (
                        <button
                          type="button"
                          className="products-catalog__search-clear"
                          onClick={(e) => {
                            e.preventDefault();
                            onSearchInputChange?.("");
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

            <div className="vendas-filters-card__field vendas-filters-card__field--account">
              <label className="vendas-filters-card__label" htmlFor="vendas-filters-account">
                Conta
              </label>
              <select
                id="vendas-filters-account"
                className="vendas-filters-card__select"
                value={filters.marketplaceAccountId}
                disabled={!accountsReady}
                onChange={(e) => setMarketplaceAccountId(e.target.value)}
              >
                <option value="">Todas as contas</option>
                {accounts.map((a) => {
                  const id = a.id != null ? String(a.id).trim() : "";
                  if (!id) return null;
                  return (
                    <option key={id} value={id}>
                      {accountLabel(a)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* P_2.2 hotfix final — filtros sem integração backend ocultos temporariamente.
                Reativar removendo o atributo hidden + a regra CSS --future[hidden]. */}
            <div className="vendas-filters-card__field vendas-filters-card__field--future" hidden>
              <label className="vendas-filters-card__label" htmlFor="vendas-filters-status">
                Status da venda
              </label>
              <select
                id="vendas-filters-status"
                className="vendas-filters-card__select"
                value={statusVenda}
                onChange={(e) => setStatusVenda(e.target.value)}
              >
                {VENDAS_STATUS_VENDA_OPTIONS.map((o) => (
                  <option key={o.id || "all"} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="vendas-filters-card__field vendas-filters-card__field--future" hidden>
              <label className="vendas-filters-card__label" htmlFor="vendas-filters-delivery">
                Tipo de entrega
              </label>
              <select
                id="vendas-filters-delivery"
                className="vendas-filters-card__select"
                value={tipoEntrega}
                onChange={(e) => setTipoEntrega(e.target.value)}
              >
                {VENDAS_TIPO_ENTREGA_OPTIONS.map((o) => (
                  <option key={o.id || "all"} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="vendas-filters-card__field vendas-filters-card__field--future" hidden>
              <label className="vendas-filters-card__label" htmlFor="vendas-filters-origin">
                Origem da venda
              </label>
              <select
                id="vendas-filters-origin"
                className="vendas-filters-card__select"
                value={origemVenda}
                onChange={(e) => setOrigemVenda(e.target.value)}
              >
                {VENDAS_ORIGEM_VENDA_OPTIONS.map((o) => (
                  <option key={o.id || "all"} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* P_2.2 M02 — Marketplace oculto temporariamente (somente ML ativo).
                Código e lógica preservados; retornará com Shopee/Amazon/Shein. */}
            <div className="vendas-filters-card__field vendas-filters-card__field--marketplace" hidden>
              <span className="vendas-filters-card__label">Marketplace</span>
              <div className="vendas-filters-card__marketplaces" role="group" aria-label="Marketplace">
                {getVendasMarketplaceOptionsForUi().map((m) => {
                  const active =
                    (m.id === "" && !filters.marketplace) || filters.marketplace === m.id;
                  return (
                    <button
                      key={m.id || "all"}
                      type="button"
                      className={[
                        "vendas-filters-card__marketplace-chip",
                        active ? "vendas-filters-card__marketplace-chip--active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-pressed={active}
                      onClick={() => setMarketplace(m.id)}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="vendas-filters-card__row vendas-filters-card__row--chips">
            <span className="vendas-filters-card__label">Filtros rápidos</span>
            <div className="vendas-filters-card__chip-row" role="toolbar" aria-label="Filtros de vendas">
              {/* "Todos" removido — a ação oficial de zerar filtros é o botão "Limpar filtros". */}
              {SALES_FILTER_CHIPS.filter((c) => c.id !== "all").map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`products-catalog__filter-chip ${listFilter === c.id ? "products-catalog__filter-chip--active" : ""}`}
                  onClick={() => onListFilterChange?.(c.id)}
                >
                  <span
                    className={`products-catalog__filter-chip-icon products-catalog__filter-chip-icon--${c.iconTone}`}
                    aria-hidden
                  >
                    <S7Icon name={c.icon} size={15} strokeWidth={1.65} />
                  </span>
                  <span className="products-catalog__filter-chip-label">{c.label}</span>
                </button>
              ))}
              <button
                type="button"
                className="products-catalog__filter-clear"
                disabled={!hasActiveCatalogFilters}
                title="Remove os filtros aplicados"
                onClick={limparFiltrosCatalogo}
              >
                <S7Icon name="filter_clear" size={14} strokeWidth={1.75} className="products-catalog__filter-clear-icon" />
                <span>Limpar filtros</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default VendasFiltersCard;
