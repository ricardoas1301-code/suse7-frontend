// ======================================================================
// Resumo Diário — seção do Dashboard com escopo automático (hoje vs filtro).
// DASH.4: dados reais via /api/sales/executive-summary (fonte única Suse7).
// DASH.6A/6B: composição executiva + impostos + multi-contas + filtro manual.
// DASH.6D: bloco Custos detalhado (somente apresentação — motor DASH.6C intacto).
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import S7DailySummaryCard from "./S7DailySummaryCard.jsx";
import S7DailySummaryAccountDistribution from "./S7DailySummaryAccountDistribution.jsx";
import S7DailySummaryTopProducts from "./S7DailySummaryTopProducts.jsx";
import S7BlockFiltersPanel from "./S7BlockFiltersPanel.jsx";
import { useDashboardBlockFilters } from "./DashboardBlockFiltersContext.jsx";
import { useDashboardScope } from "./useDashboardScope.js";
import { useAuthBootstrapReady } from "../../hooks/useAuthBootstrapReady.js";
import { useSalesExecutiveSummary } from "../../hooks/useSalesExecutiveSummary.js";
import { isExecutiveSummaryQueryEnabled } from "./dashboardScope.js";
import { isExecutiveSummaryEmptyForFilters } from "../sales/vendasExecutivePanelUx.js";
import { fetchMercadoLivreMarketplaceAccounts } from "../../services/marketplaceAccountsApi.js";
import {
  buildDailySummaryBlocks,
  buildDailySummaryPlaceholderBlocks,
} from "../../features/sales/executiveSummaryDisplay.js";
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
export default function S7DailySummarySection({ className = "" }) {
  const scope = useDashboardScope();
  const {
    dailySummaryFilters,
    dailySummaryPeriodTouched,
    dailySummaryFiltersExpanded,
    applyDailySummaryPeriod,
    setDailySummaryAccountId,
    toggleDailySummaryFiltersExpanded,
  } = useDashboardBlockFilters();

  const authReady = useAuthBootstrapReady();

  const { summary, topListingsByQuantity, distributionByAccount, loading, error } = useSalesExecutiveSummary(
    scope.resumo.resumoParams,
    {
      enabled: authReady && isExecutiveSummaryQueryEnabled(scope.resumo.resumoParams),
    },
  );
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

  const empty = useMemo(
    () => !loading && !error && isExecutiveSummaryEmptyForFilters(summary),
    [loading, error, summary],
  );

  const blocks = useMemo(() => {
    if (loading || error || empty) {
      return buildDailySummaryPlaceholderBlocks();
    }
    return buildDailySummaryBlocks(summary);
  }, [loading, error, summary, empty]);

  const filtersActive = useMemo(
    () =>
      dailySummaryPeriodTouched ||
      Boolean(String(dailySummaryFilters.marketplaceAccountId ?? "").trim()),
    [dailySummaryPeriodTouched, dailySummaryFilters.marketplaceAccountId],
  );

  const periodChipLabel = scope.resumo.resumoChipLabel;
  const periodDateLabel = useMemo(() => {
    const raw = scope.resumo.resumoDateLabel;
    if (!raw) return "";
    return String(raw).replace(/\s[–→]\s/g, " | ");
  }, [scope.resumo.resumoDateLabel]);

  const salesFooter = useMemo(() => {
    if (loading || error || empty) return null;

    const topProductsBlock = <S7DailySummaryTopProducts items={topListingsByQuantity} />;
    const accountDistribution =
      scope.resumo.allAccountsScope ? (
        <S7DailySummaryAccountDistribution entries={distributionByAccount} accounts={mlAccounts} />
      ) : null;

    if (!accountDistribution) {
      return topProductsBlock;
    }

    return (
      <div className="s7-daily-summary__sales-footer-grid">
        {topProductsBlock}
        {accountDistribution}
      </div>
    );
  }, [
    loading,
    error,
    empty,
    scope.resumo.allAccountsScope,
    topListingsByQuantity,
    distributionByAccount,
    mlAccounts,
  ]);

  const filterPanel = (
    <S7BlockFiltersPanel
      idPrefix="s7-daily-summary"
      expanded={dailySummaryFiltersExpanded}
      periodPreset={dailySummaryFilters.periodPreset}
      startDate={dailySummaryFilters.startDate}
      endDate={dailySummaryFilters.endDate}
      marketplaceAccountId={dailySummaryFilters.marketplaceAccountId}
      accounts={mlAccounts}
      accountLabel={dashboardMlAccountLabel}
      accountsReady={mlAccountsReady}
      onApplyPeriod={applyDailySummaryPeriod}
      onAccountChange={setDailySummaryAccountId}
    />
  );

  return (
    <S7DailySummaryCard
      title="Resumo Diário"
      blocks={blocks}
      periodChipLabel={periodChipLabel}
      periodLabel={dailySummaryPeriodTouched ? scope.resumo.resumoPeriodLabel : ""}
      periodDateLabel={periodDateLabel}
      filtersExpanded={dailySummaryFiltersExpanded}
      filtersActive={filtersActive}
      onToggleFilters={toggleDailySummaryFiltersExpanded}
      filterPanel={filterPanel}
      slots={{ salesFooter }}
      className={className}
    />
  );
}
