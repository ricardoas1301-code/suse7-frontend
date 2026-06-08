// ======================================================
// API — Documentação Viva (Dev Center) — S1_1.10.5
// ------------------------------------------------------
// Camada de service do FRONTEND para falar com o backend.
// O frontend NÃO acessa o Supabase diretamente: tudo passa
// pelas rotas admin /api/dev-center/documentacao-viva/*.
//
// Auth (Bearer) é injetado automaticamente por apiFetch.
// ======================================================

import { buildApiUrl, apiFetch } from "../config/api";

const BASE = "/api/dev-center/documentacao-viva";

/**
 * Carrega a árvore completa da Documentação Viva.
 * @returns {Promise<{ ok: boolean; domains?: object[]; degraded?: boolean; error?: string; status: number }>}
 */
export async function fetchDocumentacaoViva() {
  const url = buildApiUrl(BASE);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };

  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    return { ok: false, error: res.error, status: res.status };
  }
  return {
    ok: true,
    domains: Array.isArray(res.data?.domains) ? res.data.domains : [],
    degraded: Boolean(res.data?.degraded),
    status: res.status,
  };
}

/**
 * Carrega a trilha histórica (timeline). Sem domainId → histórico global.
 * @param {string} [domainDbId] uuid do domínio no backend
 * @returns {Promise<{ ok: boolean; history?: object[]; degraded?: boolean; error?: string; status: number }>}
 */
export async function fetchDocumentacaoVivaHistory(domainDbId) {
  const caminho = domainDbId ? `${BASE}/domains/${domainDbId}/history` : `${BASE}/history`;
  const url = buildApiUrl(caminho);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };

  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return {
    ok: true,
    history: Array.isArray(res.data?.history) ? res.data.history : [],
    degraded: Boolean(res.data?.degraded),
    status: res.status,
  };
}

/**
 * Cria um novo domínio (nasce em rascunho no backend).
 * @param {{ domain_name: string; description?: string }} payload
 */
export async function createDocumentacaoVivaDomain(payload) {
  const url = buildApiUrl(`${BASE}/domains`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };

  const res = await apiFetch(url, { method: "POST", body: payload });
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return { ok: true, domain: res.data?.domain ?? null, status: res.status };
}

/**
 * Atualiza um domínio existente.
 * @param {string} domainDbId uuid do domínio no backend
 * @param {object} payload
 */
export async function saveDocumentacaoVivaDomain(domainDbId, payload) {
  const url = buildApiUrl(`${BASE}/domains/${domainDbId}`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };

  const res = await apiFetch(url, { method: "PATCH", body: payload });
  return { ok: res.ok, error: res.error, status: res.status };
}

/**
 * Atualiza uma seção (metadados e/ou substituição de itens).
 * @param {string} sectionDbId uuid da seção no backend
 * @param {object} payload
 */
export async function saveDocumentacaoVivaSection(sectionDbId, payload) {
  const url = buildApiUrl(`${BASE}/sections/${sectionDbId}`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };

  const res = await apiFetch(url, { method: "PATCH", body: payload });
  return { ok: res.ok, error: res.error, status: res.status };
}

/**
 * Atualiza um item individual.
 * @param {string} itemDbId uuid do item no backend
 * @param {object} payload
 */
export async function saveDocumentacaoVivaItem(itemDbId, payload) {
  const url = buildApiUrl(`${BASE}/items/${itemDbId}`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };

  const res = await apiFetch(url, { method: "PATCH", body: payload });
  return { ok: res.ok, error: res.error, status: res.status };
}
