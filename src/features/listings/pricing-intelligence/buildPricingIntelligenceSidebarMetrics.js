// ======================================================
// View-model do card lateral — Precificação Inteligente.
// Fonte: GET /api/ml/listings → mapGridApiToCatalogRow → product_card_metrics (backend)
// com fallback nos campos já usados na grade de Anúncios (sem cálculo no front).
// ======================================================

import { pickCatalogAccountFields } from "../../../components/catalog/S7CatalogAccountCell.jsx";
import { DASH, formatBrlFromApiString, formatPercentFromApiString } from "../utils/catalogFormatters.js";

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatIntegerBR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DASH;
  return n.toLocaleString("pt-BR");
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function pickNonEmptyString(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw).trim();
}

/**
 * @param {string | null | undefined} brlRaw
 * @returns {string}
 */
function formatProfitBrl(brlRaw) {
  if (brlRaw == null || String(brlRaw).trim() === "") return DASH;
  const n = Number(String(brlRaw).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  if (n === 0) return formatBrlFromApiString("0");
  return formatBrlFromApiString(brlRaw);
}

/**
 * @param {string | null | undefined} pctRaw
 * @returns {string}
 */
function formatProfitPercent(pctRaw) {
  if (pctRaw == null || String(pctRaw).trim() === "") return DASH;
  const formatted = formatPercentFromApiString(pctRaw);
  return formatted === DASH && String(pctRaw).trim() === "0.00" ? "0%" : formatted;
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
 * @returns {string}
 */
function resolveAccountDisplayName(row) {
  const cm = readProductCardMetrics(row);
  const fromMetrics = pickNonEmptyString(cm?.accountDisplayName);
  if (fromMetrics) return fromMetrics;

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
  const cm = readProductCardMetrics(row);
  const marketplaceAccount = resolveAccountDisplayName(row);

  const listingTypeRaw =
    pickNonEmptyString(cm?.listingType) ?? pickNonEmptyString(row.listingTypeLabel);
  const listingType = listingTypeRaw ?? DASH;

  const listingSalesCountRaw =
    cm?.listingSalesCount != null && Number.isFinite(Number(cm.listingSalesCount))
      ? Number(cm.listingSalesCount)
      : null;
  const listingSalesCount =
    listingSalesCountRaw != null ? formatIntegerBR(listingSalesCountRaw) : DASH;

  const listingSalesBrlRaw = pickNonEmptyString(cm?.listingSalesAmountBrl);
  const listingSalesAmount =
    listingSalesBrlRaw != null ? formatBrlFromApiString(listingSalesBrlRaw) : DASH;

  const listingProfitAmount = formatProfitBrl(pickNonEmptyString(cm?.listingProfitBrl));
  const listingProfitPercent = formatProfitPercent(pickNonEmptyString(cm?.listingProfitPercent));

  const productSalesCountRaw =
    cm?.productSalesCount != null && Number.isFinite(Number(cm.productSalesCount))
      ? Number(cm.productSalesCount)
      : null;
  const productSalesBrlRaw = pickNonEmptyString(cm?.productSalesAmountBrl);

  const productSalesCount =
    productSalesCountRaw != null ? formatIntegerBR(productSalesCountRaw) : DASH;
  const productSalesAmount =
    productSalesBrlRaw != null ? formatBrlFromApiString(productSalesBrlRaw) : DASH;
  const productProfitAmount = formatProfitBrl(pickNonEmptyString(cm?.productProfitBrl));
  const productProfitPercent = formatProfitPercent(pickNonEmptyString(cm?.productProfitPercent));

  return {
    marketplaceAccount,
    listingType,
    listingSalesCount,
    listingSalesAmount,
    listingProfitAmount,
    listingProfitPercent,
    productSalesCount,
    productSalesAmount,
    productProfitAmount,
    productProfitPercent,
  };
}
