// ======================================================================
// Coluna VENDAS — lista Precificações (somente formatação; sem recálculo).
// SSOT: row.salesCount (mesmo campo de applyPrecificacoesCatalogFilters / Mais vendidos).
// ======================================================================

/** Fallback canônico da tabela (paridade catalogFormatters.DASH). */
const DASH = "—";

/** Campo canônico na linha da grid. */
export const PRECIFICACOES_LIST_SALES_COUNT_FIELD = "salesCount";

/**
 * Valor inteiro usado pela ordenação “Mais vendidos” (paridade estrutural com a coluna).
 * @param {Record<string, unknown>} row
 */
export function lerQuantidadeVendasListaPrecificacoesParaOrdenacao(row) {
  const n = Number(row?.[PRECIFICACOES_LIST_SALES_COUNT_FIELD] ?? 0);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/**
 * Exibição da coluna VENDAS — inteiro pt-BR; zero real ≠ ausência.
 * @param {unknown} salesCount
 */
export function formatarQuantidadeVendasListaPrecificacoes(salesCount) {
  if (salesCount == null) return DASH;
  if (typeof salesCount === "string" && salesCount.trim() === "") return DASH;
  const n = Number(salesCount);
  if (!Number.isFinite(n)) return DASH;
  return Math.trunc(n).toLocaleString("pt-BR");
}

/**
 * @param {Record<string, unknown>} row
 */
export function formatarQuantidadeVendasListaPrecificacoesDaLinha(row) {
  return formatarQuantidadeVendasListaPrecificacoes(row?.[PRECIFICACOES_LIST_SALES_COUNT_FIELD]);
}
