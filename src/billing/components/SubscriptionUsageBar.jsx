import { resolveMonthlyUsageDisplay } from "../subscriptionUsage";

export default function SubscriptionUsageBar({ usage, limits, monthlySalesLimit }) {
  const display = resolveMonthlyUsageDisplay(usage, limits, monthlySalesLimit);

  return (
    <section className={`s7-billing-usage-bar s7-billing-usage-bar--${display.tone}`} aria-label="Consumo mensal de vendas">
      <div className="s7-billing-usage-bar__header">
        <strong>Consumo mensal do ecossistema</strong>
        <span>{display.mode === "open" ? display.limitLabel : display.percentLabel}</span>
      </div>
      <p className="s7-billing-usage-bar__caption">{display.usageLabel}</p>
      <div className="s7-billing-usage-bar__track" aria-hidden="true">
        <div className="s7-billing-usage-bar__fill" style={{ width: `${display.barPercent}%` }} />
      </div>
      {display.mode === "metered" ? (
        <p className="s7-billing-usage-bar__meta">Limite do plano: {display.limitLabel}</p>
      ) : (
        <p className="s7-billing-usage-bar__meta">O backend consolida vendas de todas as contas e marketplaces.</p>
      )}
    </section>
  );
}
