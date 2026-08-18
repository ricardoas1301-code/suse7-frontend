// FIXTURE VISUAL — placeholders de pop-up por seção da Central de Notificações.
// Sem persistência, sem PATCH, sem chaves popup_alert.* reais.
// Remover ou substituir quando cada trilha de pop-ups for homologada.

import {
  S7_SALES_POPUP_PLACEHOLDER_SWITCH_HINT,
  S7_SALES_POPUP_VISUAL_PLACEHOLDERS,
} from "./salesPopupVisualPlaceholders";

export { S7_SALES_POPUP_PLACEHOLDER_SWITCH_HINT };

const COMPETITION_PLACEHOLDER_PREFIX = "S7_COMPETITION_POPUP_PLACEHOLDER";
const BILLING_PLACEHOLDER_PREFIX = "S7_BILLING_POPUP_PLACEHOLDER";

/** @type {readonly { key: string, label: string, description: string }[]} */
export const S7_COMPETITION_POPUP_VISUAL_PLACEHOLDERS = Object.freeze(
  [1, 2, 3, 4].map((index) => ({
    key: `${COMPETITION_PLACEHOLDER_PREFIX}_${index}`,
    label: `Pop-up provisório ${index}`,
    description: "Alerta provisório para validação visual da Central de Notificações.",
  }))
);

// FIXTURE VISUAL — substituir ou remover durante a trilha real de pop-ups de Assinatura e pagamentos.
/** @type {readonly { key: string, label: string, description: string }[]} */
export const S7_BILLING_POPUP_VISUAL_PLACEHOLDERS = Object.freeze(
  [1, 2, 3, 4].map((index) => ({
    key: `${BILLING_PLACEHOLDER_PREFIX}_${index}`,
    label: `Pop-up provisório ${index}`,
    description: "Alerta provisório para validação visual da Central de Notificações.",
  }))
);

/** @type {Readonly<Record<string, readonly { key: string, label: string, description: string }[]>>} */
export const NOTIFICATION_CENTER_VISUAL_POPUP_PLACEHOLDERS = Object.freeze({
  sales_profit: S7_SALES_POPUP_VISUAL_PLACEHOLDERS,
  competition: S7_COMPETITION_POPUP_VISUAL_PLACEHOLDERS,
  billing: S7_BILLING_POPUP_VISUAL_PLACEHOLDERS,
});

/** Chaves internas de seção com grade provisória (fixture visual exclusiva). */
export const NOTIFICATION_CENTER_VISUAL_POPUP_SECTION_KEYS = Object.freeze([
  "sales_profit",
  "competition",
  "billing",
]);

/** @param {string | null | undefined} sectionKey */
export function sectionUsesVisualPopupPlaceholders(sectionKey) {
  return NOTIFICATION_CENTER_VISUAL_POPUP_SECTION_KEYS.includes(String(sectionKey ?? "").trim());
}

/** @param {string | null | undefined} sectionKey */
export function resolveNotificationCenterVisualPopupPlaceholders(sectionKey) {
  return NOTIFICATION_CENTER_VISUAL_POPUP_PLACEHOLDERS[String(sectionKey ?? "").trim()] ?? null;
}
