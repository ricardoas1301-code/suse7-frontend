// ======================================================================
// DEV-only — previews e mocks nunca em build de produção (Fase 3.0.4)
// ======================================================================

/**
 * Preview de billing (finance / payments) — somente Vite DEV.
 * Em `vite build`, import.meta.env.DEV é false: retorna sempre false.
 *
 * @param {string | null | undefined} previewParam
 * @param {"finance" | "payments" | "payment-methods"} kind
 */
export function isBillingDevPreviewEnabled(previewParam, kind) {
  if (!import.meta.env.DEV || import.meta.env.PROD) return false;
  return String(previewParam ?? "") === kind;
}
