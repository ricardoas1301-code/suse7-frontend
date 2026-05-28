import { S7Button } from "../../components/ui";
import { formatPlanPriceBRL, formatSalesLimit, resolvePlanDisplayName } from "../billingFormatters";
import { getPlanCardCtaState } from "../planCta";
import { getPlanPresentation } from "../planPresentation";

export default function PlanCard({ plan, currentPlan, catalogPlans, onSelect }) {
  const presentation = getPlanPresentation(plan.plan_key ?? plan.slug);
  const cta = getPlanCardCtaState(plan, currentPlan, catalogPlans);

  return (
    <article
      className={`s7-billing-plan-card${presentation.recommended ? " s7-billing-plan-card--recommended" : ""}${cta.isCurrent ? " s7-billing-plan-card--current" : ""}`}
    >
      <header className="s7-billing-plan-card__header">
        <PlanCardTitle plan={plan} presentation={presentation} />
        {cta.badge ? <span className="s7-billing-plan-card__pill">{cta.badge}</span> : null}
      </header>

      <p className="s7-billing-plan-card__price">
        {formatPlanPriceBRL(plan.price_monthly)}
        <span>/mês</span>
      </p>
      <p className="s7-billing-plan-card__limit">{formatSalesLimit(plan.sales_limit_monthly)}</p>

      <ul className="s7-billing-plan-card__highlights">
        {presentation.highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <PlanCardMeta presentation={presentation} />

      <S7Button
        variant={presentation.recommended ? "primary" : "secondary"}
        className="s7-billing-plan-card__cta"
        disabled={cta.disabled}
        onClick={() => onSelect(plan, cta)}
      >
        {cta.label}
      </S7Button>
    </article>
  );
}

function PlanCardTitle({ plan, presentation }) {
  return (
    <div className="s7-billing-plan-card__title">
      <h3>{resolvePlanDisplayName(plan)}</h3>
      <span className="s7-billing-plan-card__tier">{presentation.tier}</span>
    </div>
  );
}

function PlanCardMeta({ presentation }) {
  return (
    <div className="s7-billing-plan-card__meta">
      <span>Marketplaces: {presentation.marketplaces}</span>
      <span>Suporte: {presentation.support}</span>
    </div>
  );
}
