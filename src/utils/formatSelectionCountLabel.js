// ======================================================================
// Rótulo de contagem de itens selecionados — util compartilhada S7.
// ======================================================================

/**
 * @param {number} count
 * @param {string} singularLabel — ex.: "produto selecionado"
 * @param {string} pluralLabel — ex.: "produtos selecionados"
 */
export function formatSelectionCountLabel(count, singularLabel, pluralLabel) {
  const n = Number.isFinite(Number(count)) ? Math.max(0, Math.trunc(Number(count))) : 0;
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? singularLabel : pluralLabel}`;
}
