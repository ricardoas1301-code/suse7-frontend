// ======================================================================
// Top 10 — bloco do Dashboard com filtros próprios (período + conta).
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { fetchMercadoLivreMarketplaceAccounts } from "../../services/marketplaceAccountsApi";
import { useDashboardBlockFilters } from "./DashboardBlockFiltersContext.jsx";
import { useDashboardScope } from "./useDashboardScope.js";
import S7BlockFiltersPanel from "./S7BlockFiltersPanel.jsx";
import S7Icon from "../ui/S7Icon";
import VendasExecutivePanelSection from "../sales/VendasExecutivePanelSection";
import "./S7BlockFiltersPanel.css";

/** @param {Record<string, unknown> | null | undefined} a */
function dashboardMlAccountLabel(a) {
  if (!a || typeof a !== "object") return "Conta";
  if (a.ml_nickname != null && String(a.ml_nickname).trim() !== "") return String(a.ml_nickname).trim();
  if (a.account_alias != null && String(a.account_alias).trim() !== "") return String(a.account_alias).trim();
  if (a.external_seller_id != null) return String(a.external_seller_id);
  return "Conta";
}

/**
 * @param {{ className?: string }} props
 */
export default function S7Top10BlockSection({ className = "" }) {
  const scope = useDashboardScope();
  const {
    top10Filters,
    top10FiltersExpanded,
    top10PeriodTouched,
    applyTop10Period,
    setTop10AccountId,
    toggleTop10FiltersExpanded,
  } = useDashboardBlockFilters();

  const [mlAccounts, setMlAccounts] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [mlAccountsReady, setMlAccountsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchMercadoLivreMarketplaceAccounts();
      if (cancelled) return;
      setMlAccountsReady(true);
      const list =
        res.ok && Array.isArray(res.data?.accounts) ? /** @type {Record<string, unknown>[]} */ (res.data.accounts) : [];
      setMlAccounts(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtersActive = useMemo(
    () =>
      top10PeriodTouched || Boolean(String(top10Filters.marketplaceAccountId ?? "").trim()),
    [top10PeriodTouched, top10Filters.marketplaceAccountId],
  );

  const top10ExecutiveParams = useMemo(
    () => scope.top10.executiveParams,
    [scope.top10.executiveParams],
  );

  const handleTop10HeaderToggle = () => {
    toggleTop10FiltersExpanded();
  };

  /** @param {import("react").KeyboardEvent<HTMLElement>} event */
  const handleTop10HeaderKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleTop10FiltersExpanded();
    }
  };

  return (
    <section className={["s7-top10-block", className].filter(Boolean).join(" ")} aria-label="Top 10">
      <div className="s7-top10-block__shell">
        <header
          className="s7-top10-block__head s7-dashboard-block-head s7-dashboard-block-head--clickable"
          onClick={handleTop10HeaderToggle}
          onKeyDown={handleTop10HeaderKeyDown}
          role="button"
          tabIndex={0}
          aria-expanded={top10FiltersExpanded}
          aria-controls="s7-top10-filters-panel"
        >
          <div className="s7-dashboard-block-head__title-row">
            <button
              type="button"
              className={[
                "s7-block-filter-toggle",
                top10FiltersExpanded || filtersActive ? "s7-block-filter-toggle--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-expanded={top10FiltersExpanded}
              aria-controls="s7-top10-filters-panel"
              aria-label={top10FiltersExpanded ? "Recolher filtros dos Top 10" : "Expandir filtros dos Top 10"}
              onClick={(event) => {
                event.stopPropagation();
                toggleTop10FiltersExpanded();
              }}
            >
              <S7Icon name="search" size={18} strokeWidth={1.85} />
            </button>
            <h2 className="s7-top10-block__title">Top 10</h2>
          </div>
          <div className="s7-dashboard-block-head__period-aside" aria-label="Período dos Top 10">
            <span className="s7-top10-block__period-label">{scope.top10.top10PeriodLabel || "Período"}</span>
            {scope.top10.top10ChipLabel ? (
              <span className="s7-top10-block__period-preset">{scope.top10.top10ChipLabel}</span>
            ) : null}
            {scope.top10.top10DateLabel ? (
              <span className="s7-top10-block__period-date">{scope.top10.top10DateLabel}</span>
            ) : null}
          </div>
        </header>

        <S7BlockFiltersPanel
          idPrefix="s7-top10"
          expanded={top10FiltersExpanded}
          periodPreset={top10Filters.periodPreset}
          startDate={top10Filters.startDate}
          endDate={top10Filters.endDate}
          marketplaceAccountId={top10Filters.marketplaceAccountId}
          accounts={mlAccounts}
          accountLabel={dashboardMlAccountLabel}
          accountsReady={mlAccountsReady}
          onApplyPeriod={applyTop10Period}
          onAccountChange={setTop10AccountId}
        />
      </div>

      <VendasExecutivePanelSection
        className="dashboard-page__executive-kpis"
        tituloExternoTop10
        executiveParamsOverride={top10ExecutiveParams}
        executivePeriodLabelOverride={scope.top10.top10PeriodLabel}
      />
    </section>
  );
}
