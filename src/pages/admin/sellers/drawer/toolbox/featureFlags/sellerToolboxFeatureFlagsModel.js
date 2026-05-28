/** @typedef {"pricing" | "notifications" | "sync" | "analytics" | "beta" | "ai"} SellerFeatureFlagCategory */

/**
 * Origem operacional da flag.
 * Preparado para rollout, plano, marketplace e flags temporárias (S_5.3.3.x).
 * @typedef {"manual" | "plan" | "system" | "rollout" | "marketplace" | "temporary" | "beta"} SellerFeatureFlagSource
 */

/** @typedef {"loading" | "loaded" | "empty" | "error"} SellerFeatureFlagsViewState */

/** @typedef {"all" | "active" | "inactive"} SellerFeatureFlagStatusFilter */

/**
 * Contrato de uma feature flag do seller.
 * @typedef {{
 *   key: string;
 *   label: string;
 *   description: string;
 *   category: SellerFeatureFlagCategory;
 *   enabled: boolean;
 *   source: SellerFeatureFlagSource;
 *   createdAt: string;
 *   updatedAt?: string | null;
 *   rolloutPercentage?: number | null;
 *   planId?: string | null;
 *   marketplaceKey?: string | null;
 *   expiresAt?: string | null;
 * }} SellerFeatureFlag
 */

/**
 * Entrada parcial para mock/local — mescla com catálogo.
 * @typedef {{
 *   key: string;
 *   enabled?: boolean;
 *   source?: SellerFeatureFlagSource;
 *   createdAt?: string;
 *   updatedAt?: string | null;
 * }} SellerFeatureFlagMockEntry
 */

export const SELLER_FEATURE_FLAG_CATEGORIES = Object.freeze([
  "pricing",
  "notifications",
  "sync",
  "analytics",
  "beta",
  "ai",
]);

/** @type {Record<string, Omit<SellerFeatureFlag, "enabled">>} */
export const SELLER_TOOLBOX_FEATURE_FLAG_CATALOG = Object.freeze({
  smart_pricing_ai: {
    key: "smart_pricing_ai",
    label: "Precificação IA",
    description: "Habilita recomendações inteligentes de precificação.",
    category: "pricing",
    source: "manual",
    createdAt: "2025-11-12T14:30:00.000Z",
  },
  whatsapp_notifications: {
    key: "whatsapp_notifications",
    label: "Notificações WhatsApp",
    description: "Envia alertas operacionais e cobrança pelo WhatsApp.",
    category: "notifications",
    source: "plan",
    createdAt: "2025-10-03T09:15:00.000Z",
  },
  advanced_dashboard: {
    key: "advanced_dashboard",
    label: "Dashboard avançado",
    description: "Painéis analíticos estendidos e widgets personalizados.",
    category: "analytics",
    source: "manual",
    createdAt: "2026-01-20T11:00:00.000Z",
  },
  ml_real_time_sync: {
    key: "ml_real_time_sync",
    label: "Sync ML em tempo real",
    description: "Sincroniza pedidos do Mercado Livre em tempo real.",
    category: "sync",
    source: "system",
    createdAt: "2026-02-08T16:45:00.000Z",
  },
});

/** @type {SellerFeatureFlagMockEntry[]} */
export const SELLER_TOOLBOX_FEATURE_FLAGS_DEFAULT_MOCK = Object.freeze([
  { key: "smart_pricing_ai", enabled: true },
  { key: "whatsapp_notifications", enabled: true },
  { key: "advanced_dashboard", enabled: false },
  { key: "ml_real_time_sync", enabled: false },
]);

/**
 * @param {SellerFeatureFlagCategory | string | null | undefined} category
 */
export function resolveFeatureFlagCategoryLabel(category) {
  switch (category) {
    case "pricing":
      return "Precificação";
    case "notifications":
      return "Notificações";
    case "sync":
      return "Sincronização";
    case "analytics":
      return "Analytics";
    case "beta":
      return "Beta";
    case "ai":
      return "Inteligência artificial";
    default:
      return "Geral";
  }
}

/**
 * @param {boolean} enabled
 */
export function resolveFeatureFlagStatusLabel(enabled) {
  return enabled ? "ATIVA" : "INATIVA";
}

/**
 * @param {boolean} enabled
 * @returns {"active" | "inactive"}
 */
export function resolveFeatureFlagStatusVariant(enabled) {
  return enabled ? "active" : "inactive";
}

/**
 * @param {SellerFeatureFlagSource | string | null | undefined} source
 */
export function resolveFeatureFlagSourceLabel(source) {
  switch (source) {
    case "manual":
      return "Manual";
    case "plan":
      return "Plano";
    case "system":
      return "Sistema";
    case "rollout":
      return "Rollout gradual";
    case "marketplace":
      return "Marketplace";
    case "temporary":
      return "Temporária";
    case "beta":
      return "Beta";
    default:
      return "—";
  }
}

/**
 * @param {string | null | undefined} iso
 */
export function formatFeatureFlagDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * @param {Partial<SellerFeatureFlag> & { key: string }} input
 * @returns {SellerFeatureFlag | null}
 */
export function normalizeSellerFeatureFlag(input) {
  const key = String(input.key ?? "").trim();
  if (!key) return null;

  const catalogEntry = SELLER_TOOLBOX_FEATURE_FLAG_CATALOG[key];
  const category = input.category ?? catalogEntry?.category ?? "beta";
  const normalizedCategory = SELLER_FEATURE_FLAG_CATEGORIES.includes(category)
    ? category
    : "beta";

  return {
    key,
    label: String(input.label ?? catalogEntry?.label ?? key).trim() || key,
    description: String(input.description ?? catalogEntry?.description ?? "").trim(),
    category: normalizedCategory,
    enabled: Boolean(input.enabled),
    source: input.source ?? catalogEntry?.source ?? "manual",
    createdAt: input.createdAt ?? catalogEntry?.createdAt ?? new Date(0).toISOString(),
    updatedAt: input.updatedAt ?? null,
    rolloutPercentage: input.rolloutPercentage ?? null,
    planId: input.planId ?? null,
    marketplaceKey: input.marketplaceKey ?? null,
    expiresAt: input.expiresAt ?? null,
  };
}

/**
 * Converte payload API (detail.feature_flags) para entradas do view model.
 * @param {unknown} apiFlags
 * @returns {import("./sellerToolboxFeatureFlagsModel").SellerFeatureFlagMockEntry[]}
 */
export function mapApiFeatureFlagsToMockEntries(apiFlags) {
  if (!Array.isArray(apiFlags)) return [];

  return apiFlags
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const key = String(row.key ?? row.flag_key ?? "").trim();
      if (!key) return null;
      return {
        key,
        enabled: row.enabled === true,
        source: row.source ?? row.scope ?? "manual",
        updatedAt: row.updated_at ?? row.updatedAt ?? null,
        createdAt: row.created_at ?? row.createdAt ?? null,
        planId: row.plan_id ?? null,
        marketplaceKey: row.marketplace ?? null,
      };
    })
    .filter(Boolean);
}

/**
 * @param {SellerFeatureFlagMockEntry[]} [entries]
 * @returns {SellerFeatureFlag[]}
 */
export function buildSellerFeatureFlagsViewModel(entries = SELLER_TOOLBOX_FEATURE_FLAGS_DEFAULT_MOCK) {
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry) => {
      const catalogEntry = SELLER_TOOLBOX_FEATURE_FLAG_CATALOG[entry.key];
      return normalizeSellerFeatureFlag({
        ...catalogEntry,
        ...entry,
      });
    })
    .filter((flag) => flag !== null);
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   entries?: SellerFeatureFlagMockEntry[];
 * }} [overrides]
 */
export function createSellerFeatureFlagsMockInput(overrides = {}) {
  return {
    sellerId: overrides.sellerId ?? null,
    entries: overrides.entries ?? [...SELLER_TOOLBOX_FEATURE_FLAGS_DEFAULT_MOCK],
  };
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   drawerState?: import("../../../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("../sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 *   hasFlags?: boolean;
 * }} input
 * @returns {SellerFeatureFlagsViewState}
 */
export function resolveSellerFeatureFlagsViewState({
  sellerId = null,
  drawerState = null,
  toolboxState = null,
  isReady = false,
  hasFlags = true,
}) {
  if (!sellerId) return "empty";
  if (drawerState === "loading" || toolboxState === "loading") return "loading";
  if (drawerState === "error" || toolboxState === "error") return "error";
  if (drawerState === "empty" || toolboxState === "empty") return "empty";
  if (!isReady) return "loading";
  if (!hasFlags) return "empty";
  return "loaded";
}

/**
 * @param {SellerFeatureFlag[]} flags
 * @param {{ query?: string; statusFilter?: SellerFeatureFlagStatusFilter }} [options]
 * @returns {SellerFeatureFlag[]}
 */
export function filterSellerFeatureFlags(flags, options = {}) {
  const query = String(options.query ?? "")
    .trim()
    .toLowerCase();
  const statusFilter = options.statusFilter ?? "all";

  return flags.filter((flag) => {
    if (statusFilter === "active" && !flag.enabled) return false;
    if (statusFilter === "inactive" && flag.enabled) return false;

    if (!query) return true;

    const haystack = [
      flag.key,
      flag.label,
      flag.description,
      resolveFeatureFlagCategoryLabel(flag.category),
      resolveFeatureFlagSourceLabel(flag.source),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

/**
 * @param {"active" | "inactive"} variant
 */
export function sellerFeatureFlagStatusClassName(variant) {
  return `seller-feature-flags-panel__status seller-feature-flags-panel__status--${variant}`;
}

/**
 * @param {SellerFeatureFlagCategory | string} category
 */
export function sellerFeatureFlagCategoryClassName(category) {
  const normalized = String(category ?? "beta").trim() || "beta";
  return `seller-feature-flags-panel__category seller-feature-flags-panel__category--${normalized}`;
}
