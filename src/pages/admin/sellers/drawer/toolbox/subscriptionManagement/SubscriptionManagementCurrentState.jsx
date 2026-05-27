import { memo } from "react";
import {
  formatSalesLimit,
  formatSubscriptionPrice,
  resolveBillingCycleLabel,
  resolveSubscriptionStatusLabel,
  subscriptionManagementStatusClassName,
} from "./subscriptionManagementModel";
import "./SubscriptionManagementCurrentState.css";

/**
 * @param {{ state: import("./subscriptionManagementModel").SubscriptionManagementStateViewModel }} props
 */
function SubscriptionManagementCurrentState({ state }) {
  return (
    <section className="subscription-management-current-state" aria-label="Estado atual da assinatura">
      <header className="subscription-management-current-state__head">
        <h5 className="subscription-management-current-state__title">Estado operacional</h5>
        <span className={subscriptionManagementStatusClassName(state.subscriptionStatus)}>
          {resolveSubscriptionStatusLabel(state.subscriptionStatus)}
        </span>
      </header>

      <dl className="subscription-management-current-state__grid">
        <div className="subscription-management-current-state__item">
          <dt>Plano</dt>
          <dd>{state.currentPlan}</dd>
        </div>
        <div className="subscription-management-current-state__item">
          <dt>Valor assinatura</dt>
          <dd>{formatSubscriptionPrice(state.subscriptionPrice)}</dd>
        </div>
        <div className="subscription-management-current-state__item">
          <dt>Limite mensal</dt>
          <dd>{formatSalesLimit(state.salesLimit)}</dd>
        </div>
        <div className="subscription-management-current-state__item">
          <dt>Consumo atual</dt>
          <dd>{formatSalesLimit(state.currentConsumption)}</dd>
        </div>
        <div className="subscription-management-current-state__item">
          <dt>Disponível</dt>
          <dd className="subscription-management-current-state__value--available">
            {formatSalesLimit(state.remainingSales)}
          </dd>
        </div>
        <div className="subscription-management-current-state__item">
          <dt>Ciclo</dt>
          <dd>{resolveBillingCycleLabel(state.billingCycle)}</dd>
        </div>
      </dl>
    </section>
  );
}

export default memo(SubscriptionManagementCurrentState);
