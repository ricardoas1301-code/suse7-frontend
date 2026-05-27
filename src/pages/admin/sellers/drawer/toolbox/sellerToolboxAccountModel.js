import { formatPlanDisplay, formatSellerDate, statusClass } from "../../sellerOpsUtils";

/** @typedef {"loading" | "loaded" | "empty" | "error"} SellerToolboxAccountPanelState */

/**
 * @typedef {{
 *   nome: string | null;
 *   email: string | null;
 *   telefone: string | null;
 *   photoUrl: string | null;
 *   initial: string;
 *   sellerIdSummary: string;
 *   accountStatus: string | null;
 *   accountStatusLabel: string;
 *   createdAt: string | null;
 *   createdAtLabel: string;
 *   planLabel: string;
 * }} SellerToolboxAccountModel
 */

/**
 * @param {string | null | undefined} sellerId
 */
export function formatSellerIdSummary(sellerId) {
  if (!sellerId || typeof sellerId !== "string") return "—";
  const trimmed = sellerId.trim();
  if (!trimmed) return "—";
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 8)}…`;
}

/**
 * @param {string | null | undefined} value
 * @param {string} [fallback]
 */
export function formatAccountField(value, fallback = "Não informado") {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "—") return fallback;
  return normalized;
}

/**
 * @param {string | null | undefined} status
 */
function formatAccountStatusLabel(status) {
  const normalized = String(status ?? "").trim();
  if (!normalized) return "Não informado";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 * @returns {SellerToolboxAccountModel}
 */
export function buildSellerToolboxAccountModel({
  sellerId = null,
  listPreview = null,
  detail = null,
}) {
  const seller = detail?.seller ?? null;
  const subscription = detail?.subscription ?? null;

  const nomeRaw = String(seller?.nome ?? listPreview?.nome ?? "").trim();
  const emailRaw = String(seller?.email ?? listPreview?.email ?? "").trim();
  const telefoneRaw = seller?.telefone ?? listPreview?.telefone ?? null;

  const accountStatus = String(seller?.status ?? listPreview?.status ?? "").trim() || null;
  const createdAt = seller?.created_at ?? listPreview?.created_at ?? null;

  return {
    nome: nomeRaw || null,
    email: emailRaw || null,
    telefone: telefoneRaw ? String(telefoneRaw).trim() : null,
    photoUrl: seller?.photo_url ?? listPreview?.photo_url ?? null,
    initial: (nomeRaw || emailRaw || "?").slice(0, 1).toUpperCase(),
    sellerIdSummary: formatSellerIdSummary(sellerId),
    accountStatus,
    accountStatusLabel: formatAccountStatusLabel(accountStatus),
    createdAt: createdAt ? String(createdAt) : null,
    createdAtLabel: formatSellerDate(createdAt),
    planLabel: formatPlanDisplay(
      /** @type {string | null | undefined} */ (subscription?.plan_key ?? listPreview?.plan_key),
      /** @type {string | null | undefined} */ (subscription?.plan_label ?? listPreview?.plano),
    ),
  };
}

/**
 * @param {SellerToolboxAccountModel} model
 */
export function isSellerToolboxAccountEmpty(model) {
  return !model.nome && !model.email;
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 *   drawerState?: import("../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("./sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 * }} input
 * @returns {SellerToolboxAccountPanelState}
 */
export function resolveSellerToolboxAccountPanelState({
  sellerId = null,
  listPreview = null,
  detail = null,
  drawerState = null,
  toolboxState = null,
  isReady = false,
}) {
  if (!sellerId) return "empty";
  if (drawerState === "loading" || toolboxState === "loading") return "loading";
  if (drawerState === "error" || toolboxState === "error") return "error";
  if (drawerState === "empty" || toolboxState === "empty") return "empty";
  if (!isReady) return "loading";

  const model = buildSellerToolboxAccountModel({ sellerId, listPreview, detail });
  if (isSellerToolboxAccountEmpty(model)) return "empty";
  return "loaded";
}

/**
 * @param {string | null | undefined} status
 */
export function sellerToolboxAccountStatusClassName(status) {
  return statusClass(status ?? "");
}
