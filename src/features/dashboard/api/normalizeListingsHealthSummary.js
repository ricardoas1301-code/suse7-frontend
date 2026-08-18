// ======================================================================
// Normalização do contrato — Central de Saúde dos Anúncios (summary_cards).
// SSOT: snake_case oficial; aceita camelCase legado na leitura.
// ======================================================================

const SUMMARY_CARD_FIELDS = [
  "active_count",
  "offline_count",
  "paused_count",
  "inactive_count",
  "active_with_sales_count",
  "active_without_sales_count",
  "attention_count",
];

/** @param {string} snake */
function toCamelCase(snake) {
  return snake.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/** @param {unknown} value */
function readCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {Record<string, unknown> | null | undefined} rawData
 * @param {{ onWarn?: (message: string) => void }} [options]
 * @returns {Record<string, number> | null}
 */
export function normalizeListingsHealthSummaryCards(rawData, options = {}) {
  const { onWarn = null } = options;

  /** @param {string} message */
  const warn = (message) => {
    if (typeof onWarn === "function") {
      onWarn(message);
      return;
    }
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.warn(message);
    }
  };

  const source =
    rawData?.summary_cards ??
    rawData?.summaryCards ??
    null;

  if (source == null || typeof source !== "object") {
    warn("[S7_LISTING_HEALTH_DASHBOARD] missing summary_cards");
    return null;
  }

  /** @type {Record<string, number>} */
  const normalized = {};

  for (const field of SUMMARY_CARD_FIELDS) {
    const camelField = toCamelCase(field);
    const raw = source[field] ?? source[camelField];
    if (raw === undefined || raw === null) {
      warn(`[S7_LISTING_HEALTH_DASHBOARD] missing summary_cards.${field}`);
    }
    normalized[field] = readCount(raw);
  }

  return normalized;
}

/**
 * Normaliza resposta completa do fetch/handler para uso no componente.
 *
 * @param {Record<string, unknown> | null | undefined} raw
 * @param {{ onWarn?: (message: string) => void }} [options]
 */
export function normalizeListingsHealthSummaryPayload(raw, options = {}) {
  if (raw == null || typeof raw !== "object") {
    return {
      summary: null,
      summary_cards: null,
      cards: null,
      metadata: null,
    };
  }

  return {
    summary: raw.summary ?? null,
    summary_cards: normalizeListingsHealthSummaryCards(raw, options),
    cards: raw.cards ?? null,
    metadata: raw.metadata ?? null,
  };
}
