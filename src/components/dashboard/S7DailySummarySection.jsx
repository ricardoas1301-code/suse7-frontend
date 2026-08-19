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
import { RankingTooltipCompanyProvider } from "../sales/RankingTooltipCompanyProvider.jsx";
import S7BlockFiltersPanel from "./S7BlockFiltersPanel.jsx";
import { useDashboardBlockFilters } from "./DashboardBlockFiltersContext.jsx";
import { useDashboardScope } from "./useDashboardScope.js";
import { useAuthBootstrapReady } from "../../hooks/useAuthBootstrapReady.js";
import { useSalesExecutiveSummary } from "../../hooks/useSalesExecutiveSummary.js";
import { isExecutiveSummaryQueryEnabled } from "./dashboardScope.js";
import { fetchMercadoLivreMarketplaceAccounts } from "../../services/marketplaceAccountsApi.js";
import {
  buildDailySummaryBlocks,
  buildDailySummaryPlaceholderBlocks,
} from "../../features/sales/executiveSummaryDisplay.js";
import {
  isSalesExecutiveSummaryZeroUniverse,
  normalizeSalesExecutiveSummary,
  resolveDailySummaryPresentationState,
} from "../../features/sales/normalizeSalesExecutiveSummary.js";
import { DASHBOARD_RESUMO_DIARIO_ENZO_ID } from "../../features/easter-eggs/eggs/dashboardResumoDiarioEnzo.js";
import { DASHBOARD_DAILY_SUMMARY_PERIOD_PRESETS } from "../../features/vendas/filters/vendasFiltersConstants.js";
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
export default function S7DailySummarySection({
  className = "",
  sectionJumpDownTargetRef = null,
  sectionJumpDownAriaLabel = "Ir para busca e filtros",
}) {
  const scope = useDashboardScope();
  const {
    dailySummaryFilters,
    dailySummaryPeriodTouched,
    dailySummaryFiltersExpanded,
    applyDailySummaryPeriod,
    setDailySummaryAccountId,
  } = useDashboardBlockFilters();

  const authReady = useAuthBootstrapReady();

  const executiveQueryEnabled =
    authReady &&
    (dailySummaryPeriodTouched || scope.operationalConfigReady) &&
    isExecutiveSummaryQueryEnabled(scope.resumo.resumoParams);

  const waitingOperationalScope =
    authReady && !dailySummaryPeriodTouched && !scope.operationalConfigReady;

  const { summary, topProducts, distributionByAccount, loading, error } = useSalesExecutiveSummary(
    scope.resumo.resumoParams,
    {
      enabled: executiveQueryEnabled,
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

  const effectivelyLoading = waitingOperationalScope || loading;

  const normalizedSummary = useMemo(
    () => normalizeSalesExecutiveSummary(summary),
    [summary],
  );

  const presentation = useMemo(
    () =>
      resolveDailySummaryPresentationState({
        loading: effectivelyLoading,
        error,
        summary,
      }),
    [effectivelyLoading, error, summary],
  );

  const empty = useMemo(
    () => presentation === "zero" || isSalesExecutiveSummaryZeroUniverse(normalizedSummary),
    [presentation, normalizedSummary],
  );

  const blocks = useMemo(() => {
    // Loading → placeholder. Zero real e dados → blocos canônicos (nunca “—” por empty).
    // Erro sem summary: mantém placeholder (sem novo UI de erro — fronteira visual).
    if (presentation === "loading" || (presentation === "error" && normalizedSummary == null)) {
      return buildDailySummaryPlaceholderBlocks();
    }
    if (normalizedSummary == null) {
      return buildDailySummaryPlaceholderBlocks();
    }
    return buildDailySummaryBlocks(normalizedSummary);
  }, [presentation, normalizedSummary]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.info("[S7][ResumoDiario hydrate]", {
      presentation,
      enabled: executiveQueryEnabled,
      operationalConfigReady: scope.operationalConfigReady,
      periodTouched: dailySummaryPeriodTouched,
      period_preset: scope.resumo.resumoParams?.period_preset ?? null,
      start_datetime: scope.resumo.resumoParams?.start_datetime ?? null,
      end_datetime: scope.resumo.resumoParams?.end_datetime ?? null,
      start_date: scope.resumo.resumoParams?.start_date ?? null,
      end_date: scope.resumo.resumoParams?.end_date ?? null,
      selector_trigger: scope.resumo.selectorTriggerLabel ?? null,
      selector_start: scope.resumo.selectorStartDate ?? null,
      selector_end: scope.resumo.selectorEndDate ?? null,
      uses_operational_cycle: scope.resumo.resumoUsesOperationalCycle,
      marketplace_account_id: scope.resumo.resumoParams?.marketplace_account_id ?? null,
      orders_count: normalizedSummary?.orders_count ?? null,
      gross_sales_brl: normalizedSummary?.gross_sales_brl ?? null,
      net_profit_brl: normalizedSummary?.net_profit_brl ?? null,
      zero_universe: normalizedSummary?._s7_zero_universe === true,
      has_error: Boolean(error),
    });
  }, [
    presentation,
    executiveQueryEnabled,
    scope.operationalConfigReady,
    scope.resumo.resumoParams,
    dailySummaryPeriodTouched,
    normalizedSummary,
    error,
  ]);

  const periodChipLabel = scope.resumo.resumoChipLabel;
  const periodDateLabel = useMemo(() => {
    const raw = scope.resumo.resumoDateLabel;
    if (!raw) return "";
    return String(raw).replace(/\s[–→]\s/g, " | ");
  }, [scope.resumo.resumoDateLabel]);

  const salesFooter = useMemo(() => {
    if (effectivelyLoading || error || empty) return null;

    const topProductsBlock = (
      <RankingTooltipCompanyProvider marketplaceAccounts={mlAccounts}>
        <S7DailySummaryTopProducts items={topProducts} />
      </RankingTooltipCompanyProvider>
    );
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
    effectivelyLoading,
    error,
    empty,
    scope.resumo.allAccountsScope,
    topProducts,
    distributionByAccount,
    mlAccounts,
  ]);

  const filterPanel = (
    <S7BlockFiltersPanel
      idPrefix="s7-daily-summary"
      expanded={dailySummaryFiltersExpanded}
      layout="inline"
      periodPreset={
        scope.resumo.resumoUsesOperationalCycle ? "operational_cycle" : dailySummaryFilters.periodPreset
      }
      startDate={scope.resumo.selectorStartDate || dailySummaryFilters.startDate}
      endDate={scope.resumo.selectorEndDate || dailySummaryFilters.endDate}
      marketplaceAccountId={dailySummaryFilters.marketplaceAccountId}
      accounts={mlAccounts}
      accountLabel={dashboardMlAccountLabel}
      accountsReady={mlAccountsReady}
      onApplyPeriod={applyDailySummaryPeriod}
      onAccountChange={setDailySummaryAccountId}
      triggerLabelOverride={scope.resumo.selectorTriggerLabel}
      periodPresets={DASHBOARD_DAILY_SUMMARY_PERIOD_PRESETS}
    />
  );

  return (
    <S7DailySummaryCard
      title="Vendas ao Vivo"
      titleEasterEggId={DASHBOARD_RESUMO_DIARIO_ENZO_ID}
      blocks={blocks}
      periodChipLabel={periodChipLabel}
      periodLabel={dailySummaryPeriodTouched ? scope.resumo.resumoPeriodLabel : ""}
      periodDateLabel={periodDateLabel}
      filtersLayout="inline"
      filterPanel={filterPanel}
      slots={{ salesFooter }}
      sectionJumpDownTargetRef={sectionJumpDownTargetRef}
      sectionJumpDownAriaLabel={sectionJumpDownAriaLabel}
      className={className}
    />
  );
}
