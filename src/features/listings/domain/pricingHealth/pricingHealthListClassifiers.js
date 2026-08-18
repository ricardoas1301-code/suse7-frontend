// ======================================================================
// Classificadores de lista — paridade Central de Saúde da Precificação.
// SSOT: catalog_pricing_health_buckets (GET catalog-pricing-health-buckets).
// ======================================================================

import {
  PRECIFICACOES_QUICK_FILTER_LEGACY_ALIASES,
  PRECIFICACOES_QUICK_FILTER_NEUTRAL_ID,
  PRICING_HEALTH_LISTING_TYPE_FILTER_TO_BUCKET,
  PRICING_HEALTH_PROJECTED_MARGIN_FILTER_TO_BUCKET,
  PRICING_HEALTH_PROMOTION_FILTER_TO_BUCKET,
} from "./pricingHealthConstants.js";
import {
  lerBucketsCanonicosPrecificacaoDaLinha,
  lerBucketsOperacionaisDaLinha,
} from "./pricingHealthBucketReader.js";

/** @param {string} filterId */
export function normalizarIdFiltroRapidoPrecificacoes(filterId) {
  const id = String(filterId ?? "").trim();
  if (!id || id === "all") return PRECIFICACOES_QUICK_FILTER_NEUTRAL_ID;
  return PRECIFICACOES_QUICK_FILTER_LEGACY_ALIASES[id] ?? id;
}

/** @param {string} filterId */
export function isOrdenacaoFiltroRapidoPrecificacoes(filterId) {
  const id = normalizarIdFiltroRapidoPrecificacoes(filterId);
  return id === "top_sales" || id === "top_profit";
}

/**
 * @param {Record<string, unknown>} row
 * @param {string} filterId
 */
export function anuncioAtendeFiltroRapidoPrecificacoesLista(row, filterId) {
  const id = normalizarIdFiltroRapidoPrecificacoes(filterId);
  if (isOrdenacaoFiltroRapidoPrecificacoes(id)) return true;

  const buckets = lerBucketsCanonicosPrecificacaoDaLinha(row);
  if (!buckets) return false;

  const operational = lerBucketsOperacionaisDaLinha(row);

  switch (id) {
    case "offer_status_healthy":
      return buckets.offer_status_bucket === "healthy";
    case "offer_status_attention":
      return buckets.offer_status_bucket === "attention";
    case "offer_status_critical":
      return buckets.offer_status_bucket === "critical";
    case "offer_status_no_data":
      return buckets.offer_status_bucket === "no_data";
    case "projected_margin_30_plus":
      return (
        buckets.projected_margin_bucket ===
        PRICING_HEALTH_PROJECTED_MARGIN_FILTER_TO_BUCKET.projected_margin_30_plus
      );
    case "projected_margin_20_29":
      return (
        buckets.projected_margin_bucket ===
        PRICING_HEALTH_PROJECTED_MARGIN_FILTER_TO_BUCKET.projected_margin_20_29
      );
    case "projected_margin_10_19":
      return (
        buckets.projected_margin_bucket ===
        PRICING_HEALTH_PROJECTED_MARGIN_FILTER_TO_BUCKET.projected_margin_10_19
      );
    case "projected_margin_0_9":
      return (
        buckets.projected_margin_bucket ===
        PRICING_HEALTH_PROJECTED_MARGIN_FILTER_TO_BUCKET.projected_margin_0_9
      );
    case "projected_margin_loss":
      return (
        buckets.projected_margin_bucket ===
        PRICING_HEALTH_PROJECTED_MARGIN_FILTER_TO_BUCKET.projected_margin_loss
      );
    case "projected_margin_no_data":
      return (
        buckets.projected_margin_bucket ===
        PRICING_HEALTH_PROJECTED_MARGIN_FILTER_TO_BUCKET.projected_margin_no_data
      );
    case "promotion_active":
      return buckets.promotion_bucket === PRICING_HEALTH_PROMOTION_FILTER_TO_BUCKET.promotion_active;
    case "promotion_scheduled":
      return buckets.promotion_bucket === PRICING_HEALTH_PROMOTION_FILTER_TO_BUCKET.promotion_scheduled;
    case "promotion_available":
      return buckets.promotion_bucket === PRICING_HEALTH_PROMOTION_FILTER_TO_BUCKET.promotion_available;
    case "promotion_none":
      return buckets.promotion_bucket === PRICING_HEALTH_PROMOTION_FILTER_TO_BUCKET.promotion_none;
    case "listing_type_classic":
      return buckets.listing_type_key === PRICING_HEALTH_LISTING_TYPE_FILTER_TO_BUCKET.listing_type_classic;
    case "listing_type_premium":
      return buckets.listing_type_key === PRICING_HEALTH_LISTING_TYPE_FILTER_TO_BUCKET.listing_type_premium;
    case "logistics_free_shipping":
      return buckets.free_shipping === true;
    case "operation_active":
      return operational.status_normalized === "active";
    case "operation_paused":
      return operational.status_normalized === "paused";
    case "operation_no_sales":
      return operational.sales_count === 0;
    case "operation_sku_pending":
      return operational.sku_pending;
    default:
      return true;
  }
}
