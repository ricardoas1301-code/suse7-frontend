/** @typedef {"loading" | "loaded" | "empty" | "error"} SellerDrawerState */

/**
 * @param {import("../sellerOpsTypes").SellerDetailPayload | null | undefined} detail
 */
export function isSellerDetailEmpty(detail) {
  if (!detail || typeof detail !== "object") return true;

  const seller = detail.seller;
  if (!seller || typeof seller !== "object") return true;

  const nome = String(seller.nome ?? "").trim();
  const email = String(seller.email ?? "").trim();
  return !nome && !email;
}

/**
 * Resolve estado oficial do drawer seller.
 * @param {{
 *   loading?: boolean;
 *   error?: string | null;
 *   detail?: import("../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 * @returns {SellerDrawerState}
 */
export function resolveSellerDrawerState({ loading = false, error = null, detail = null }) {
  if (loading) return "loading";
  if (error) return "error";
  if (!detail || isSellerDetailEmpty(detail)) return "empty";
  return "loaded";
}

/**
 * @param {SellerDrawerState} state
 */
export function isSellerDrawerToolsEnabled(state) {
  return state === "loaded";
}
