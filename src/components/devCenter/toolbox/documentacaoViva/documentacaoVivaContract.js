// ======================================================
// DOCUMENTAÇÃO VIVA — CONTRATO DE PERSISTÊNCIA (S1_1.10.1)
// ------------------------------------------------------
// Mapeamento ÚNICO entre o formato dos componentes (frontend)
// e o formato de persistência (backend/Supabase).
//
// O frontend NÃO conhece detalhes do Supabase. A tradução
// acontece só aqui + na camada service/store (S1_1.10.7).
//
// CONTRATO (frontend ↔ persistência):
//
//   Domínio (devcenter_doc_domains)
//     domain_id        ← id (uuid)              [domain_db_id]
//     domain_name      ← name
//     domain_slug      ← slug
//     description      ← description
//     status           ← status   (catálogo)
//     owner            ← owner    (catálogo)
//     maturity         ← maturity (catálogo)
//     next_review_at   ← next_review_at (date|"")
//     updated_at       ← updated_at
//
//   Seção (devcenter_doc_sections)
//     section_id       ← section_key            [section_db_id ← id]
//     section_title    ← title
//     section_hint     ← hint
//
//   Item (devcenter_doc_items)
//     item_title       ← title                  [item_db_id ← id]
//     item_content     ← content
//     item_notes       ← notes
//     item_status      ← status  (catálogo)
//     updated_at       ← updated_at
// ======================================================

import { normalizarDominio } from "./documentacaoVivaModel";

/**
 * Normaliza um domínio vindo do backend para o formato dos componentes.
 * O backend já entrega no shape esperado; aqui garantimos defaults
 * (campos novos, observações, etc.) sem que componentes mudem.
 * @param {object} domainRemoto
 */
export function normalizarDominioRemoto(domainRemoto) {
  return normalizarDominio(domainRemoto ?? {});
}

/**
 * Payload de criação de domínio (frontend → backend).
 * @param {{ domain_name: string; description?: string }} dados
 */
export function montarPayloadCriarDominio(dados) {
  return {
    domain_name: dados.domain_name,
    description: dados.description ?? "",
  };
}

/**
 * Payload de atualização de domínio (somente campos suportados).
 * @param {object} patch
 */
export function montarPayloadDominio(patch) {
  const payload = {};
  if (patch.domain_name !== undefined) payload.domain_name = patch.domain_name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.owner !== undefined) payload.owner = patch.owner;
  if (patch.maturity !== undefined) payload.maturity = patch.maturity;
  if (patch.next_review_at !== undefined) payload.next_review_at = patch.next_review_at;
  return payload;
}

/**
 * Payload de atualização de seção (metadados + itens opcionais).
 * @param {{ items?: object[]; section_title?: string; section_hint?: string }} patch
 */
export function montarPayloadSecao(patch) {
  const payload = {};
  if (patch.section_title !== undefined) payload.section_title = patch.section_title;
  if (patch.section_hint !== undefined) payload.section_hint = patch.section_hint;
  if (Array.isArray(patch.items)) {
    payload.items = patch.items.map((item) => ({
      item_title: item.item_title ?? "",
      item_content: item.item_content ?? "",
      item_notes: item.item_notes ?? "",
      item_status: item.item_status ?? "rascunho",
    }));
  }
  return payload;
}
