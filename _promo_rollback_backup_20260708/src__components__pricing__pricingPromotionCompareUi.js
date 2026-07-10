// ======================================================
// PI — Aba Promoções: seleção única da promoção ativa (comparação Clássico × Premium).
// Somente UX; não implica aplicação/combinação simultânea no marketplace.
// ======================================================

/**
 * @param {readonly { selectionId: string }[]} opcoes
 * @returns {string | null}
 */
export function resolverPromocaoAtivaInicial(opcoes) {
  if (opcoes.length === 0) return null;
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
