// ======================================================================
// Card premium de busca e filtros — página Vendas (linha única permanente).
// ======================================================================

import { forwardRef, useCallback, useMemo, useState } from "react";
import S7Icon from "../../../components/ui/S7Icon";
import S7Input from "../../../components/ui/S7Input";
import {
  VENDAS_QUICK_FILTER_NEUTRAL_ID,
  VENDAS_QUICK_FILTER_OPTIONS,
  VENDAS_QUICK_FILTER_SECTION_LABELS,
  resolverRotuloBotaoFiltroRapidoVendas,
} from "./vendasQuickFiltersConfig";
import { useVendasFilters } from "./VendasFiltersContext";
import {
  getVendasMarketplaceOptionsForUi,
  VENDAS_ORIGEM_VENDA_OPTIONS,
  VENDAS_STATUS_VENDA_OPTIONS,
  VENDAS_TIPO_ENTREGA_OPTIONS,
} from "./vendasFiltersConstants";
import VendasPeriodRangePicker from "./VendasPeriodRangePicker";
import { getDefaultLast30DaysRange, isVendasOfficialDefaultPeriod } from "./vendasFiltersPeriod";
import S7Button from "../../../components/ui/S7Button";
import S7SectionJumpButton from "../../../components/ui/S7SectionJumpButton.jsx";
import {
  S7AccountSelect,
  S7ClearFiltersAction,
  S7QuickFiltersDropdown,
  S7SearchFiltersCard,
} from "../../../components/searchFilters";
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
 *   sectionJumpUpTargetRef?: import("react").RefObject<Element | null>;
 *   sectionJumpUpAriaLabel?: string;
 *   onClearAll?: () => void;
 * }} props
 */
const VendasFiltersCard = forwardRef(function VendasFiltersCard(
  {
    accounts = [],
    accountLabel,
    accountsReady = true,
    listFilter = VENDAS_QUICK_FILTER_NEUTRAL_ID,
    onListFilterChange,
    searchInput = "",
    onSearchInputChange,
    showGerarRelatorio = false,
    gerarRelatorioDisabled = false,
    onGerarRelatorioClick,
    sectionJumpUpTargetRef = null,
    sectionJumpUpAriaLabel = "Voltar para o resumo da página",
    onClearAll,
  },
  ref,
) {
  const { filters, applyPeriod, setMarketplace, setMarketplaceAccountId } = useVendasFilters();

  const hasActiveCatalogFilters = useMemo(() => {
    const hasChip = listFilter && listFilter !== VENDAS_QUICK_FILTER_NEUTRAL_ID;
    const hasSearch = String(searchInput ?? "").trim() !== "";
    const hasAccount = String(filters.marketplaceAccountId ?? "").trim() !== "";
    const hasCustomPeriod = !isVendasOfficialDefaultPeriod(filters);
    return hasChip || hasSearch || hasAccount || hasCustomPeriod;
  }, [listFilter, searchInput, filters]);

  const limparFiltrosCatalogo = useCallback(() => {
    const officialPeriod = getDefaultLast30DaysRange();
    applyPeriod({
      preset: officialPeriod.preset,
      startDate: officialPeriod.startDate,
      endDate: officialPeriod.endDate,
    });
    onListFilterChange?.(VENDAS_QUICK_FILTER_NEUTRAL_ID);
    onSearchInputChange?.("");
    setMarketplace("");
    setMarketplaceAccountId("");
    onClearAll?.();
  }, [
    applyPeriod,
    onListFilterChange,
    onSearchInputChange,
    setMarketplace,
    setMarketplaceAccountId,
    onClearAll,
  ]);

  const [statusVenda, setStatusVenda] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState("");
  const [origemVenda, setOrigemVenda] = useState("");

  const quickFilterItems = useMemo(
    () =>
      VENDAS_QUICK_FILTER_OPTIONS.map((option) => ({
        key: option.id,
        label: option.label,
        buttonLabel: resolverRotuloBotaoFiltroRapidoVendas(option.id) ?? option.label,
        icon: option.icon,
        iconTone: option.iconTone,
        active: listFilter === option.id,
        title: option.title,
        section: option.section,
        sectionLabel: VENDAS_QUICK_FILTER_SECTION_LABELS[option.section],
        onSelect: () => onListFilterChange?.(option.id),
      })),
    [listFilter, onListFilterChange],
  );

  const actions = (
    <>
      {showGerarRelatorio ? (
        <S7Button
          type="button"
          variant="secondary"
          size="sm"
          iconName="reports"
          className="vendas-filters-card__report-btn"
          disabled={gerarRelatorioDisabled}
          onClick={() => onGerarRelatorioClick?.()}
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
  );

  return (
    <S7SearchFiltersCard
      ref={ref}
      className="vendas-filters-card"
      layout="vendas"
      actions={actions}
      ariaLabel="Busca e filtros de vendas"
    >
      <div className="s7-search-filters-card__field s7-search-filters-card__field--period vendas-filters-card__field--period">
        <VendasPeriodRangePicker
          periodPreset={filters.periodPreset}
          startDate={filters.startDate}
          endDate={filters.endDate}
          onApply={applyPeriod}
          showFieldLabel={false}
        />
      </div>

      <div className="s7-search-filters-card__field s7-search-filters-card__field--search">
        <div className="products-catalog__search-wrap vendas-filters-card__search-wrap">
          <div className="products-catalog__search-field">
            <span className="products-catalog__search-icon" aria-hidden>
              <S7Icon name="search" size={15} strokeWidth={1.85} />
            </span>
            <S7Input
              label=""
              name="vendas-filters-search"
              value={searchInput}
              onChange={(e) => onSearchInputChange?.(e.target.value)}
              placeholder="Título, SKU ou número do anúncio"
              className="products-catalog__search-s7"
              inputClassName="products-catalog__search-input-field s7-search-filters-card__search-input-field"
              autoComplete="off"
              aria-label="Buscar vendas por título, SKU ou número do anúncio"
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

      <div className="s7-search-filters-card__field s7-search-filters-card__field--account">
        <S7AccountSelect
          id="vendas-filters-account"
          accounts={accounts}
          value={filters.marketplaceAccountId}
          onChange={setMarketplaceAccountId}
          disabled={!accountsReady}
          accountLabel={accountLabel}
        />
      </div>

      <div className="s7-search-filters-card__field s7-search-filters-card__field--quick">
        <S7QuickFiltersDropdown id="vendas-filters-quick" items={quickFilterItems} />
      </div>

      <div className="s7-search-filters-card__field s7-search-filters-card__field--clear">
        <S7ClearFiltersAction
          disabled={!hasActiveCatalogFilters}
          onClick={limparFiltrosCatalogo}
        />
      </div>

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

      <div className="vendas-filters-card__field vendas-filters-card__field--marketplace" hidden>
        <span className="vendas-filters-card__label">Marketplace</span>
        <div className="vendas-filters-card__marketplaces" role="group" aria-label="Marketplace">
          {getVendasMarketplaceOptionsForUi().map((m) => {
            const active = (m.id === "" && !filters.marketplace) || filters.marketplace === m.id;
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
    </S7SearchFiltersCard>
  );
});

export default VendasFiltersCard;
