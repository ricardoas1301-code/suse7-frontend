// =============================================================================
// Destinatários E-mail marcados para Raio-X manual (motor central)
// =============================================================================

import { resolveRayxRecipientDisplayName } from "./resolveRayxRecipientDisplayName.js";

export const RAYX_MANUAL_CATEGORY = "SALES";
export const RAYX_MANUAL_TYPE = "MANUAL_SALE_RAYX";

/** @typedef {"event_delivery_rules" | "no_event_delivery_rules"} RayxEmailTargetsSource */

/**
 * @param {string} raw
 */
export function normalizeRayxEmailAddress(raw) {
  return String(raw ?? "").trim().toLowerCase();
}

/**
 * @param {Array<Record<string, unknown>>} rules
 */
function rayxEmailRules(rules) {
  return (rules ?? []).filter(
    (r) =>
      String(r?.category_code) === RAYX_MANUAL_CATEGORY &&
      String(r?.type_key) === RAYX_MANUAL_TYPE &&
      String(r?.channel) === "email",
  );
}

/**
 * @param {Array<Record<string, unknown>>} rules
 */
function enabledRayxEmailGroupIds(rules) {
  const ids = new Set();
  for (const r of rayxEmailRules(rules)) {
    if (r?.enabled === true && r?.recipient_group_id != null) {
      ids.add(String(r.recipient_group_id));
    }
  }
  return ids;
}

/**
 * @param {Record<string, unknown>} group
 */
function resolveGroupId(group) {
  const id = group?.group_id ?? group?.id;
  return id != null ? String(id).trim() : "";
}

/**
 * @param {{
 *   recipients?: Array<Record<string, unknown>>;
 *   groups?: Array<Record<string, unknown>>;
 *   rules?: Array<Record<string, unknown>>;
 * }} input
 * @returns {{
 *   targets: Array<{ recipientId: string | null; recipientEmail: string; recipientName?: string | null; label?: string }>;
 *   selected_targets_source: RayxEmailTargetsSource;
 *   enabled_group_ids: string[];
 * }}
 */
export function pickRayxManualEmailRecipients(input) {
  const groups = Array.isArray(input?.groups) ? input.groups : [];
  const rules = Array.isArray(input?.rules) ? input.rules : [];
  const ruleRows = rayxEmailRules(rules);
  const useEventRules = ruleRows.length > 0;
  const enabledGroups = enabledRayxEmailGroupIds(rules);
  const selected_targets_source = useEventRules
    ? "event_delivery_rules"
    : "no_event_delivery_rules";

  /** @type {Array<{ recipientId: string | null; recipientEmail: string; recipientName?: string | null; label?: string }>} */
  const collected = [];

  if (!useEventRules) {
    return { targets: [], selected_targets_source, enabled_group_ids: [] };
  }

  for (const g of groups) {
    if (g?.is_active === false) continue;
    const groupId = resolveGroupId(g);
    if (!groupId || !enabledGroups.has(groupId)) continue;

    const emailChannel = g?.channels?.email;
    if (!emailChannel || emailChannel.is_active === false) continue;
    const rawEmail = normalizeRayxEmailAddress(emailChannel.destination);
    if (!rawEmail.includes("@")) continue;

    const recipientName = resolveRayxRecipientDisplayName(g, emailChannel);

    collected.push({
      recipientId: emailChannel.id != null ? String(emailChannel.id) : null,
      recipientEmail: rawEmail,
      recipientName,
      label: recipientName ?? undefined,
    });
  }

  /** @type {Map<string, { recipientId: string | null; recipientEmail: string; recipientName?: string | null; label?: string }>} */
  const byEmail = new Map();
  for (const item of collected) {
    const key = normalizeRayxEmailAddress(item.recipientEmail);
    if (!key || byEmail.has(key)) continue;
    byEmail.set(key, item);
  }

  return {
    targets: [...byEmail.values()],
    selected_targets_source,
    enabled_group_ids: [...enabledGroups],
  };
}
