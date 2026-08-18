import BillingStatusBadge from "./BillingStatusBadge";
import { formatPlanPriceBRL, formatSalesLimit, resolvePlanDisplayName } from "../billingFormatters";
import {
  resolveEffectivePlanUsageLabel,
  resolveEffectiveUsageLimitLabel,
  resolveFinancialAccessStatusLabel,
  resolveFinancialSubscriptionStatusLabel,
} from "../billingFinancialStateUi.js";

export default function SubscriptionPlanCard({
  access,
  subscription,
  plan,
  planName,
  planPriceMonthly,
  salesLimitMonthly,
  renewalExperience = null,
}) {
  const displayName = planName || resolvePlanDisplayName(plan) || subscription?.plan_key || "Plano atual";
  const price = planPriceMonthly ?? plan?.price_monthly ?? null;
  const limitValue = salesLimitMonthly ?? plan?.sales_limit_monthly ?? null;
  const financialStatusLabel = resolveFinancialSubscriptionStatusLabel(renewalExperience);
  const financialAccessLabel = resolveFinancialAccessStatusLabel(renewalExperience);
  const effectivePlanLabel = resolveEffectivePlanUsageLabel(renewalExperience);
  const displayNameResolved = effectivePlanLabel ?? displayName;
  const accessLabel =
    financialAccessLabel ??
    (access?.can_access ? "Acesso liberado" : "Acesso bloqueado");
  const accessTone =
    financialAccessLabel === "Bloqueado" || access?.can_access === false ? "off" : "on";

  return (
    <section className="s7-billing-plan-hero" aria-label="Plano atual">
      <header className="s7-billing-plan-hero__header">
        <div>
          <p className="s7-billing-plan-hero__eyebrow">Plano atual</p>
          <h2>{displayNameResolved}</h2>
          <p className="s7-billing-plan-hero__price">
            {formatPlanPriceBRL(price)}
            <span>/mês</span>
          </p>
        </div>
        <div className="s7-billing-plan-hero__badges">
          {financialStatusLabel ? (
            <span className="s7-billing-plan-hero__status s7-billing-plan-hero__status--financial">
              {financialStatusLabel}
            </span>
          ) : (
            <BillingStatusBadge state={access?.state} status={subscription?.status} />
          )}
          <span className={`s7-billing-plan-hero__access s7-billing-plan-hero__access--${accessTone}`}>
            {accessLabel}
          </span>
        </div>
      </header>
      <p className="s7-billing-plan-hero__meta">Limite mensal: {formatSalesLimit(limitValue)}</p>
    </section>
  );
}
