// ======================================================
// Detalhe da tarifa / comissão (mesmo padrão do card Raio-x).
// ======================================================

import { formatPercentDetailLabel } from "./saleRayxFormat";

/**
 * @param {Record<string, unknown>} fin
 * @returns {string | null}
 */
export function pickSaleRayxInternalTaxPercentDetail(fin) {
  const internalCosts =
    fin.internal_costs && typeof fin.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (fin.internal_costs)
      : null;

  const internalTaxPercent =
    internalCosts?.tax_percent_applied != null ? String(internalCosts.tax_percent_applied) : null;
  const label = formatPercentDetailLabel(internalTaxPercent);
  return label ? `Alíquota ${label}` : null;
}

/**
 * @param {Record<string, unknown>} fin
 * @param {unknown} feePercent
 * @returns {string | null}
 */
export function buildSaleRayxMarketplaceFeePercentDetail(fin, feePercent) {
  const tier =
    fin.marketplace_fee_tier_label != null && String(fin.marketplace_fee_tier_label).trim() !== ""
      ? String(fin.marketplace_fee_tier_label).trim()
      : fin.listing_type_label != null && String(fin.listing_type_label).trim() !== ""
        ? String(fin.listing_type_label).trim()
        : null;

  const pct = formatPercentDetailLabel(feePercent != null ? String(feePercent) : null);
  if (tier && pct) {
    const pctNum = pct.replace("%", "").trim();
    return `${tier} ${pctNum}%`;
  }
  return pct;
}

/**
 * @param {Record<string, unknown>} fin
 * @param {Record<string, unknown>} mr
 * @returns {string | null}
 */
export function pickSaleRayxMarketplaceFeePercent(fin, mr) {
  const marketplaceFee =
    (mr.marketplace_fee && typeof mr.marketplace_fee === "object"
      ? mr.marketplace_fee
      : fin.marketplace_fee && typeof fin.marketplace_fee === "object"
        ? fin.marketplace_fee
        : null) ?? null;

  const feePercent =
    (marketplaceFee?.percentage != null ? String(marketplaceFee.percentage) : null) ??
    (mr.marketplace_fee_percent != null ? String(mr.marketplace_fee_percent) : null) ??
    (fin.marketplace_fee_percent != null ? String(fin.marketplace_fee_percent) : null);

  const detail = buildSaleRayxMarketplaceFeePercentDetail(
    {
      ...fin,
      listing_type_label:
        (marketplaceFee?.listing_type_label != null
          ? String(marketplaceFee.listing_type_label)
          : null) ??
        (mr.listing_type_label != null ? String(mr.listing_type_label) : null) ??
        fin.listing_type_label,
      marketplace_fee_tier_label:
        (marketplaceFee?.listing_type_label != null
          ? String(marketplaceFee.listing_type_label)
          : null) ??
        (fin.marketplace_fee_tier_label != null ? String(fin.marketplace_fee_tier_label) : null) ??
        (mr.listing_type_label != null ? String(mr.listing_type_label) : null) ??
        fin.listing_type_label,
    },
    feePercent,
  );

  return detail != null && detail.trim() !== "" ? detail.trim() : null;
}
