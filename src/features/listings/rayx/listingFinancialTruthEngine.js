import Decimal from "decimal.js";
import { formatBrlFromApiString } from "../utils/catalogFormatters.js";

const OPTIONAL_COST_FIELDS = new Set(["ads_brl", "operational_cost_brl"]);
const COST_ORDER = [
  "product_cost_brl",
  "marketplace_fee_brl",
  "shipping_cost_brl",
  "tax_brl",
  "operation_packaging_brl",
  "ads_brl",
  "operational_cost_brl",
];

/**
 * @param {unknown} raw
 * @returns {Decimal | null}
 */
function parseApiDecimal(raw) {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  try {
    const normalized = text.replace(",", ".");
    const dec = new Decimal(normalized);
    if (!dec.isFinite()) return null;
    return dec;
  } catch {
    return null;
  }
}

/**
 * @param {unknown} raw
 * @returns {number}
 */
function parseNonNegativeInt(raw) {
  if (raw == null) return 0;
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * @param {Decimal} value
 */
function toApiMoney(value) {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

/**
 * @param {Decimal} cost
 * @param {Decimal} gross
 */
function toApiPercent(cost, gross, fractionDigits = 4) {
  if (gross.isZero()) return new Decimal(0).toFixed(fractionDigits);
  return cost
    .div(gross)
    .times(100)
    .toDecimalPlaces(fractionDigits, Decimal.ROUND_HALF_UP)
    .toFixed(fractionDigits);
}

/**
 * @param {string | null | undefined} pctRaw
 * @param {number} [fractionDigits]
 */
export function formatPercentDisplay(pctRaw, fractionDigits = 4) {
  const pct = parseApiDecimal(pctRaw);
  if (pct == null) return "—";
  return `${pct.toDecimalPlaces(fractionDigits, Decimal.ROUND_HALF_UP).toFixed(fractionDigits).replace(".", ",")}%`;
}

/**
 * @param {string | null | undefined} moneyRaw
 * @param {string | null | undefined} pctRaw
 * @param {{ optional?: boolean }} [options]
 */
function buildCostMetricDisplay(moneyRaw, pctRaw, options = {}) {
  const optional = options.optional === true;
  const moneyDec = parseApiDecimal(moneyRaw);
  if (moneyDec == null) {
    if (optional) {
      return {
        value: formatBrlFromApiString("0.00"),
        sharePercent: formatPercentDisplay("0.0000"),
      };
    }
    return {
      value: "—",
      sharePercent: "—",
    };
  }

  const absMoney = toApiMoney(moneyDec.abs());
  if (moneyDec.isZero()) {
    return {
      value: formatBrlFromApiString("0.00"),
      sharePercent: formatPercentDisplay("0.0000"),
    };
  }

  const pctDec = parseApiDecimal(pctRaw);
  const pct = pctDec != null ? pctDec : new Decimal(0);
  return {
    value: `-${formatBrlFromApiString(absMoney)}`,
    sharePercent: formatPercentDisplay(pct.toFixed(4)),
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} summary
 * @param {string} field
 * @param {string[]} warnings
 */
function resolveCostDecimal(summary, field, warnings) {
  const sourceMap = {
    product_cost_brl: "product_cost_only_brl",
    marketplace_fee_brl: "marketplace_fee_brl",
    shipping_cost_brl: "shipping_cost_brl",
    tax_brl: "tax_cost_brl",
    operation_packaging_brl: "operation_packaging_cost_brl",
    ads_brl: "ads_cost_brl",
    operational_cost_brl: "operational_costs_brl",
  };
  const sourceField = sourceMap[field];
  const raw = sourceField ? summary?.[sourceField] : null;
  const dec = parseApiDecimal(raw);
  if (dec != null) return dec;
  if (!OPTIONAL_COST_FIELDS.has(field)) {
    warnings.push(`Custo crítico ausente em summary.${sourceField}.`);
  }
  return new Decimal(0);
}

/**
 * @param {Record<string, unknown> | null | undefined} listing
 * @param {Record<string, unknown> | null | undefined} executiveData
 */
export function buildListingFinancialTruthContract(listing, executiveData) {
  const summary =
    executiveData?.summary != null && typeof executiveData.summary === "object"
      ? /** @type {Record<string, unknown>} */ (executiveData.summary)
      : null;
  if (!summary) return null;

  const warnings = [];
  const gross = parseApiDecimal(summary.gross_sales_brl) ?? new Decimal(0);
  const salesCount = parseNonNegativeInt(summary.orders_count);
  const unitsSold = parseNonNegativeInt(summary.items_quantity_sold);

  /** @type {Record<string, Decimal>} */
  const costsDec = {};
  for (const field of COST_ORDER) {
    costsDec[field] = resolveCostDecimal(summary, field, warnings);
  }
  const totalCosts = COST_ORDER.reduce((acc, field) => acc.plus(costsDec[field]), new Decimal(0));
  const netProfit = gross.minus(totalCosts);
  const marginPct = gross.isZero()
    ? new Decimal(0)
    : netProfit.div(gross).times(100).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  const profitPerUnit = unitsSold > 0 ? netProfit.div(unitsSold).toDecimalPlaces(2, Decimal.ROUND_HALF_UP) : null;
  const ticketAverage = salesCount > 0 ? gross.div(salesCount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP) : null;

  const periodObj =
    executiveData?.period != null && typeof executiveData.period === "object"
      ? /** @type {Record<string, unknown>} */ (executiveData.period)
      : null;
  const dataQuality =
    executiveData?.data_quality != null && typeof executiveData.data_quality === "object"
      ? /** @type {Record<string, unknown>} */ (executiveData.data_quality)
      : null;
  const externalWarnings = Array.isArray(dataQuality?.warnings)
    ? dataQuality.warnings.map((w) => String(w))
    : [];
  warnings.push(...externalWarnings);

  const missingCriticalCosts = warnings.filter((w) => w.includes("Custo crítico ausente")).length;
  const confidence = missingCriticalCosts > 0 ? "partial" : String(dataQuality?.status ?? "complete");

  const firstRankingProduct = Array.isArray(executiveData?.rankings?.products)
    ? executiveData.rankings.products[0]
    : null;
  const resolvedProductId =
    listing?.product_id != null && String(listing.product_id).trim() !== ""
      ? String(listing.product_id).trim()
      : firstRankingProduct?.product_id != null && String(firstRankingProduct.product_id).trim() !== ""
        ? String(firstRankingProduct.product_id).trim()
        : null;

  return {
    scope: "listing",
    listing_id:
      listing?.external_listing_id != null && String(listing.external_listing_id).trim() !== ""
        ? String(listing.external_listing_id).trim()
        : null,
    product_id: resolvedProductId,
    period_start: periodObj?.start_date != null ? String(periodObj.start_date) : null,
    period_end: periodObj?.end_date != null ? String(periodObj.end_date) : null,
    sales_count: salesCount,
    units_sold: unitsSold,
    gross_revenue_brl: toApiMoney(gross),
    costs: {
      product_cost_brl: toApiMoney(costsDec.product_cost_brl),
      marketplace_fee_brl: toApiMoney(costsDec.marketplace_fee_brl),
      shipping_cost_brl: toApiMoney(costsDec.shipping_cost_brl),
      tax_brl: toApiMoney(costsDec.tax_brl),
      operation_packaging_brl: toApiMoney(costsDec.operation_packaging_brl),
      ads_brl: toApiMoney(costsDec.ads_brl),
      operational_cost_brl: toApiMoney(costsDec.operational_cost_brl),
      total_cost_brl: toApiMoney(totalCosts),
    },
    profit: {
      net_profit_brl: toApiMoney(netProfit),
      net_margin_pct: marginPct.toFixed(4),
      ticket_average_brl: ticketAverage != null ? toApiMoney(ticketAverage) : null,
      profit_per_unit_brl: profitPerUnit != null ? toApiMoney(profitPerUnit) : null,
      profit_per_unit_pct: marginPct.toFixed(4),
    },
    confidence,
    warnings,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} summary
 * @param {ReturnType<typeof buildListingFinancialTruthContract> | null | undefined} contract
 */
export function buildListingRayXSummaryFromContract(summary, contract) {
  if (!summary || !contract) return summary ?? null;
  const marketplaceFee = parseApiDecimal(contract.costs.marketplace_fee_brl) ?? new Decimal(0);
  const shipping = parseApiDecimal(contract.costs.shipping_cost_brl) ?? new Decimal(0);
  const netReceived = (parseApiDecimal(contract.gross_revenue_brl) ?? new Decimal(0))
    .minus(marketplaceFee)
    .minus(shipping);

  return {
    ...summary,
    orders_count: contract.sales_count,
    items_quantity_sold: contract.units_sold,
    gross_sales_brl: contract.gross_revenue_brl,
    product_cost_only_brl: contract.costs.product_cost_brl,
    marketplace_fee_brl: contract.costs.marketplace_fee_brl,
    shipping_cost_brl: contract.costs.shipping_cost_brl,
    tax_cost_brl: contract.costs.tax_brl,
    operation_packaging_cost_brl: contract.costs.operation_packaging_brl,
    ads_cost_brl: contract.costs.ads_brl,
    operational_costs_brl: contract.costs.operational_cost_brl,
    total_costs_brl: contract.costs.total_cost_brl,
    net_profit_brl: contract.profit.net_profit_brl,
    contribution_profit_brl: contract.profit.net_profit_brl,
    contribution_margin_percent: contract.profit.net_margin_pct,
    average_ticket_brl: contract.profit.ticket_average_brl,
    you_receive_brl: toApiMoney(netReceived),
    sales_count_display: contract.sales_count,
    units_sold_display: contract.units_sold,
  };
}

/**
 * @param {ReturnType<typeof buildListingFinancialTruthContract> | null | undefined} contract
 */
export function buildListingRayXCostsMetrics(contract) {
  if (!contract) return [];

  const gross = parseApiDecimal(contract.gross_revenue_brl) ?? new Decimal(0);
  const toMetric = (id, label, amountRaw, optional = false) => {
    const amount = parseApiDecimal(amountRaw) ?? new Decimal(0);
    const pct = toApiPercent(amount, gross, 4);
    const display = buildCostMetricDisplay(amountRaw, pct, { optional });
    return {
      id,
      label,
      value: display.value,
      sharePercent: display.sharePercent,
      tone: "danger",
    };
  };

  return [
    toMetric("product_cost_only", "Custo Produto", contract.costs.product_cost_brl, false),
    toMetric("marketplace_fee", "Comissão Marketplace", contract.costs.marketplace_fee_brl, false),
    toMetric("shipping_cost", "Frete", contract.costs.shipping_cost_brl, false),
    toMetric("tax_cost", "Impostos", contract.costs.tax_brl, false),
    toMetric(
      "operation_packaging_cost",
      "Operação + Embalagem",
      contract.costs.operation_packaging_brl,
      false,
    ),
    toMetric("ads_cost", "ML Ads", contract.costs.ads_brl, true),
    toMetric("operational_costs", "Custos Operacionais", contract.costs.operational_cost_brl, true),
    toMetric("total_costs", "Total dos custos", contract.costs.total_cost_brl, false),
  ];
}

/**
 * @param {Record<string, unknown> | null | undefined} summary
 */
export function buildExecutiveSummaryRayXCostsMetrics(summary) {
  if (!summary) return [];
  const gross = parseApiDecimal(summary.gross_sales_brl) ?? new Decimal(0);
  const fields = [
    { id: "product_cost", label: "Custo Produto", raw: summary.product_cost_only_brl, optional: false },
    { id: "marketplace_fee", label: "Comissão Marketplace", raw: summary.marketplace_fee_brl, optional: false },
    { id: "shipping", label: "Frete", raw: summary.shipping_cost_brl, optional: false },
    { id: "taxes", label: "Impostos", raw: summary.tax_cost_brl, optional: false },
    {
      id: "operation_packaging",
      label: "Operação + Embalagem",
      raw: summary.operation_packaging_cost_brl,
      optional: false,
    },
    { id: "ml_ads", label: "ML Ads", raw: summary.ads_cost_brl ?? "0.00", optional: true },
    {
      id: "operational_costs",
      label: "Custos Operacionais",
      raw: summary.operational_costs_brl ?? "0.00",
      optional: true,
    },
  ];

  const costs = fields.map((field) => ({
    ...field,
    amount: parseApiDecimal(field.raw) ?? new Decimal(0),
  }));
  const totalCosts = costs.reduce((acc, entry) => acc.plus(entry.amount), new Decimal(0));
  const totalRaw = toApiMoney(totalCosts);

  const toMetric = (id, label, amountRaw, optional = false) => {
    const amount = parseApiDecimal(amountRaw) ?? new Decimal(0);
    const pct = toApiPercent(amount, gross, 4);
    const display = buildCostMetricDisplay(amountRaw, pct, { optional });
    return {
      id,
      label,
      value: display.value,
      sharePercent: display.sharePercent,
      tone: "danger",
    };
  };

  return [
    ...fields.map((field) => toMetric(field.id, field.label, field.raw, field.optional)),
    toMetric("total_costs", "Total dos custos", totalRaw, false),
  ];
}
