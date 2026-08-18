// ======================================================
// PI — Aba Promoções: seleção única da promoção ativa (comparação Clássico × Premium).
// Somente UX; não implica aplicação/combinação simultânea no marketplace.
// ======================================================

import { promocaoBetaPermiteSimulacaoEfetiva } from "../../features/pricing/promotions/promotionBetaPricePresentation.js";

/**
 * @param {readonly { selectionId: string; row?: { scenario?: unknown } | null }[]} opcoes
 * @param {(selectionId: string) => import("../../features/pricing/promotions/promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord | null | undefined} [obterPrecoManual]
 * @returns {string | null}
 */
export function resolverPromocaoAtivaInicial(opcoes, obterPrecoManual = null) {
  if (opcoes.length === 0) return null;
  for (const opcao of opcoes) {
    const scenario = opcao.row?.scenario ?? null;
    const manual = obterPrecoManual?.(opcao.selectionId) ?? null;
    if (scenario != null && promocaoBetaPermiteSimulacaoEfetiva(scenario, manual ?? null)) {
      return opcao.selectionId;
    }
  }
  return opcoes[0].selectionId;
}

/**
 * Mantém a promoção ativa válida quando a lista muda.
 *
 * @param {string | null} promocaoAtivaId
 * @param {readonly { selectionId: string }[]} opcoes
 * @returns {string | null}
 */
export function sincronizarPromocaoAtiva(promocaoAtivaId, opcoes) {
  if (opcoes.length === 0) return null;
  if (promocaoAtivaId != null && opcoes.some((o) => o.selectionId === promocaoAtivaId)) {
    return promocaoAtivaId;
  }
  return opcoes[0].selectionId;
}
