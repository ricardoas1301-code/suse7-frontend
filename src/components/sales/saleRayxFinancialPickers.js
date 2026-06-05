// ======================================================
// Seletores financeiros do Raio-x — mesma resolução de campo do modal.
// Sem cálculos; só leitura do payload já calculado na API.
// ======================================================

import { formatPercentDetailLabel } from "./saleRayxFormat";
import { buildSaleRayxMarketplaceFeePercentDetail } from "./saleRayxMarketplaceFeeDetail.js";

/**
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {Record<string, unknown> | null}
 */
function pickMarketplaceRevenue(fin) {
  if (!fin || typeof fin !== "object") return null;
  return fin.marketplace_revenue && typeof fin.marketplace_revenue === "object"
    ? /** @type {Record<string, unknown>} */ (fin.marketplace_revenue)
    : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {Record<string, unknown> | null}
 */
function pickMarketplaceFeeObject(fin) {
  if (!fin || typeof fin !== "object") return null;
  const mr = pickMarketplaceRevenue(fin);
  if (mr?.marketplace_fee && typeof mr.marketplace_fee === "object") {
    return /** @type {Record<string, unknown>} */ (mr.marketplace_fee);
  }
  if (fin.marketplace_fee && typeof fin.marketplace_fee === "object") {
    return /** @type {Record<string, unknown>} */ (fin.marketplace_fee);
  }
  return null;
}

/**
 * Valor da tarifa/comissão — espelha SaleFinancialBreakdownCard (commissionRaw).
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {string | null}
 */
export function pickSaleMarketplaceFeeBrl(fin) {
  if (!fin || typeof fin !== "object") return null;
  const mr = pickMarketplaceRevenue(fin);
  const marketplaceFee = pickMarketplaceFeeObject(fin);
  const raw =
    (marketplaceFee?.amount_brl != null ? String(marketplaceFee.amount_brl) : null) ??
    (mr?.marketplace_fee_amount_brl != null ? String(mr.marketplace_fee_amount_brl) : null) ??
    (fin.commission != null ? String(fin.commission) : null) ??
    (fin.marketplace_fee_amount != null ? String(fin.marketplace_fee_amount) : null);
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw);
}

/**
 * Impostos internos — espelha SaleFinancialBreakdownCard (Custos internos).
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {string | null}
 */
export function pickSaleInternalTaxBrl(fin) {
  if (!fin || typeof fin !== "object") return null;
  const internalCosts =
    fin.internal_costs && typeof fin.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (fin.internal_costs)
      : null;
  const raw = internalCosts?.internal_tax_brl ?? fin.internal_taxes ?? fin.internal_tax_amount;
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw);
}

/**
 * Percentual do imposto interno — espelha Raio-X (tax_percent_applied).
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {string | null} ex.: "6%"
 */
export function pickSaleInternalTaxPercentLabel(fin) {
  if (!fin || typeof fin !== "object") return null;
  const internalCosts =
    fin.internal_costs && typeof fin.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (fin.internal_costs)
      : null;
  const raw = internalCosts?.tax_percent_applied ?? fin.tax_percent_applied;
  if (raw == null || String(raw).trim() === "") return null;
  return formatPercentDetailLabel(String(raw));
}

/**
 * Tipo do anúncio (Premium / Clássico) — mesma origem da tarifa no Raio-X.
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {string | null}
 */
export function pickSaleListingTypeLabel(fin) {
  if (!fin || typeof fin !== "object") return null;
  const mr = pickMarketplaceRevenue(fin);
  const marketplaceFee = pickMarketplaceFeeObject(fin);
  const raw =
    (marketplaceFee?.listing_type_label != null ? String(marketplaceFee.listing_type_label) : null) ??
    (mr?.listing_type_label != null ? String(mr.listing_type_label) : null) ??
    (fin.marketplace_fee_tier_label != null ? String(fin.marketplace_fee_tier_label) : null) ??
    (fin.listing_type_label != null ? String(fin.listing_type_label) : null);
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw).trim();
}

/**
 * Percentual da comissão/tarifa — só o número (sem Premium/Clássico).
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {string | null}
 */
export function pickSaleMarketplaceFeePercentLabel(fin) {
  if (!fin || typeof fin !== "object") return null;
  const mr = pickMarketplaceRevenue(fin);
  const marketplaceFee = pickMarketplaceFeeObject(fin);
  const feePercent =
    (marketplaceFee?.percentage != null ? String(marketplaceFee.percentage) : null) ??
    (mr?.marketplace_fee_percent != null ? String(mr.marketplace_fee_percent) : null) ??
    (fin.marketplace_fee_percent != null ? String(fin.marketplace_fee_percent) : null);
  if (feePercent == null || String(feePercent).trim() === "") return null;
  return formatPercentDetailLabel(feePercent);
}

/**
 * Linha 2 da coluna Comissão — tipo + percentual (ex.: "Premium 16,5%").
 * Mesmo normalizador do Raio-X (buildSaleRayxMarketplaceFeePercentDetail).
 * @param {Record<string, unknown> | null | undefined} fin
 * @returns {string | null}
 */
export function pickSaleCommissionSecondaryLabel(fin) {
  if (!fin || typeof fin !== "object") return null;
  const mr = pickMarketplaceRevenue(fin) ?? {};
  const marketplaceFee = pickMarketplaceFeeObject(fin);
  const feePercent =
    (marketplaceFee?.percentage != null ? String(marketplaceFee.percentage) : null) ??
    (mr.marketplace_fee_percent != null ? String(mr.marketplace_fee_percent) : null) ??
    (fin.marketplace_fee_percent != null ? String(fin.marketplace_fee_percent) : null);

  const listingTypeLabel = pickSaleListingTypeLabel(fin);
  const pctLabel = feePercent ? formatPercentDetailLabel(feePercent) : null;

  const detail = buildSaleRayxMarketplaceFeePercentDetail(
    {
      ...fin,
      listing_type_label:
        listingTypeLabel ??
        (fin.listing_type_label != null ? String(fin.listing_type_label) : null),
      marketplace_fee_tier_label:
        listingTypeLabel ??
        (fin.marketplace_fee_tier_label != null ? String(fin.marketplace_fee_tier_label) : null),
    },
    feePercent,
  );
  if (detail != null && String(detail).trim() !== "") return String(detail).trim();
  if (listingTypeLabel && pctLabel) return `${listingTypeLabel} ${pctLabel}`;
  if (listingTypeLabel) return listingTypeLabel;
  if (pctLabel) return pctLabel;
  return null;
}

/**
 * Status operacional da venda — exclusivamente sale_status_label (Raio-X general).
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {string | null}
 */
export function pickSaleOperationalStatusLabel(row) {
  if (!row || typeof row !== "object") return null;
  const raw = row.sale_status_label != null ? String(row.sale_status_label).trim() : "";
  return raw || null;
}
