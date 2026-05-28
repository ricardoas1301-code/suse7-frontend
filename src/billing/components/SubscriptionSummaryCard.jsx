import BillingStatusBadge from "./BillingStatusBadge";
import { formatBillingDate, formatPlanPriceBRL, formatSalesLimit } from "../billingFormatters";

export default function SubscriptionSummaryCard({
  access,
  subscription,
  usage,
  limits,
  planName,
  planPriceMonthly,
  salesLimitMonthly,
}) {
  const monthlyLimit = limits?.monthly_sales_limit ?? salesLimitMonthly;
  const currentUsage = usage?.total_sales_month ?? limits?.current_month_sales;

  return (
    <section className="s7-billing-summary-card" aria-label="Resumo da assinatura">
      <SummaryRow label="Plano" value={planName || "—"} />
      <SummaryRow label="Valor mensal" value={planPriceMonthly != null ? `${formatPlanPriceBRL(planPriceMonthly)}/mês` : "—"} />
      <div className="s7-billing-summary-card__row">
        <strong>Status da assinatura</strong>
        <BillingStatusBadge state={access?.state} status={subscription?.status} />
      </div>
      <SummaryRow label="Status de acesso" value={access?.can_access ? "Liberado" : "Bloqueado"} />
      <SummaryRow label="Limite mensal de vendas" value={formatSalesLimit(monthlyLimit)} />
      <SummaryRow
        label="Consumo atual do mês"
        value={currentUsage != null ? `${Number(currentUsage).toLocaleString("pt-BR")} vendas` : "—"}
      />
      <SummaryRow label="Próxima cobrança" value={formatBillingDate(subscription?.next_due_date)} />
      <SummaryRow
        label="Período atual"
        value={`${formatBillingDate(subscription?.current_period_start)} — ${formatBillingDate(subscription?.current_period_end)}`}
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
