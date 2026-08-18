// ======================================================================
// Classificadores de lista — paridade Central de Saúde dos Anúncios.
// SSOT: listingHealthBucketResolvers (espelho backend).
// ======================================================================

import { ANUNCIOS_QUICK_FILTER_NEUTRAL_ID } from "./listingHealthConstants.js";
import { montarBucketsSaudeAnuncioDaLinha } from "./listingHealthBucketResolvers.js";

/** @param {string} filterId */
export function normalizarIdFiltroRapidoAnuncios(filterId) {
  const id = String(filterId ?? "").trim();
  if (!id || id === "all") return ANUNCIOS_QUICK_FILTER_NEUTRAL_ID;
  return id;
}

/** @param {string} filterId */
export function isOrdenacaoFiltroRapidoAnuncios(filterId) {
  const id = normalizarIdFiltroRapidoAnuncios(filterId);
  return id === "top_sales" || id === "top_profit";
}

/**
 * @param {Record<string, unknown>} row
 * @param {string} filterId
 */
export function anuncioAtendeFiltroRapidoLista(row, filterId) {
  const id = normalizarIdFiltroRapidoAnuncios(filterId);
  if (isOrdenacaoFiltroRapidoAnuncios(id)) return true;

  const buckets = montarBucketsSaudeAnuncioDaLinha(row);

  switch (id) {
    case "executive_active_listings":
      return buckets.is_active_listing;
    case "executive_offline":
      return buckets.is_offline;
    case "executive_active_with_sales":
      return buckets.active_with_sales;
    case "executive_active_without_sales":
      return buckets.active_without_sales;
    case "executive_needs_attention":
      return buckets.needs_attention;
    case "registration_complete":
      return buckets.registration === "complete";
    case "registration_excellent":
      return buckets.registration === "excellent";
    case "registration_attention":
      return buckets.registration === "attention";
    case "registration_critical":
      return buckets.registration === "critical";
    case "registration_urgent":
      return buckets.registration === "urgent";
    case "operational_critical_stock":
      return buckets.operational === "critical_stock";
    case "operational_zero_stock":
      return buckets.operational === "zero_stock";
    case "operational_paused":
      return buckets.operational === "paused";
    case "operational_inactive":
      return buckets.operational === "inactive";
    case "commercial_excellent_margin":
      return buckets.commercial === "excellent_margin";
    case "commercial_healthy_margin":
      return buckets.commercial === "healthy_margin";
    case "commercial_attention_margin":
      return buckets.commercial === "attention_margin";
    case "commercial_critical_margin":
      return buckets.commercial === "critical_margin";
    case "commercial_negative_margin":
      return buckets.commercial === "negative_margin";
    case "commercial_no_data":
      return buckets.commercial === "no_commercial_data";
    default:
      return true;
  }
}
