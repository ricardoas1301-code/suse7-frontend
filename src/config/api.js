// ======================================================
// CONFIGURAÇÃO E FETCH CENTRAL DA API — SUSE7
// Fonte única da URL do backend e envio de Bearer token.
// Tratamento de 401 com fallback e aviso único (evita spam no console).
//
// API pública (não remover exports):
//   - API_BASE_URL, buildApiUrl(path), getSessionToken(), apiFetch(url, options)
// ======================================================

import { supabase } from "../supabaseClient";

// ----------------------------------------------------------------------
// URL base (VITE_API_BASE_URL; sem barra final)
// Ordem Vite em `vite` (dev; cada arquivo sobrescreve o anterior): .env → .env.local → .env.development → .env.development.local
// ----------------------------------------------------------------------
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

if (import.meta.env.DEV && API_BASE_URL && /vercel\.app/i.test(API_BASE_URL)) {
  console.warn(
    "[Suse7] VITE_API_BASE_URL aponta para a Vercel em DEV. Para o backend local use http://localhost:3001, salve o .env e reinicie o Vite. " +
      "Arquivo com prioridade máxima: .env.development.local (gitignore)."
  );
}

/**
 * Constrói URL absoluta para um path da API.
 * Aceita path com ou sem prefixo /api (normaliza conforme base).
 */
export function buildApiUrl(path) {
  if (!API_BASE_URL) return null;
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const suffix = base.endsWith("/api") ? p.replace(/^\/api/, "") : p;
  return `${base}${suffix}`;
}

/**
 * Obtém o access_token da sessão Supabase (para envio em Authorization).
 * Usado internamente por apiFetch; exposto para quem precisar checar sessão.
 */
export async function getSessionToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ----------------------------------------------------------------------
// Flag para aviso 401 único por sessão de página (evita spam no console)
// ----------------------------------------------------------------------
let _hasWarned401 = false;

/**
 * Fetch central para chamadas /api/*.
 * - Obtém sessão do Supabase e envia Authorization: Bearer <token> quando houver.
 * - Em 401 com unauthorizedFallback: retorna { ok: true, data: fallback } e
 *   loga no máximo um console.warn em DEV.
 *
 * @param {string} url - URL completa (use buildApiUrl)
 * @param {object} [options]
 * @param {string} [options.method='GET']
 * @param {object} [options.headers]
 * @param {string|object} [options.body]
 * @param {*} [options.unauthorizedFallback] - se definido e status === 401, retorna { ok: true, data: unauthorizedFallback }
 * @returns {Promise<{ ok: boolean; data?: any; error?: string; status: number }>}
 */
export async function apiFetch(url, options = {}) {
  const { method = "GET", headers = {}, body, unauthorizedFallback } = options;

  const token = await getSessionToken();
  const sendHeaders = { ...headers };
  if (token) {
    sendHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers: sendHeaders,
    ...(body != null && { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });

  const data = await res.json().catch(() => ({}));

  // --------------------------------------------------------------------
  // 401: retorno limpo com fallback (preferences = {} / notifications = [])
  // e aviso único para não poluir o console
  // --------------------------------------------------------------------
  if (res.status === 401 && unauthorizedFallback !== undefined) {
    if (import.meta.env.DEV && !_hasWarned401) {
      console.warn("[S7 API] 401 Unauthorized — sessão inválida ou expirada. Usando fallback.");
      _hasWarned401 = true;
    }
    return { ok: true, data: unauthorizedFallback, status: 401 };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: data?.message ?? data?.error ?? `Erro ${res.status}`,
      status: res.status,
      data,
    };
  }

  return { ok: true, data, status: res.status };
}
