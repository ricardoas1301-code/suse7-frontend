// ======================================================
// DOCUMENTAÇÃO VIVA — SELETORES / DERIVAÇÕES (S1_1.9B)
// ------------------------------------------------------
// Funções puras que derivam visões a partir dos domínios:
// busca global, filtros operacionais e métricas do dashboard.
//
// REGRA: cálculo 100% local. Sem chamadas externas, sem APIs.
// ======================================================

import { DOC_STATUS, DOC_REVISAO_ESTADO, situacaoRevisao } from "./documentacaoVivaModel";

/** Normaliza texto para busca (minúsculo, sem acento). */
function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Concatena todo o conteúdo pesquisável de um domínio (S1_1.9B.4):
 * nome, descrição, títulos/descrições/observações dos itens.
 * @param {import("./documentacaoVivaModel").DocDomain} dominio
 * @returns {string}
 */
function textoPesquisavel(dominio) {
  const partes = [dominio.domain_name, dominio.description, dominio.owner];
  for (const secao of dominio.sections ?? []) {
    for (const item of secao.items ?? []) {
      partes.push(item.item_title, item.item_content, item.item_notes);
    }
  }
  return normalizarTexto(partes.filter(Boolean).join(" \u0001 "));
}

/**
 * Busca textual global (S1_1.9B.4).
 * @param {import("./documentacaoVivaModel").DocDomain[]} dominios
 * @param {string} termo
 */
export function buscarDominios(dominios, termo) {
  const alvo = normalizarTexto(termo).trim();
  if (!alvo) return dominios;
  return dominios.filter((dominio) => textoPesquisavel(dominio).includes(alvo));
}

/**
 * Filtros operacionais (S1_1.9B.5). Cada filtro vazio = "todos".
 * @param {import("./documentacaoVivaModel").DocDomain[]} dominios
 * @param {{ status?: string; maturity?: string; owner?: string }} filtros
 */
export function filtrarDominios(dominios, { status = "", maturity = "", owner = "" } = {}) {
  return dominios.filter((dominio) => {
    if (status && dominio.status !== status) return false;
    if (maturity && dominio.maturity !== maturity) return false;
    if (owner && dominio.owner !== owner) return false;
    return true;
  });
}

/**
 * Aplica busca + filtros em sequência.
 * @param {import("./documentacaoVivaModel").DocDomain[]} dominios
 * @param {{ termo?: string; status?: string; maturity?: string; owner?: string }} criterios
 */
export function aplicarBuscaEFiltros(dominios, { termo = "", status = "", maturity = "", owner = "" } = {}) {
  return filtrarDominios(buscarDominios(dominios, termo), { status, maturity, owner });
}

/**
 * Métricas executivas do dashboard documental (S1_1.9B.6).
 * Calculadas apenas sobre os dados locais atuais.
 * @param {import("./documentacaoVivaModel").DocDomain[]} dominios
 */
export function calcularDashboard(dominios) {
  const base = {
    total: dominios.length,
    homologados: 0,
    emRevisao: 0,
    rascunhos: 0,
    arquivados: 0,
    revisoesPendentes: 0,
    // Indicadores de governança (S1_1.11A.12)
    revisaoVencida: 0,
    alteracaoPendente: 0,
  };

  for (const dominio of dominios) {
    if (dominio.status === DOC_STATUS.HOMOLOGADO) base.homologados += 1;
    if (dominio.status === DOC_STATUS.EM_REVISAO) base.emRevisao += 1;
    if (dominio.status === DOC_STATUS.RASCUNHO) base.rascunhos += 1;
    if (dominio.status === DOC_STATUS.ARQUIVADO) base.arquivados += 1;

    // Alteração pendente de homologação: já foi homologado antes
    // (tem registro) e voltou para "Em revisão".
    if (dominio.status === DOC_STATUS.EM_REVISAO && dominio.homologated_at) {
      base.alteracaoPendente += 1;
    }

    const revisao = situacaoRevisao(dominio.next_review_at);
    if (revisao.estado === DOC_REVISAO_ESTADO.VENCIDA) base.revisaoVencida += 1;
    if (
      revisao.estado === DOC_REVISAO_ESTADO.VENCIDA ||
      revisao.estado === DOC_REVISAO_ESTADO.PROXIMA
    ) {
      base.revisoesPendentes += 1;
    }
  }

  return base;
}
