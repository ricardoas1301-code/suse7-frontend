// ======================================================
// View-model do card lateral — Precificação Inteligente.
// Fonte SSOT: accumulated_performance (bootstrap/grid) — escopos atômicos.
// ======================================================

import { pickCatalogAccountFields } from "../../../components/catalog/S7CatalogAccountCell.jsx";
import { isAtomicCompleteAccumulatedScope } from "../../../services/listingAccumulatedPerformanceApi.js";
import { formatAccumulatedPerformanceScope } from "../../shared/formatAccumulatedPerformanceScope.js";
import { DASH } from "../utils/catalogFormatters.js";

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function pickNonEmptyString(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw).trim();
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown> | null}
 */
function readProductCardMetrics(row) {
  return row.product_card_metrics != null && typeof row.product_card_metrics === "object"
    ? /** @type {Record<string, unknown>} */ (row.product_card_metrics)
    : null;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown> | null}
 */
function readAccumulatedPerformance(row) {
  return row.accumulated_performance != null && typeof row.accumulated_performance === "object"
    ? /** @type {Record<string, unknown>} */ (row.accumulated_performance)
    : null;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown> | null}
 */
function readOfficialListingScope(row) {
  const qty =
    row.salesCount != null && Number.isFinite(Number(row.salesCount))
      ? String(Math.trunc(Number(row.salesCount)))
      : null;
  const gross = pickNonEmptyString(row.grossRevenueBrl ?? row.grossSalesBrl);
  const profit = pickNonEmptyString(row.contributionProfitBrl ?? row.netProfitBrl);
  const pct = pickNonEmptyString(row.contributionMarginPercent);
  const scope = {
    sales_quantity: qty,
    sales_amount_brl: gross,
    sales_profit_brl: profit,
    sales_profit_percent: pct,
  };
  return isAtomicCompleteAccumulatedScope(scope) ? scope : null;
}

/**
 * @param {Record<string, unknown>} row
 * @param {"listing" | "product"} kind
 * @returns {Record<string, unknown> | null}
 */
function resolveCanonicalScope(row, kind) {
  const ap = readAccumulatedPerformance(row);
  const fromAp =
    ap?.[kind] != null && typeof ap[kind] === "object"
      ? /** @type {Record<string, unknown>} */ (ap[kind])
      : null;
  if (isAtomicCompleteAccumulatedScope(fromAp)) {
    return fromAp;
  }
  if (kind === "listing") {
    return readOfficialListingScope(row);
  }
  return null;
}

/**
 * @param {Record<string, unknown>} row
 * @param {Record<string, unknown> | null} listingScope
 * @param {Record<string, unknown> | null} productScope
 */
function logPiAccumulatedParityDev(row, listingScope, productScope) {
  if (import.meta.env.PROD) return;
  const ap = readAccumulatedPerformance(row);
  console.info("[S7_ACCUMULATED_PERFORMANCE_PARITY]", {
    surface: "pricing_intelligence",
    external_listing_id: row.externalId ?? row.external_listing_id ?? null,
    product_id: row.productId ?? row.product_id ?? null,
    listing_quantity: listingScope?.sales_quantity ?? null,
    listing_gross_brl: listingScope?.sales_amount_brl ?? null,
    listing_profit_brl: listingScope?.sales_profit_brl ?? null,
    listing_profit_percent: listingScope?.sales_profit_percent ?? null,
    product_quantity: productScope?.sales_quantity ?? null,
    product_gross_brl: productScope?.sales_amount_brl ?? null,
    product_profit_brl: productScope?.sales_profit_brl ?? null,
    product_profit_percent: productScope?.sales_profit_percent ?? null,
    source:
      ap?.meta && typeof ap.meta === "object" && ap.meta.source != null
        ? String(ap.meta.source)
        : listingScope != null
          ? "official_listing_fields"
          : "unavailable",
    availability:
      ap?.meta && typeof ap.meta === "object" && ap.meta.availability != null
        ? String(ap.meta.availability)
        : listingScope != null && productScope != null
          ? "complete"
          : listingScope != null
            ? "listing_only"
            : "unavailable",
  });
}

/**
 * @param {Record<string, unknown>} row
 * @returns {string}
 */
function resolveAccountDisplayName(row) {
  const { accountAlias } = pickCatalogAccountFields({
    account_alias: row.account_alias ?? row.accountAlias,
    accountAlias: row.accountAlias ?? row.account_alias,
    ml_account_alias: row.ml_account_alias ?? row.mlAccountAlias,
    mlAccountAlias: row.mlAccountAlias ?? row.ml_account_alias,
    marketplace_account_id: row.marketplace_account_id ?? row.marketplaceAccountId,
    marketplaceAccountId: row.marketplaceAccountId ?? row.marketplace_account_id,
  });

  if (accountAlias != null && String(accountAlias).trim() !== "") {
    return String(accountAlias).trim();
  }

  const mlAliasRaw = row.mlAccountAlias ?? row.ml_account_alias;
  const mlAlias =
    mlAliasRaw != null && String(mlAliasRaw).trim() !== "" ? String(mlAliasRaw).trim() : null;
  if (mlAlias) return mlAlias;

  return DASH;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {{
 *   marketplaceAccount: string;
 *   listingType: string;
 *   listingSalesCount: string;
 *   listingSalesAmount: string;
 *   listingProfitAmount: string;
 *   listingProfitPercent: string;
 *   productSalesCount: string;
 *   productSalesAmount: string;
 *   productProfitAmount: string;
 *   productProfitPercent: string;
 * }}
 */
export function buildPricingIntelligenceSidebarMetrics(row) {
  const marketplaceAccount = resolveAccountDisplayName(row);

  const cm = readProductCardMetrics(row);
  const listingTypeRaw =
    pickNonEmptyString(cm?.listingType) ?? pickNonEmptyString(row.listingTypeLabel);
  const listingType = listingTypeRaw ?? DASH;

  const listingScope = resolveCanonicalScope(row, "listing");
  const productScope = resolveCanonicalScope(row, "product");
  logPiAccumulatedParityDev(row, listingScope, productScope);

  const listingFormatted = formatAccumulatedPerformanceScope(listingScope);
  const productFormatted = formatAccumulatedPerformanceScope(productScope);

  return {
    marketplaceAccount,
    listingType,
    listingSalesCount: listingFormatted.salesQuantity,
    listingSalesAmount: listingFormatted.salesAmount,
    listingProfitAmount: listingFormatted.profitAmount,
    listingProfitPercent: listingFormatted.profitPercent,
    productSalesCount: productFormatted.salesQuantity,
    productSalesAmount: productFormatted.salesAmount,
    productProfitAmount: productFormatted.profitAmount,
    productProfitPercent: productFormatted.profitPercent,
  };
}
