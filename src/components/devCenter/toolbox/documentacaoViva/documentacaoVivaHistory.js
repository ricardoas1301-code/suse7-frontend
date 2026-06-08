// ======================================================
// DOCUMENTAÇÃO VIVA — HISTÓRICO / GOVERNANÇA (S1_1.11A)
// ------------------------------------------------------
// Funções puras da trilha histórica documental:
//  - catálogo de operações (espelha o backend);
//  - criação de entradas (before/after + operador + timestamp);
//  - detecção de mudanças de domínio para gerar a timeline;
//  - mapeamento de entradas vindas do backend.
//
// REGRA: nada sensível aqui. É só registro/derivação local.
// A persistência oficial é no backend (S1_1.11A.2).
// ======================================================

import {
  DOC_STATUS,
  agoraISO,
  metaStatusDocumentacao,
} from "./documentacaoVivaModel";

/** Tipos de operação (espelha devCenterDocumentacaoVivaConstants.js). */
export const DOC_OPERACAO = Object.freeze({
  DOMAIN_CREATED: "domain_created",
  DOMAIN_UPDATED: "domain_updated",
  OWNER_CHANGED: "owner_changed",
  STATUS_CHANGED: "status_changed",
  HOMOLOGATED: "homologated",
  GOVERNANCE_REOPENED: "governance_reopened",
  SECTION_UPDATED: "section_updated",
  ITEM_UPDATED: "item_updated",
});

/** Metadados de exibição por operação (tom segue o padrão de badges). */
export const DOC_OPERACAO_META = Object.freeze({
  [DOC_OPERACAO.DOMAIN_CREATED]: { rotulo: "Domínio criado", tone: "info" },
  [DOC_OPERACAO.DOMAIN_UPDATED]: { rotulo: "Domínio atualizado", tone: "neutro" },
  [DOC_OPERACAO.OWNER_CHANGED]: { rotulo: "Responsável alterado", tone: "info" },
  [DOC_OPERACAO.STATUS_CHANGED]: { rotulo: "Status alterado", tone: "alerta" },
  [DOC_OPERACAO.HOMOLOGATED]: { rotulo: "Homologação", tone: "sucesso" },
  [DOC_OPERACAO.GOVERNANCE_REOPENED]: { rotulo: "Governança reaberta", tone: "alerta" },
  [DOC_OPERACAO.SECTION_UPDATED]: { rotulo: "Seção atualizada", tone: "neutro" },
  [DOC_OPERACAO.ITEM_UPDATED]: { rotulo: "Item atualizado", tone: "neutro" },
});

/** @param {string} type */
export function metaOperacao(type) {
  return DOC_OPERACAO_META[type] ?? { rotulo: type, tone: "neutro" };
}

let _seq = 0;
/** Id local estável para uma entrada de histórico. */
function novoHistoryId() {
  _seq += 1;
  return `h_${Date.now()}_${_seq}`;
}

/**
 * Cria uma entrada de histórico padronizada.
 * @param {{
 *   domain_id: string;
 *   domain_slug?: string;
 *   operation_type: string;
 *   label: string;
 *   operator_name: string;
 *   section_id?: string | null;
 *   item_id?: string | null;
 *   before?: unknown;
 *   after?: unknown;
 * }} dados
 */
export function criarEntradaHistorico(dados) {
  return {
    history_id: novoHistoryId(),
    domain_id: dados.domain_id,
    domain_slug: dados.domain_slug ?? "",
    section_id: dados.section_id ?? null,
    item_id: dados.item_id ?? null,
    operation_type: dados.operation_type,
    label: dados.label,
    operator_name: dados.operator_name,
    before: dados.before ?? null,
    after: dados.after ?? null,
    created_at: agoraISO(),
  };
}

/**
 * Mapeia uma entrada vinda do backend para o shape local.
 * O backend já entrega quase no formato; aqui garantimos defaults.
 */
export function mapEntradaRemota(row) {
  return {
    history_id: row.history_id ?? row.id ?? novoHistoryId(),
    domain_id: row.domain_id ?? "",
    domain_slug: row.domain_slug ?? "",
    section_id: row.section_id ?? null,
    item_id: row.item_id ?? null,
    operation_type: row.operation_type ?? DOC_OPERACAO.DOMAIN_UPDATED,
    label: row.label ?? "",
    operator_name: row.operator_name ?? "Sistema",
    before: row.before ?? null,
    after: row.after ?? null,
    created_at: row.created_at ?? agoraISO(),
  };
}

/** Ordena entradas mais recentes primeiro. */
export function ordenarHistorico(entradas) {
  return [...entradas].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

/** Formata um ISO em data + hora pt-BR (ou "—" se vazio/ inválido). */
export function formatarDataHora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Detecta as mudanças relevantes de um patch de domínio em relação ao estado
 * atual, gerando descrições para a trilha histórica. NÃO aplica nada — apenas
 * descreve (a aplicação/efeitos de governança ficam no store).
 *
 * @param {import("./documentacaoVivaModel").DocDomain} atual
 * @param {Partial<import("./documentacaoVivaModel").DocDomain>} patch
 * @returns {Array<{ operation_type: string; label: string; before: unknown; after: unknown }>}
 */
export function descreverMudancasDominio(atual, patch) {
  const eventos = [];

  if (patch.owner !== undefined && patch.owner !== atual.owner) {
    eventos.push({
      operation_type: DOC_OPERACAO.OWNER_CHANGED,
      label: `Responsável alterado: ${atual.owner} → ${patch.owner}`,
      before: { owner: atual.owner },
      after: { owner: patch.owner },
    });
  }

  if (patch.status !== undefined && patch.status !== atual.status) {
    if (patch.status === DOC_STATUS.HOMOLOGADO) {
      eventos.push({
        operation_type: DOC_OPERACAO.HOMOLOGATED,
        label: "Domínio homologado",
        before: { status: atual.status },
        after: { status: patch.status },
      });
    } else {
      const de = metaStatusDocumentacao(atual.status).label;
      const para = metaStatusDocumentacao(patch.status).label;
      eventos.push({
        operation_type: DOC_OPERACAO.STATUS_CHANGED,
        label: `Status alterado: ${de} → ${para}`,
        before: { status: atual.status },
        after: { status: patch.status },
      });
    }
  }

  const camposConteudo = ["domain_name", "description", "maturity", "next_review_at"];
  const conteudoMudou = camposConteudo.some(
    (campo) => patch[campo] !== undefined && patch[campo] !== atual[campo],
  );
  if (conteudoMudou) {
    eventos.push({
      operation_type: DOC_OPERACAO.DOMAIN_UPDATED,
      label: "Domínio atualizado",
      before: { domain_name: atual.domain_name, description: atual.description },
      after: {
        domain_name: patch.domain_name ?? atual.domain_name,
        description: patch.description ?? atual.description,
      },
    });
  }

  return eventos;
}
