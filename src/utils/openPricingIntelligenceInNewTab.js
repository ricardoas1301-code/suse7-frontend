import { salvarLinhaPrecificacaoInteligenteCache } from "../features/listings/pricing-intelligence/pricingIntelligenceRowCache.js";

/**
 * Abre Precificação Inteligente em nova aba (mantém contexto da página/modal atual).
 * @param {string | null | undefined} listingInternalId
 * @param {Record<string, unknown> | null | undefined} [row] — linha do catálogo para cache rápido na nova aba
 * @returns {boolean}
 */
export function openPricingIntelligenceInNewTab(listingInternalId, row = null) {
  const id = listingInternalId != null ? String(listingInternalId).trim() : "";
  if (id === "" || typeof window === "undefined") return false;
  if (row && typeof row === "object") {
    salvarLinhaPrecificacaoInteligenteCache(id, row);
  }
  const url = new URL(`/precificacoes/inteligente/${encodeURIComponent(id)}`, window.location.origin).href;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
