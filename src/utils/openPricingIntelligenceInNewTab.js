/**
 * Abre Precificação Inteligente em nova aba (mantém contexto da página/modal atual).
 * @param {string | null | undefined} listingInternalId
 * @returns {boolean}
 */
export function openPricingIntelligenceInNewTab(listingInternalId) {
  const id = listingInternalId != null ? String(listingInternalId).trim() : "";
  if (id === "" || typeof window === "undefined") return false;
  const url = new URL(`/precificacoes/inteligente/${encodeURIComponent(id)}`, window.location.origin).href;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
