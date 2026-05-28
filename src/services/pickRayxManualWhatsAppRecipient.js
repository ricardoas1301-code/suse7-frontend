// =============================================================================
// Destinatários WhatsApp marcados para Raio-X manual (motor central)
// =============================================================================

export const RAYX_MANUAL_CATEGORY = "SALES";
export const RAYX_MANUAL_TYPE = "MANUAL_SALE_RAYX";

/** @typedef {"event_delivery_rules" | "no_event_delivery_rules"} RayxTargetsSource */

/**
 * Normaliza telefone BR (DDI 55) — alinhado ao backend manualSaleRayxRecipientTargets.
 * @param {string} raw
 */
export function normalizeBrazilWhatsAppPhone(raw) {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  while (digits.startsWith("0") && digits.length > 11) {
    digits = digits.slice(1);
  }
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    digits = `55${digits}`;
  }
  return digits;
}

/**
 * @param {Array<Record<string, unknown>>} rules
 */
function rayxWhatsAppRules(rules) {
  return (rules ?? []).filter(
    (r) =>
      String(r?.category_code) === RAYX_MANUAL_CATEGORY &&
      String(r?.type_key) === RAYX_MANUAL_TYPE &&
      String(r?.channel) === "whatsapp",
  );
}

/**
 * @param {Array<Record<string, unknown>>} rules
 */
function enabledRayxWhatsAppGroupIds(rules) {
  const ids = new Set();
  for (const r of rayxWhatsAppRules(rules)) {
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
 *   targets: Array<{ recipientId: string | null; recipientPhone: string; label?: string }>;
 *   duplicateRecipientsRemoved: Array<Record<string, unknown>>;
 *   phonesRaw: string[];
 *   phonesNormalized: string[];
 *   selected_targets_source: RayxTargetsSource;
 *   enabled_group_ids: string[];
 * }}
 */
export function pickRayxManualWhatsAppRecipients(input) {
  const groups = Array.isArray(input?.groups) ? input.groups : [];
  const rules = Array.isArray(input?.rules) ? input.rules : [];
  const ruleRows = rayxWhatsAppRules(rules);
  const useEventRules = ruleRows.length > 0;
  const enabledGroups = enabledRayxWhatsAppGroupIds(rules);
  const selected_targets_source = useEventRules
    ? "event_delivery_rules"
    : "no_event_delivery_rules";

  /** @type {Array<{ recipientId: string | null; recipientPhone: string; label?: string; source: string }>} */
  const collected = [];
  /** @type {Array<Record<string, unknown>>} */
  const duplicateRecipientsRemoved = [];
  const phonesRaw = [];

  const pushCandidate = (candidate) => {
    const rawPhone = String(candidate.recipientPhone ?? "").replace(/\D/g, "");
    phonesRaw.push(rawPhone);
    collected.push({ ...candidate, recipientPhone: rawPhone });
  };

  if (!useEventRules) {
    return {
      targets: [],
      duplicateRecipientsRemoved,
      phonesRaw,
      phonesNormalized: [],
      selected_targets_source,
      enabled_group_ids: [],
    };
  }

  for (const g of groups) {
    if (g?.is_active === false) continue;
    const groupId = resolveGroupId(g);
    if (!groupId || !enabledGroups.has(groupId)) continue;

    const wa = g?.channels?.whatsapp;
    if (!wa || wa.is_active === false) continue;
    const rawPhone = String(wa.destination ?? "").replace(/\D/g, "");
    if (rawPhone.length < 10) continue;

    pushCandidate({
      recipientId: wa.id != null ? String(wa.id) : null,
      recipientPhone: rawPhone,
      label: g?.label != null ? String(g.label) : undefined,
      source: "event_delivery_rules",
    });
  }

  /** @type {Map<string, { recipientId: string | null; recipientPhone: string; label?: string }>} */
  const byPhone = new Map();
  for (const item of collected) {
    const normalized = normalizeBrazilWhatsAppPhone(item.recipientPhone);
    if (!normalized || normalized.length < 12) continue;
    if (byPhone.has(normalized)) {
      duplicateRecipientsRemoved.push({
        recipient_id: item.recipientId,
        recipient_phone_raw: item.recipientPhone,
        recipient_phone_normalized: normalized,
        source: item.source,
        kept_recipient_id: byPhone.get(normalized)?.recipientId ?? null,
        reason: "DUPLICATE_NORMALIZED_PHONE",
      });
      continue;
    }
    byPhone.set(normalized, {
      recipientId: item.recipientId,
      recipientPhone: normalized,
      label: item.label,
    });
  }

  const targets = [...byPhone.values()];
  return {
    targets,
    duplicateRecipientsRemoved,
    phonesRaw,
    phonesNormalized: targets.map((t) => t.recipientPhone),
    selected_targets_source,
    enabled_group_ids: [...enabledGroups],
  };
}

/** @deprecated Use pickRayxManualWhatsAppRecipients */
export function pickRayxManualWhatsAppRecipient(recipients) {
  const { targets } = pickRayxManualWhatsAppRecipients({ recipients });
  if (!targets.length) return { recipientId: null, recipientPhone: null };
  return targets[0];
}
