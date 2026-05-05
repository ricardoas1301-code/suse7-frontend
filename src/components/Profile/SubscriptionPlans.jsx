// ======================================================================
// PERFIL — ASSINATURA > PLANOS
// Catálogo visual de planos (fonte: constants/subscriptionPlans.js)
// ======================================================================

import { SUSE7_SUBSCRIPTION_PLANS, formatPlanPriceBRL } from "../../constants/subscriptionPlans";
import "./Subscription.css";

function planCta(plan) {
  if (plan.key === "baby") return "Começar grátis";
  if (plan.key === "enterprise") return "Falar com suporte";
  return "Testar 15 dias grátis";
}

function planLimitLabel(plan) {
  if (plan.monthlySalesLimit == null) return `Acima de ${plan.minMonthlySales} vendas/mês`;
  return `Até ${plan.monthlySalesLimit} vendas/mês`;
}

export default function SubscriptionPlans() {
  return (
    <div className="subscription-page">
      <h2>Planos</h2>
      <p>Escolha o plano ideal para o seu momento. Sem fidelidade e cancelamento a qualquer momento.</p>

      <section className="subscription-plans-grid" aria-label="Catálogo de planos do Suse7">
        {SUSE7_SUBSCRIPTION_PLANS.map((plan) => (
          <article
            key={plan.key}
            className={`subscription-plan-card${plan.recommended ? " subscription-plan-card--recommended" : ""}`}
          >
            <header className="subscription-plan-card__header">
              <h3>{plan.name}</h3>
              {plan.badge ? <span className="subscription-plan-badge">{plan.badge}</span> : null}
            </header>

            <p className="subscription-plan-price">{formatPlanPriceBRL(plan.priceCents)}<span>/mês</span></p>
            <p className="subscription-plan-limit">{planLimitLabel(plan)}</p>
            <p className="subscription-plan-profile">Perfil: {plan.profile}</p>
            <p className="subscription-plan-description">{plan.description}</p>

            {!plan.isFree ? (
              <p className="subscription-plan-trial">{plan.trialDays} dias grátis · Sem fidelidade</p>
            ) : null}

            <button type="button" className="subscription-plan-cta">
              {planCta(plan)}
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

