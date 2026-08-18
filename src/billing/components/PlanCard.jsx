import { S7Button } from "../../components/ui";
import { resolvePlanDisplayName } from "../billingFormatters";
import {
  PLAN_ARSENAL_BUTTON_LABEL,
  PLAN_BABY_FREE_LABEL,
  PLAN_FREE_TRIAL_LABEL,
  PLAN_INCLUDED_FEATURES,
  PLAN_INCLUDED_FEATURES_TITLE,
} from "../planIncludedFeatures";
import {
  formatPlanCardPrice,
  formatPlanCardPriceSuffix,
  formatPlanCardSalesLimit,
  isQuotePlan,
} from "../planDisplay";
import { getPlanCardCtaState } from "../planCta";
import { resolvePlanSupportLabel } from "../planSupportChannels";
import { PLANS_ARSENAL_MODAL_ID } from "./PlansArsenalModal";

/**
 * @param {{
 *   plan: Record<string, unknown>;
 *   currentPlan: ReturnType<typeof import("../planCta").resolveCurrentPlanSnapshot> | null;
 *   catalogPlans: Record<string, unknown>[];
 *   onSelect: (plan: Record<string, unknown>, cta: ReturnType<typeof getPlanCardCtaState>) => void;
 *   onOpenArsenal: () => void;
 * }} props
 */
export default function PlanCard({ plan, currentPlan, catalogPlans, onSelect, onOpenArsenal }) {
  const cta = getPlanCardCtaState(plan, currentPlan, catalogPlans);
  const planKey = String(plan.plan_key ?? plan.slug ?? "").toLowerCase();
  const priceSuffix = formatPlanCardPriceSuffix(plan);
  const isBabyPlan = planKey === "baby";

  return (
    <article
      className={`s7-billing-plan-card${cta.isCurrent ? " s7-billing-plan-card--current" : ""}${isQuotePlan(plan) ? " s7-billing-plan-card--quote" : ""}`}
    >
      <div className="s7-billing-plan-card__body">
        <header className="s7-billing-plan-card__header">
          <div className="s7-billing-plan-card__title">
            <h3>{resolvePlanDisplayName(plan)}</h3>
          </div>
          {cta.badge ? <span className="s7-billing-plan-card__pill">{cta.badge}</span> : null}
        </header>

        <p className="s7-billing-plan-card__price">
          {formatPlanCardPrice(plan)}
          {priceSuffix ? <span>{priceSuffix}</span> : null}
        </p>
        {isBabyPlan ? (
          <p className="s7-billing-plan-card__features-title s7-billing-plan-card__trial">
            {PLAN_BABY_FREE_LABEL}
          </p>
        ) : (
          <p className="s7-billing-plan-card__features-title s7-billing-plan-card__trial">
            {PLAN_FREE_TRIAL_LABEL}
          </p>
        )}
        <p className="s7-billing-plan-card__limit">{formatPlanCardSalesLimit(plan)}</p>

        <div className="s7-billing-plan-card__features">
          <p className="s7-billing-plan-card__features-title">{PLAN_INCLUDED_FEATURES_TITLE}</p>
          <ul className="s7-billing-plan-card__highlights">
            {PLAN_INCLUDED_FEATURES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button
            type="button"
            className="s7-billing-plan-card__arsenal-link"
            aria-haspopup="dialog"
            aria-controls={PLANS_ARSENAL_MODAL_ID}
            onClick={(event) => {
              event.stopPropagation();
              onOpenArsenal();
            }}
          >
            {PLAN_ARSENAL_BUTTON_LABEL}
          </button>
        </div>
      </div>

      <div className="s7-billing-plan-card__footer">
        <p className="s7-billing-plan-card__support">
          Suporte: {resolvePlanSupportLabel(planKey)}
        </p>
        {cta.isCurrent ? (
          <p className="s7-billing-plan-card__current-status" aria-current="true">
            {cta.statusLabel}
          </p>
        ) : (
          <S7Button
            variant="primary"
            className="s7-billing-plan-card__cta"
            onClick={() => onSelect(plan, cta)}
          >
            {cta.displayLabel}
          </S7Button>
        )}
      </div>
    </article>
  );
}
