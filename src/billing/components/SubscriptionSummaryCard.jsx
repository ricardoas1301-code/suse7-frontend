import { resolveBillingStatusLabel } from "./BillingStatusBadge";
import { formatBillingDate, formatPlanPriceBRL, formatSalesLimit } from "../billingFormatters";
import {
  resolveEffectivePlanUsageLabel,
  resolveEffectiveUsageLimitLabel,
  resolveFinancialAccessStatusLabel,
  resolveFinancialSubscriptionStatusLabel,
} from "../billingFinancialStateUi.js";

export default function SubscriptionSummaryCard({
  access,
  subscription,
  planName,
  planPriceMonthly,
  salesLimitMonthly,
  billingPeriodStart,
  billingPeriodEnd,
  renewalExperience = null,
}) {
  const monthlyLimit = salesLimitMonthly;
  const periodStart = billingPeriodStart ?? subscription?.current_period_start;
  const periodEnd = billingPeriodEnd ?? subscription?.current_period_end;
  const financialStatusLabel = resolveFinancialSubscriptionStatusLabel(renewalExperience);
  const financialAccessLabel = resolveFinancialAccessStatusLabel(renewalExperience);
  const effectivePlanLabel = resolveEffectivePlanUsageLabel(renewalExperience);
  const effectiveLimitLabel = resolveEffectiveUsageLimitLabel(renewalExperience);

  return (
    <section className="s7-billing-summary-card" aria-label="Resumo da assinatura">
      <p className="s7-billing-card-eyebrow">Resumo da assinatura</p>
      <SummaryRow label="Plano em uso" value={(effectivePlanLabel ?? planName) || "—"} />
      <SummaryRow label="Valor mensal" value={planPriceMonthly != null ? `${formatPlanPriceBRL(planPriceMonthly)}/mês` : "—"} />
      {effectiveLimitLabel ? <SummaryRow label="Limite" value={effectiveLimitLabel} /> : null}
      {renewalExperience?.previous_contracted_plan_key ? (
        <SummaryRow
          label="Assinatura anterior"
          value={`${String(renewalExperience.previous_contracted_plan_key).charAt(0).toUpperCase()}${String(renewalExperience.previous_contracted_plan_key).slice(1)} — Suspensa`}
        />
      ) : null}
      <SummaryRow
        label="Status da assinatura"
        value={financialStatusLabel ?? resolveBillingStatusLabel(access?.state, subscription?.status)}
      />
      <SummaryRow
        label="Status de acesso"
        value={financialAccessLabel ?? (access?.can_access ? "Liberado" : "Bloqueado")}
      />
      <SummaryRow label="Limite mensal de vendas" value={formatSalesLimit(monthlyLimit)} />
      <SummaryRow label="Próxima cobrança" value={formatBillingDate(subscription?.next_due_date)} />
      <SummaryRow
        label="Período atual"
        value={`${formatBillingDate(periodStart)} — ${formatBillingDate(periodEnd)}`}
      />
    </section>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="s7-billing-summary-card__row">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}
