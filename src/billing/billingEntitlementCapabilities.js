// ======================================================================
// Capabilities — gate frontend modular (S1.HF.6.8)
// ======================================================================

export const BILLING_ACCESS_PROFILE = {
  FULL_ACCESS: "FULL_ACCESS",
  EXECUTIVE_ONLY: "EXECUTIVE_ONLY",
  ARCHIVE_READ_ONLY: "ARCHIVE_READ_ONLY",
  FINANCIAL_RECOVERY_ONLY: "FINANCIAL_RECOVERY_ONLY",
};

export const BILLING_ENTITLEMENT_CAPABILITY = {
  VIEW_EXECUTIVE_CARDS: "VIEW_EXECUTIVE_CARDS",
  VIEW_STORED_LISTS: "VIEW_STORED_LISTS",
  USE_LIST_FILTERS: "USE_LIST_FILTERS",
  VIEW_STORED_DETAILS: "VIEW_STORED_DETAILS",
  VIEW_LIVE_DETAILS: "VIEW_LIVE_DETAILS",
  RUN_REPORTS: "RUN_REPORTS",
  EXPORT_DATA: "EXPORT_DATA",
  EXECUTE_BATCH_ACTIONS: "EXECUTE_BATCH_ACTIONS",
  CHANGE_MARKETPLACE_DATA: "CHANGE_MARKETPLACE_DATA",
  RUN_AUTOMATIONS: "RUN_AUTOMATIONS",
  REQUEST_MANUAL_SYNC: "REQUEST_MANUAL_SYNC",
  RECEIVE_AND_PROCESS_WEBHOOKS: "RECEIVE_AND_PROCESS_WEBHOOKS",
  CALL_MARKETPLACE_APIS: "CALL_MARKETPLACE_APIS",
  MANAGE_BILLING: "MANAGE_BILLING",
  CHANGE_PLAN: "CHANGE_PLAN",
};

/** Aliases legados 6.7 */
export const BILLING_ENTITLEMENT_CAPABILITY_LEGACY = {
  executive_cards: BILLING_ENTITLEMENT_CAPABILITY.VIEW_EXECUTIVE_CARDS,
  detailed_lists: BILLING_ENTITLEMENT_CAPABILITY.VIEW_STORED_LISTS,
  filters_search: BILLING_ENTITLEMENT_CAPABILITY.USE_LIST_FILTERS,
  sale_rayx: BILLING_ENTITLEMENT_CAPABILITY.VIEW_LIVE_DETAILS,
  listing_rayx: BILLING_ENTITLEMENT_CAPABILITY.VIEW_LIVE_DETAILS,
  detail_modals: BILLING_ENTITLEMENT_CAPABILITY.VIEW_STORED_DETAILS,
  reports: BILLING_ENTITLEMENT_CAPABILITY.RUN_REPORTS,
  exports: BILLING_ENTITLEMENT_CAPABILITY.EXPORT_DATA,
  batch_actions: BILLING_ENTITLEMENT_CAPABILITY.EXECUTE_BATCH_ACTIONS,
  automations: BILLING_ENTITLEMENT_CAPABILITY.RUN_AUTOMATIONS,
  marketplace_ops: BILLING_ENTITLEMENT_CAPABILITY.CHANGE_MARKETPLACE_DATA,
  active_sync: BILLING_ENTITLEMENT_CAPABILITY.REQUEST_MANUAL_SYNC,
  webhook_ingest: BILLING_ENTITLEMENT_CAPABILITY.RECEIVE_AND_PROCESS_WEBHOOKS,
  executive_refresh: BILLING_ENTITLEMENT_CAPABILITY.VIEW_EXECUTIVE_CARDS,
};

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
export function pickEntitlementCapabilitiesSource(source) {
  if (!source || typeof source !== "object") return null;
  if (source.capabilities && typeof source.capabilities === "object") return source;
  if (source.subscription_entitlement?.capabilities) return source.subscription_entitlement;
  if (source.renewal_experience?.capabilities) return source.renewal_experience;
  return source.subscription_entitlement ?? source.renewal_experience ?? null;
}

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
export function resolveAccessProfile(source) {
  const row = pickEntitlementCapabilitiesSource(source) ?? source;
  if (!row || typeof row !== "object") return BILLING_ACCESS_PROFILE.FULL_ACCESS;
  if (row.access_profile) return String(row.access_profile);
  if (source?.access_profile) return String(source.access_profile);
  return BILLING_ACCESS_PROFILE.FULL_ACCESS;
}

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
export function resolveEntitlementCapabilities(source) {
  const row = pickEntitlementCapabilitiesSource(source);
  const caps = row?.capabilities;
  if (!caps || typeof caps !== "object") return null;
  return /** @type {Record<string, boolean>} */ (caps);
}

/**
 * @param {Record<string, unknown> | null | undefined} source
 * @param {string} capability
 */
export function hasEntitlementCapability(source, capability) {
  const caps = resolveEntitlementCapabilities(source);
  if (!caps) return true;
  if (Object.prototype.hasOwnProperty.call(caps, capability)) {
    return Boolean(caps[capability]);
  }
  const legacyKey = Object.entries(BILLING_ENTITLEMENT_CAPABILITY_LEGACY).find(([, v]) => v === capability)?.[0];
  if (legacyKey && Object.prototype.hasOwnProperty.call(caps, legacyKey)) {
    return Boolean(caps[legacyKey]);
  }
  return false;
}

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
export function isExecutiveOnlyProfile(source) {
  return resolveAccessProfile(source) === BILLING_ACCESS_PROFILE.EXECUTIVE_ONLY;
}

/**
 * Causa canônica — NUNCA inferir só por EXECUTIVE_ONLY (S1.HF.6.9A.11A).
 *
 * @param {Record<string, unknown> | null | undefined} source
 */
export function resolveRestrictionCause(source) {
  const row = pickEntitlementCapabilitiesSource(source) ?? source ?? {};
  const reason = String(row.access_restriction_reason ?? row.access_reason ?? "");
  const owner = String(row.access_owner ?? "");
  const entitlement = String(row.effective_entitlement ?? "");
  if (
    reason === "TRIAL_EXPIRED" ||
    owner === "TRIAL_LIFECYCLE_ENGINE" ||
    entitlement === "TRIAL_EXPIRED_RESTRICTED"
  ) {
    return "TRIAL_EXPIRED";
  }
  if (owner === "BABY_QUOTA_ENGINE" || entitlement === "BABY_INTERNAL_FREE") {
    return "BABY_QUOTA";
  }
  if (String(row.usage_state ?? "") === "LIMIT_RESTRICTED") {
    return "PAID_USAGE_LIMIT";
  }
  if (resolveAccessProfile(source) === BILLING_ACCESS_PROFILE.FINANCIAL_RECOVERY_ONLY) {
    return "FINANCIAL_DELINQUENCY";
  }
  if (isExecutiveOnlyProfile(source)) return "UNKNOWN_EXECUTIVE_ONLY";
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
export function isTrialExpiredRestriction(source) {
  return resolveRestrictionCause(source) === "TRIAL_EXPIRED";
}

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
export function isArchiveReadOnlyProfile(source) {
  return resolveAccessProfile(source) === BILLING_ACCESS_PROFILE.ARCHIVE_READ_ONLY;
}

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
export function pickArchiveFreshnessLabel(source) {
  const row = pickEntitlementCapabilitiesSource(source) ?? source;
  const raw = row?.last_data_updated_at ?? source?.last_data_updated_at ?? null;
  if (!raw) return null;
  const parsed = Date.parse(String(raw));
  if (!Number.isFinite(parsed)) return null;
  const d = new Date(parsed);
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `Dados atualizados até ${date} às ${time}`;
}
