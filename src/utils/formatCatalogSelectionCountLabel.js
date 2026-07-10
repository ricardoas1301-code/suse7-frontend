// ======================================================================
// Rótulo de contagem de itens selecionados — cards de filtros (catálogos S7).
// ======================================================================

/**
 * @param {number} count
 */
export function formatCatalogSelectionCountLabel(count) {
  const n = Number.isFinite(Number(count)) ? Math.max(0, Math.trunc(Number(count))) : 0;
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? "produto selecionado" : "produtos selecionados"}`;
}
