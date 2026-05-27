/** @typedef {"healthy" | "warning" | "danger" | "blocked"} SellerConsumptionStatus */

/** @typedef {"loading" | "loaded" | "empty" | "error"} SellerConsumptionViewState */

/**
 * @typedef {{
 *   id?: string;
 *   companyId?: string | null;
 *   marketplaceAccountId?: string | null;
 *   marketplace?: string | null;
 *   marketplaceLabel?: string | null;
 *   accounts?: number;
 *   companies?: number;
 *   salesCount?: number;
 *   consumed?: number;
 * }} SellerConsumptionSource
 */

/**
 * @typedef {{
 *   sellerId?: string | null;
 *   planName: string;
 *   monthlyLimit: number;
 *   consumed: number;
 *   sources?: SellerConsumptionSource[];
 *   recalculatedAt?: string | null;
 * }} SellerConsumptionRawInput
 */

/**
 * @typedef {SellerConsumptionRawInput & {
 *   remaining: number;
 *   percentage: number;
 *   status: SellerConsumptionStatus;
 *   statusLabel: string;
 * }} SellerConsumptionViewModel
 */

export const SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK = Object.freeze({
  planName: "Pro",
  monthlyLimit: 5000,
  consumed: 1825,
  sources: [],
  recalculatedAt: null,
});

export const SELLER_TOOLBOX_FAKE_RECALCULATED_CONSUMED = 2140;

/**
 * @param {number | string | null | undefined} value
 */
export function normalizeConsumptionAmount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

/**
 * @param {number | string | null | undefined} percentage
 * @returns {SellerConsumptionStatus}
 */
export function resolveConsumptionStatus(percentage) {
  const normalized = Number(percentage);
  if (!Number.isFinite(normalized)) return "healthy";
  if (normalized >= 100) return "blocked";
  if (normalized >= 90) return "danger";
  if (normalized >= 70) return "warning";
  return "healthy";
}

/**
 * @param {SellerConsumptionStatus} status
 */
export function getConsumptionStatusLabel(status) {
  switch (status) {
    case "warning":
      return "Atenção";
    case "danger":
      return "Perigo";
    case "blocked":
      return "Bloqueado";
    default:
      return "Saudável";
  }
}

/**
 * @param {number} monthlyLimit
 * @param {number} consumed
 */
export function computeConsumptionPercentage(monthlyLimit, consumed) {
  const limit = normalizeConsumptionAmount(monthlyLimit);
  const used = normalizeConsumptionAmount(consumed);
  if (limit <= 0) return 0;
  return Math.round((used / limit) * 1000) / 10;
}

/**
 * @param {number} monthlyLimit
 * @param {number} consumed
 */
export function computeConsumptionRemaining(monthlyLimit, consumed) {
  const limit = normalizeConsumptionAmount(monthlyLimit);
  const used = normalizeConsumptionAmount(consumed);
  return Math.max(limit - used, 0);
}

/**
 * @param {number | string | null | undefined} value
 */
export function formatConsumptionAmount(value) {
  return normalizeConsumptionAmount(value).toLocaleString("pt-BR");
}

/**
 * @param {number | string | null | undefined} value
 */
export function formatConsumptionPercentage(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return "0%";
  const formatted = normalized.toLocaleString("pt-BR", {
    minimumFractionDigits: normalized % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
  return `${formatted}%`;
}

/**
 * @param {string | null | undefined} iso
 */
export function formatConsumptionRecalculatedAt(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  if (diffMs >= 0 && diffMs < 60_000) return "agora";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * @param {SellerConsumptionSource} source
 */
export function formatConsumptionSourceLabel(source) {
  const marketplaceLabel = String(source.marketplaceLabel ?? source.marketplace ?? "Marketplace").trim();
  const accounts = normalizeConsumptionAmount(source.accounts ?? 0);
  const companies = normalizeConsumptionAmount(source.companies ?? 0);

  return `${marketplaceLabel} · ${accounts} conta${accounts === 1 ? "" : "s"} · ${companies} empresa${companies === 1 ? "" : "s"}`;
}

/**
 * @param {SellerConsumptionRawInput} input
 * @returns {SellerConsumptionViewModel}
 */
export function buildSellerConsumptionViewModel(input) {
  const monthlyLimit = normalizeConsumptionAmount(input.monthlyLimit);
  const consumed = normalizeConsumptionAmount(input.consumed);
  const remaining = computeConsumptionRemaining(monthlyLimit, consumed);
  const percentage = computeConsumptionPercentage(monthlyLimit, consumed);
  const status = resolveConsumptionStatus(percentage);

  return {
    sellerId: input.sellerId ?? null,
    planName: String(input.planName ?? "—").trim() || "—",
    monthlyLimit,
    consumed,
    remaining,
    percentage,
    status,
    statusLabel: getConsumptionStatusLabel(status),
    sources: Array.isArray(input.sources) ? input.sources.map((source) => ({ ...source })) : [],
    recalculatedAt: input.recalculatedAt ?? null,
  };
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   monthlyLimit?: number;
 *   consumed?: number;
 *   planName?: string;
 *   sources?: SellerConsumptionSource[];
 *   recalculatedAt?: string | null;
 * }} [overrides]
 */
export function createSellerConsumptionMockInput(overrides = {}) {
  return {
    sellerId: overrides.sellerId ?? null,
    planName: overrides.planName ?? SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK.planName,
    monthlyLimit: overrides.monthlyLimit ?? SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK.monthlyLimit,
    consumed: overrides.consumed ?? SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK.consumed,
    sources: overrides.sources ?? [...SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK.sources],
    recalculatedAt: overrides.recalculatedAt ?? SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK.recalculatedAt,
  };
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   drawerState?: import("../../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("../sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 *   isSubscriptionEmpty?: boolean;
 * }} input
 * @returns {SellerConsumptionViewState}
 */
export function resolveSellerConsumptionViewState({
  sellerId = null,
  drawerState = null,
  toolboxState = null,
  isReady = false,
  isSubscriptionEmpty = false,
}) {
  if (!sellerId) return "empty";
  if (drawerState === "loading" || toolboxState === "loading") return "loading";
  if (drawerState === "error" || toolboxState === "error") return "error";
  if (drawerState === "empty" || toolboxState === "empty") return "empty";
  if (!isReady) return "loading";
  if (isSubscriptionEmpty) return "empty";
  return "loaded";
}

/**
 * @param {SellerConsumptionStatus} status
 */
export function sellerConsumptionStatusClassName(status) {
  return `seller-consumption-panel__status seller-consumption-panel__status--${status}`;
}

/**
 * @param {SellerConsumptionStatus} status
 */
export function sellerConsumptionBarClassName(status) {
  return `seller-consumption-panel__bar-fill seller-consumption-panel__status--${status}`;
}
