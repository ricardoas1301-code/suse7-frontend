// ======================================================================
// Card premium de busca e filtros — página Vendas (P_2.2).
// ======================================================================

import S7Icon from "../../../components/ui/S7Icon";
import S7Input from "../../../components/ui/S7Input";
import { SALES_FILTER_CHIPS } from "../../../utils/salesToolbarFilters";
import { useVendasFilters } from "./VendasFiltersContext";
import { getVendasMarketplaceOptionsForUi } from "./vendasFiltersConstants";
import VendasPeriodRangePicker from "./VendasPeriodRangePicker";
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
 * }} props
 */
export default function VendasFiltersCard({
  accounts = [],
  accountLabel,
  accountsReady = true,
  listFilter = "all",
  onListFilterChange,
  searchInput = "",
  onSearchInputChange,
}) {
  const {
    filters,
    filtersSummaryLabel,
    toggleExpanded,
    applyPeriod,
    setMarketplace,
    setMarketplaceAccountId,
  } = useVendasFilters();

  const expanded = filters.expanded;

  return (
    <section
      className={[
        "vendas-filters-card",
        "s7-sticky-filters",
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
              <span className="vendas-filters-card__summary">{filtersSummaryLabel}</span>
            ) : null}
          </span>
        </span>
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

            <div className="vendas-filters-card__field vendas-filters-card__field--marketplace">
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
            <span className="vendas-filters-card__label">Filtros operacionais</span>
            <div className="vendas-filters-card__chip-row" role="toolbar" aria-label="Filtros de vendas">
              {SALES_FILTER_CHIPS.map((c) => (
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
            </div>
          </div>

          <div className="vendas-filters-card__row vendas-filters-card__row--search">
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
        </div>
      </div>
    </section>
  );
}
