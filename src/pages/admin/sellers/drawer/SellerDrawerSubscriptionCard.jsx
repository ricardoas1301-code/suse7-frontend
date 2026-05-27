import { memo } from "react";
import SellerDrawerSection from "./SellerDrawerSection";
import { formatPlanDisplay, formatSellerDate } from "../sellerOpsUtils";
import { formatSubscriptionCycleLabel, formatSubscriptionStatusLabel } from "./sellerDrawerSectionModel";

/**
 * @param {{
 *   subscription?: Record<string, unknown> | null;
 *   metrics?: Record<string, unknown> | null;
 *   state?: "loading" | "loaded" | "empty" | "error";
 * }} props
 */
function SellerDrawerSubscriptionCard({ subscription = null, metrics = null, state = "loaded" }) {
  const hasSubscription = Boolean(subscription);

  return (
    <SellerDrawerSection
      title="Assinatura"
      subtitle="Situação comercial"
      state={state === "loaded" && !hasSubscription ? "empty" : state}
      emptyMessage="Sem assinatura vinculada."
    >
      {hasSubscription ? (
        <dl className="seller-drawer-kv">
          <div className="seller-drawer-kv__row">
            <dt>Plano</dt>
            <dd>{formatPlanDisplay(subscription.plan_key, subscription.plan_label)}</dd>
          </div>
          <div className="seller-drawer-kv__row">
            <dt>Status</dt>
            <dd>{formatSubscriptionStatusLabel(subscription)}</dd>
          </div>
          <div className="seller-drawer-kv__row">
            <dt>Ciclo</dt>
            <dd>{formatSubscriptionCycleLabel(subscription)}</dd>
          </div>
          <div className="seller-drawer-kv__row">
            <dt>Renovação</dt>
            <dd>{formatSellerDate(/** @type {string | null | undefined} */ (subscription.current_period_end))}</dd>
          </div>
          <div className="seller-drawer-kv__row">
            <dt>Consumo resumido</dt>
            <dd>{formatConsumptionSummary(metrics)}</dd>
          </div>
        </dl>
      ) : null}
    </SellerDrawerSection>
  );
}

/**
 * @param {Record<string, unknown> | null | undefined} metrics
 */
function formatConsumptionSummary(metrics) {
  const recent = Number(metrics?.sales_recent_30d ?? NaN);
  if (Number.isFinite(recent)) {
    return recent === 1 ? "1 venda nos últimos 30 dias" : `${recent} vendas nos últimos 30 dias`;
  }
  return "—";
}

export default memo(SellerDrawerSubscriptionCard);
