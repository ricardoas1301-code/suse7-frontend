export const SELLER_TOOLBOX_REASON_MIN_LENGTH = 8;
export const SELLER_TOOLBOX_REASON_MAX_LENGTH = 300;

/** @typedef {{
 *   key: string;
 *   label: string;
 *   prefix: string;
 * }} SellerToolboxQuickReason
 */

/** @type {SellerToolboxQuickReason[]} */
export const SELLER_TOOLBOX_QUICK_REASONS = [
  { key: "operational_fix", label: "Correção operacional", prefix: "Correção operacional: " },
  { key: "internal_test", label: "Teste interno", prefix: "Teste interno: " },
  { key: "seller_request", label: "Solicitação do seller", prefix: "Solicitação do seller: " },
  { key: "investigation", label: "Investigação", prefix: "Investigação: " },
  { key: "other", label: "Outro", prefix: "" },
];

/**
 * @typedef {{
 *   actionId: string;
 *   reason: string;
 *   reasonCategory: string | null;
 *   isValid: boolean;
 *   title: string;
 *   description: string;
 *   riskLevel?: string | null;
 *   metadata?: Record<string, unknown>;
 * }} SellerToolboxReasonState
 */

/**
 * @param {string} reason
 */
export function normalizeSellerToolboxReasonText(reason) {
  return String(reason ?? "").trim();
}

/**
 * @param {string} reason
 */
export function validateSellerToolboxReasonText(reason) {
  const normalized = normalizeSellerToolboxReasonText(reason);
  const length = normalized.length;

  if (length < SELLER_TOOLBOX_REASON_MIN_LENGTH) {
    return {
      isValid: false,
      errorMessage: `Informe ao menos ${SELLER_TOOLBOX_REASON_MIN_LENGTH} caracteres.`,
      reasonLength: length,
    };
  }

  if (length > SELLER_TOOLBOX_REASON_MAX_LENGTH) {
    return {
      isValid: false,
      errorMessage: `Use no máximo ${SELLER_TOOLBOX_REASON_MAX_LENGTH} caracteres.`,
      reasonLength: length,
    };
  }

  return {
    isValid: true,
    errorMessage: "",
    reasonLength: length,
  };
}

/**
 * @param {Partial<SellerToolboxReasonState> | null | undefined} input
 * @returns {SellerToolboxReasonState | null}
 */
export function createSellerToolboxReasonState(input) {
  if (!input || typeof input !== "object") return null;

  const actionId = String(input.actionId ?? "").trim();
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim();
  if (!actionId || !title) return null;

  const reason = normalizeSellerToolboxReasonText(input.reason);
  const validation = validateSellerToolboxReasonText(reason);

  return {
    actionId,
    title,
    description,
    reason,
    reasonCategory: input.reasonCategory != null ? String(input.reasonCategory) : null,
    riskLevel: input.riskLevel != null ? String(input.riskLevel) : null,
    isValid: validation.isValid,
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : undefined,
  };
}
