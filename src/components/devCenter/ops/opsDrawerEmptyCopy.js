// =============================================================================
// Dev Center S_4.7.4 — copy padronizado para estados vazios do drawer global
// =============================================================================

/** @typedef {{ title: string; message?: string }} OpsDrawerEmptyCopy */

/** @type {Record<string, OpsDrawerEmptyCopy>} */
export const OPS_DRAWER_EMPTY = {
  DETAIL_UNAVAILABLE: {
    title: "Detalhe indisponível",
    message: "Não foi possível carregar este registro global. Tente novamente em instantes.",
  },
  NO_CUSTOMER: {
    title: "Registro sem identificação",
    message: "Os dados básicos deste cliente ainda não estão disponíveis.",
  },
  NO_TIMELINE: {
    title: "Sem atividade disponível",
    message: "Registro sem histórico suficiente para montar a linha do tempo.",
  },
  NO_SELLERS: {
    title: "Sem relacionamentos registrados",
    message: "Nenhum seller vinculado a este registro global no momento.",
  },
  NO_OPERATIONAL: {
    title: "Dados agregados indisponíveis",
    message: "Informação ainda não calculada para este registro.",
  },
  UPDATE_FAILED: {
    title: "Não foi possível atualizar",
    message: "Exibindo a última versão disponível em cache.",
  },
};
