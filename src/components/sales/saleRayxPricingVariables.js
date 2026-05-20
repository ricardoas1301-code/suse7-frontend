// ======================================================
// Variáveis de precificação ativas — leitura do financial_breakdown.
// ======================================================

import { DASH, formatNegativeBrlApi, formatPercentDetailLabel } from "./saleRayxFormat";

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   amountKeys: string[];
 *   percentKeys: string[];
 *   flagKeys: string[];
 * }} PricingVarDef
 */

/** @type {PricingVarDef[]} */
const PRICING_VARIABLE_DEFS = [
  {
    id: "planned_promo",
    label: "Desc. / promoção",
    amountKeys: ["discount_promotion_amount", "promotion_discount_amount", "seller_discount_amount"],
    percentKeys: ["discount_promotion_percent", "promotion_discount_percent", "seller_discount_percent"],
    flagKeys: ["planned_promo"],
  },
  {
    id: "ml_ads",
    label: "ML Ads",
    amountKeys: ["ml_ads_amount", "ml_ads_cost_amount"],
    percentKeys: ["ml_ads_percent"],
    flagKeys: ["ml_ads"],
  },
  {
    id: "affiliates",
    label: "Afiliados",
    amountKeys: ["affiliates_amount", "affiliate_amount"],
    percentKeys: ["affiliates_percent", "affiliate_percent"],
    flagKeys: ["affiliates", "affiliate"],
  },
  {
    id: "safety_reserve",
    label: "Reserva perdas e devoluções",
    amountKeys: ["loss_reserve_amount", "safety_reserve_amount", "loss_returns_reserve_amount"],
    percentKeys: ["loss_reserve_percent", "safety_reserve_percent", "loss_returns_reserve_percent"],
    flagKeys: ["safety_reserve", "loss_reserve", "loss_returns_reserve"],
  },
];

/**
 * @param {Record<string, unknown>} fin
 * @param {string[]} keys
 */
function pickFirstDefined(fin, keys) {
  for (const key of keys) {
    if (fin[key] != null && String(fin[key]).trim() !== "") return fin[key];
  }
  return null;
}

/**
 * @param {unknown} raw
 */
function isActiveAmount(raw) {
  if (raw == null || String(raw).trim() === "") return false;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) && n !== 0;
}

/**
 * @param {unknown} raw
 */
function isActivePercent(raw) {
  if (raw == null || String(raw).trim() === "") return false;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) && n !== 0;
}

/**
 * @param {Record<string, unknown>} flagsRoot
 * @param {string[]} flagKeys
 */
function readFlagEntry(flagsRoot, flagKeys) {
  for (const key of flagKeys) {
    const node = flagsRoot[key];
    if (!node || typeof node !== "object") continue;
    const n = /** @type {Record<string, unknown>} */ (node);
    const enabled =
      n.enabled === true ||
      n.active === true ||
      String(n.enabled ?? n.active ?? "").toLowerCase() === "true";
    const percent = n.percent ?? n.pct ?? n.percent_value;
    const amount = n.amount ?? n.amount_brl ?? n.value_brl;
    const hasPct = isActivePercent(percent);
    const hasAmt = isActiveAmount(amount);
    if (!enabled && !hasPct && !hasAmt) continue;
    return {
      enabled: enabled || hasPct || hasAmt,
      percent,
      amount,
    };
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} financial
 * @returns {{ label: string; value: string; percentDetail: string | null }[]}
 */
export function collectSaleRayxPricingVariables(financial) {
  const fin = financial && typeof financial === "object" ? financial : {};
  /** @type {{ label: string; value: string; percentDetail: string | null }[]} */
  const lines = [];
  const seen = new Set();

  const nested =
    fin.pricing_variables && typeof fin.pricing_variables === "object"
      ? /** @type {Record<string, unknown>} */ (fin.pricing_variables)
      : /** @type {Record<string, unknown>} */ ({});

  const flagsRoot =
    fin.pricing_variable_flags && typeof fin.pricing_variable_flags === "object"
      ? /** @type {Record<string, unknown>} */ (fin.pricing_variable_flags)
      : /** @type {Record<string, unknown>} */ ({});

  const merged = { ...nested, ...fin };

  for (const def of PRICING_VARIABLE_DEFS) {
    const flag = readFlagEntry(flagsRoot, def.flagKeys);
    const amountRaw = pickFirstDefined(merged, def.amountKeys);
    const percentRaw = pickFirstDefined(merged, def.percentKeys);
    const flagAmount = flag?.amount ?? null;
    const flagPercent = flag?.percent ?? null;

    const resolvedAmount = amountRaw ?? flagAmount;
    const resolvedPercent = percentRaw ?? flagPercent;
    const hasAmount = isActiveAmount(resolvedAmount);
    const hasPercent = isActivePercent(resolvedPercent);
    const isMarked = flag?.enabled === true;

    if (!isMarked) continue;
    if (!hasAmount && !hasPercent) continue;

    const value = hasAmount
      ? formatNegativeBrlApi(String(resolvedAmount)) ??
        formatNegativeBrlApi(String(Math.abs(Number(String(resolvedAmount).replace(",", ".")))))
      : DASH;
    const percentDetail = hasPercent ? formatPercentDetailLabel(resolvedPercent) : null;

    if (!seen.has(def.id)) {
      seen.add(def.id);
      lines.push({
        label: def.label,
        value: value ?? DASH,
        percentDetail,
      });
    }
  }

  if (Array.isArray(fin.pricing_variable_lines)) {
    for (const row of fin.pricing_variable_lines) {
      if (!row || typeof row !== "object") continue;
      const r = /** @type {Record<string, unknown>} */ (row);
      const label = r.label != null ? String(r.label).trim() : "";
      if (label === "") continue;
      const amountRaw = r.amount ?? r.amount_brl ?? r.value;
      const percentRaw = r.percent ?? r.percent_value;
      if (!isActiveAmount(amountRaw) && !isActivePercent(percentRaw)) continue;
      const lineKey = `line:${label}`;
      if (seen.has(lineKey)) continue;
      seen.add(lineKey);
      lines.push({
        label,
        value: isActiveAmount(amountRaw) ? formatNegativeBrlApi(String(amountRaw)) ?? DASH : DASH,
        percentDetail: isActivePercent(percentRaw) ? formatPercentDetailLabel(percentRaw) : null,
      });
    }
  }

  return lines;
}

/**
 * Ajustes comerciais previstos (somente flags ativas da precificação do anúncio).
 *
 * @param {Record<string, unknown> | null | undefined} financial
 */
export function collectSaleRayxCommercialAdjustments(financial) {
  const fin = financial && typeof financial === "object" ? financial : {};
  if (Array.isArray(fin.commercial_adjustment_lines) && fin.commercial_adjustment_lines.length > 0) {
    /** @type {{ label: string; value: string; percentDetail: string | null }[]} */
    const lines = [];
    for (const row of fin.commercial_adjustment_lines) {
      if (!row || typeof row !== "object") continue;
      const r = /** @type {Record<string, unknown>} */ (row);
      const label = r.label != null ? String(r.label).trim() : "";
      if (label === "") continue;
      const amountRaw = r.amount_brl ?? r.amount ?? r.value;
      const percentRaw = r.percent ?? r.percent_value;
      const hasAmount = isActiveAmount(amountRaw);
      const hasPercent = isActivePercent(percentRaw);
      if (!hasAmount && !hasPercent) continue;
      lines.push({
        label,
        value: hasAmount ? formatNegativeBrlApi(String(amountRaw)) ?? DASH : DASH,
        percentDetail: hasPercent ? formatPercentDetailLabel(percentRaw) : null,
      });
    }
    if (lines.length > 0) return lines;
  }
  return collectSaleRayxPricingVariables(financial);
}
