// ======================================================================
// Central de Relatórios — Precificação (S1.7)
// Constantes visuais/estruturais. Sem processamento, exportação ou API.
// ======================================================================

/** @typedef {'preparacao' | 'em_breve' | 'disponivel' | 'indisponivel'} PrecificacaoRelatorioStatusId */

/** @typedef {'catalogo' | 'loading' | 'vazio' | 'sem_relatorios' | 'indisponivel'} PrecificacaoRelatoriosCentralViewId */

/** Estados da central (estrutura para fases futuras). */
export const PRECIFICACAO_RELATORIOS_VIEW = /** @type {const} */ ({
  CATALOGO: "catalogo",
  LOADING: "loading",
  VAZIO: "vazio",
  SEM_RELATORIOS: "sem_relatorios",
  INDISPONIVEL: "indisponivel",
});

/** Status exibido nos cards nesta fase. */
export const PRECIFICACAO_RELATORIO_STATUS = /** @type {const} */ ({
  PREPARACAO: "preparacao",
  EM_BREVE: "em_breve",
  DISPONIVEL: "disponivel",
  INDISPONIVEL: "indisponivel",
});

/** @type {Record<PrecificacaoRelatorioStatusId, { label: string; tone: string }>} */
export const PRECIFICACAO_RELATORIO_STATUS_UI = {
  preparacao: { label: "Em preparação", tone: "prep" },
  em_breve: { label: "Disponível em breve", tone: "soon" },
  disponivel: { label: "Disponível", tone: "ok" },
  indisponivel: { label: "Indisponível", tone: "off" },
};

/**
 * Marketplaces previstos na arquitetura (sem integração nesta fase).
 * @type {{ id: string; label: string; ativo: boolean }[]}
 */
export const PRECIFICACAO_RELATORIOS_MARKETPLACES_FUTUROS = [
  { id: "mercado_livre", label: "Mercado Livre", ativo: true },
  { id: "shopee", label: "Shopee", ativo: false },
  { id: "amazon", label: "Amazon", ativo: false },
  { id: "shein", label: "Shein", ativo: false },
  { id: "tiktok_shop", label: "TikTok Shop", ativo: false },
];
