// ======================================================================
// Top 10 — bloco do Dashboard / Vendas com filtros inline (período + conta).
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { fetchMercadoLivreMarketplaceAccounts } from "../../services/marketplaceAccountsApi";
import { useDashboardBlockFilters } from "./DashboardBlockFiltersContext.jsx";
import { useDashboardScope } from "./useDashboardScope.js";
import S7BlockFiltersPanel from "./S7BlockFiltersPanel.jsx";
import S7DashboardSectionPanel from "./S7DashboardSectionPanel.jsx";
import VendasExecutivePanelSection from "../sales/VendasExecutivePanelSection";
import S7SectionJumpButton from "../ui/S7SectionJumpButton.jsx";
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
 * @param {{
 *   className?: string;
 *   sectionJumpDownTargetRef?: import("react").RefObject<Element | null>;
 *   sectionJumpDownAriaLabel?: string;
 * }} props
 */
export default function S7Top10BlockSection({
  className = "",
  sectionJumpDownTargetRef = null,
  sectionJumpDownAriaLabel = "Ir para busca e filtros",
}) {
  const scope = useDashboardScope();
  const { top10Filters, applyTop10Period, setTop10AccountId } = useDashboardBlockFilters();

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

  const top10ExecutiveParams = useMemo(
    () => scope.top10.executiveParams,
    [scope.top10.executiveParams],
  );

  const top10DateLabel = useMemo(() => {
    const raw = scope.top10.top10DateLabel;
    if (!raw) return "";
    return String(raw).replace(/\s[–→]\s/g, " | ");
  }, [scope.top10.top10DateLabel]);

  const filterPanel = (
    <S7BlockFiltersPanel
      idPrefix="s7-top10"
      expanded={false}
      layout="inline"
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
  );

  return (
    <section className={["s7-top10-block", className].filter(Boolean).join(" ")} aria-label="Top 10">
      <S7DashboardSectionPanel>
        <header className="s7-top10-block__head s7-dashboard-block-head s7-dashboard-block-head--inline-filters">
          <div className="s7-dashboard-block-head__title-row s7-dashboard-block-head__title-row--with-filters">
            <h2 className="s7-top10-block__title">Top 10</h2>
            <div className="s7-dashboard-block-head__inline-filters">{filterPanel}</div>
          </div>
          {scope.top10.top10ChipLabel || top10DateLabel || sectionJumpDownTargetRef ? (
            <div
              className={[
                "s7-dashboard-block-head__period-aside",
                sectionJumpDownTargetRef ? "s7-dashboard-block-head__period-aside--with-jump" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label="Período dos Top 10"
            >
              {sectionJumpDownTargetRef ? (
                <S7SectionJumpButton
                  direction="down"
                  targetRef={sectionJumpDownTargetRef}
                  ariaLabel={sectionJumpDownAriaLabel}
                />
              ) : null}
              {scope.top10.top10ChipLabel || top10DateLabel ? (
                <div className="s7-dashboard-block-head__period-aside-copy">
                  {scope.top10.top10ChipLabel ? (
                    <span className="s7-daily-summary__period-chip">{scope.top10.top10ChipLabel}</span>
                  ) : null}
                  {top10DateLabel ? (
                    <span className="s7-top10-block__period-date s7-daily-summary__period-range">
                      {top10DateLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </header>

        <VendasExecutivePanelSection
          className="dashboard-page__executive-kpis"
          tituloExternoTop10
          executiveParamsOverride={top10ExecutiveParams}
          executivePeriodLabelOverride={scope.top10.top10PeriodLabel}
        />
      </S7DashboardSectionPanel>
    </section>
  );
}
