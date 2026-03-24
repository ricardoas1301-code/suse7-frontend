// ======================================================================
// SUSE7 — Busca textual no catálogo (client-side; migrável para API depois)
// Campos alinhados à linha `products` / mapper da listagem.
// ======================================================================

/**
 * @param {unknown} q
 * @returns {string}
 */
export function normalizeCatalogSearchQuery(q) {
  return String(q ?? "")
    .trim()
    .toLowerCase();
}

/**
 * Texto agregado para match (contains, case-insensitive).
 * Inclui aliases comuns (ean ↔ gtin) para não depender do nome da coluna no payload.
 *
 * @param {Record<string, unknown>} product
 * @returns {string}
 */
export function getCatalogProductSearchHaystack(product) {
  if (!product || typeof product !== "object") return "";
  const p = product;
  const parts = [
    p.product_name,
    p.sku,
    p.gtin,
    p.ean,
    p.ean_gtin,
    p.brand,
    p.model,
  ];
  return parts
    .map((v) => String(v ?? "").toLowerCase())
    .join("\u0000");
}

/**
 * Busca parcial: cada palavra (token) deve aparecer em algum lugar do haystack agregado.
 * Permite "armário branco" com nome + modelo em campos diferentes.
 *
 * @param {Record<string, unknown>} product
 * @param {string} normalizedQuery — resultado de normalizeCatalogSearchQuery
 * @returns {boolean}
 */
export function productMatchesCatalogSearch(product, normalizedQuery) {
  const n = normalizeCatalogSearchQuery(normalizedQuery);
  if (!n) return true;
  const tokens = n.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = getCatalogProductSearchHaystack(product);
  return tokens.every((t) => haystack.includes(t));
}

/**
 * @param {object[]|null|undefined} products
 * @param {string} query — texto cru do campo de busca
 * @returns {object[]}
 */
export function filterProductsByCatalogSearch(products, query) {
  if (!Array.isArray(products) || products.length === 0) return [];
  const n = normalizeCatalogSearchQuery(query);
  if (!n) return [...products];
  return products.filter((p) => productMatchesCatalogSearch(p, n));
}
