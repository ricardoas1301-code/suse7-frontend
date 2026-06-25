// ======================================================================
// Rótulo de contagem de produtos selecionados — card de filtros.
// ======================================================================

/**
 * @param {number} count
 */
export function formatConcorrenciaSelectionCountLabel(count) {
  const n = Number.isFinite(Number(count)) ? Math.max(0, Math.trunc(Number(count))) : 0;
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? "produto selecionado" : "produtos selecionados"}`;
}
