// ======================================================================
// Exibição visual do consumo mensal — percentual e barra vêm do backend.
// ======================================================================

import { formatBillingDate } from "./billingFormatters.js";

/**
 * @param {number | null | undefined} value
 */
function formatUsagePercentLabel(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% usado`;
}

/**
 * @param {Record<string, unknown> | null | undefined} usage
 * @param {Record<string, unknown> | null | undefined} limits
 * @param {number | string | null | undefined} [resolvedMonthlyLimit]
 * @param {{ loading?: boolean; usageUnavailable?: boolean }} [options]
 */
export function resolveMonthlyUsageDisplay(usage, limits, resolvedMonthlyLimit, options = {}) {
  const loading = Boolean(options.loading);
  const usageUnavailable =
    Boolean(options.usageUnavailable) ||
    usage?.usage_status === "unavailable" ||
    limits?.usage_status === "unavailable";

  if (loading) {
    return {
      mode: "loading",
      used: null,
      limit: null,
      percent: null,
      barPercent: 0,
      usageLabel: "Carregando consumo…",
      limitLabel: "—",
      percentLabel: "—",
      periodLabel: null,
      tone: "muted",
    };
  }

  if (usageUnavailable) {
    return {
      mode: "unavailable",
      used: null,
      limit: null,
      percent: null,
      barPercent: 0,
      usageLabel: "Consumo indisponível",
      limitLabel: "—",
      percentLabel: "—",
      periodLabel: null,
      tone: "muted",
    };
  }

  const usedRaw = usage?.used_sales ?? usage?.total_sales_month ?? limits?.current_month_sales;
  const used = usedRaw != null && usedRaw !== "" ? Math.max(0, Number(usedRaw)) : 0;
  const limitRaw = limits?.monthly_sales_limit ?? usage?.sales_limit ?? usage?.limit_sales_month ?? resolvedMonthlyLimit;
  const limitNumber = limitRaw != null && limitRaw !== "" ? Number(limitRaw) : null;
  const hasFiniteLimit = limitNumber != null && Number.isFinite(limitNumber) && limitNumber > 0;

  const periodStart = usage?.period_start ?? limits?.period_start ?? null;
  const periodEnd = usage?.period_end ?? limits?.period_end ?? null;
  const periodLabel =
    periodStart && periodEnd
      ? `Período: ${formatBillingDate(periodStart)} — ${formatBillingDate(periodEnd)}`
      : null;
  const periodMetaLabel =
    periodStart && periodEnd ? `${formatBillingDate(periodStart)} — ${formatBillingDate(periodEnd)}` : null;

  if (!hasFiniteLimit) {
    return {
      mode: "open",
      used,
      limit: null,
      percent: 0,
      barPercent: 0,
      usageLabel: `${used.toLocaleString("pt-BR")} vendas usadas neste período`,
      limitLabel: "Limite personalizado",
      percentLabel: "Sob consulta",
      periodLabel: periodMetaLabel,
      tone: "muted",
    };
  }

  const backendPercent = usage?.usage_percent ?? limits?.usage_percent;
  const percentNumber =
    backendPercent != null && backendPercent !== "" && Number.isFinite(Number(backendPercent))
      ? Number(backendPercent)
      : null;
  const barPercent =
    percentNumber != null ? Math.min(100, Math.max(0, percentNumber)) : 0;

  let tone = "normal";
  if (percentNumber != null && percentNumber > 100) tone = "danger";
  else if (percentNumber != null && percentNumber >= 80) tone = "warning";

  return {
    mode: "metered",
    used,
    limit: limitNumber,
    percent: percentNumber,
    barPercent,
    usageLabel: `${used.toLocaleString("pt-BR")} de ${limitNumber.toLocaleString("pt-BR")} vendas usadas neste período`,
    limitLabel: `${limitNumber.toLocaleString("pt-BR")} vendas/mês`,
    percentLabel: formatUsagePercentLabel(percentNumber),
    periodLabel: periodMetaLabel,
    tone,
  };
}
