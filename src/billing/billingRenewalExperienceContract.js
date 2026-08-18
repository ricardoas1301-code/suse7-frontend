// ======================================================================
// Contrato runtime — renewal experience (normalização única frontend)
// ======================================================================

import { RENEWAL_EXPERIENCE_STATE } from "./renewalExperienceUi.js";

/**
 * @param {Record<string, unknown> | null | undefined} raw
 */
export function normalizeBillingRenewalExperience(raw) {
  if (!raw || typeof raw !== "object") return null;

  const nested = raw.renewal_experience ?? raw.renewalExperience;
  const source = nested && typeof nested === "object" ? nested : raw;

  const primaryActionRaw = source.primary_action ?? source.primaryAction;
  const primaryAction =
    typeof primaryActionRaw === "string"
      ? { action: primaryActionRaw, label: null }
      : primaryActionRaw && typeof primaryActionRaw === "object"
        ? {
            action: sourcePrimaryActionAction(primaryActionRaw),
            label: primaryActionRaw.label != null ? String(primaryActionRaw.label) : null,
          }
        : null;

  const planRaw = source.plan && typeof source.plan === "object" ? source.plan : null;
  const periodRaw = source.period && typeof source.period === "object" ? source.period : null;
  const cycleRaw = source.cycle && typeof source.cycle === "object" ? source.cycle : null;

  const renewalCycleId =
    source.renewal_cycle_id ??
    source.renewalCycleId ??
    cycleRaw?.id ??
    null;

  return {
    renewal_state: source.renewal_state != null ? String(source.renewal_state) : null,
    subscription_id: source.subscription_id != null ? String(source.subscription_id) : null,
    renewal_cycle_id: renewalCycleId != null ? String(renewalCycleId) : null,
    plan: planRaw
      ? {
          id: planRaw.id != null ? String(planRaw.id) : null,
          key: planRaw.key != null ? String(planRaw.key) : planRaw.plan_key != null ? String(planRaw.plan_key) : null,
          name: planRaw.name != null ? String(planRaw.name) : null,
          plan_key: planRaw.plan_key != null ? String(planRaw.plan_key) : null,
        }
      : null,
    amount: source.amount != null ? String(source.amount) : null,
    amount_source: source.amount_source != null ? String(source.amount_source).toUpperCase() : null,
    currency: source.currency != null ? String(source.currency) : "BRL",
    due_state: source.due_state != null ? String(source.due_state) : null,
    due_date: source.due_date != null ? String(source.due_date).slice(0, 10) : null,
    period: periodRaw
      ? {
          start: periodRaw.start != null ? String(periodRaw.start).slice(0, 10) : null,
          end: periodRaw.end != null ? String(periodRaw.end).slice(0, 10) : null,
        }
      : null,
    primary_action: primaryAction,
    available_actions: Array.isArray(source.available_actions)
      ? source.available_actions.map((item) => String(item))
      : [],
    available_payment_methods: Array.isArray(source.available_payment_methods)
      ? source.available_payment_methods.map((item) => String(item))
      : [],
    payment: source.payment ?? null,
    renewal_status: source.renewal_status != null ? String(source.renewal_status) : null,
    renewal_strategy: source.renewal_strategy != null ? String(source.renewal_strategy) : null,
    subscription_lifecycle_status:
      source.subscription_lifecycle_status != null ? String(source.subscription_lifecycle_status) : null,
    billing_financial_state: source.billing_financial_state != null ? String(source.billing_financial_state) : null,
    access_state: source.access_state != null ? String(source.access_state) : null,
    payment_context: source.payment_context != null ? String(source.payment_context) : null,
    days_past_due: source.days_past_due != null ? Number(source.days_past_due) : null,
    grace_period_start: source.grace_period_start != null ? String(source.grace_period_start).slice(0, 10) : null,
    grace_period_end: source.grace_period_end != null ? String(source.grace_period_end).slice(0, 10) : null,
    suspension_start: source.suspension_start != null ? String(source.suspension_start).slice(0, 10) : null,
    data_retention_days: source.data_retention_days != null ? Number(source.data_retention_days) : null,
    contracted_plan_key: source.contracted_plan_key != null ? String(source.contracted_plan_key) : null,
    contracted_subscription_state:
      source.contracted_subscription_state != null ? String(source.contracted_subscription_state) : null,
    effective_entitlement: source.effective_entitlement != null ? String(source.effective_entitlement) : null,
    effective_entitlement_source:
      source.effective_entitlement_source != null ? String(source.effective_entitlement_source) : null,
    effective_plan_key: source.effective_plan_key != null ? String(source.effective_plan_key) : null,
    effective_plan_label: source.effective_plan_label != null ? String(source.effective_plan_label) : null,
    usage_state: source.usage_state != null ? String(source.usage_state) : null,
    usage_count: source.usage_count != null ? Number(source.usage_count) : null,
    usage_limit: source.usage_limit != null ? Number(source.usage_limit) : null,
    suspension_fallback_active: Boolean(source.suspension_fallback_active),
    previous_contracted_plan_key:
      source.previous_contracted_plan_key != null ? String(source.previous_contracted_plan_key) : null,
    operational_blocked: source.operational_blocked != null ? Boolean(source.operational_blocked) : null,
    sync_state: source.sync_state != null ? String(source.sync_state) : null,
    capabilities: source.capabilities ?? null,
    trial_state: source.trial_state != null ? String(source.trial_state) : null,
    trial_start_date: source.trial_start_date != null ? String(source.trial_start_date).slice(0, 10) : null,
    trial_end_date: source.trial_end_date != null ? String(source.trial_end_date).slice(0, 10) : null,
    last_data_updated_at:
      source.last_data_updated_at != null ? String(source.last_data_updated_at).slice(0, 10) : null,
    data_gap: source.data_gap ?? null,
  };
}

/**
 * @param {Record<string, unknown>} primaryActionRaw
 */
function sourcePrimaryActionAction(primaryActionRaw) {
  return primaryActionRaw.action != null ? String(primaryActionRaw.action) : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} experience
 */
export function isRenewalExperienceHydrated(experience) {
  return Boolean(experience?.renewal_cycle_id);
}

/**
 * @param {Record<string, unknown> | null | undefined} experience
 */
export function canOpenRenewalCheckout(experience) {
  if (!isRenewalExperienceHydrated(experience)) return false;
  const state = String(experience?.renewal_state || "");
  if (state === RENEWAL_EXPERIENCE_STATE.RENEWAL_PAID) return false;
  return Boolean(
    experience?.primary_action?.action ||
      state === RENEWAL_EXPERIENCE_STATE.RENEWAL_AWAITING_GENERATION ||
      state === RENEWAL_EXPERIENCE_STATE.REACTIVATION_AWAITING_GENERATION
  );
}

/**
 * @param {Record<string, unknown> | null | undefined} left
 * @param {Record<string, unknown> | null | undefined} right
 */
export function pickPreferredRenewalExperience(left, right) {
  if (isRenewalExperienceHydrated(left)) return left;
  if (isRenewalExperienceHydrated(right)) return right;
  return left ?? right ?? null;
}
