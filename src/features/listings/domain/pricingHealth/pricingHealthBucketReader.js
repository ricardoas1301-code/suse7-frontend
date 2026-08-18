// ======================================================================
// Leitura dos buckets canônicos — payload catalog_pricing_health_buckets.
// Sem recálculo: apenas seleção por chave.
// ======================================================================

import { ATTENTION_REASON_SKU_PENDING_ML } from "../../../../constants/listingAttention.js";
import { normalizarStatusMercadoLivre } from "../health/normalizeListingHealthSnapshotFromCatalogRow.js";
import {
  PRICING_HEALTH_LISTING_TYPE_FILTER_TO_BUCKET,
  PRICING_HEALTH_PROJECTED_MARGIN_FILTER_TO_BUCKET,
  PRICING_HEALTH_PROMOTION_FILTER_TO_BUCKET,
} from "./pricingHealthConstants.js";

/** @param {Record<string, unknown>} row */
export function lerBucketsCanonicosPrecificacaoDaLinha(row) {
  const raw = row?.catalog_pricing_health_buckets;
  return raw != null && typeof raw === "object"
    ? /** @type {Record<string, unknown>} */ (raw)
    : null;
}

/** @param {Record<string, unknown>} row */
export function anuncioPossuiFinanceiroAvaliavelCanonicamente(row) {
  const buckets = lerBucketsCanonicosPrecificacaoDaLinha(row);
  if (!buckets) return false;
  if (buckets.financial_evaluable !== true) return false;

  const profit = buckets.profit_brl;
  const margin = buckets.margin_pct;
  const profitOk = profit != null && String(profit).trim() !== "";
  const marginOk = margin != null && String(margin).trim() !== "";
  return profitOk && marginOk;
}

/** @param {Record<string, unknown>} row */
function lerBucketsOperacionaisDaLinha(row) {
  const rawStatus = row.listingStatusRaw ?? row.status ?? row.statusKey ?? null;
  const statusNormalized = normalizarStatusMercadoLivre(rawStatus);
  const salesCount =
    row.salesCount != null && Number.isFinite(Number(row.salesCount))
      ? Math.trunc(Number(row.salesCount))
      : 0;

  return {
    status_normalized: statusNormalized,
    sales_count: salesCount,
    sku_pending:
      row.skuPending === true || String(row.attentionReason ?? "") === ATTENTION_REASON_SKU_PENDING_ML,
  };
}

export { lerBucketsOperacionaisDaLinha };
