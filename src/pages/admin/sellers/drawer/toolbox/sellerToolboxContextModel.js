/** @typedef {"loading" | "loaded" | "empty" | "error"} SellerToolboxState */

/**
 * Contrato oficial da Seller Toolbox (S_5.2.2).
 *
 * Fluxo: Seller selecionado → Drawer Seller → Seller Toolbox → Toolbox Context → Categorias.
 * A toolbox nunca faz fetch/reload/query — tudo vem deste contrato.
 *
 * @typedef {{
 *   sellerId: string | null;
 *   listPreview: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail: import("../../sellerOpsTypes").SellerDetailPayload | null;
 *   drawerState: import("../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState: SellerToolboxState;
 *   isReady: boolean;
 * }} SellerToolboxContextValue
 */

/**
 * @param {{
 *   sellerId?: string | null;
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 *   drawerState?: import("../SellerDrawerStateResolver").SellerDrawerState | null;
 * }} input
 */
export function isSellerToolboxContextReady({
  sellerId = null,
  listPreview = null,
  detail = null,
  drawerState = null,
}) {
  if (!sellerId || typeof sellerId !== "string") return false;
  if (drawerState !== "loaded") return false;
  if (!detail || typeof detail !== "object") return false;

  const seller = detail.seller;
  if (!seller || typeof seller !== "object") return false;

  const nome = String(seller.nome ?? listPreview?.nome ?? "").trim();
  const email = String(seller.email ?? listPreview?.email ?? "").trim();
  return Boolean(nome || email);
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 *   drawerState?: import("../SellerDrawerStateResolver").SellerDrawerState | null;
 * }} input
 * @returns {SellerToolboxState}
 */
export function resolveSellerToolboxState({
  sellerId = null,
  listPreview = null,
  detail = null,
  drawerState = null,
}) {
  if (!sellerId) return "empty";
  if (!drawerState) return "empty";

  switch (drawerState) {
    case "loading":
      return "loading";
    case "empty":
      return "empty";
    case "error":
      return "error";
    case "loaded":
      return isSellerToolboxContextReady({ sellerId, listPreview, detail, drawerState })
        ? "loaded"
        : "error";
    default:
      return "error";
  }
}

/**
 * @param {SellerToolboxContextValue} value
 */
export function isSellerToolboxContextInvalid(value) {
  return value.toolboxState === "error";
}
