/**
 * Rótulo amigável do tipo de anúncio Mercado Livre (somente exibição).
 * @param {unknown} listingTypeId
 */
export function formatarTipoAnuncioMl(listingTypeId) {
  if (listingTypeId == null || String(listingTypeId).trim() === "") return null;
  const id = String(listingTypeId).trim().toLowerCase();
  if (id.includes("gold_pro") || id.includes("gold_premium")) return "Premium";
  if (id.includes("gold_special") || id.includes("gold_classic")) return "Clássico";
  if (id.includes("gold")) return "Ouro";
  if (id.includes("free")) return "Grátis";
  const humanized = id.replace(/_/g, " ");
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
}
