// =============================================================================
// Destinatários E-mail — Relatório de Concorrência (COMPETITION:MANUAL_COMPETITION_REPORT).
// =============================================================================

export const CONCORRENCIA_REPORT_EMAIL_MANUAL_CATEGORY = "COMPETITION";
export const CONCORRENCIA_REPORT_EMAIL_MANUAL_TYPE = "MANUAL_COMPETITION_REPORT";

/**
 * @param {Array<Record<string, unknown>>} rules
 */
function concorrenciaReportEmailRules(rules) {
  return (rules ?? []).filter(
    (r) =>
      String(r?.category_code) === CONCORRENCIA_REPORT_EMAIL_MANUAL_CATEGORY &&
      String(r?.type_key) === CONCORRENCIA_REPORT_EMAIL_MANUAL_TYPE &&
      String(r?.channel) === "email",
  );
}

/**
 * @param {Array<Record<string, unknown>>} rules
 */
function enabledGroupIds(rules) {
  const ids = new Set();
  for (const r of concorrenciaReportEmailRules(rules)) {
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
export function pickConcorrenciaReportEmailRecipients(input) {
  const groups = Array.isArray(input?.groups) ? input.groups : [];
  const rules = Array.isArray(input?.rules) ? input.rules : [];
  const ruleRows = concorrenciaReportEmailRules(rules);
  if (ruleRows.length === 0) return { targets: [] };

  const enabled = enabledGroupIds(rules);
  /** @type {Map<string, { recipientId: string | null; recipientEmail: string; label?: string }>} */
  const byEmail = new Map();

  for (const g of groups) {
    if (g?.is_active === false) continue;
    const groupId = resolveGroupId(g);
    if (!groupId || !enabled.has(groupId)) continue;

    const emailChannel = g?.channels?.email;
    if (!emailChannel || emailChannel.is_active === false) continue;
    const rawEmail = String(emailChannel.destination ?? "")
      .trim()
      .toLowerCase();
    if (!rawEmail || !rawEmail.includes("@")) continue;
    if (byEmail.has(rawEmail)) continue;

    byEmail.set(rawEmail, {
      recipientId: emailChannel.id != null ? String(emailChannel.id) : null,
      recipientEmail: rawEmail,
      label: g?.label != null ? String(g.label) : undefined,
    });
  }

  return { targets: [...byEmail.values()] };
}
