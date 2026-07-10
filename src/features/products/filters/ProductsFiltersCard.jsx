// ======================================================================
// Card premium de busca e filtros — página Produtos (padrão Concorrência).
// Somente apresentação; filtros aplicados no catálogo existente.
// ======================================================================

import { forwardRef, useCallback, useMemo, useState } from "react";
import S7Icon from "../../../components/ui/S7Icon";
import S7Input from "../../../components/ui/S7Input";
import S7Button from "../../../components/ui/S7Button";
import S7SectionJumpButton from "../../../components/ui/S7SectionJumpButton.jsx";
import { PRODUCTS_FILTERS_EXPANDED_SESSION_KEY } from "./productsFiltersConstants";
import { formatCatalogSelectionCountLabel } from "../../../utils/formatCatalogSelectionCountLabel.js";
import "./ProductsFiltersCard.css";

function readExpandedFromSession() {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(PRODUCTS_FILTERS_EXPANDED_SESSION_KEY);
    if (raw === "0") return false;
    if (raw === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

function writeExpandedToSession(expanded) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PRODUCTS_FILTERS_EXPANDED_SESSION_KEY, expanded ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/**
 * @param {{
 *   filterChips?: readonly {
 *     id: string;
 *     label: string;
 *     icon: string;
 *     iconTone: string;
 *     enabled?: boolean;
 *     description?: string;
 *     phase?: number;
 *   }[];
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
    filterChips = [],
    listFilter = "all",
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
  const [expanded, setExpanded] = useState(readExpandedFromSession);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      writeExpandedToSession(next);
      return next;
    });
  }, []);

  const collapsedSummary = useMemo(() => {
    const parts = [];
    const activeChip = filterChips.find((c) => c.id === listFilter);
    parts.push(`Filtro: ${activeChip?.label ?? "Todos"}`);

    const query = String(searchInput ?? "").trim();
    if (query) parts.push(`Busca: "${query}"`);

    return parts.filter(Boolean).join(" · ");
  }, [filterChips, listFilter, searchInput]);

  return (
    <section
      ref={ref}
      className={[
        "products-filters-card",
        "s7-sticky-filters",
        "s7-catalog-filter-card",
        expanded ? "products-filters-card--expanded" : "products-filters-card--collapsed",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Busca e filtros de produtos"
    >
      <div className="products-filters-card__header">
        <button
          type="button"
          className="products-filters-card__header-toggle"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-controls="products-filters-card-panel"
        >
          <span className="products-filters-card__header-main">
            <span className="products-filters-card__header-icon" aria-hidden>
              <S7Icon name="search" size={18} strokeWidth={1.85} />
            </span>
            <span className="products-filters-card__header-text">
              <span className="products-filters-card__title">Busca e filtros</span>
              {!expanded ? (
                <span className="products-filters-card__summary">
                  {collapsedSummary}
                  {selectedCount > 0 ? (
                    <>
                      {" · "}
                      <span className="products-filters-card__summary-selected">
                        {formatCatalogSelectionCountLabel(selectedCount)}
                      </span>
                    </>
                  ) : null}
                </span>
              ) : null}
            </span>
          </span>
        </button>
        <div className="products-filters-card__header-actions">
          {sectionJumpUpTargetRef ? (
            <S7SectionJumpButton
              direction="up"
              targetRef={sectionJumpUpTargetRef}
              ariaLabel={sectionJumpUpAriaLabel}
            />
          ) : null}
          {expanded && selectedCount > 0 ? (
            <span className="products-filters-card__header-selected">
              {formatCatalogSelectionCountLabel(selectedCount)}
            </span>
          ) : null}
          {onNewProductClick ? (
            <S7Button
              type="button"
              variant="primary"
              size="sm"
              iconName="plus"
              className="products-filters-card__new-product-btn"
              title="Cadastrar novo produto"
              onClick={onNewProductClick}
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
              title="Gerar relatório com os filtros atuais"
              onClick={() => onRelatoriosClick?.()}
            >
              Gerar relatório
            </S7Button>
          ) : null}
          <button
            type="button"
            className="products-filters-card__chevron-btn"
            aria-label={expanded ? "Recolher filtros" : "Expandir filtros"}
            onClick={toggleExpanded}
          >
            <span
              className={[
                "products-filters-card__chevron",
                expanded ? "products-filters-card__chevron--open" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden
            >
              <S7Icon name="chevron_down" size={18} strokeWidth={2} />
            </span>
          </button>
        </div>
      </div>

      <div id="products-filters-card-panel" className="products-filters-card__collapse" aria-hidden={!expanded}>
        <div className="products-filters-card__body">
          <div className="products-filters-card__row products-filters-card__row--search">
            <div className="products-filters-card__field products-filters-card__field--search">
              <label className="products-filters-card__label" htmlFor="products-filters-search">
                Buscar
              </label>
              <div className="products-catalog__search-wrap products-filters-card__search-wrap">
                <div className="products-catalog__search-field">
                  <span className="products-catalog__search-icon" aria-hidden>
                    <S7Icon name="search" size={18} strokeWidth={1.85} />
                  </span>
                  <S7Input
                    label=""
                    name="products-filters-search"
                    value={searchInput}
                    onChange={(e) => onSearchInputChange?.(e.target.value)}
                    placeholder="Buscar por nome, SKU, EAN, marca ou modelo"
                    className="products-catalog__search-s7"
                    inputClassName="products-catalog__search-input-field"
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
          </div>

          <div className="products-filters-card__row products-filters-card__row--chips">
            <span className="products-filters-card__label">Filtros rápidos</span>
            <div className="products-filters-card__chip-row" role="toolbar" aria-label="Filtros do catálogo de produtos">
              {filterChips.map((def) => {
                const isActive = listFilter === def.id;
                const chipTitle = def.enabled ? def.description : `${def.description} Em breve.`;
                return (
                  <button
                    key={def.id}
                    type="button"
                    className={`products-catalog__filter-chip${isActive ? " products-catalog__filter-chip--active" : ""}${def.enabled ? "" : " products-catalog__filter-chip--disabled"}`}
                    aria-pressed={def.enabled ? isActive : undefined}
                    disabled={!def.enabled}
                    title={chipTitle}
                    data-phase={def.phase}
                    onClick={() => {
                      if (!def.enabled) return;
                      onListFilterChange?.(def.id);
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
                disabled={!hasActiveFilters}
                title="Remove filtros e volta à listagem padrão"
                onClick={() => onClearAll?.()}
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

export default ProductsFiltersCard;
