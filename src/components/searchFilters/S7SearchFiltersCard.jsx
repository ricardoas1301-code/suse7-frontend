import { forwardRef } from "react";
import S7Icon from "../ui/S7Icon";
import "./S7SearchFiltersCard.css";

/**
 * Shell visual compartilhado — Busca e filtros (linha única permanente).
 * @param {{
 *   layout?: "vendas" | "catalog" | "produtos" | "concorrencia";
 *   actions?: import("react").ReactNode;
 *   children?: import("react").ReactNode;
 *   ariaLabel: string;
 *   className?: string;
 * }} props
 */
const S7SearchFiltersCard = forwardRef(function S7SearchFiltersCard(
  {
    layout = "catalog",
    actions = null,
    children = null,
    ariaLabel,
    className = "",
  },
  ref
) {
  return (
    <section
      ref={ref}
      className={[
        "s7-search-filters-card",
        "s7-search-filters-card--single-row",
        `s7-search-filters-card--layout-${layout}`,
        "s7-sticky-filters",
        "s7-catalog-filter-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel}
    >
      <div className="s7-search-filters-card__row">
        <div
          className="s7-search-filters-card__title-block s7-search-filters-card__title-block--icon-only"
          aria-label="Busca e filtros"
        >
          <span className="s7-search-filters-card__header-icon" aria-hidden>
            <S7Icon name="search" size={16} strokeWidth={1.85} />
          </span>
          <span className="s7-search-filters-card__sr-only">Busca e filtros</span>
        </div>

        <div className="s7-search-filters-card__fields">{children}</div>

        {actions ? <div className="s7-search-filters-card__actions">{actions}</div> : null}
      </div>
    </section>
  );
});

export default S7SearchFiltersCard;
