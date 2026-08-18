// ======================================================================
// Textos dinâmicos — tarefas operacionais
// ======================================================================

/**
 * @param {number} count
 */
export function buildMissingProductCostsDescription(count) {
  const n = Math.max(0, Number(count) || 0);
  if (n === 1) return "1 produto aguarda cadastro de custos";
  return `${n.toLocaleString("pt-BR")} produtos aguardam cadastro de custos`;
}

/**
 * @param {number} taskCount
 */
export function buildCollapsedOperationalTasksLabel(taskCount) {
  const n = Math.max(0, Number(taskCount) || 0);
  if (n === 1) return "1 pendência";
  return `${n} pendências`;
}
