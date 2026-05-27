/** @typedef {"success" | "error" | "warning" | "info"} SellerToolboxFeedbackType */

/**
 * @typedef {{
 *   type: SellerToolboxFeedbackType;
 *   title: string;
 *   description: string;
 *   actionLabel?: string;
 *   action?: (() => void) | null;
 * }} SellerToolboxFeedbackState
 */

/**
 * @param {SellerToolboxFeedbackType} type
 */
export function sellerToolboxFeedbackTypeLabel(type) {
  switch (type) {
    case "success":
      return "Sucesso";
    case "error":
      return "Erro";
    case "warning":
      return "Aviso";
    case "info":
      return "Informação";
    default:
      return "Feedback";
  }
}

/**
 * @param {SellerToolboxFeedbackType} type
 */
export function sellerToolboxFeedbackToneClassName(type) {
  return `seller-toolbox-feedback--${type}`;
}

/**
 * @param {Partial<SellerToolboxFeedbackState> | null | undefined} input
 * @returns {SellerToolboxFeedbackState | null}
 */
export function normalizeSellerToolboxFeedback(input) {
  if (!input || typeof input !== "object") return null;

  const type = /** @type {SellerToolboxFeedbackType} */ (input.type ?? "info");
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim();

  if (!["success", "error", "warning", "info"].includes(type)) return null;
  if (!title || !description) return null;

  const actionLabel = input.actionLabel != null ? String(input.actionLabel).trim() : "";
  const action = typeof input.action === "function" ? input.action : null;

  return {
    type,
    title,
    description,
    actionLabel: actionLabel || undefined,
    action: actionLabel && action ? action : undefined,
  };
}
