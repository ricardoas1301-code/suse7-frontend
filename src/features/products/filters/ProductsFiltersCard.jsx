// ======================================================================
// Card premium de busca e filtros — página Produtos (linha única permanente).
// ======================================================================

import { forwardRef, useMemo } from "react";
import S7Icon from "../../../components/ui/S7Icon";
import S7Input from "../../../components/ui/S7Input";
import S7Button from "../../../components/ui/S7Button";
import S7SectionJumpButton from "../../../components/ui/S7SectionJumpButton.jsx";
import { S7ClearFiltersAction, S7QuickFiltersDropdown, S7SearchFiltersCard, S7SelectionCounter } from "../../../components/searchFilters";
import {
  PRODUCTS_QUICK_FILTER_OPTIONS,
  PRODUCTS_QUICK_FILTER_SECTION_LABELS,
} from "./productsQuickFiltersConfig.js";
import { normalizarIdFiltroRapidoProdutos } from "../domain/productHealthListClassifiers.js";
import { PRODUCTS_QUICK_FILTER_NEUTRAL_ID } from "../domain/productHealthConstants.js";
import "./ProductsFiltersCard.css";

/**
 * @param {{
 *   listFilter?: string;
 *   onListFilterChange?: (filterId: string) => void;
 *   searchInput?: string;
 *   onSearchInputChange?: (value: string) => void;
 *   onClearAll?: () => void;
 *   hasActiveFilters?: boolean;
 *   onNewProductClick?: () => void;
 *   showRelatorios?: boolean;
 *   relatoriosDisabled?: boolean;
 *   onRelatoriosClick?: () => void;
 *   selectedCount?: number;
 *   sectionJumpUpTargetRef?: import("react").RefObject<Element | null>;
 *   sectionJumpUpAriaLabel?: string;
 * }} props
 */
const ProductsFiltersCard = forwardRef(function ProductsFiltersCard(
  {
    listFilter = PRODUCTS_QUICK_FILTER_NEUTRAL_ID,
    onListFilterChange,
    searchInput = "",
    onSearchInputChange,
    onClearAll,
    hasActiveFilters = false,
    onNewProductClick,
    showRelatorios = false,
    relatoriosDisabled = false,
    onRelatoriosClick,
    selectedCount = 0,
    sectionJumpUpTargetRef = null,
    sectionJumpUpAriaLabel = "Voltar para o resumo da página",
  },
  ref,
) {
  const normalizedListFilter = useMemo(
    () => normalizarIdFiltroRapidoProdutos(listFilter),
    [listFilter],
  );

  const quickFilterItems = useMemo(
    () =>
      PRODUCTS_QUICK_FILTER_OPTIONS.map((option) => ({
        key: option.id,
        label: option.label,
        icon: option.icon,
        iconTone: option.iconTone,
        active: normalizedListFilter === option.id,
        title: option.title,
        section: option.section,
        sectionLabel: PRODUCTS_QUICK_FILTER_SECTION_LABELS[option.section],
        onSelect: () => onListFilterChange?.(option.id),
      })),
    [normalizedListFilter, onListFilterChange],
  );

  const actions = (
    <>
      {onNewProductClick ? (
        <S7Button
          type="button"
          variant="primary"
          size="sm"
          iconName="plus"
          className="products-filters-card__new-product-btn"
          onClick={() => onNewProductClick()}
        >
          Novo produto
        </S7Button>
      ) : null}
      {showRelatorios ? (
        <S7Button
          type="button"
          variant="secondary"
          size="sm"
          iconName="reports"
          className="products-filters-card__report-btn"
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
      className="products-filters-card"
      layout="produtos"
      actions={actions}
      ariaLabel="Busca e filtros de produtos"
    >
      <div className="s7-search-filters-card__field s7-search-filters-card__field--search">
        <div className="products-catalog__search-wrap products-filters-card__search-wrap">
          <div className="products-catalog__search-field">
            <span className="products-catalog__search-icon" aria-hidden>
              <S7Icon name="search" size={15} strokeWidth={1.85} />
            </span>
            <S7Input
              label=""
              name="products-filters-search"
              value={searchInput}
              onChange={(e) => onSearchInputChange?.(e.target.value)}
              placeholder="Nome, SKU, EAN, marca ou modelo"
              className="products-catalog__search-s7"
              inputClassName="products-catalog__search-input-field s7-search-filters-card__search-input-field"
              autoComplete="off"
              aria-label="Buscar produtos por nome, SKU, EAN, marca ou modelo"
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

      <div className="s7-search-filters-card__field s7-search-filters-card__field--quick">
        <S7QuickFiltersDropdown id="products-filters-quick" items={quickFilterItems} />
      </div>

      <div className="s7-search-filters-card__field s7-search-filters-card__field--clear">
        <S7ClearFiltersAction disabled={!hasActiveFilters} onClick={() => onClearAll?.()} />
      </div>

      {selectedCount > 0 ? (
        <div className="s7-search-filters-card__field s7-search-filters-card__field--selection">
          <S7SelectionCounter
            count={selectedCount}
            singularLabel="produto selecionado"
            pluralLabel="produtos selecionados"
          />
        </div>
      ) : null}
    </S7SearchFiltersCard>
  );
});

export default ProductsFiltersCard;
