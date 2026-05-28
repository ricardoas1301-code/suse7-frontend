import { formatBillingDate } from "./billingFormatters";

/**
 * @param {Record<string, unknown> | null | undefined} subscription
 * @param {Record<string, unknown> | null | undefined} access
 */
export function canRequestSubscriptionCancellation(subscription, access) {
  if (!subscription || !access?.can_access) return false;
  const provider = String(subscription.provider || "").toLowerCase();
  const status = String(subscription.status || access.subscription_status || "").toLowerCase();
  if (subscription.cancel_at_period_end === true) return false;
  if (provider === "internal" && (status === "internal_free" || status === "active")) return false;
  return ["active", "past_due", "pending"].includes(status);
}

/**
 * @param {Record<string, unknown> | null | undefined} subscription
 * @param {string | null | undefined} accessEndsAt
 */
export function resolveSubscriptionAccessEndLabel(subscription, accessEndsAt) {
  const value = accessEndsAt || subscription?.access_ends_at || subscription?.current_period_end;
  return formatBillingDate(value);
}
