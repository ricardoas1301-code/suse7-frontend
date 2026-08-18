// =============================================================================
// Destinatários E-mail — Relatório de Vendas (SALES:MANUAL_SALES_REPORT).
// Mesmo padrão de leitura de grupos/regras do canal WhatsApp.
// =============================================================================

export const VENDAS_REPORT_EMAIL_MANUAL_CATEGORY = "SALES";
export const VENDAS_REPORT_EMAIL_MANUAL_TYPE = "MANUAL_SALES_REPORT";

/**
 * @param {Array<Record<string, unknown>>} rules
 */
function vendasReportEmailRules(rules) {
  return (rules ?? []).filter(
    (r) =>
      String(r?.category_code) === VENDAS_REPORT_EMAIL_MANUAL_CATEGORY &&
      String(r?.type_key) === VENDAS_REPORT_EMAIL_MANUAL_TYPE &&
      String(r?.channel) === "email",
  );
}

/**
 * @param {Array<Record<string, unknown>>} rules
 */
function enabledGroupIds(rules) {
  const ids = new Set();
  for (const r of vendasReportEmailRules(rules)) {
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
export function pickVendasReportEmailRecipients(input) {
  const groups = Array.isArray(input?.groups) ? input.groups : [];
  const rules = Array.isArray(input?.rules) ? input.rules : [];
  const ruleRows = vendasReportEmailRules(rules);
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
