import BillingStatusBadge from "./BillingStatusBadge";
import { formatPlanPriceBRL, formatSalesLimit, resolvePlanDisplayName } from "../billingFormatters";

export default function SubscriptionPlanCard({ access, subscription, plan, planName, planPriceMonthly, salesLimitMonthly }) {
  const displayName = planName || resolvePlanDisplayName(plan) || subscription?.plan_key || "Plano atual";
  const price = planPriceMonthly ?? plan?.price_monthly ?? subscription?.amount;
  const limitValue = salesLimitMonthly ?? plan?.sales_limit_monthly ?? null;

  return (
    <section className="s7-billing-plan-hero" aria-label="Plano atual">
      <header className="s7-billing-plan-hero__header">
        <div>
          <p className="s7-billing-plan-hero__eyebrow">Plano atual</p>
          <h2>{displayName}</h2>
          <p className="s7-billing-plan-hero__price">
            {formatPlanPriceBRL(price)}
            <span>/mês</span>
          </p>
        </div>
        <div className="s7-billing-plan-hero__badges">
          <BillingStatusBadge state={access?.state} status={subscription?.status} />
          <span className={`s7-billing-plan-hero__access s7-billing-plan-hero__access--${access?.can_access ? "on" : "off"}`}>
            {access?.can_access ? "Acesso liberado" : "Acesso bloqueado"}
          </span>
        </div>
      </header>
      <p className="s7-billing-plan-hero__meta">Limite mensal: {formatSalesLimit(limitValue)}</p>
    </section>
  );
}
