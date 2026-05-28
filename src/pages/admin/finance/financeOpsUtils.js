import { paymentStatusLabel } from "./financeOpsConstants";

export { paymentStatusLabel };

/**
 * @param {import('./financeOpsTypes').FinanceListRow[]} rows
 * @param {import('./financeOpsTypes').FinanceFilters} filters
 */
export function filterFinanceRows(rows, filters) {
  const q = filters.q.trim().toLowerCase();
  const now = Date.now();
  const weekMs = 7 * 86400000;

  return rows.filter((r) => {
    if (q) {
      const blob = [r.seller_name, r.seller_email, r.id, r.seller_id, r.plan].filter(Boolean).join(" ").toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (filters.payment_status && r.payment_status !== filters.payment_status) return false;
    if (filters.plan && !(r.plan ?? "").toLowerCase().includes(filters.plan.toLowerCase())) return false;
    if (filters.health && r.financial_health !== filters.health) return false;
    if (filters.payment_method && r.payment_method !== filters.payment_method) return false;
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
 * @param {import('./financeOpsTypes').FinanceSummary | null | undefined} summary
 */
export function normalizeFinanceSummary(summary) {
  return {
    mrr_brl: summary?.mrr_brl ?? "—",
    arr_brl: summary?.arr_brl ?? "—",
    receita_mes_atual_brl: summary?.receita_mes_atual_brl ?? "—",
    receita_recebida_brl: summary?.receita_recebida_brl ?? "—",
    receita_pendente_brl: summary?.receita_pendente_brl ?? "—",
    receita_grace_brl: summary?.receita_grace_brl ?? "—",
    receita_risco_brl: summary?.receita_risco_brl ?? "—",
    receita_cancelada_count: summary?.receita_cancelada_count ?? 0,
    inadimplencia: summary?.inadimplencia ?? 0,
    churn_risco: summary?.churn_risco ?? 0,
    sellers_pagantes: summary?.sellers_pagantes ?? 0,
    trials_ativos: summary?.trials_ativos ?? 0,
    renovacoes_proximas: summary?.renovacoes_proximas ?? 0,
    ticket_medio_brl: summary?.ticket_medio_brl ?? "—",
    assinaturas_ativas: summary?.assinaturas_ativas ?? 0,
  };
}

export function formatFinanceWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatFinanceDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function financialHealthClass(health) {
  const base = "dc-fin-pill";
  if (health === "saudavel") return `${base} dc-fin-pill--health-ok`;
  if (health === "inadimplente") return `${base} dc-fin-pill--health-critical`;
  if (health === "risco_churn" || health === "trial_expirando") return `${base} dc-fin-pill--health-warn`;
  return `${base} dc-fin-pill--health-attention`;
}

export function financialHealthLabel(health) {
  if (health === "saudavel") return "Saudável";
  if (health === "atencao") return "Atenção";
  if (health === "risco_churn") return "Risco churn";
  if (health === "inadimplente") return "Inadimplente";
  if (health === "trial_expirando") return "Trial expirando";
  return "—";
}

export function paymentStatusClass(status) {
  const base = "dc-fin-pill";
  if (status === "paid") return `${base} dc-fin-pill--pay-ok`;
  if (status === "pending") return `${base} dc-fin-pill--pay-warn`;
  if (status === "failed" || status === "overdue") return `${base} dc-fin-pill--pay-critical`;
  return `${base} dc-fin-pill--neutral`;
}

export function formatUsagePercent(percent) {
  if (percent == null || !Number.isFinite(percent)) return "—";
  return `${percent}%`;
}
