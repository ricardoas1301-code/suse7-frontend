/** @typedef {"loading" | "loaded" | "empty" | "error"} SellerCacheRefreshViewState */

/**
 * @typedef {{
 *   key: string;
 *   label: string;
 * }} SellerCacheRefreshScope
 */

export const SELLER_TOOLBOX_REFRESH_SELLER_SCOPE_KEYS = Object.freeze([
  "seller_profile",
  "subscription_summary",
  "connected_marketplaces",
  "quick_metrics",
]);

export const SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_SCOPE_KEYS = Object.freeze([
  "seller_drawer",
  "seller_toolbox",
  "subscription_panel",
  "feature_flags_panel",
]);

export const SELLER_TOOLBOX_RELOAD_PANEL_DATA_PANEL_KEYS = Object.freeze([
  "seller_identity",
  "subscription",
  "marketplaces",
  "quick_metrics",
  "feature_flags",
  "cache_refresh",
]);

/** @type {SellerCacheRefreshScope[]} */
export const SELLER_TOOLBOX_REFRESH_SELLER_SCOPES = Object.freeze([
  { key: "seller_profile", label: "Perfil do seller" },
  { key: "subscription_summary", label: "Assinatura" },
  { key: "connected_marketplaces", label: "Marketplaces conectados" },
  { key: "quick_metrics", label: "Métricas rápidas" },
]);

/** @type {SellerCacheRefreshScope[]} */
export const SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_SCOPES = Object.freeze([
  { key: "seller_drawer", label: "Drawer do seller" },
  { key: "seller_toolbox", label: "Toolbox do seller" },
  { key: "subscription_panel", label: "Painel de assinatura" },
  { key: "feature_flags_panel", label: "Painel de feature flags" },
]);

/** @type {SellerCacheRefreshScope[]} */
export const SELLER_TOOLBOX_RELOAD_PANEL_DATA_PANELS = Object.freeze([
  { key: "seller_identity", label: "Identidade do seller" },
  { key: "subscription", label: "Assinatura" },
  { key: "marketplaces", label: "Marketplaces" },
  { key: "quick_metrics", label: "Métricas rápidas" },
  { key: "feature_flags", label: "Feature Flags" },
  { key: "cache_refresh", label: "Cache / Refresh" },
]);

/** @type {Record<string, SellerCacheRefreshScope[]>} */
const CACHE_REFRESH_LABEL_CATALOGS = {
  refresh: SELLER_TOOLBOX_REFRESH_SELLER_SCOPES,
  clear: SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_SCOPES,
  reload: SELLER_TOOLBOX_RELOAD_PANEL_DATA_PANELS,
};

/**
 * @param {"refresh" | "clear" | "reload"} catalogKey
 * @param {string | null | undefined} itemKey
 */
export function resolveCacheRefreshItemLabel(catalogKey, itemKey) {
  const normalized = String(itemKey ?? "").trim();
  const catalog = CACHE_REFRESH_LABEL_CATALOGS[catalogKey] ?? [];
  const match = catalog.find((item) => item.key === normalized);
  return match?.label ?? (normalized || "—");
}

/**
 * @param {string | null | undefined} scopeKey
 */
export function resolveCacheRefreshScopeLabel(scopeKey) {
  return resolveCacheRefreshItemLabel("refresh", scopeKey);
}

/**
 * @param {string | null | undefined} scopeKey
 */
export function resolveClearOperationalCacheScopeLabel(scopeKey) {
  return resolveCacheRefreshItemLabel("clear", scopeKey);
}

/**
 * @param {string | null | undefined} panelKey
 */
export function resolveReloadPanelDataLabel(panelKey) {
  return resolveCacheRefreshItemLabel("reload", panelKey);
}

/**
 * @param {string[] | null | undefined} scopeKeys
 */
export function resolveCacheRefreshScopeLabels(scopeKeys) {
  if (!Array.isArray(scopeKeys) || scopeKeys.length === 0) return [];
  return scopeKeys.map((key) => resolveCacheRefreshScopeLabel(key));
}

/**
 * @param {string | null | undefined} iso
 */
export function formatCacheRefreshTimestamp(iso) {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  if (diffMs >= 0 && diffMs < 60_000) return "agora";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   drawerState?: import("../../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("../sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 * }} input
 * @returns {SellerCacheRefreshViewState}
 */
export function resolveSellerCacheRefreshViewState({
  sellerId = null,
  drawerState = null,
  toolboxState = null,
  isReady = false,
}) {
  if (!sellerId) return "empty";
  if (drawerState === "loading" || toolboxState === "loading") return "loading";
  if (drawerState === "error" || toolboxState === "error") return "error";
  if (drawerState === "empty" || toolboxState === "empty") return "empty";
  if (!isReady) return "loading";
  return "loaded";
}
