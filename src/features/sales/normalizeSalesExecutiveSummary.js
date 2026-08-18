// ======================================================================
// Normalização canônica do executive-summary (Dashboard + Vendas).
// Puro / testável — sem cálculo financeiro paralelo; só shape + zero×ausência.
// ======================================================================

/**
 * @param {unknown} value
 * @returns {number}
 */
export function parseExecutiveSummaryCount(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
export function coerceExecutiveMoneyStringOrNull(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  return s;
}

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function coerceExecutiveMoneyStringOrZero(raw) {
  const s = coerceExecutiveMoneyStringOrNull(raw);
  return s != null ? s : "0.00";
}

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function coerceExecutivePercentStringOrZero(raw) {
  if (raw == null) return "0.00";
  const s = String(raw).trim();
  return s !== "" ? s : "0.00";
}

/**
 * Extrai o objeto `summary` de um payload completo ou de um summary já plano.
 * @param {Record<string, unknown> | null | undefined} input
 * @returns {Record<string, unknown> | null}
 */
export function extractSalesExecutiveSummaryObject(input) {
  if (input == null || typeof input !== "object") return null;

  const hasSummaryFields =
    Object.prototype.hasOwnProperty.call(input, "orders_count") ||
    Object.prototype.hasOwnProperty.call(input, "gross_sales_brl") ||
    Object.prototype.hasOwnProperty.call(input, "items_quantity_sold");

  if (hasSummaryFields) {
    return /** @type {Record<string, unknown>} */ (input);
  }

  const nested = input.summary;
  if (nested != null && typeof nested === "object") {
    return /** @type {Record<string, unknown>} */ (nested);
  }

  return null;
}

/**
 * Universo sem vendas elegíveis (zero real — não é erro nem loading).
 * @param {Record<string, unknown> | null | undefined} summary
 */
export function isSalesExecutiveSummaryZeroUniverse(summary) {
  if (summary == null || typeof summary !== "object") return false;
  const orders = parseExecutiveSummaryCount(summary.orders_count);
  const qty = parseExecutiveSummaryCount(summary.items_quantity_sold ?? summary.orders_count);
  return orders === 0 && qty === 0;
}

/**
 * Normaliza o summary para exibição.
 * - Zero universo → zeros canônicos (não null) nos campos financeiros do card.
 * - Com vendas → preserva null onde a API sinaliza ausência/indisponibilidade.
 *
 * @param {Record<string, unknown> | null | undefined} input
 * @returns {Record<string, unknown> | null}
 */
export function normalizeSalesExecutiveSummary(input) {
  const base = extractSalesExecutiveSummaryObject(input);
  if (base == null) return null;

  const orders = parseExecutiveSummaryCount(base.orders_count);
  const qty = parseExecutiveSummaryCount(base.items_quantity_sold);
  const zeroUniverse = orders === 0 && qty === 0;

  if (zeroUniverse) {
    return {
      ...base,
      orders_count: 0,
      items_quantity_sold: 0,
      orders_in_progress_count: parseExecutiveSummaryCount(base.orders_in_progress_count),
      gross_sales_brl: coerceExecutiveMoneyStringOrZero(base.gross_sales_brl),
      average_ticket_brl: coerceExecutiveMoneyStringOrZero(base.average_ticket_brl),
      highest_order_gross_brl: coerceExecutiveMoneyStringOrZero(
        base.highest_order_gross_brl ?? base.highest_sale_gross_brl ?? base.max_order_gross_brl,
      ),
      net_received_brl: coerceExecutiveMoneyStringOrZero(base.net_received_brl),
      you_receive_brl: coerceExecutiveMoneyStringOrZero(
        base.you_receive_brl ?? base.net_received_brl,
      ),
      net_profit_brl: coerceExecutiveMoneyStringOrZero(base.net_profit_brl),
      contribution_profit_brl: coerceExecutiveMoneyStringOrZero(
        base.contribution_profit_brl ?? base.net_profit_brl,
      ),
      contribution_margin_percent: coerceExecutivePercentStringOrZero(
        base.contribution_margin_percent,
      ),
      marketplace_fee_brl: coerceExecutiveMoneyStringOrZero(base.marketplace_fee_brl),
      shipping_cost_brl: coerceExecutiveMoneyStringOrZero(base.shipping_cost_brl),
      tax_cost_brl: coerceExecutiveMoneyStringOrZero(base.tax_cost_brl),
      ads_cost_brl: coerceExecutiveMoneyStringOrZero(base.ads_cost_brl),
      product_cost_only_brl: coerceExecutiveMoneyStringOrZero(base.product_cost_only_brl),
      operation_packaging_cost_brl: coerceExecutiveMoneyStringOrZero(
        base.operation_packaging_cost_brl,
      ),
      operational_costs_brl: coerceExecutiveMoneyStringOrZero(base.operational_costs_brl),
      nominal_costs_brl: coerceExecutiveMoneyStringOrZero(base.nominal_costs_brl),
      marketplace_settlement_credits_brl: coerceExecutiveMoneyStringOrZero(
        base.marketplace_settlement_credits_brl,
      ),
      total_costs_brl: coerceExecutiveMoneyStringOrZero(base.total_costs_brl),
      _s7_zero_universe: true,
    };
  }

  return {
    ...base,
    orders_count: orders,
    items_quantity_sold: qty,
    gross_sales_brl: coerceExecutiveMoneyStringOrNull(base.gross_sales_brl) ?? "0.00",
    average_ticket_brl: coerceExecutiveMoneyStringOrNull(base.average_ticket_brl),
    highest_order_gross_brl: coerceExecutiveMoneyStringOrNull(
      base.highest_order_gross_brl ?? base.highest_sale_gross_brl ?? base.max_order_gross_brl,
    ),
    net_received_brl: coerceExecutiveMoneyStringOrNull(base.net_received_brl),
    you_receive_brl: coerceExecutiveMoneyStringOrNull(base.you_receive_brl ?? base.net_received_brl),
    net_profit_brl: coerceExecutiveMoneyStringOrNull(base.net_profit_brl),
    contribution_profit_brl: coerceExecutiveMoneyStringOrNull(
      base.contribution_profit_brl ?? base.net_profit_brl,
    ),
    contribution_margin_percent:
      base.contribution_margin_percent != null && String(base.contribution_margin_percent).trim() !== ""
        ? String(base.contribution_margin_percent).trim()
        : null,
    marketplace_fee_brl: coerceExecutiveMoneyStringOrNull(base.marketplace_fee_brl),
    shipping_cost_brl: coerceExecutiveMoneyStringOrNull(base.shipping_cost_brl),
    tax_cost_brl: coerceExecutiveMoneyStringOrNull(base.tax_cost_brl),
    ads_cost_brl: coerceExecutiveMoneyStringOrNull(base.ads_cost_brl),
    product_cost_only_brl: coerceExecutiveMoneyStringOrNull(base.product_cost_only_brl),
    operation_packaging_cost_brl: coerceExecutiveMoneyStringOrNull(base.operation_packaging_cost_brl),
    operational_costs_brl: coerceExecutiveMoneyStringOrNull(base.operational_costs_brl),
    nominal_costs_brl: coerceExecutiveMoneyStringOrNull(base.nominal_costs_brl),
    marketplace_settlement_credits_brl: coerceExecutiveMoneyStringOrNull(
      base.marketplace_settlement_credits_brl,
    ),
    total_costs_brl: coerceExecutiveMoneyStringOrNull(base.total_costs_brl),
    _s7_zero_universe: false,
  };
}

/**
 * Classifica o estado de apresentação do Resumo Diário.
 * @param {{
 *   loading?: boolean;
 *   error?: string | null;
 *   summary?: Record<string, unknown> | null;
 * }} state
 * @returns {'loading' | 'error' | 'zero' | 'data' | 'absent'}
 */
export function resolveDailySummaryPresentationState(state) {
  if (state.loading) return "loading";
  if (state.error) return "error";
  const normalized = normalizeSalesExecutiveSummary(state.summary);
  if (normalized == null) return "absent";
  if (normalized._s7_zero_universe === true) return "zero";
  return "data";
}
