// ======================================================================
// Canais de suporte por plano (apresentação comercial)
// ======================================================================

/** @type {Record<string, string>} */
export const PLAN_SUPPORT_BY_KEY = {
  baby: "E-mail",
  start: "E-mail",
  crescer: "E-mail prioritário",
  pro: "E-mail / Ticket",
  scale: "E-mail / WhatsApp / Ticket",
  elite: "E-mail / WhatsApp / Ticket",
  enterprise: "E-mail / WhatsApp / Ticket",
  infinity: "E-mail / WhatsApp / Ticket",
};

/**
 * @param {string | null | undefined} planKey
 */
export function resolvePlanSupportLabel(planKey) {
  const key = String(planKey || "").trim().toLowerCase();
  return PLAN_SUPPORT_BY_KEY[key] ?? "E-mail / WhatsApp / Ticket";
}
