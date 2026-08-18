// ======================================================================
// Helpers de exibição compartilhados — lista Vendas (desktop + mobile).
// ======================================================================

export const VENDAS_LIST_DASH = "—";

/** @param {string | null | undefined} fullName */
export function formatVendasBuyerNameShort(fullName) {
  const t = fullName != null ? String(fullName).trim() : "";
  if (!t) return "";
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return t;
  return words.slice(0, 2).join(" ");
}

/**
 * @param {Record<string, unknown>} row
 * @param {string} listingId
 * @returns {string | null}
 */
export function pickVendasListingMercadoLivreUrl(row, listingId) {
  const marketplace = row.marketplace != null ? String(row.marketplace).trim().toLowerCase() : "";
  if (marketplace !== "mercado_livre" && marketplace !== "mercadolivre") return null;

  const permalinkCandidates = [row.listing_permalink, row.listingPermalink];
  const rawJson =
    row.raw_json && typeof row.raw_json === "object"
      ? /** @type {Record<string, unknown>} */ (row.raw_json)
      : null;
  if (rawJson) {
    permalinkCandidates.push(rawJson.permalink);
    const nestedItem =
      rawJson.item && typeof rawJson.item === "object"
        ? /** @type {Record<string, unknown>} */ (rawJson.item)
        : null;
    if (nestedItem) permalinkCandidates.push(nestedItem.permalink);
  }

  for (const candidate of permalinkCandidates) {
    if (candidate != null && String(candidate).trim() !== "") {
      return String(candidate).trim();
    }
  }

  const lid = listingId != null ? String(listingId).trim().replace(/^#/, "") : "";
  const mlbMatch = lid.match(/MLB-?(\d+)/i);
  if (!mlbMatch) return null;
  return `https://produto.mercadolivre.com.br/MLB-${mlbMatch[1]}`;
}
