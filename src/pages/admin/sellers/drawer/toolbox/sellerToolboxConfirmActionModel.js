/** @typedef {"low" | "medium" | "high" | "danger"} SellerToolboxConfirmRiskLevel */

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   description: string;
 *   riskLevel: SellerToolboxConfirmRiskLevel;
 *   confirmLabel?: string;
 *   cancelLabel?: string;
 *   metadata?: Record<string, unknown>;
 * }} SellerToolboxPendingAction
 */

export const SELLER_TOOLBOX_CONFIRM_DEFAULT_LABELS = {
  confirm: "Confirmar",
  cancel: "Cancelar",
};

/**
 * @param {SellerToolboxConfirmRiskLevel} riskLevel
 */
export function sellerToolboxConfirmRiskLabel(riskLevel) {
  switch (riskLevel) {
    case "low":
      return "Baixo";
    case "medium":
      return "Médio";
    case "high":
      return "Alto";
    case "danger":
      return "Crítico";
    default:
      return "—";
  }
}

/**
 * @param {SellerToolboxConfirmRiskLevel} riskLevel
 */
export function sellerToolboxConfirmRiskBadgeClassName(riskLevel) {
  const base = "seller-toolbox-confirm__risk dc-seller-pill";
  if (riskLevel === "low") return `${base} dc-seller-pill--neutral`;
  if (riskLevel === "medium") return `${base} dc-seller-pill--status-muted`;
  if (riskLevel === "high") return `${base} dc-seller-pill--health-warn`;
  return `${base} dc-seller-pill--health-critical`;
}

/**
 * @param {SellerToolboxConfirmRiskLevel} riskLevel
 */
export function isSellerToolboxConfirmHighRisk(riskLevel) {
  return riskLevel === "high" || riskLevel === "danger";
}

/**
 * @param {Partial<SellerToolboxPendingAction> | null | undefined} input
 * @returns {SellerToolboxPendingAction | null}
 */
export function normalizeSellerToolboxPendingAction(input) {
  if (!input || typeof input !== "object") return null;

  const id = String(input.id ?? "").trim();
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim();
  const riskLevel = /** @type {SellerToolboxConfirmRiskLevel} */ (input.riskLevel ?? "medium");

  if (!id || !title || !description) return null;
  if (!["low", "medium", "high", "danger"].includes(riskLevel)) return null;

  return {
    id,
    title,
    description,
    riskLevel,
    confirmLabel: String(input.confirmLabel ?? SELLER_TOOLBOX_CONFIRM_DEFAULT_LABELS.confirm).trim(),
    cancelLabel: String(input.cancelLabel ?? SELLER_TOOLBOX_CONFIRM_DEFAULT_LABELS.cancel).trim(),
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : undefined,
  };
}
