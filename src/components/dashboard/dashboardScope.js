// ======================================================================
// Escopo executivo do Dashboard — regra sem filtro vs com filtro (DASH.3).
// DASH.7: filtros independentes por bloco (Resumo Diário vs Top 10).
// Sem cálculos financeiros; apenas resolução de período/conta por bloco.
// ======================================================================

import {
  buildVendasExecutiveApiParams,
  buildOperationalCycleExecutiveApiParams,
  formatIsoToBrDate,
  getDefaultLast30DaysRange,
  getVendasPeriodPresetLabel,
  resolveVendasPeriodRange,
} from "../../features/vendas/filters/vendasFiltersPeriod.js";
import {
  DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
  DEFAULT_SELLER_TIMEZONE,
  normalizeOperationalDayClosesAt,
  resolveOperationalDayCycle,
} from "../../features/dashboard/operationalDayCycle.js";
import { normalizeOperationalWorkingDays } from "../../features/dashboard/operationalWorkingDays.js";

/**
 * @typedef {{
 *   periodPreset: import("../../features/vendas/filters/vendasFiltersPeriod.js").VendasPeriodPresetUi;
 *   startDate: string;
 *   endDate: string;
 *   marketplace?: string;
 *   marketplaceAccountId?: string;
 * }} DashboardBlockFilterInput
 */

/**
 * Conta do bloco — vazio = todas as contas (omitir ID na API).
 * @param {DashboardBlockFilterInput} filters
 */
export function resolveBlockMarketplaceAccountId(filters) {
  return String(filters.marketplaceAccountId ?? "").trim();
}

/**
 * @param {string} startIso
 * @param {string} endIso
 */
export function formatDashboardPeriodRangeLabel(startIso, endIso) {
  const start = formatIsoToBrDate(startIso);
  const end = formatIsoToBrDate(endIso);
  if (!start && !end) return "Período";
  if (start && end && start === end) return start;
  if (start && end) return `${start} – ${end}`;
  return start || end || "Período";
}

/**
 * Intervalo legível para chips do Dashboard (ex.: 01/06/2026 até 21/06/2026).
 * @param {string} startIso
 * @param {string} endIso
 */
export function formatDashboardPeriodRangeLabelLong(startIso, endIso) {
  const start = formatIsoToBrDate(startIso);
  const end = formatIsoToBrDate(endIso);
  if (!start && !end) return "";
  if (start && end && start === end) return start;
  if (start && end) return `${start} até ${end}`;
  return start || end || "";
}

/**
 * Params Top 10 — sempre envia start_date/end_date explícitos (evita falha no load inicial).
 * @param {DashboardBlockFilterInput} filters
 * @param {{ startDate: string; endDate: string }} range
 */
export function buildTop10ExecutiveApiParams(filters, range) {
  return buildVendasExecutiveApiParams({
    periodPreset: "custom",
    startDate: range.startDate,
    endDate: range.endDate,
    marketplace: filters.marketplace,
    marketplaceAccountId: resolveBlockMarketplaceAccountId(filters),
    rankingLimit: 10,
  });
}

/**
 * @param {{
 *   closesAt?: string;
 *   timezone?: string;
 *   workingDays?: unknown;
 *   loaded?: boolean;
 * }} [operationalConfig]
 */
function resolveOperationalConfig(operationalConfig = {}) {
  const closesAt = normalizeOperationalDayClosesAt(
    operationalConfig.closesAt ?? DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
  );
  const timezone =
    operationalConfig.timezone != null && String(operationalConfig.timezone).trim() !== ""
      ? String(operationalConfig.timezone).trim()
      : DEFAULT_SELLER_TIMEZONE;
  const workingDays = normalizeOperationalWorkingDays(operationalConfig.workingDays);
  return { closesAt, timezone, workingDays };
}

/**
 * Resumo Diário — ciclo operacional até o seller alterar o período manualmente.
 * Conta específica não desativa o ciclo operacional.
 * @param {DashboardBlockFilterInput} filters
 * @param {{
 *   closesAt?: string;
 *   timezone?: string;
 *   workingDays?: unknown;
 *   loaded?: boolean;
 * }} [operationalConfig]
 * @param {{ periodTouched?: boolean }} [scopeOptions]
 */
export function resolveDailySummaryScope(filters, operationalConfig = {}, scopeOptions = {}) {
  const periodTouched = Boolean(scopeOptions.periodTouched);
  const { closesAt, timezone, workingDays } = resolveOperationalConfig(operationalConfig);
  const operationalCycle = resolveOperationalDayCycle({ closesAt, timezone, workingDays });
  const appliedRange = resolveVendasPeriodRange(
    filters.periodPreset,
    filters.startDate,
    filters.endDate,
  );
  const accountIdForApi = resolveBlockMarketplaceAccountId(filters);

  const resumoUsesOperationalCycle = !periodTouched;

  const resumoParams = resumoUsesOperationalCycle
    ? buildOperationalCycleExecutiveApiParams({
        cycle: operationalCycle,
        marketplace: filters.marketplace,
        marketplaceAccountId: accountIdForApi,
        rankingLimit: 10,
      })
    : buildVendasExecutiveApiParams({
        periodPreset: filters.periodPreset,
        startDate: appliedRange.startDate,
        endDate: appliedRange.endDate,
        marketplace: filters.marketplace,
        marketplaceAccountId: accountIdForApi,
        rankingLimit: 10,
      });

  const resumoPeriodLabel = resumoUsesOperationalCycle ? "Ciclo operacional" : "Período selecionado";

  const resumoDateLabel = resumoUsesOperationalCycle
    ? operationalCycle?.labelCompact ?? formatIsoToBrDate(appliedRange.startDate)
    : formatDashboardPeriodRangeLabel(appliedRange.startDate, appliedRange.endDate);

  const resumoChipLabel = resumoUsesOperationalCycle ? "Ciclo operacional" : null;

  const resumoFilterParams = resumoUsesOperationalCycle
    ? operationalCycle
      ? {
          periodStart: operationalCycle.startDatetimeIso,
          periodEnd: operationalCycle.endDatetimeIso,
          marketplaceAccountId: accountIdForApi || null,
        }
      : {
          periodStart: appliedRange.startDate,
          periodEnd: appliedRange.endDate,
          marketplaceAccountId: accountIdForApi || null,
        }
    : {
        periodStart: appliedRange.startDate,
        periodEnd: appliedRange.endDate,
        marketplaceAccountId: accountIdForApi || null,
      };

  return {
    periodTouched,
    resumoUsesOperationalCycle,
    allAccountsScope: !accountIdForApi,
    accountIdForApi,
    accountScopeLabel: accountIdForApi ? "conta_especifica" : "todas_as_contas",
    resumoParams,
    resumoPeriodLabel,
    resumoDateLabel,
    resumoChipLabel,
    resumoFilterParams,
    operationalCycle,
    operationalConfig: { closesAt, timezone, workingDays },
    appliedRange,
  };
}

/**
 * Top 10 — últimos 30 dias até o seller alterar o período manualmente.
 * Conta específica não reseta o período mensal padrão.
 * @param {DashboardBlockFilterInput} filters
 * @param {{ periodTouched?: boolean }} [scopeOptions]
 */
export function resolveTop10Scope(filters, scopeOptions = {}) {
  const periodTouched = Boolean(scopeOptions.periodTouched);
  const defaultLast30 = getDefaultLast30DaysRange();
  const appliedRange = resolveVendasPeriodRange(
    filters.periodPreset,
    filters.startDate,
    filters.endDate,
  );
  const executiveRange = periodTouched
    ? appliedRange
    : { startDate: defaultLast30.startDate, endDate: defaultLast30.endDate };
  const accountIdForApi = resolveBlockMarketplaceAccountId(filters);

  const executiveParams = buildTop10ExecutiveApiParams(filters, {
    startDate: executiveRange.startDate,
    endDate: executiveRange.endDate,
  });

  const top10PeriodLabel = "Período";
  const top10ChipLabel = periodTouched
    ? getVendasPeriodPresetLabel(filters.periodPreset)
    : defaultLast30.label;

  const top10DateLabel = formatDashboardPeriodRangeLabelLong(
    executiveRange.startDate,
    executiveRange.endDate,
  );

  return {
    periodTouched,
    allAccountsScope: !accountIdForApi,
    accountIdForApi,
    accountScopeLabel: accountIdForApi ? "conta_especifica" : "todas_as_contas",
    executiveParams,
    top10PeriodLabel,
    top10ChipLabel,
    top10DateLabel,
    executiveRange,
    appliedRange,
    executiveFilterParams: {
      periodStart: executiveRange.startDate,
      periodEnd: executiveRange.endDate,
      marketplaceAccountId: accountIdForApi || null,
    },
  };
}

/**
 * @deprecated Preferir resolveDailySummaryScope / resolveTop10Scope com estados separados.
 * Mantido para compatibilidade de scripts legados.
 */
export function isDashboardSellerFilterActive(filters, options = {}) {
  const dashboardFilterTouched = Boolean(options.dashboardFilterTouched);
  const accountActive = Boolean(String(filters.marketplaceAccountId ?? "").trim());
  if (accountActive || dashboardFilterTouched) return true;

  const defaultLast30 = resolveVendasPeriodRange("last_30_days");
  const appliedRange = resolveVendasPeriodRange(
    filters.periodPreset,
    filters.startDate,
    filters.endDate,
  );

  return (
    filters.periodPreset !== "last_30_days" ||
    appliedRange.startDate !== defaultLast30.startDate ||
    appliedRange.endDate !== defaultLast30.endDate
  );
}

/**
 * @deprecated Preferir resolveDailySummaryScope / resolveTop10Scope.
 */
export function resolveDashboardScope(filters, operationalConfig = {}, scopeOptions = {}) {
  const resumo = resolveDailySummaryScope(filters, operationalConfig, {
    periodTouched: Boolean(scopeOptions.dashboardFilterTouched),
  });
  const top10 = resolveTop10Scope(filters, {
    periodTouched: Boolean(scopeOptions.dashboardFilterTouched),
  });

  return {
    filterActive: resumo.periodTouched || top10.periodTouched || Boolean(resumo.accountIdForApi),
    dashboardFilterTouched: Boolean(scopeOptions.dashboardFilterTouched),
    resumoUsesOperationalCycle: resumo.resumoUsesOperationalCycle,
    allAccountsScope: resumo.allAccountsScope && top10.allAccountsScope,
    resumoParams: resumo.resumoParams,
    executiveParams: top10.executiveParams,
    top10PeriodLabel: top10.top10PeriodLabel,
    resumoPeriodLabel: resumo.resumoPeriodLabel,
    resumoDateLabel: resumo.resumoDateLabel,
    resumoBadgeLabel: resumo.resumoUsesOperationalCycle ? "Parcial" : null,
    operationalCycle: resumo.operationalCycle,
    operationalConfig: resumo.operationalConfig,
    unifiedFilterParams: resumo.periodTouched
      ? {
          periodStart: resumo.appliedRange.startDate,
          periodEnd: resumo.appliedRange.endDate,
          marketplaceAccountId: resumo.accountIdForApi || null,
        }
      : null,
    resumoFilterParams: resumo.resumoFilterParams,
    executiveFilterParams: top10.executiveFilterParams,
    accountIdForApi: resumo.accountIdForApi,
    accountScopeLabel: resumo.accountScopeLabel,
  };
}

/**
 * @param {import("../../services/salesExecutiveSummaryApi.js").SalesExecutiveSummaryParams | null | undefined} params
 */
export function isExecutiveSummaryQueryEnabled(params) {
  if (params == null || typeof params !== "object") return false;

  if (String(params.period_preset ?? "").trim() === "operational_cycle") {
    return Boolean(String(params.start_datetime ?? "").trim());
  }

  const start =
    String(params.start_date ?? "").trim() ||
    String(params.period_start ?? "").trim() ||
    String(params.start_datetime ?? "").trim();
  const end =
    String(params.end_date ?? "").trim() ||
    String(params.period_end ?? "").trim() ||
    String(params.end_datetime ?? "").trim();

  if (start && end) return true;
  return Boolean(String(params.period_preset ?? "").trim());
}

/** @deprecated Use resolveBlockMarketplaceAccountId. */
export function resolveDashboardMarketplaceAccountId(filters, _filterActive) {
  return resolveBlockMarketplaceAccountId(filters);
}
