// ======================================================================

// Normalização do contrato — Central de Saúde dos Produtos (summary_cards).

// ======================================================================



const SUMMARY_CARD_COUNT_FIELDS = new Set([

  "dead_stock_count",

  "dead_stock_days_threshold",

  "stockout_risk_count",

  "low_markup_count",

]);



const SUMMARY_CARD_FIELDS = [

  "dead_stock_count",

  "dead_stock_capital_brl",

  "dead_stock_days_threshold",

  "stockout_risk_count",

  "average_markup",

  "low_markup_count",

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



/** @param {unknown} value */

function readString(value) {

  return value != null ? String(value).trim() : "";

}



/**

 * @param {unknown} raw

 * @returns {Record<string, unknown> | null}

 */

function normalizeProductTurnover(raw) {

  if (raw == null || typeof raw !== "object") return null;

  const source = /** @type {Record<string, unknown>} */ (raw);

  const subtitle = readString(source.subtitle);

  return {

    title: readString(source.title) || "Giro dos Produtos",

    products_with_sales_in_window: readCount(

      source.products_with_sales_in_window ?? source.productsWithSalesInWindow,

    ),

    total_products: readCount(source.total_products ?? source.totalProducts),

    percent: readString(source.percent) || "0.00",

    window_days: readCount(source.window_days ?? source.windowDays),

    subtitle:

      subtitle ||

      `${readCount(source.products_with_sales_in_window ?? source.productsWithSalesInWindow)} de ${readCount(source.total_products ?? source.totalProducts)} produtos venderam nos últimos ${readCount(source.window_days ?? source.windowDays)} dias`,

    sales_source: readString(source.sales_source ?? source.salesSource) || null,

  };

}



/**

 * @param {Record<string, unknown> | null | undefined} rawData

 * @param {{ onWarn?: (message: string) => void }} [options]

 * @returns {Record<string, unknown> | null}

 */

export function normalizeProductsHealthSummaryCards(rawData, options = {}) {

  const { onWarn = null } = options;



  const warn = (message) => {

    if (typeof onWarn === "function") {

      onWarn(message);

      return;

    }

    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {

      console.warn(message);

    }

  };



  const source = rawData?.summary_cards ?? rawData?.summaryCards ?? null;

  if (source == null || typeof source !== "object") {

    warn("[S7_PRODUCT_HEALTH_DASHBOARD] missing summary_cards");

    return null;

  }



  /** @type {Record<string, unknown>} */

  const normalized = {};



  for (const field of SUMMARY_CARD_FIELDS) {

    const camelField = toCamelCase(field);

    const raw = source[field] ?? source[camelField];

    if (raw === undefined || raw === null) {

      warn(`[S7_PRODUCT_HEALTH_DASHBOARD] missing summary_cards.${field}`);

    }

    if (SUMMARY_CARD_COUNT_FIELDS.has(field) || field.endsWith("_count")) {

      normalized[field] = readCount(raw);

    } else {

      normalized[field] = readString(raw) || "0";

    }

  }



  const productTurnover = normalizeProductTurnover(source.product_turnover ?? source.productTurnover);

  if (productTurnover == null) {

    warn("[S7_PRODUCT_HEALTH_DASHBOARD] missing summary_cards.product_turnover");

  } else {

    normalized.product_turnover = productTurnover;

  }



  return normalized;

}



/**

 * @param {Record<string, unknown> | null | undefined} raw

 */

export function normalizeProductsHealthSummaryPayload(raw) {

  if (raw == null || typeof raw !== "object") {

    return {

      total_products: 0,

      period: null,

      abc_mix: null,

      stock_coverage: null,

      profitability_mix: null,

      summary_cards: null,

      metadata: null,

    };

  }



  return {

    total_products: readCount(raw.total_products ?? raw.totalProducts),

    period: raw.period ?? null,

    abc_mix: raw.abc_mix ?? raw.abcMix ?? null,

    stock_coverage: raw.stock_coverage ?? raw.stockCoverage ?? null,

    profitability_mix: raw.profitability_mix ?? raw.profitabilityMix ?? null,

    summary_cards: normalizeProductsHealthSummaryCards(raw),

    metadata: raw.metadata ?? null,

  };

}

