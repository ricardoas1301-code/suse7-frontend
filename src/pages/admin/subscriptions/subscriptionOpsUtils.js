import { billingStatusLabel } from "./subscriptionOpsConstants";

/**
 * @param {import('./subscriptionOpsTypes').SubscriptionListRow[]} rows
 * @param {import('./subscriptionOpsTypes').SubscriptionFilters} filters
 */
export function filterSubscriptions(rows, filters) {
  const q = filters.q.trim().toLowerCase();
  const now = Date.now();
  const weekMs = 7 * 86400000;

  return rows.filter((r) => {
    if (q) {
      const blob = [r.seller_name, r.seller_email, r.id, r.seller_id, r.plan, r.plan_key]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (filters.billing_status && r.billing_status !== filters.billing_status) return false;
    if (filters.plan && !(r.plan ?? "").toLowerCase().includes(filters.plan.toLowerCase())) return false;
    if (filters.health && r.financial_health !== filters.health) return false;
    if (filters.billing_flag === "grace" && r.billing_status !== "grace") return false;
    if (filters.billing_flag === "past_due" && r.billing_status !== "past_due") return false;
    if (filters.billing_flag === "trial" && r.billing_status !== "trialing") return false;
    if (filters.renewal === "upcoming") {
      if (!r.renewal_date) return false;
      const ms = new Date(String(r.renewal_date)).getTime() - now;
      if (!(ms >= 0 && ms <= weekMs)) return false;
    }
    return true;
  });
}

/**
 * @param {import('./subscriptionOpsTypes').SubscriptionSummary | null | undefined} summary
 */
export function normalizeSummary(summary) {
  return {
    active_subscriptions: summary?.active_subscriptions ?? 0,
    grace_period: summary?.grace_period ?? 0,
    past_due: summary?.past_due ?? 0,
    trials_active: summary?.trials_active ?? 0,
    mrr_brl: summary?.mrr_brl ?? "—",
    arr_brl: summary?.arr_brl ?? "—",
    churn_risk: summary?.churn_risk ?? 0,
    renewals_upcoming: summary?.renewals_upcoming ?? 0,
  };
}

/**
 * @param {string | null | undefined} iso
 */
export function formatSubscriptionWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * @param {string | null | undefined} iso
 */
export function formatSubscriptionDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

/**
 * @param {import('./subscriptionOpsTypes').FinancialHealth | string | null | undefined} health
 */
export function financialHealthClass(health) {
  const base = "dc-sub-pill";
  if (health === "saudavel") return `${base} dc-sub-pill--health-ok`;
  if (health === "inadimplente") return `${base} dc-sub-pill--health-critical`;
  if (health === "risco_churn" || health === "trial_expirando") return `${base} dc-sub-pill--health-warn`;
  return `${base} dc-sub-pill--health-attention`;
}

/**
 * @param {import('./subscriptionOpsTypes').FinancialHealth | string | null | undefined} health
 */
export function financialHealthLabel(health) {
  if (health === "saudavel") return "Saudável";
  if (health === "atencao") return "Atenção";
  if (health === "risco_churn") return "Risco churn";
  if (health === "inadimplente") return "Inadimplente";
  if (health === "trial_expirando") return "Trial expirando";
  return "—";
}

/**
 * @param {string | null | undefined} status
 */
export function billingStatusClass(status) {
  const base = "dc-sub-pill";
  if (status === "active") return `${base} dc-sub-pill--status-active`;
  if (status === "grace" || status === "trialing") return `${base} dc-sub-pill--status-warn`;
  if (status === "past_due" || status === "paused") return `${base} dc-sub-pill--status-critical`;
  if (status === "canceled") return `${base} dc-sub-pill--status-muted`;
  return `${base} dc-sub-pill--status-neutral`;
}

/**
 * @param {number | null | undefined} percent
 */
export function formatUsagePercent(percent) {
  if (percent == null || !Number.isFinite(percent)) return "—";
  return `${percent}%`;
}

export { billingStatusLabel };
