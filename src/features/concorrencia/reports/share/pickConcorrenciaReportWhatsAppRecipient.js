// =============================================================================
// Destinatários WhatsApp — Relatório de Concorrência (COMPETITION:MANUAL_COMPETITION_REPORT).
// =============================================================================

import { normalizeBrazilWhatsAppPhone } from "../../../../services/pickRayxManualWhatsAppRecipient.js";

export const CONCORRENCIA_REPORT_MANUAL_CATEGORY = "COMPETITION";
export const CONCORRENCIA_REPORT_MANUAL_TYPE = "MANUAL_COMPETITION_REPORT";

/**
 * @param {Array<Record<string, unknown>>} rules
 */
function concorrenciaReportWhatsAppRules(rules) {
  return (rules ?? []).filter(
    (r) =>
      String(r?.category_code) === CONCORRENCIA_REPORT_MANUAL_CATEGORY &&
      String(r?.type_key) === CONCORRENCIA_REPORT_MANUAL_TYPE &&
      String(r?.channel) === "whatsapp",
  );
}

/**
 * @param {Array<Record<string, unknown>>} rules
 */
function enabledGroupIds(rules) {
  const ids = new Set();
  for (const r of concorrenciaReportWhatsAppRules(rules)) {
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
 *   groups?: Array<Record<string, unknown>>;
 *   rules?: Array<Record<string, unknown>>;
 * }} input
 */
export function pickConcorrenciaReportWhatsAppRecipients(input) {
  const groups = Array.isArray(input?.groups) ? input.groups : [];
  const rules = Array.isArray(input?.rules) ? input.rules : [];
  const ruleRows = concorrenciaReportWhatsAppRules(rules);
  if (ruleRows.length === 0) return { targets: [] };

  const enabled = enabledGroupIds(rules);
  /** @type {Map<string, { recipientId: string | null; recipientPhone: string; label?: string }>} */
  const byPhone = new Map();

  for (const g of groups) {
    if (g?.is_active === false) continue;
    const groupId = resolveGroupId(g);
    if (!groupId || !enabled.has(groupId)) continue;

    const wa = g?.channels?.whatsapp;
    if (!wa || wa.is_active === false) continue;
    const rawPhone = String(wa.destination ?? "").replace(/\D/g, "");
    if (rawPhone.length < 10) continue;

    const normalized = normalizeBrazilWhatsAppPhone(rawPhone);
    if (!normalized || normalized.length < 12) continue;
    if (byPhone.has(normalized)) continue;

    byPhone.set(normalized, {
      recipientId: wa.id != null ? String(wa.id) : null,
      recipientPhone: normalized,
      label: g?.label != null ? String(g.label) : undefined,
    });
  }

  return { targets: [...byPhone.values()] };
}
