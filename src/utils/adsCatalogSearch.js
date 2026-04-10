// ======================================================================
// Busca textual na listagem de Anúncios (mock / futura API).
// ======================================================================

import { listingExternalIdMatchesCatalogSearch } from "./marketplaceListingId.js";

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} query
 */
export function filterAdsByCatalogSearch(rows, query) {
  if (!Array.isArray(rows)) return [];
  const q = String(query || "").trim().toLowerCase();
  if (!q) return rows;

  return rows.filter((row) => {
    const title = String(row.adTitle || "").toLowerCase();
    const product = String(row.productName || "").toLowerCase();
    const mkt = String(row.marketplaceLabel || "").toLowerCase();
    const sku = String(row.sku || "").toLowerCase();
    const marketplaceRaw = /** @type {{ marketplaceRaw?: string }} */ (row).marketplaceRaw;
    const externalId = String(row.externalId || "");
    const idMatch = listingExternalIdMatchesCatalogSearch(marketplaceRaw, externalId, q);
    return (
      title.includes(q) || product.includes(q) || mkt.includes(q) || idMatch || sku.includes(q)
    );
  });
}
