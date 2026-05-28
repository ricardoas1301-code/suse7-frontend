// ======================================================================
// Exibição visual do consumo mensal (percentual apenas para UI)
// ======================================================================

/**
 * @param {Record<string, unknown> | null | undefined} usage
 * @param {Record<string, unknown> | null | undefined} limits
 * @param {number | string | null | undefined} [resolvedMonthlyLimit]
 */
export function resolveMonthlyUsageDisplay(usage, limits, resolvedMonthlyLimit) {
  const used = Math.max(0, Number(usage?.total_sales_month ?? limits?.current_month_sales ?? 0) || 0);
  const limitRaw = limits?.monthly_sales_limit ?? usage?.limit_sales_month ?? resolvedMonthlyLimit;
  const limitNumber = limitRaw != null && limitRaw !== "" ? Number(limitRaw) : null;
  const hasFiniteLimit = limitNumber != null && Number.isFinite(limitNumber) && limitNumber > 0;

  if (!hasFiniteLimit) {
    return {
      mode: "open",
      used,
      limit: null,
      percent: 0,
      barPercent: 0,
      usageLabel: `${used.toLocaleString("pt-BR")} vendas usadas neste mês`,
      limitLabel: "Limite personalizado",
      percentLabel: "Sob consulta",
      tone: "muted",
    };
  }

  const percent = limitNumber > 0 ? (used / limitNumber) * 100 : 0;
  const roundedPercent = Math.round(percent * 100) / 100;
  const barPercent = Math.min(100, roundedPercent);

  let tone = "normal";
  if (roundedPercent > 100) tone = "danger";
  else if (roundedPercent >= 80) tone = "warning";

  return {
    mode: "metered",
    used,
    limit: limitNumber,
    percent: roundedPercent,
    barPercent,
    usageLabel: `${used.toLocaleString("pt-BR")} de ${limitNumber.toLocaleString("pt-BR")} vendas usadas neste mês`,
    limitLabel: `${limitNumber.toLocaleString("pt-BR")} vendas/mês`,
    percentLabel: `${roundedPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% usado`,
    tone,
  };
}
