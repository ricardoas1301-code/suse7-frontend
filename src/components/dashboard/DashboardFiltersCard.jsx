// ======================================================================
// Card Busca e filtros — Dashboard (paridade visual com Vendas, escopo executivo).
// Período + Conta; estado via VendasFiltersContext (scope dashboard).
// ======================================================================

import { useMemo } from "react";
import S7Icon from "../ui/S7Icon";
import S7Button from "../ui/S7Button";
import { useVendasFilters } from "../../features/vendas/filters/VendasFiltersContext";
import VendasPeriodRangePicker from "../../features/vendas/filters/VendasPeriodRangePicker";
import "../../features/vendas/filters/VendasFiltersCard.css";
import "./DashboardFiltersCard.css";

/**
 * @param {{
 *   className?: string;
 *   accounts?: readonly Record<string, unknown>[];
 *   accountLabel: (account: Record<string, unknown>) => string;
 *   accountsReady?: boolean;
 * }} props
 */
export default function DashboardFiltersCard({
  className = "",
  accounts = [],
  accountLabel,
  accountsReady = true,
}) {
  const {
    filters,
    periodSummaryLabel,
    toggleExpanded,
    applyPeriod,
    setMarketplaceAccountId,
  } = useVendasFilters();

  const expanded = filters.expanded;

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

    return parts.filter(Boolean).join(" · ");
  }, [periodSummaryLabel, filters.marketplaceAccountId, accounts, accountLabel]);

  return (
    <section
      className={[
        "vendas-filters-card",
        "dashboard-filters-card",
        "s7-catalog-filter-card",
        expanded ? "vendas-filters-card--expanded" : "vendas-filters-card--collapsed",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Busca e filtros do Dashboard"
    >
      <button
        type="button"
        className="vendas-filters-card__header"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls="dashboard-filters-card-panel"
      >
        <span className="vendas-filters-card__header-main">
          <span className="vendas-filters-card__header-icon" aria-hidden>
            <S7Icon name="search" size={18} strokeWidth={1.85} />
          </span>
          <span className="vendas-filters-card__header-text">
            <span className="vendas-filters-card__title">Busca e filtros</span>
            {!expanded ? (
              <span className="vendas-filters-card__summary">{collapsedSummary}</span>
            ) : null}
          </span>
        </span>
        <span className="vendas-filters-card__header-actions">
          <S7Button
            type="button"
            variant="secondary"
            size="sm"
            iconName="reports"
            className="vendas-filters-card__report-btn"
            disabled
            title="Relatório do Dashboard em breve"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Gerar relatório
          </S7Button>
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

      <div id="dashboard-filters-card-panel" className="vendas-filters-card__collapse" aria-hidden={!expanded}>
        <div className="vendas-filters-card__body">
          <div className="vendas-filters-card__row vendas-filters-card__row--primary dashboard-filters-card__row--executive">
            <div className="vendas-filters-card__field vendas-filters-card__field--period">
              <VendasPeriodRangePicker
                periodPreset={filters.periodPreset}
                startDate={filters.startDate}
                endDate={filters.endDate}
                onApply={applyPeriod}
              />
            </div>

            <div className="vendas-filters-card__selects">
              <div className="vendas-filters-card__field vendas-filters-card__field--account">
                <label className="vendas-filters-card__label" htmlFor="dashboard-filters-account">
                  Conta
                </label>
                <select
                  id="dashboard-filters-account"
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
