// ======================================================================
// Card premium de busca e filtros — página Concorrência (padrão Vendas).
// Somente apresentação; filtros de conta/marketplace aplicados no frontend.
// ======================================================================

import { forwardRef, useCallback, useMemo, useState } from "react";
import S7Icon from "../../../components/ui/S7Icon";
import S7Input from "../../../components/ui/S7Input";
import S7Button from "../../../components/ui/S7Button";
import {
  CONCORRENCIA_FILTERS_EXPANDED_SESSION_KEY,
  CONCORRENCIA_MARKETPLACE_OPTIONS,
  rotuloContaMercadoLivre,
} from "./concorrenciaFiltersConstants";
import { formatConcorrenciaSelectionCountLabel } from "../selection/formatConcorrenciaSelectionCountLabel.js";
import "./ConcorrenciaFiltersCard.css";

function readExpandedFromSession() {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(CONCORRENCIA_FILTERS_EXPANDED_SESSION_KEY);
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
    window.sessionStorage.setItem(CONCORRENCIA_FILTERS_EXPANDED_SESSION_KEY, expanded ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/**
 * @param {{
 *   accounts?: readonly Record<string, unknown>[];
 *   accountsReady?: boolean;
 *   accountId?: string;
 *   onAccountIdChange?: (value: string) => void;
 *   marketplaceId?: string;
 *   onMarketplaceIdChange?: (value: string) => void;
 *   filterChips?: readonly {
 *     id: string;
 *     label: string;
 *     icon: string;
 *     iconTone: string;
 *   }[];
 *   listFilter?: string;
 *   onListFilterChange?: (filterId: string) => void;
 *   searchInput?: string;
 *   onSearchInputChange?: (value: string) => void;
 *   onClearAll?: () => void;
 *   hasActiveFilters?: boolean;
 *   showRelatorios?: boolean;
 *   relatoriosDisabled?: boolean;
 *   onRelatoriosClick?: () => void;
 *   onIncluirAnuncioClick?: () => void;
 *   selectedCount?: number;
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
  filterChips = [],
  listFilter = "all",
  onListFilterChange,
  searchInput = "",
  onSearchInputChange,
  onClearAll,
  hasActiveFilters = false,
  showRelatorios = false,
  relatoriosDisabled = false,
  onRelatoriosClick,
  onIncluirAnuncioClick,
  selectedCount = 0,
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

    const selectedAccountId = String(accountId ?? "").trim();
    if (selectedAccountId) {
      const account = accounts.find((a) => (a?.id != null ? String(a.id).trim() : "") === selectedAccountId);
      parts.push(`Conta: ${account ? rotuloContaMercadoLivre(account) : "Conta selecionada"}`);
    } else {
      parts.push("Todas as contas");
    }

    const activeChip = filterChips.find((c) => c.id === listFilter);
    parts.push(`Filtro: ${activeChip?.label ?? "Todos"}`);

    const query = String(searchInput ?? "").trim();
    if (query) parts.push(`Busca: "${query}"`);

    return parts.filter(Boolean).join(" · ");
  }, [accountId, accounts, filterChips, listFilter, searchInput]);

  return (
    <section
      ref={ref}
      className={[
        "concorrencia-filters-card",
        "s7-sticky-filters",
        "s7-catalog-filter-card",
        expanded ? "concorrencia-filters-card--expanded" : "concorrencia-filters-card--collapsed",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Busca e filtros de concorrência"
    >
      <button
        type="button"
        className="concorrencia-filters-card__header"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls="concorrencia-filters-card-panel"
      >
        <span className="concorrencia-filters-card__header-main">
          <span className="concorrencia-filters-card__header-icon" aria-hidden>
            <S7Icon name="search" size={18} strokeWidth={1.85} />
          </span>
          <span className="concorrencia-filters-card__header-text">
            <span className="concorrencia-filters-card__title">Busca e filtros</span>
            {!expanded ? (
              <span className="concorrencia-filters-card__summary">
                {collapsedSummary}
                {selectedCount > 0 ? (
                  <>
                    {" · "}
                    <span className="concorrencia-filters-card__summary-selected">
                      {formatConcorrenciaSelectionCountLabel(selectedCount)}
                    </span>
                  </>
                ) : null}
              </span>
            ) : null}
          </span>
        </span>
        <span className="concorrencia-filters-card__header-actions">
          {expanded && selectedCount > 0 ? (
            <span className="concorrencia-filters-card__header-selected">
              {formatConcorrenciaSelectionCountLabel(selectedCount)}
            </span>
          ) : null}
          {onIncluirAnuncioClick ? (
            <S7Button
              type="button"
              variant="primary"
              size="sm"
              className="concorrencia-filters-card__include-btn"
              title="Incluir anúncio para monitoramento"
              onClick={(e) => {
                e.stopPropagation();
                onIncluirAnuncioClick();
              }}
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
              title="Gerar relatório com os filtros atuais"
              onClick={(e) => {
                e.stopPropagation();
                onRelatoriosClick?.();
              }}
            >
              Relatórios
            </S7Button>
          ) : null}
          <span
            className={[
              "concorrencia-filters-card__chevron",
              expanded ? "concorrencia-filters-card__chevron--open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden
          >
            <S7Icon name="chevron_down" size={18} strokeWidth={2} />
          </span>
        </span>
      </button>

      <div
        id="concorrencia-filters-card-panel"
        className="concorrencia-filters-card__collapse"
        aria-hidden={!expanded}
      >
        <div className="concorrencia-filters-card__body">
          <div className="concorrencia-filters-card__row concorrencia-filters-card__row--search-account">
            <div className="concorrencia-filters-card__field concorrencia-filters-card__field--search">
              <label className="concorrencia-filters-card__label" htmlFor="concorrencia-filters-search">
                Buscar
              </label>
              <div className="products-catalog__search-wrap concorrencia-filters-card__search-wrap">
                <div className="products-catalog__search-field">
                  <span className="products-catalog__search-icon" aria-hidden>
                    <S7Icon name="search" size={18} strokeWidth={1.85} />
                  </span>
                  <S7Input
                    label=""
                    name="concorrencia-filters-search"
                    value={searchInput}
                    onChange={(e) => onSearchInputChange?.(e.target.value)}
                    placeholder="Buscar por nome ou SKU"
                    className="products-catalog__search-s7"
                    inputClassName="products-catalog__search-input-field"
                    autoComplete="off"
                    aria-label="Buscar produtos por nome ou SKU"
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

            <div className="concorrencia-filters-card__field concorrencia-filters-card__field--account">
              <label className="concorrencia-filters-card__label" htmlFor="concorrencia-filters-account">
                Conta
              </label>
              <select
                id="concorrencia-filters-account"
                className="concorrencia-filters-card__select"
                value={accountId}
                disabled={!accountsReady}
                onChange={(e) => onAccountIdChange?.(e.target.value)}
              >
                <option value="">Todas as contas</option>
                {accounts.map((a) => {
                  const id = a.id != null ? String(a.id).trim() : "";
                  if (!id) return null;
                  return (
                    <option key={id} value={id}>
                      {rotuloContaMercadoLivre(a)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Marketplace — oculto na UI; estado e handlers preservados para uso futuro */}
            <div
              className="concorrencia-filters-card__field concorrencia-filters-card__field--marketplace concorrencia-filters-card__field--hidden"
              aria-hidden
              hidden
            >
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
          </div>

          <div className="concorrencia-filters-card__row concorrencia-filters-card__row--chips">
            <span className="concorrencia-filters-card__label">Filtros rápidos</span>
            <div className="concorrencia-filters-card__chip-row" role="toolbar" aria-label="Filtros de concorrência">
              {filterChips
                .filter((c) => c.id !== "all")
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`products-catalog__filter-chip ${listFilter === c.id ? "products-catalog__filter-chip--active" : ""}`}
                    aria-pressed={listFilter === c.id}
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
                disabled={!hasActiveFilters}
                title="Remove os filtros aplicados"
                onClick={() => onClearAll?.()}
              >
                <S7Icon
                  name="filter_clear"
                  size={14}
                  strokeWidth={1.75}
                  className="products-catalog__filter-clear-icon"
                />
                <span>Limpar filtros</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default ConcorrenciaFiltersCard;
