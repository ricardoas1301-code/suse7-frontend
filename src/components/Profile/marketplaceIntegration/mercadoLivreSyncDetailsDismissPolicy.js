// ======================================================================
// Política de fechamento — modal "Detalhes da sincronização"
// ======================================================================
// Produto (CPJ-2 T1): awaiting_start / sincronização necessária NÃO bloqueia
// fechamento. O seller pode fechar sem iniciar sync; reabrir depois é permitido.
// Fechar NÃO inicia pipeline, NÃO altera jobs/token/estado da integração.
// ======================================================================

/**
 * Política de fechamento do modal "Detalhes da sincronização".
 *
 * Produto CPJ-2 T1 (paridade Hosted/PROD observada pelo seller):
 * - awaiting_start / sincronização necessária → FECHA (backdrop/Escape)
 * - running / completed / demais → FECHA (comportamento histórico quando pipeline já engajou)
 *
 * Fechar NÃO inicia sync, NÃO altera jobs/token/estado da integração.
 *
 * @param {{
 *   awaitingPipelineStart?: boolean;
 *   overall?: string | null;
 * }} [ctx]
 * @returns {boolean}
 */
export function podeFecharModalDetalhesSincronizacao(ctx = {}) {
  void ctx?.awaitingPipelineStart;
  void ctx?.overall;
  return true;
}

/**
 * Resultado puro do fechamento (sem efeitos colaterais de sync).
 * @param {{
 *   awaitingPipelineStart?: boolean;
 *   overall?: string | null;
 * }} [ctx]
 * @returns {{ closed: boolean; syncStarted: boolean; jobsMutated: boolean; tokenMutated: boolean; integrationMutated: boolean }}
 */
export function resultadoFechamentoModalDetalhesSincronizacao(ctx = {}) {
  const pode = podeFecharModalDetalhesSincronizacao(ctx);
  return {
    closed: pode,
    syncStarted: false,
    jobsMutated: false,
    tokenMutated: false,
    integrationMutated: false,
  };
}
