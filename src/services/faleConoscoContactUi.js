// ======================================================================
// Fale Conosco — assuntos canônicos (UI)
// ======================================================================

/** @type {readonly string[]} */
export const FALE_CONOSCO_SUBJECT_OPTIONS = [
  "Suporte técnico",
  "Dúvidas sobre assinatura",
  "Plano Infinity",
  "Sugestão",
  "Problema com precificação",
  "Outro",
];

/**
 * @param {string | null | undefined} subject
 */
export function isKnownFaleConoscoSubject(subject) {
  const value = String(subject ?? "").trim();
  return FALE_CONOSCO_SUBJECT_OPTIONS.includes(value);
}
