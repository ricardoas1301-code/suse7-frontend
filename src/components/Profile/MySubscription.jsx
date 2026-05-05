// ======================================================================
// PERFIL — ASSINATURA > MINHA ASSINATURA
// Visão de status e consumo mensal (mock inicial, backend-ready).
// ======================================================================

import { SUSE7_SUBSCRIPTION_PLANS, formatPlanPriceBRL } from "../../constants/subscriptionPlans";
import "./Subscription.css";

const MOCK_SUBSCRIPTION = {
  planKey: "start",
  status: "trialing",
  monthlyUsedSales: 72,
};

function statusLabel(status) {
  if (status === "trialing") return "Em período grátis";
  if (status === "active") return "Ativa";
  if (status === "past_due") return "Pagamento pendente";
  return "Em revisão";
}

export default function MySubscription() {
  const plan = SUSE7_SUBSCRIPTION_PLANS.find((item) => item.key === MOCK_SUBSCRIPTION.planKey) ?? SUSE7_SUBSCRIPTION_PLANS[0];
  const limit = plan.monthlySalesLimit ?? 0;
  const used = MOCK_SUBSCRIPTION.monthlyUsedSales;
  const usagePct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const usageTone =
    usagePct >= 100 ? "danger" : usagePct >= 80 ? "warning" : "normal";

  return (
    <div className="subscription-page">
      <h2>Minha assinatura</h2>
      <p>Resumo do seu plano atual e uso mensal consolidado de vendas.</p>

      <section className="subscription-status-card" aria-label="Status atual da assinatura">
        <div className="subscription-status-row">
          <strong>Plano atual</strong>
          <span>{plan.name} · {formatPlanPriceBRL(plan.priceCents)}/mês</span>
        </div>
        <div className="subscription-status-row">
          <strong>Status</strong>
          <span>{statusLabel(MOCK_SUBSCRIPTION.status)}</span>
        </div>
        <div className="subscription-status-row">
          <strong>Uso no mês</strong>
          <span>Você usou {used} de {limit || "∞"} vendas do seu plano {plan.name}.</span>
        </div>

        <div className="subscription-progress">
          <div className={`subscription-progress__bar subscription-progress__bar--${usageTone}`} style={{ width: `${usagePct}%` }} />
        </div>

        {usagePct >= 100 ? (
          <p className="subscription-alert subscription-alert--danger">
            Você atingiu o limite do plano. Recomendamos upgrade imediato.
          </p>
        ) : usagePct >= 80 ? (
          <p className="subscription-alert subscription-alert--warning">
            Atenção: seu uso está acima de 80% do limite mensal.
          </p>
        ) : (
          <p className="subscription-alert subscription-alert--normal">
            Uso dentro da faixa segura.
          </p>
        )}

        <button type="button" className="subscription-plan-cta">
          Alterar plano
        </button>
      </section>
    </div>
  );
}

