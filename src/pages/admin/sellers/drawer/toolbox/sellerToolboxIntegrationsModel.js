import { marketplaceLabel } from "../../sellerOpsConstants";
import { formatSellerWhen } from "../../sellerOpsUtils";
import { resolveLastMarketplaceSync } from "../sellerDrawerSectionModel";

/** @typedef {"loading" | "loaded" | "empty" | "error"} SellerToolboxIntegrationsPanelState */

/** @typedef {"active" | "pending" | "expired" | "error" | "unknown"} SellerToolboxConnectionHealth */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   health: SellerToolboxConnectionHealth;
 *   healthLabel: string;
 *   lastSyncLabel: string;
 * }} SellerToolboxIntegrationAccount
 */

/**
 * @typedef {{
 *   marketplaceKey: string;
 *   marketplaceLabel: string;
 *   accountCount: number;
 *   connectionHealth: SellerToolboxConnectionHealth;
 *   connectionHealthLabel: string;
 *   lastSyncLabel: string;
 *   accounts: SellerToolboxIntegrationAccount[];
 *   hiddenAccountCount: number;
 * }} SellerToolboxMarketplaceGroup
 */

/**
 * @typedef {{
 *   summary: {
 *     marketplaceCount: number;
 *     marketplaceCountLabel: string;
 *     connectedAccounts: number;
 *     connectedAccountsLabel: string;
 *     lastSyncLabel: string;
 *   };
 *   marketplaceGroups: SellerToolboxMarketplaceGroup[];
 *   marketplaceList: Array<{
 *     marketplaceKey: string;
 *     marketplaceLabel: string;
 *     accountCount: number;
 *     statusLabel: string;
 *     health: SellerToolboxConnectionHealth;
 *   }>;
 *   healthItems: Array<{
 *     marketplaceLabel: string;
 *     accountLabel: string;
 *     health: SellerToolboxConnectionHealth;
 *     healthLabel: string;
 *   }>;
 * }} SellerToolboxIntegrationsModel
 */

const SENSITIVE_FIELD_PATTERN =
  /(?:access[_-]?token|refresh[_-]?token|client[_-]?secret|authorization[_-]?code|credential|secret|oauth|password|api[_-]?key)/i;

const VISIBLE_ACCOUNTS_PER_MARKETPLACE = 3;

/**
 * @param {string | null | undefined} value
 * @param {string} [fallback]
 */
export function formatIntegrationsField(value, fallback = "Não informado") {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "—") return fallback;
  return normalized;
}

/**
 * @param {Record<string, unknown>} row
 */
function isSensitiveField(key) {
  return SENSITIVE_FIELD_PATTERN.test(String(key));
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
function sanitizeIntegrationRow(row) {
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
function collectIntegrationRows(detail) {
  /** @type {Record<string, unknown>[]} */
  const rows = [];

  const marketplaces = Array.isArray(detail?.marketplaces) ? detail.marketplaces : [];
  const marketplaceAccounts = Array.isArray(detail?.marketplace_accounts)
    ? detail.marketplace_accounts
    : [];

  for (const row of [...marketplaces, ...marketplaceAccounts]) {
    if (!row || typeof row !== "object") continue;
    rows.push(sanitizeIntegrationRow(row));
  }

  return rows;
}

/**
 * @param {unknown} statusRaw
 * @returns {SellerToolboxConnectionHealth}
 */
export function resolveConnectionHealth(statusRaw) {
  const raw = String(statusRaw ?? "").trim().toLowerCase();
  if (!raw) return "unknown";
  if (/ativ|active|connect|ok|saud|linked|sync/.test(raw)) return "active";
  if (/pend|await|pending|process/.test(raw)) return "pending";
  if (/expir|expired|revok|invalid/.test(raw)) return "expired";
  if (/err|fail|critical|crit|denied|broken/.test(raw)) return "error";
  return "unknown";
}

/**
 * @param {SellerToolboxConnectionHealth} health
 */
export function connectionHealthLabel(health) {
  switch (health) {
    case "active":
      return "Ativa";
    case "pending":
      return "Pendente";
    case "expired":
      return "Expirada";
    case "error":
      return "Erro";
    default:
      return "Não informado";
  }
}

/**
 * @param {SellerToolboxConnectionHealth} health
 */
export function sellerToolboxIntegrationBadgeClassName(health) {
  const base = "seller-toolbox-integration-badge dc-seller-pill";
  if (health === "active") return `${base} dc-seller-pill--status-active`;
  if (health === "pending") return `${base} dc-seller-pill--status-muted`;
  if (health === "expired" || health === "error") return `${base} dc-seller-pill--health-warn`;
  return `${base} dc-seller-pill--neutral`;
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
 * @param {Record<string, unknown>} row
 * @param {number} index
 */
function buildAccountEntry(row, index) {
  const health = resolveConnectionHealth(row.status ?? row.connection_badge_label ?? row.connection_status);
  const lastSync = row.last_sync_at ?? row.last_sync ?? row.synced_at;

  return {
    id: String(row.id ?? row.account_id ?? `${row.marketplace ?? "mp"}-${index}`),
    label: resolveAccountLabel(row),
    health,
    healthLabel: connectionHealthLabel(health),
    lastSyncLabel: formatIntegrationsField(formatSellerWhen(/** @type {string | null | undefined} */ (lastSync))),
  };
}

/**
 * @param {Record<string, unknown>[]} accounts
 * @param {Record<string, unknown>[]} sourceRows
 */
function buildMarketplaceGroup(marketplaceKey, accounts, sourceRows) {
  const healthFromRows = sourceRows.map((row) =>
    resolveConnectionHealth(row.status ?? row.connection_badge_label ?? row.connection_status),
  );
  const groupHealth = healthFromRows.includes("error")
    ? "error"
    : healthFromRows.includes("expired")
      ? "expired"
      : healthFromRows.includes("pending")
        ? "pending"
        : healthFromRows.includes("active")
          ? "active"
          : "unknown";

  const lastSyncRaw = resolveLastMarketplaceSync(sourceRows);
  const visibleAccounts = accounts.slice(0, VISIBLE_ACCOUNTS_PER_MARKETPLACE);

  return {
    marketplaceKey,
    marketplaceLabel: marketplaceLabel(marketplaceKey),
    accountCount: accounts.length,
    connectionHealth: groupHealth,
    connectionHealthLabel: connectionHealthLabel(groupHealth),
    lastSyncLabel: formatIntegrationsField(formatSellerWhen(lastSyncRaw)),
    accounts: visibleAccounts,
    hiddenAccountCount: Math.max(0, accounts.length - VISIBLE_ACCOUNTS_PER_MARKETPLACE),
  };
}

/**
 * @param {{
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 */
export function buildSellerToolboxIntegrationsModel({ listPreview = null, detail = null }) {
  const rows = collectIntegrationRows(detail);

  /** @type {Map<string, { accounts: SellerToolboxIntegrationAccount[]; sourceRows: Record<string, unknown>[] }>} */
  const grouped = new Map();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const marketplaceKey = String(row.marketplace ?? "outros").trim() || "outros";
    const current = grouped.get(marketplaceKey) ?? { accounts: [], sourceRows: [] };
    current.accounts.push(buildAccountEntry(row, index));
    current.sourceRows.push(row);
    grouped.set(marketplaceKey, current);
  }

  if (grouped.size === 0) {
    const previewMarketplaces = Array.isArray(listPreview?.marketplaces) ? listPreview.marketplaces : [];
    for (const mp of previewMarketplaces) {
      const marketplaceKey = String(mp ?? "").trim();
      if (!marketplaceKey) continue;
      grouped.set(marketplaceKey, { accounts: [], sourceRows: [] });
    }
  }

  const marketplaceGroups = [...grouped.entries()].map(([marketplaceKey, value]) =>
    buildMarketplaceGroup(marketplaceKey, value.accounts, value.sourceRows),
  );

  const connectedFromMetrics = Number(detail?.metrics?.connected_accounts ?? NaN);
  const connectedFromPreview = Number(listPreview?.connected_accounts ?? NaN);
  const connectedAccounts = Number.isFinite(connectedFromMetrics)
    ? connectedFromMetrics
    : Number.isFinite(connectedFromPreview)
      ? connectedFromPreview
      : rows.length;

  const lastSyncGeneral = resolveLastMarketplaceSync(rows);

  const marketplaceList = marketplaceGroups.map((group) => ({
    marketplaceKey: group.marketplaceKey,
    marketplaceLabel: group.marketplaceLabel,
    accountCount: group.accountCount,
    statusLabel: group.connectionHealthLabel,
    health: group.connectionHealth,
  }));

  const healthItems = marketplaceGroups.flatMap((group) => {
    if (group.accounts.length === 0) {
      return [
        {
          marketplaceLabel: group.marketplaceLabel,
          accountLabel: "Sem contas detalhadas",
          health: group.connectionHealth,
          healthLabel: group.connectionHealthLabel,
        },
      ];
    }

    return group.accounts.map((account) => ({
      marketplaceLabel: group.marketplaceLabel,
      accountLabel: account.label,
      health: account.health,
      healthLabel: account.healthLabel,
    }));
  });

  return {
    summary: {
      marketplaceCount: marketplaceGroups.length,
      marketplaceCountLabel:
        marketplaceGroups.length > 0 ? String(marketplaceGroups.length) : "Não informado",
      connectedAccounts,
      connectedAccountsLabel:
        connectedAccounts > 0 ? String(connectedAccounts) : "Não informado",
      lastSyncLabel: formatIntegrationsField(formatSellerWhen(lastSyncGeneral)),
    },
    marketplaceGroups,
    marketplaceList,
    healthItems,
  };
}

/**
 * @param {{
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 */
export function isSellerToolboxIntegrationsEmpty({ listPreview = null, detail = null }) {
  const rows = collectIntegrationRows(detail);
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
 * @returns {SellerToolboxIntegrationsPanelState}
 */
export function resolveSellerToolboxIntegrationsPanelState({
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

  if (isSellerToolboxIntegrationsEmpty({ listPreview, detail })) return "empty";
  return "loaded";
}
