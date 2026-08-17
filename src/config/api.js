// ======================================================
// CONFIGURAÇÃO E FETCH CENTRAL DA API — SUSE7
// Fonte única da URL do backend e envio de Bearer token.
// Tratamento de 401 com fallback e aviso único (evita spam no console).
//
// API pública (não remover exports):
//   - API_BASE_URL, buildApiUrl(path), getSessionToken(), apiFetch(url, options)
// ======================================================

import {
  ensureAuthSessionBootstrapped,
  getAuthBootstrapAccessToken,
} from "../auth/authBootstrapService";

// ----------------------------------------------------------------------
// URL base (VITE_API_BASE_URL; sem barra final)
// Ordem Vite em `vite` (dev; cada arquivo sobrescreve o anterior): .env → .env.local → .env.development → .env.development.local
// ----------------------------------------------------------------------
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

if (import.meta.env.DEV && API_BASE_URL && /vercel\.app/i.test(API_BASE_URL)) {
  console.warn(
    "[Suse7] ATENÇÃO: VITE_API_BASE_URL aponta para Vercel em DEV:",
    API_BASE_URL,
    "— Raio-X WhatsApp live exige backend LOCAL com flags live. Ajuste suse7-frontend/.env.development.local para http://localhost:3001 e reinicie o Vite."
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

/** Single-flight via auth bootstrap — evita getSession paralelo (lock broken). */
let _getSessionTokenInFlight = /** @type {Promise<string | null> | null} */ (null);

/**
 * Obtém o access_token da sessão Supabase (para envio em Authorization).
 * Usado internamente por apiFetch; exposto para quem precisar checar sessão.
 */
export async function getSessionToken() {
  const cached = getAuthBootstrapAccessToken();
  if (cached) return cached;

  if (!_getSessionTokenInFlight) {
    _getSessionTokenInFlight = ensureAuthSessionBootstrapped()
      .then((session) => session?.access_token ?? getAuthBootstrapAccessToken())
      .finally(() => {
        _getSessionTokenInFlight = null;
      });
  }
  return _getSessionTokenInFlight;
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
  const { method = "GET", headers = {}, body, unauthorizedFallback, cache, timeoutMs, signal: externalSignal } =
    options;

  if (!API_BASE_URL) {
    const message = "VITE_API_BASE_URL não configurada.";
    if (import.meta.env.DEV) {
      console.error(`[S7 API] ${message}`);
    }
    return { ok: false, error: message, status: 0, connectionError: true };
  }

  const token = await getSessionToken();
  const sendHeaders = { ...headers };
  if (token) {
    sendHeaders.Authorization = `Bearer ${token}`;
  }
  if (body != null && sendHeaders["Content-Type"] == null && sendHeaders["content-type"] == null) {
    sendHeaders["Content-Type"] = "application/json";
  }

  let res;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeoutId = null;
  /** @type {AbortController | null} */
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }
  if (timeoutMs != null && Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0) {
    timeoutId = setTimeout(() => controller.abort(), Number(timeoutMs));
  }
  try {
    res = await fetch(url, {
      method,
      headers: sendHeaders,
      ...(cache != null ? { cache } : {}),
      ...(body != null && { body: typeof body === "string" ? body : JSON.stringify(body) }),
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      const abortedByCaller = Boolean(externalSignal?.aborted);
      const message = abortedByCaller
        ? "Requisição cancelada."
        : "Tempo esgotado ao carregar o resumo executivo. Tente novamente.";
      if (import.meta.env.DEV) {
        console.warn("[S7 API] Timeout:", url, { timeoutMs, abortedByCaller });
      }
      return {
        ok: false,
        error: message,
        status: abortedByCaller ? 499 : 408,
        timedOut: !abortedByCaller,
        aborted: abortedByCaller,
        connectionError: !abortedByCaller,
      };
    }
    const message =
      "Não foi possível conectar ao backend. Verifique se a API está online e se VITE_API_BASE_URL está correta.";
    if (import.meta.env.DEV) {
      console.warn("[S7 API] Falha de rede:", url, err);
    }
    return { ok: false, error: message, status: 0, connectionError: true };
  } finally {
    if (timeoutId != null) clearTimeout(timeoutId);
    if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
  }

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
      connectionError: res.status === 0 || res.status === 408 || res.status === 503,
      unauthorized: res.status === 401,
    };
  }

  return { ok: true, data, status: res.status };
}
