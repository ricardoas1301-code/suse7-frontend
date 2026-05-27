import { logSellerToolbox } from "../../sellerToolboxDevLog";

/** @typedef {"navigation" | "confirmation" | "feedback" | "panel" | "future_action"} SellerToolboxOperationCategory */

/**
 * @typedef {{
 *   id: string;
 *   timestamp: string;
 *   sellerId: string;
 *   source: string;
 *   event: string;
 *   category: SellerToolboxOperationCategory;
 *   metadata?: Record<string, unknown>;
 * }} SellerToolboxOperationalLogEntry
 */

export const SELLER_TOOLBOX_OPERATION_SOURCE = "seller_toolbox";

export const SELLER_TOOLBOX_OPERATION_CATEGORIES = {
  NAVIGATION: "navigation",
  CONFIRMATION: "confirmation",
  FEEDBACK: "feedback",
  PANEL: "panel",
  FUTURE_ACTION: "future_action",
};

const MAX_BUFFER_SIZE = 50;
const MAX_METADATA_JSON_LENGTH = 512;
const MAX_STRING_VALUE_LENGTH = 120;

const SENSITIVE_KEY_PATTERN =
  /(?:email|telefone|phone|document|cpf|cnpj|token|secret|password|credential|oauth|payload|raw|buyer|customer_name|nome|address|endereco)/i;

const SENSITIVE_VALUE_PATTERN =
  /@|(?:\+55|\(\d{2}\))|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;

/** @type {SellerToolboxOperationalLogEntry[]} */
const operationalLogBuffer = [];

let devBridgeInitialized = false;

/**
 * @param {string} [prefix]
 */
function createOperationalLogId(prefix = "stb") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * @param {unknown} value
 * @param {number} depth
 * @returns {unknown}
 */
function sanitizeOperationalValue(value, depth = 0) {
  if (value == null) return value;

  if (typeof value === "boolean" || typeof value === "number") return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || SENSITIVE_VALUE_PATTERN.test(trimmed)) return undefined;
    if (trimmed.length > MAX_STRING_VALUE_LENGTH) return `${trimmed.slice(0, MAX_STRING_VALUE_LENGTH - 1)}…`;
    return trimmed;
  }

  if (Array.isArray(value)) {
    if (depth >= 1) return undefined;
    return value
      .slice(0, 8)
      .map((item) => sanitizeOperationalValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (typeof value === "object") {
    if (depth >= 1) return undefined;
    return sanitizeOperationalMetadata(/** @type {Record<string, unknown>} */ (value));
  }

  return undefined;
}

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 */
export function sanitizeOperationalMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return undefined;

  /** @type {Record<string, unknown>} */
  const safe = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEY_PATTERN.test(String(key))) continue;
    const sanitized = sanitizeOperationalValue(value, 0);
    if (sanitized !== undefined) safe[key] = sanitized;
  }

  if (Object.keys(safe).length === 0) return undefined;

  try {
    const serialized = JSON.stringify(safe);
    if (serialized.length > MAX_METADATA_JSON_LENGTH) return undefined;
  } catch {
    return undefined;
  }

  return safe;
}

/**
 * @param {SellerToolboxOperationCategory} category
 */
function isValidCategory(category) {
  return Object.values(SELLER_TOOLBOX_OPERATION_CATEGORIES).includes(category);
}

function initDevToolboxLogBridge() {
  if (!import.meta.env.DEV || devBridgeInitialized || typeof window === "undefined") return;
  devBridgeInitialized = true;

  window.__S7_TOOLBOX_LOGS__ = {
    get: () => operationalLogBuffer.map((entry) => ({ ...entry })),
    clear: () => {
      clearSellerToolboxOperationalLogs();
    },
  };
}

/**
 * @returns {SellerToolboxOperationalLogEntry[]}
 */
export function getSellerToolboxOperationalLogs() {
  return operationalLogBuffer.map((entry) => ({ ...entry }));
}

export function clearSellerToolboxOperationalLogs() {
  operationalLogBuffer.length = 0;
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   event?: string | null;
 *   category?: SellerToolboxOperationCategory | null;
 *   metadata?: Record<string, unknown> | null;
 *   source?: string | null;
 * }} input
 * @returns {SellerToolboxOperationalLogEntry | null}
 */
export function appendSellerToolboxOperationalLog({
  sellerId = null,
  event = null,
  category = null,
  metadata = null,
  source = SELLER_TOOLBOX_OPERATION_SOURCE,
}) {
  const normalizedSellerId = String(sellerId ?? "").trim();
  const normalizedEvent = String(event ?? "").trim();
  const normalizedSource = String(source ?? SELLER_TOOLBOX_OPERATION_SOURCE).trim();

  if (!normalizedSellerId || !normalizedEvent) return null;
  if (!category || !isValidCategory(category)) return null;

  const safeMetadata = sanitizeOperationalMetadata(metadata ?? undefined);

  /** @type {SellerToolboxOperationalLogEntry} */
  const entry = {
    id: createOperationalLogId(),
    timestamp: new Date().toISOString(),
    sellerId: normalizedSellerId,
    source: normalizedSource || SELLER_TOOLBOX_OPERATION_SOURCE,
    event: normalizedEvent,
    category,
    ...(safeMetadata ? { metadata: safeMetadata } : {}),
  };

  operationalLogBuffer.push(entry);

  let trimmed = false;
  while (operationalLogBuffer.length > MAX_BUFFER_SIZE) {
    operationalLogBuffer.shift();
    trimmed = true;
  }

  initDevToolboxLogBridge();

  logSellerToolbox("operation_logged", {
    sellerId: normalizedSellerId,
    event: normalizedEvent,
    count: operationalLogBuffer.length,
  });

  if (trimmed) {
    logSellerToolbox("operation_log_trimmed", {
      sellerId: normalizedSellerId,
      event: normalizedEvent,
      count: operationalLogBuffer.length,
    });
  }

  return entry;
}

/**
 * @param {{
 *   event: string;
 *   category: SellerToolboxOperationCategory;
 *   sellerId?: string | null;
 *   metadata?: Record<string, unknown> | null;
 * }} input
 */
export function recordSellerToolboxOperation({ event, category, sellerId = null, metadata = null }) {
  return appendSellerToolboxOperationalLog({ sellerId, event, category, metadata });
}
