import { marketplaceLabel } from "../../sellerOpsConstants";
import { formatSellerWhen } from "../../sellerOpsUtils";
import { resolveLastMarketplaceSync } from "../sellerDrawerSectionModel";

/** @typedef {"loading" | "loaded" | "empty" | "error"} SellerToolboxSyncPanelState */

/** @typedef {"updated" | "attention" | "pending" | "error" | "unknown"} SellerToolboxSyncHealth */

/**
 * @typedef {{
 *   summary: {
 *     aggregateHealth: SellerToolboxSyncHealth;
 *     aggregateStatusLabel: string;
 *     lastSyncLabel: string;
 *     accountsConsidered: number;
 *     accountsConsideredLabel: string;
 *   };
 *   recentSyncs: Array<{
 *     id: string;
 *     marketplaceLabel: string;
 *     accountLabel: string;
 *     lastSyncLabel: string;
 *     statusLabel: string;
 *     health: SellerToolboxSyncHealth;
 *   }>;
 *   hiddenRecentSyncCount: number;
 *   pendingItems: Array<{ label: string; reason: string }>;
 *   healthItems: Array<{
 *     marketplaceLabel: string;
 *     accountLabel: string;
 *     health: SellerToolboxSyncHealth;
 *     healthLabel: string;
 *   }>;
 * }} SellerToolboxSyncModel
 */

const SENSITIVE_FIELD_PATTERN =
  /(?:access[_-]?token|refresh[_-]?token|client[_-]?secret|authorization[_-]?code|credential|secret|oauth|password|api[_-]?key|stack|trace)/i;

const VISIBLE_RECENT_SYNCS = 5;

/**
 * @param {string | null | undefined} value
 * @param {string} [fallback]
 */
export function formatSyncField(value, fallback = "Não informado") {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "—") return fallback;
  return normalized;
}

/**
 * @param {string} key
 */
function isSensitiveField(key) {
  return SENSITIVE_FIELD_PATTERN.test(String(key));
}

/**
 * @param {Record<string, unknown>} row
 */
function sanitizeSyncRow(row) {
  /** @type {Record<string, unknown>} */
  const safe = {};
  for (const [key, value] of Object.entries(row)) {
    if (isSensitiveField(key)) continue;
    safe[key] = value;
  }
  return safe;
}

/**
 * @param {import("../../sellerOpsTypes").SellerDetailPayload | null | undefined} detail
 */
function collectSyncRows(detail) {
  /** @type {Record<string, unknown>[]} */
  const rows = [];
  const marketplaces = Array.isArray(detail?.marketplaces) ? detail.marketplaces : [];
  const marketplaceAccounts = Array.isArray(detail?.marketplace_accounts)
    ? detail.marketplace_accounts
    : [];

  for (const row of [...marketplaces, ...marketplaceAccounts]) {
    if (!row || typeof row !== "object") continue;
    rows.push(sanitizeSyncRow(row));
  }

  return rows;
}

/**
 * @param {Record<string, unknown>} row
 */
function resolveAccountLabel(row) {
  const candidates = [
    row.account_name,
    row.nickname,
    row.label,
    row.name,
    row.account_label,
    row.seller_nickname,
    row.store_name,
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate ?? "").trim();
    if (normalized && !SENSITIVE_FIELD_PATTERN.test(normalized)) {
      return normalized;
    }
  }

  return "Conta";
}

/**
 * @param {unknown} iso
 */
function parseSyncTime(iso) {
  if (!iso) return null;
  const time = Date.parse(String(iso));
  return Number.isFinite(time) ? time : null;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {SellerToolboxSyncHealth}
 */
export function resolveSyncHealth(row) {
  const statusRaw = String(
    row.status ?? row.connection_badge_label ?? row.sync_status ?? row.connection_status ?? "",
  )
    .trim()
    .toLowerCase();

  const lastSync = row.last_sync_at ?? row.last_sync ?? row.synced_at;
  const hasSync = Boolean(lastSync);

  if (/err|fail|broken|denied/.test(statusRaw)) return "error";
  if (/expir|token/.test(statusRaw)) return "attention";
  if (/pend|await|pending|queue/.test(statusRaw)) return "pending";
  if (/atenc|warn|stale|delay/.test(statusRaw)) return "attention";
  if (hasSync && (/ativ|active|ok|sync|connect/.test(statusRaw) || !statusRaw)) return "updated";
  if (hasSync) return "updated";
  if (statusRaw) return "pending";
  return "unknown";
}

/**
 * @param {SellerToolboxSyncHealth} health
 */
export function syncHealthLabel(health) {
  switch (health) {
    case "updated":
      return "Atualizado";
    case "attention":
      return "Atenção";
    case "pending":
      return "Pendente";
    case "error":
      return "Erro";
    default:
      return "Não informado";
  }
}

/**
 * @param {SellerToolboxSyncHealth} health
 */
export function sellerToolboxSyncBadgeClassName(health) {
  const base = "seller-toolbox-sync-badge dc-seller-pill";
  if (health === "updated") return `${base} dc-seller-pill--status-active`;
  if (health === "attention") return `${base} dc-seller-pill--health-warn`;
  if (health === "pending") return `${base} dc-seller-pill--status-muted`;
  if (health === "error") return `${base} dc-seller-pill--health-warn`;
  return `${base} dc-seller-pill--neutral`;
}

/**
 * @param {SellerToolboxSyncHealth[]} healths
 * @returns {SellerToolboxSyncHealth}
 */
function resolveAggregateSyncHealth(healths) {
  if (healths.includes("error")) return "error";
  if (healths.includes("pending")) return "pending";
  if (healths.includes("attention")) return "attention";
  if (healths.includes("updated")) return "updated";
  return "unknown";
}

/**
 * @param {Record<string, unknown>} row
 */
function buildPendingItem(row) {
  const health = resolveSyncHealth(row);
  const marketplace = marketplaceLabel(/** @type {string} */ (row.marketplace));
  const accountLabel = resolveAccountLabel(row);
  const label = `${marketplace} — ${accountLabel}`;

  if (health === "error") {
    return { label, reason: "Erro de conexão" };
  }
  if (health === "attention") {
    return { label, reason: "Token expirado" };
  }
  if (health === "pending") {
    return { label, reason: "Sync pendente" };
  }

  const lastSync = row.last_sync_at ?? row.last_sync ?? row.synced_at;
  if (!lastSync) {
    return { label, reason: "Conta sem sync" };
  }

  return null;
}

/**
 * @param {{
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 * @returns {SellerToolboxSyncModel}
 */
export function buildSellerToolboxSyncModel({ listPreview = null, detail = null }) {
  const rows = collectSyncRows(detail);

  const recentItems = rows
    .map((row, index) => {
      const lastSync = row.last_sync_at ?? row.last_sync ?? row.synced_at;
      const health = resolveSyncHealth(row);

      return {
        id: String(row.id ?? row.account_id ?? `sync-${index}`),
        marketplaceLabel: marketplaceLabel(/** @type {string} */ (row.marketplace)),
        accountLabel: resolveAccountLabel(row),
        lastSyncLabel: formatSyncField(formatSellerWhen(/** @type {string | null | undefined} */ (lastSync))),
        statusLabel: syncHealthLabel(health),
        health,
        sortTime: parseSyncTime(lastSync),
      };
    })
    .sort((a, b) => (b.sortTime ?? 0) - (a.sortTime ?? 0));

  const recentSyncs = recentItems.slice(0, VISIBLE_RECENT_SYNCS).map(({ sortTime, ...item }) => item);
  const hiddenRecentSyncCount = Math.max(0, recentItems.length - VISIBLE_RECENT_SYNCS);

  const healthItems = rows.map((row, index) => {
    const health = resolveSyncHealth(row);
    return {
      marketplaceLabel: marketplaceLabel(/** @type {string} */ (row.marketplace)),
      accountLabel: resolveAccountLabel(row),
      health,
      healthLabel: syncHealthLabel(health),
      key: String(row.id ?? index),
    };
  });

  const pendingItems = rows
    .map(buildPendingItem)
    .filter((item) => item != null);

  const healths = healthItems.map((item) => item.health);
  const aggregateHealth = resolveAggregateSyncHealth(healths);

  const connectedFromMetrics = Number(detail?.metrics?.connected_accounts ?? NaN);
  const connectedFromPreview = Number(listPreview?.connected_accounts ?? NaN);
  const accountsConsidered = Number.isFinite(connectedFromMetrics)
    ? connectedFromMetrics
    : Number.isFinite(connectedFromPreview)
      ? connectedFromPreview
      : rows.length;

  const lastSyncGeneral = resolveLastMarketplaceSync(rows);

  return {
    summary: {
      aggregateHealth,
      aggregateStatusLabel: syncHealthLabel(aggregateHealth),
      lastSyncLabel: formatSyncField(formatSellerWhen(lastSyncGeneral)),
      accountsConsidered,
      accountsConsideredLabel:
        accountsConsidered > 0 ? String(accountsConsidered) : "Não informado",
    },
    recentSyncs,
    hiddenRecentSyncCount,
    pendingItems,
    healthItems: healthItems.map(({ key, ...item }) => item),
  };
}

/**
 * @param {{
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 */
export function isSellerToolboxSyncEmpty({ listPreview = null, detail = null }) {
  const rows = collectSyncRows(detail);
  if (rows.length > 0) return false;

  const previewMarketplaces = Array.isArray(listPreview?.marketplaces) ? listPreview.marketplaces : [];
  if (previewMarketplaces.length > 0) return false;

  const connected = Number(listPreview?.connected_accounts ?? detail?.metrics?.connected_accounts ?? 0);
  if (connected > 0) return false;

  return true;
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
 * @returns {SellerToolboxSyncPanelState}
 */
export function resolveSellerToolboxSyncPanelState({
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

  if (isSellerToolboxSyncEmpty({ listPreview, detail })) return "empty";
  return "loaded";
}
