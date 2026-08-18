// ======================================================
// Custos operacionais — exibição no Raio-x da venda (somente leitura).
// Fonte: snapshot/contrato histórico da venda (operational_costs_display).
// Sem fallback de configuração viva do listing.
// ======================================================

import Decimal from "decimal.js";
import { DASH, formatNegativeBrlApi, formatPercentDetailLabel } from "./saleRayxFormat";

const ROUND = Decimal.ROUND_HALF_UP;

/** @type {ReadonlyArray<{ key: string; label: string }>} */
const OPERATIONAL_COST_SPECS = [
  { key: "ml_ads", label: "ML Ads" },
  { key: "safety_reserve", label: "Custos Operacionais" },
];

/** @type {Record<string, string>} */
const OPERATIONAL_COST_RAYX_LABELS = {
  ml_ads: "ML Ads",
  safety_reserve: "Custos Operacionais",
};

const ZERO_PERCENT_DETAIL = "0,00%";
const ZERO_VALUE = formatNegativeBrlApi("0.00") ?? "-R$ 0,00";

/**
 * @param {unknown} raw
 * @returns {Decimal | null}
 */
function parseFinancialDecimal(raw) {
  if (raw == null) return null;
  const text = String(raw).trim().replace("%", "");
  if (!text) return null;
  try {
    const dec = new Decimal(text.replace(",", "."));
    return dec.isFinite() ? dec : null;
  } catch {
    return null;
  }
}

/**
 * @param {unknown} amountRaw
 * @param {unknown} percentRaw
 * @param {unknown} salePriceRaw
 * @returns {Decimal | null}
 */
function resolveOperationalAmountDecimal(amountRaw, percentRaw, salePriceRaw) {
  const amount = parseFinancialDecimal(amountRaw);
  if (amount != null) return amount;

  const pct = parseFinancialDecimal(percentRaw);
  const sale = parseFinancialDecimal(salePriceRaw);
  if (pct == null || sale == null || sale.lte(0)) return null;
  return sale.mul(pct).div(100).toDecimalPlaces(2, ROUND);
}

/**
 * @param {string | null | undefined} key
 * @param {string | null | undefined} label
 */
function normalizeOperationalCostLabel(key, label) {
  const k = key != null ? String(key).trim() : "";
  if (k && OPERATIONAL_COST_RAYX_LABELS[k]) return OPERATIONAL_COST_RAYX_LABELS[k];

  const text = label != null ? String(label).trim() : "";
  if (text === "Reserva perdas e devoluções") return "Custos Operacionais";
  return text;
}

/**
 * @param {unknown} pct
 */
function formatOperationalPercentDetail(pct) {
  const dec = parseFinancialDecimal(pct);
  if (dec == null) return ZERO_PERCENT_DETAIL;
  if (dec.isZero()) return ZERO_PERCENT_DETAIL;
  return formatPercentDetailLabel(dec.toFixed(2)) ?? ZERO_PERCENT_DETAIL;
}

/**
 * @param {Record<string, unknown>} row
 * @param {unknown} salePriceRaw
 * @returns {{ label: string; value: string; percentDetail: string; isZero: boolean }}
 */
function formatOperationalCostDisplayRow(row, salePriceRaw) {
  const key = row.key != null ? String(row.key) : "";
  const label = normalizeOperationalCostLabel(key, row.label != null ? String(row.label) : "");
  const percentRaw = row.percent ?? row.percent_value;
  const amountDec = resolveOperationalAmountDecimal(
    row.amount_brl ?? row.amount ?? row.value,
    percentRaw,
    salePriceRaw,
  );

  const isZero = amountDec == null || amountDec.isZero();
  const value =
    amountDec != null
      ? formatNegativeBrlApi(amountDec.toDecimalPlaces(2, ROUND).toFixed(2)) ?? ZERO_VALUE
      : ZERO_VALUE;

  return {
    label: label || key,
    value,
    percentDetail: formatOperationalPercentDetail(percentRaw),
    isZero,
  };
}

/**
 * @param {unknown} lines
 * @param {unknown} salePriceRaw
 * @returns {Map<string, { label: string; value: string; percentDetail: string }>}
 */
function mapOperationalCostLinesByKey(lines, salePriceRaw) {
  /** @type {Map<string, { label: string; value: string; percentDetail: string }>} */
  const byKey = new Map();
  if (!Array.isArray(lines)) return byKey;

  for (const row of lines) {
    if (!row || typeof row !== "object") continue;
    const record = /** @type {Record<string, unknown>} */ (row);
    const key = record.key != null ? String(record.key).trim() : "";
    if (!key) continue;
    byKey.set(key, formatOperationalCostDisplayRow(record, salePriceRaw));
  }
  return byKey;
}

/**
 * @param {Record<string, unknown> | null | undefined} financial
 * @returns {{ label: string; value: string; percentDetail: string; isZero: boolean }[]}
 */
export function collectSaleRayxOperationalCostsDisplayLines(financial) {
  const fin = financial && typeof financial === "object" ? financial : {};
  const mr =
    fin.marketplace_revenue && typeof fin.marketplace_revenue === "object"
      ? /** @type {Record<string, unknown>} */ (fin.marketplace_revenue)
      : null;
  const salePriceRaw = mr?.gross_sale_amount_brl ?? fin.sale_price ?? fin.gross_amount;

  const displayBlock =
    fin.operational_costs_display && typeof fin.operational_costs_display === "object"
      ? /** @type {Record<string, unknown>} */ (fin.operational_costs_display)
      : null;

  let byKey = mapOperationalCostLinesByKey(displayBlock?.lines, salePriceRaw);

  if (byKey.size === 0) {
    const cm =
      fin.contingency_margin && typeof fin.contingency_margin === "object"
        ? /** @type {Record<string, unknown>} */ (fin.contingency_margin)
        : null;
    byKey = mapOperationalCostLinesByKey(cm?.lines, salePriceRaw);
  }

  if (byKey.size === 0 && Array.isArray(fin.commercial_adjustment_lines)) {
    const filtered = fin.commercial_adjustment_lines.filter((row) => {
      if (!row || typeof row !== "object") return false;
      const key = /** @type {Record<string, unknown>} */ (row).key;
      return key === "ml_ads" || key === "safety_reserve";
    });
    byKey = mapOperationalCostLinesByKey(filtered, salePriceRaw);
  }

  return OPERATIONAL_COST_SPECS.map((spec) => {
    const fromSnapshot = byKey.get(spec.key);
    if (fromSnapshot) return { ...fromSnapshot, label: spec.label };
    return {
      label: spec.label,
      value: ZERO_VALUE,
      percentDetail: ZERO_PERCENT_DETAIL,
      isZero: true,
    };
  });
}
