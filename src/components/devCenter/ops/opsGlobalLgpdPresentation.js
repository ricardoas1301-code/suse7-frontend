// =============================================================================
// Dev Center S_4.8.1 — helpers LGPD (renderização segura)
// =============================================================================

const DASH = "—";
const SAFE_ERROR_FALLBACK = "Não foi possível concluir a operação. Tente novamente.";

/**
 * Campo mascarado do contrato detail — NUNCA faz fallback para campo cru.
 * @param {Record<string, unknown> | null | undefined} customer
 * @param {"document_masked" | "email_masked" | "phone_masked"} maskedKey
 */
export function formatContractMaskedField(customer, maskedKey) {
  const s = String(customer?.[maskedKey] ?? "").trim();
  return s || "Não informado";
}

/**
 * Campo mascarado da listagem (chaves document/email/phone já vêm mascaradas do backend).
 * @param {unknown} value
 */
export function formatGlobalListMaskedField(value) {
  const s = String(value ?? "").trim();
  return s || DASH;
}

/**
 * Referência externa (buyer id, conta) — truncada para reduzir reidentificação.
 * @param {unknown} value
 * @param {number} [visible=6]
 */
export function formatExternalRef(value, visible = 6) {
  const s = String(value ?? "").trim();
  if (!s) return DASH;
  if (s.length <= visible + 2) return `${s.slice(0, 2)}••••`;
  return `${s.slice(0, visible)}…`;
}

/**
 * Mensagem de erro segura — evita ecoar PII vinda do backend por engano.
 * @param {unknown} error
 * @param {string} [fallback=SAFE_ERROR_FALLBACK]
 */
export function devCenterSafeErrorMessage(error, fallback = SAFE_ERROR_FALLBACK) {
  const s = String(error ?? "").trim();
  if (!s) return fallback;
  if (/@/.test(s)) return fallback;
  if (/\d{9,}/.test(s.replace(/\D/g, ""))) return fallback;
  if (/document_normalized|email_normalized|dedupe_key/i.test(s)) return fallback;
  return s;
}

export { SAFE_ERROR_FALLBACK };
