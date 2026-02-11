/**
 * imageRules.js — regras de negócio para imagens (sem side effects)
 * - ensureSinglePrimary: garante apenas 1 is_primary por escopo
 * - normalizeSortOrder: reordena sort_order após drag & drop
 * - getFallbackPrimary: retorna link principal quando não há is_primary
 */

/**
 * Garante que apenas um link seja primary no escopo.
 * @param {Array} links - lista de links com { id, is_primary }
 * @param {string|number} primaryLinkId - id do link que deve ser primary
 * @returns {Array} links com is_primary atualizado
 */
export function ensureSinglePrimary(links, primaryLinkId) {
  if (!Array.isArray(links)) return [];
  return links.map((l) => ({
    ...l,
    is_primary: l.id === primaryLinkId,
  }));
}

/**
 * Normaliza sort_order para ser sequencial (0, 1, 2, ...).
 * @param {Array} links - lista de links com sort_order
 * @param {Array} orderedIds - ids na nova ordem
 * @returns {Array} links com sort_order atualizado
 */
export function normalizeSortOrder(links, orderedIds) {
  if (!Array.isArray(links) || !Array.isArray(orderedIds)) return links;
  const byId = new Map(links.map((l) => [l.id, { ...l }]));
  orderedIds.forEach((id, idx) => {
    if (byId.has(id)) byId.get(id).sort_order = idx;
  });
  return Array.from(byId.values());
}

/**
 * Retorna o link que deve ser considerado principal (primeiro por sort_order ou primeiro da lista).
 * @param {Array} links - lista de links do produto (variant_key null) ou variação
 * @returns {Object|null} link principal ou null
 */
export function getFallbackPrimary(links) {
  if (!Array.isArray(links) || links.length === 0) return null;
  const primary = links.find((l) => l.is_primary);
  if (primary) return primary;
  const sorted = [...links].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  return sorted[0] || null;
}
