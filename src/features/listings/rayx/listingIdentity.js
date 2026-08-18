import { isMercadoLivreMarketplace } from "../../../utils/marketplaceListingId.js";

/**
 * @param {Record<string, unknown> | null | undefined} listing
 * @param {string | null | undefined} fallback
 */
export function resolverListingIdCompleto(listing, fallback = null) {
  const candidatos = [
    listing?.external_listing_id,
    listing?.externalId,
    listing?.listing_id,
    listing?.listing_id_display,
    listing?.listingIdDisplay,
    listing?.listingNumber,
    listing?.listing_number,
    listing?.listingId,
    fallback,
  ];

  for (const bruto of candidatos) {
    if (bruto == null) continue;
    const texto = String(bruto).trim();
    if (texto) return texto;
  }
  return "";
}

/**
 * Chave canônica para comparar IDs de anúncio entre payloads diferentes.
 * ML: considera equivalência com/sem prefixo MLB.
 *
 * @param {string | null | undefined} marketplace
 * @param {string | null | undefined} listingId
 */
export function normalizarListingIdParaMatch(marketplace, listingId) {
  const id = String(listingId ?? "").trim();
  if (!id) return "";
  if (!isMercadoLivreMarketplace(marketplace)) return id.toLowerCase();

  const upper = id.toUpperCase();
  if (/^MLB\d+$/.test(upper)) return upper.slice(3);
  if (/^\d+$/.test(upper)) return upper;
  return upper;
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 */
export function extrairListingIdDaVenda(row) {
  const candidatos = [
    row?.external_listing_id,
    row?.listing_id_display,
    row?.listing_id,
    row?.listing_number,
  ];
  for (const bruto of candidatos) {
    if (bruto == null) continue;
    const texto = String(bruto).trim();
    if (texto) return texto;
  }
  return "";
}
