import { formatBillingDate } from "./billingFormatters";

/**
 * @param {Record<string, unknown> | null | undefined} subscription
 */
export function canReactivateSubscription(subscription) {
  return subscription?.cancel_at_period_end === true;
}

/**
 * @param {Record<string, unknown> | null | undefined} subscription
 * @param {Record<string, unknown> | null | undefined} access
 */
export function resolvePlanChangeAccessEndLabel(subscription, access) {
  const value =
    subscription?.plan_change_access_ends_at ??
    subscription?.current_period_end ??
    access?.current_period_end ??
    null;
  return formatBillingDate(value);
}
