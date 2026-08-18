// ======================================================================
// Apresentação de preço e limite — consome contrato do catálogo (API)
// ======================================================================

import { formatPlanPriceBRL } from "./billingFormatters";
import { normalizePlanKey } from "./planCta";
import { PLAN_BABY_SALES_LIMIT_MONTHLY } from "./planIncludedFeatures";

/**
 * @param {Record<string, unknown> | null | undefined} plan
 */
export function isQuotePlan(plan) {
  if (!plan) return false;
  if (String(plan.pricing_mode || "").toLowerCase() === "quote") return true;
  if (plan.contact_sales === true || plan.requires_sales_contact === true) return true;
  return normalizePlanKey(plan) === "infinity";
}

/**
 * @param {Record<string, unknown> | null | undefined} plan
 */
export function formatPlanCardPrice(plan) {
  if (isQuotePlan(plan)) return "Sob consulta";
  if (plan?.price_cents == null && (plan?.price_monthly == null || plan?.price_monthly === "")) {
    return "—";
  }
  const cents = plan?.price_cents;
  if (cents != null && Number.isFinite(Number(cents))) {
    return formatPlanPriceBRL(Number(cents) / 100);
  }
  return formatPlanPriceBRL(plan?.price_monthly);
}

/**
 * @param {Record<string, unknown> | null | undefined} plan
 */
export function formatPlanCardSalesLimit(plan) {
  if (isQuotePlan(plan)) return "Acima de 20.000 vendas/mês";
  if (normalizePlanKey(plan) === "baby") {
    return `Até ${PLAN_BABY_SALES_LIMIT_MONTHLY.toLocaleString("pt-BR")} vendas/mês`;
  }
  const limit = plan?.sales_limit_monthly;
  if (limit == null || limit === "") return "—";
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `Até ${n.toLocaleString("pt-BR")} vendas/mês`;
}

/**
 * @param {Record<string, unknown> | null | undefined} plan
 */
export function formatPlanCardPriceSuffix(plan) {
  return isQuotePlan(plan) ? "" : "/mês";
}
