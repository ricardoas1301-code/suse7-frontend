// ======================================================================
// Card premium de busca e filtros — página Concorrência (linha única permanente).
// ======================================================================

import { forwardRef, useMemo } from "react";
import S7Icon from "../../../components/ui/S7Icon";
import S7Input from "../../../components/ui/S7Input";
import S7Button from "../../../components/ui/S7Button";
import S7SectionJumpButton from "../../../components/ui/S7SectionJumpButton.jsx";
import {
  CONCORRENCIA_MARKETPLACE_OPTIONS,
  rotuloContaMercadoLivre,
} from "./concorrenciaFiltersConstants";
import {
  S7_OPERATIONAL_DEFAULT_SORT_ID,
  S7_OPERATIONAL_SORT_TOP_SALES_CHIP,
} from "../../../utils/s7OperationalListSort.js";
import {
  CONCORRENCIA_QUICK_FILTER_OPTIONS,
  CONCORRENCIA_QUICK_FILTER_SECTION_LABELS,
} from "./competitionQuickFiltersConfig.js";
import {
  S7AccountSelect,
  S7ClearFiltersAction,
  S7QuickFiltersDropdown,
  S7SearchFiltersCard,
  S7SelectionCounter,
} from "../../../components/searchFilters";
import "./ConcorrenciaFiltersCard.css";

/**
 * @param {{
 *   accounts?: readonly Record<string, unknown>[];
 *   accountsReady?: boolean;
 *   accountId?: string;
 *   onAccountIdChange?: (value: string) => void;
 *   marketplaceId?: string;
 *   onMarketplaceIdChange?: (value: string) => void;
 *   listFilter?: string;
 *   onListFilterChange?: (filterId: string) => void;
 *   listSortId?: string;
 *   onListSortChange?: (sortId: string) => void;
 *   searchInput?: string;
 *   onSearchInputChange?: (value: string) => void;
 *   onClearAll?: () => void;
 *   hasActiveFilters?: boolean;
 *   showRelatorios?: boolean;
 *   relatoriosDisabled?: boolean;
 *   onRelatoriosClick?: () => void;
 *   onIncluirAnuncioClick?: () => void;
 *   selectedCount?: number;
 *   sectionJumpUpTargetRef?: import("react").RefObject<Element | null>;
 *   sectionJumpUpAriaLabel?: string;
 * }} props
 */
const ConcorrenciaFiltersCard = forwardRef(function ConcorrenciaFiltersCard(
  {
    accounts = [],
    accountsReady = true,
    accountId = "",
    onAccountIdChange,
    marketplaceId = "",
    onMarketplaceIdChange,
    listFilter = "all",
    onListFilterChange,
    listSortId = S7_OPERATIONAL_DEFAULT_SORT_ID,
    onListSortChange,
    searchInput = "",
    onSearchInputChange,
    onClearAll,
    hasActiveFilters = false,
    showRelatorios = false,
    relatoriosDisabled = false,
    onRelatoriosClick,
    onIncluirAnuncioClick,
    selectedCount = 0,
    sectionJumpUpTargetRef = null,
    sectionJumpUpAriaLabel = "Voltar para o resumo da página",
  },
  ref,
) {
  const quickFilterItems = useMemo(
    () =>
      CONCORRENCIA_QUICK_FILTER_OPTIONS.map((option) => {
        const isSort = option.kind === "sort";
        const active = isSort
          ? listSortId === S7_OPERATIONAL_SORT_TOP_SALES_CHIP.id && listFilter === "all"
          : listFilter === option.id;

        return {
          key: option.id,
          label: option.label,
          icon: option.icon,
          iconTone: option.iconTone,
          active,
          title: option.title,
          section: option.section,
          sectionLabel: CONCORRENCIA_QUICK_FILTER_SECTION_LABELS[option.section],
          onSelect: () => {
            if (isSort) {
              onListSortChange?.(S7_OPERATIONAL_DEFAULT_SORT_ID);
              return;
            }
            onListFilterChange?.(option.id);
          },
        };
      }),
    [listFilter, listSortId, onListFilterChange, onListSortChange],
  );

  const actions = (
    <>
      {onIncluirAnuncioClick ? (
        <S7Button
          type="button"
          variant="primary"
          size="sm"
          className="concorrencia-filters-card__include-btn"
          onClick={() => onIncluirAnuncioClick()}
        >
          Incluir anúncio para monitoramento
        </S7Button>
      ) : null}
      {showRelatorios ? (
        <S7Button
          type="button"
          variant="secondary"
          size="sm"
          iconName="reports"
          className="concorrencia-filters-card__report-btn"
          disabled={relatoriosDisabled}
          onClick={() => onRelatoriosClick?.()}
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
      className="concorrencia-filters-card"
      layout="concorrencia"
      actions={actions}
      ariaLabel="Busca e filtros de concorrência"
    >
      <div className="s7-search-filters-card__field s7-search-filters-card__field--search">
        <div className="products-catalog__search-wrap concorrencia-filters-card__search-wrap">
          <div className="products-catalog__search-field">
            <span className="products-catalog__search-icon" aria-hidden>
              <S7Icon name="search" size={15} strokeWidth={1.85} />
            </span>
            <S7Input
              label=""
              name="concorrencia-filters-search"
              value={searchInput}
              onChange={(e) => onSearchInputChange?.(e.target.value)}
              placeholder="Título, SKU ou número do anúncio"
              className="products-catalog__search-s7"
              inputClassName="products-catalog__search-input-field s7-search-filters-card__search-input-field"
              autoComplete="off"
              aria-label="Buscar por título, SKU ou número do anúncio"
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
          id="concorrencia-filters-account"
          accounts={accounts}
          value={accountId}
          onChange={onAccountIdChange}
          disabled={!accountsReady}
          accountLabel={rotuloContaMercadoLivre}
        />
      </div>

      <div className="s7-search-filters-card__field s7-search-filters-card__field--quick">
        <S7QuickFiltersDropdown id="concorrencia-filters-quick" items={quickFilterItems} />
      </div>

      <div className="s7-search-filters-card__field s7-search-filters-card__field--clear">
        <S7ClearFiltersAction disabled={!hasActiveFilters} onClick={() => onClearAll?.()} />
      </div>

      {selectedCount > 0 ? (
        <div className="s7-search-filters-card__field s7-search-filters-card__field--selection">
          <S7SelectionCounter
            count={selectedCount}
            singularLabel="anúncio selecionado"
            pluralLabel="anúncios selecionados"
          />
        </div>
      ) : null}

      <div className="concorrencia-filters-card__field concorrencia-filters-card__field--hidden" aria-hidden hidden>
        <label className="concorrencia-filters-card__label" htmlFor="concorrencia-filters-marketplace">
          Marketplace
        </label>
        <select
          id="concorrencia-filters-marketplace"
          className="concorrencia-filters-card__select"
          value={marketplaceId}
          tabIndex={-1}
          onChange={(e) => onMarketplaceIdChange?.(e.target.value)}
        >
          {CONCORRENCIA_MARKETPLACE_OPTIONS.map((m) => (
            <option key={m.id || "all"} value={m.id} disabled={!m.enabled}>
              {m.label}
              {!m.enabled ? " (em breve)" : ""}
            </option>
          ))}
        </select>
      </div>
    </S7SearchFiltersCard>
  );
});

export default ConcorrenciaFiltersCard;
