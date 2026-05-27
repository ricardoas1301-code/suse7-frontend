import { marketplaceLabel } from "../../sellerOpsConstants";
import { formatSellerWhen } from "../../sellerOpsUtils";
import { resolveLastMarketplaceSync } from "../sellerDrawerSectionModel";

/** @typedef {"loading" | "loaded" | "empty" | "error"} SellerToolboxHistoryPanelState */

/** @typedef {"active" | "stale" | "empty" | "unknown"} SellerToolboxHistoryAggregateStatus */

/**
 * @typedef {{
 *   summary: {
 *     totalEventsLabel: string;
 *     lastActivityLabel: string;
 *     dataSourceLabel: string;
 *     aggregateStatus: SellerToolboxHistoryAggregateStatus;
 *     aggregateStatusLabel: string;
 *   };
 *   recentEvents: Array<{
 *     id: string;
 *     typeLabel: string;
 *     description: string;
 *     whenLabel: string;
 *   }>;
 *   hiddenEventCount: number;
 *   commercialActivities: Array<{
 *     id: string;
 *     label: string;
 *     detail: string;
 *     whenLabel: string;
 *   }>;
 *   lastActivity: {
 *     lastSaleLabel: string | null;
 *     lastSyncLabel: string | null;
 *     lastChangeLabel: string | null;
 *   };
 * }} SellerToolboxHistoryModel
 */

const SENSITIVE_FIELD_PATTERN =
  /(?:access[_-]?token|refresh[_-]?token|client[_-]?secret|authorization[_-]?code|credential|secret|oauth|password|api[_-]?key|stack|trace|raw[_-]?json|payload|buyer|customer[_-]?email|buyer[_-]?email|email|phone|telefone|document|cpf|cnpj|amount|price|total|brl|margin|profit|revenue|net_|gross_)/i;

const SENSITIVE_VALUE_PATTERN =
  /@|(?:\+55|\(\d{2}\))|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;

const VISIBLE_EVENTS = 5;
const VISIBLE_COMMERCIAL = 5;
const STALE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * @param {string | null | undefined} value
 * @param {string} [fallback]
 */
export function formatHistoryField(value, fallback = "Não informado") {
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
 * @param {unknown} value
 */
function isSensitiveValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  return SENSITIVE_VALUE_PATTERN.test(text);
}

/**
 * @param {unknown} iso
 */
function parseActivityTime(iso) {
  if (!iso) return null;
  const time = Date.parse(String(iso));
  return Number.isFinite(time) ? time : null;
}

/**
 * @param {Record<string, unknown>} row
 */
function pickEventTimestamp(row) {
  const candidates = [
    row.occurred_at,
    row.created_at,
    row.updated_at,
    row.timestamp,
    row.at,
    row.date,
    row.event_at,
  ];
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) return candidate;
  }
  return null;
}

/**
 * @param {Record<string, unknown>} row
 */
function pickEventType(row) {
  const candidates = [row.event_type, row.type, row.kind, row.category, row.action, row.source];
  for (const candidate of candidates) {
    const normalized = String(candidate ?? "").trim();
    if (normalized && !isSensitiveValue(normalized)) return normalized;
  }
  return "Evento";
}

/**
 * @param {Record<string, unknown>} row
 */
function pickEventDescription(row) {
  const candidates = [row.label, row.message, row.summary, row.title, row.description, row.detail];
  for (const candidate of candidates) {
    const normalized = String(candidate ?? "").trim();
    if (!normalized || isSensitiveValue(normalized)) continue;
    if (normalized.length > 120) return `${normalized.slice(0, 117)}…`;
    return normalized;
  }
  return "Atividade registrada";
}

/**
 * @param {Record<string, unknown>} row
 */
function sanitizeHistoryRow(row) {
  /** @type {Record<string, unknown>} */
  const safe = {};
  for (const [key, value] of Object.entries(row)) {
    if (isSensitiveField(key)) continue;
    if (typeof value === "string" && isSensitiveValue(value)) continue;
    safe[key] = value;
  }
  return safe;
}

/**
 * @param {unknown} rows
 */
function normalizeRowArray(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row && typeof row === "object").map((row) => sanitizeHistoryRow(row));
}

/**
 * @param {import("../../sellerOpsTypes").SellerDetailPayload | null | undefined} detail
 */
function collectEventRows(detail) {
  /** @type {Record<string, unknown>[]} */
  const rows = [];

  rows.push(...normalizeRowArray(detail?.recent_events));
  rows.push(...normalizeRowArray(detail?.timeline));
  rows.push(...normalizeRowArray(detail?.audit_logs));

  const futureActions = detail?.future_actions;
  if (futureActions && typeof futureActions === "object" && !Array.isArray(futureActions)) {
    const recent = /** @type {Record<string, unknown>} */ (futureActions).recent;
    rows.push(...normalizeRowArray(recent));
    const items = /** @type {Record<string, unknown>} */ (futureActions).items;
    rows.push(...normalizeRowArray(items));
  }

  return rows;
}

/**
 * @param {Record<string, unknown>} row
 * @param {number} index
 * @param {string} prefix
 */
function buildEventEntry(row, index, prefix) {
  const timestamp = pickEventTimestamp(row);
  return {
    id: String(row.id ?? row.event_id ?? `${prefix}-${index}`),
    typeLabel: formatHistoryField(pickEventType(row), "Evento"),
    description: pickEventDescription(row),
    whenLabel: formatHistoryField(formatSellerWhen(/** @type {string | null | undefined} */ (timestamp))),
    sortTime: parseActivityTime(timestamp),
  };
}

/**
 * @param {Record<string, unknown>} row
 * @param {number} index
 */
function buildCommercialEntry(row, index) {
  const timestamp =
    row.sold_at ??
    row.sale_at ??
    row.order_date ??
    row.created_at ??
    row.updated_at ??
    row.date;

  const marketplace = marketplaceLabel(/** @type {string} */ (row.marketplace ?? row.channel));
  const statusRaw = String(row.status ?? row.sale_status ?? row.order_status ?? "").trim();
  const statusLabel = statusRaw && !isSensitiveValue(statusRaw) ? statusRaw : "Registrada";

  const detailParts = [marketplace !== "—" ? marketplace : null, statusLabel !== "Registrada" ? statusLabel : null]
    .filter(Boolean);

  return {
    id: String(row.id ?? row.sale_id ?? row.order_id ?? `sale-${index}`),
    label: "Venda registrada",
    detail: detailParts.length > 0 ? detailParts.join(" · ") : "Atividade comercial",
    whenLabel: formatHistoryField(formatSellerWhen(/** @type {string | null | undefined} */ (timestamp))),
    sortTime: parseActivityTime(timestamp),
  };
}

/**
 * @param {string[]} sources
 */
function buildDataSourceLabel(sources) {
  if (sources.length === 0) return "Não informado";
  return sources.join(" · ");
}

/**
 * @param {SellerToolboxHistoryAggregateStatus} status
 */
export function historyAggregateStatusLabel(status) {
  switch (status) {
    case "active":
      return "Ativo";
    case "stale":
      return "Desatualizado";
    case "empty":
      return "Sem histórico";
    default:
      return "Não informado";
  }
}

/**
 * @param {SellerToolboxHistoryAggregateStatus} status
 */
export function sellerToolboxHistoryBadgeClassName(status) {
  const base = "seller-toolbox-history-badge dc-seller-pill";
  if (status === "active") return `${base} dc-seller-pill--status-active`;
  if (status === "stale") return `${base} dc-seller-pill--health-warn`;
  if (status === "empty") return `${base} dc-seller-pill--status-muted`;
  return `${base} dc-seller-pill--neutral`;
}

/**
 * @param {number | null} latestTime
 * @param {boolean} hasAnyData
 * @returns {SellerToolboxHistoryAggregateStatus}
 */
function resolveAggregateStatus(latestTime, hasAnyData) {
  if (!hasAnyData) return "empty";
  if (latestTime == null) return "unknown";
  const age = Date.now() - latestTime;
  if (age <= STALE_MS) return "active";
  return "stale";
}

/**
 * @param {...unknown} timestamps
 * @returns {number | null}
 */
function pickLatestTime(...timestamps) {
  let latest = null;
  for (const ts of timestamps) {
    const time = parseActivityTime(ts);
    if (time != null && (latest == null || time > latest)) latest = time;
  }
  return latest;
}

/**
 * @param {{
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 * @returns {SellerToolboxHistoryModel}
 */
export function buildSellerToolboxHistoryModel({ listPreview = null, detail = null }) {
  const eventRows = collectEventRows(detail);
  const salesRows = normalizeRowArray(detail?.recent_sales);
  const marketplaces = Array.isArray(detail?.marketplaces) ? detail.marketplaces : [];

  /** @type {string[]} */
  const dataSources = [];
  if (Array.isArray(detail?.recent_events) && detail.recent_events.length > 0) {
    dataSources.push("Eventos recentes");
  }
  if (salesRows.length > 0) dataSources.push("Vendas recentes");
  if (Array.isArray(detail?.timeline) && detail.timeline.length > 0) dataSources.push("Timeline");
  if (Array.isArray(detail?.audit_logs) && detail.audit_logs.length > 0) dataSources.push("Auditoria");
  if (listPreview?.last_access_at) dataSources.push("Lista sellers");

  const eventItems = eventRows
    .map((row, index) => buildEventEntry(row, index, "event"))
    .sort((a, b) => (b.sortTime ?? 0) - (a.sortTime ?? 0));

  const recentEvents = eventItems.slice(0, VISIBLE_EVENTS).map(({ sortTime, ...item }) => item);
  const hiddenEventCount = Math.max(0, eventItems.length - VISIBLE_EVENTS);

  const commercialItems = salesRows
    .map((row, index) => buildCommercialEntry(row, index))
    .sort((a, b) => (b.sortTime ?? 0) - (a.sortTime ?? 0));

  const commercialActivities = commercialItems
    .slice(0, VISIBLE_COMMERCIAL)
    .map(({ sortTime, ...item }) => item);

  const lastSaleRow = commercialItems[0] ?? null;
  const lastSyncRaw = resolveLastMarketplaceSync(marketplaces);
  const sellerUpdatedAt = detail?.seller?.updated_at ?? detail?.seller?.last_updated_at;
  const lastAccessAt = listPreview?.last_access_at ?? detail?.seller?.last_access_at;

  const lastSaleTime = lastSaleRow?.sortTime ?? null;
  const lastSyncTime = parseActivityTime(lastSyncRaw);
  const lastChangeTime = pickLatestTime(
    eventItems[0]?.sortTime,
    parseActivityTime(sellerUpdatedAt),
    parseActivityTime(lastAccessAt),
  );

  const latestActivityTime = pickLatestTime(lastSaleTime, lastSyncTime, lastChangeTime);

  const totalEventsKnown = eventRows.length;
  const hasAnyData =
    totalEventsKnown > 0 ||
    salesRows.length > 0 ||
    Boolean(lastSyncRaw) ||
    Boolean(lastAccessAt) ||
    Boolean(sellerUpdatedAt);

  const aggregateStatus = resolveAggregateStatus(latestActivityTime, hasAnyData);

  const formatTimeLabel = (time) =>
    time != null ? formatHistoryField(formatSellerWhen(new Date(time).toISOString())) : null;

  return {
    summary: {
      totalEventsLabel: totalEventsKnown > 0 ? String(totalEventsKnown) : "Não informado",
      lastActivityLabel: latestActivityTime != null ? formatTimeLabel(latestActivityTime) : "Não informado",
      dataSourceLabel: buildDataSourceLabel(dataSources),
      aggregateStatus,
      aggregateStatusLabel: historyAggregateStatusLabel(aggregateStatus),
    },
    recentEvents,
    hiddenEventCount,
    commercialActivities,
    lastActivity: {
      lastSaleLabel: formatTimeLabel(lastSaleTime),
      lastSyncLabel: lastSyncRaw ? formatHistoryField(formatSellerWhen(lastSyncRaw)) : null,
      lastChangeLabel: formatTimeLabel(lastChangeTime),
    },
  };
}

/**
 * @param {{
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 */
export function isSellerToolboxHistoryEmpty({ listPreview = null, detail = null }) {
  const eventRows = collectEventRows(detail);
  const salesRows = normalizeRowArray(detail?.recent_sales);
  const marketplaces = Array.isArray(detail?.marketplaces) ? detail.marketplaces : [];
  const lastSync = resolveLastMarketplaceSync(marketplaces);

  if (eventRows.length > 0 || salesRows.length > 0) return false;
  if (lastSync) return false;

  const lastAccess = listPreview?.last_access_at ?? detail?.seller?.last_access_at;
  if (lastAccess) return false;

  const updatedAt = detail?.seller?.updated_at ?? detail?.seller?.last_updated_at;
  if (updatedAt) return false;

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
 * @returns {SellerToolboxHistoryPanelState}
 */
export function resolveSellerToolboxHistoryPanelState({
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

  if (isSellerToolboxHistoryEmpty({ listPreview, detail })) return "empty";
  return "loaded";
}
