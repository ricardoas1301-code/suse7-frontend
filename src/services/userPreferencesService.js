// ======================================================================
// SUSE7 — User Preferences Service
// Consumo da API de preferências (backend como fonte de verdade).
// Cache segmentado por prefixo (evita overwrite entre modal./tooltip./etc).
// Usa fetch central (config/api) com Bearer token e tratamento 401.
// ======================================================================

import { supabase } from "../supabaseClient";
import { API_BASE_URL, buildApiUrl, apiFetch, getSessionToken } from "../config/api";

// ----------------------------------------------------------------------
// Cache segmentado por prefixo
// load("modal.") e load("tooltip.") não sobrescrevem um ao outro
// ----------------------------------------------------------------------
let cache = {
  byPrefix: {},
  all: {},
};

// ----------------------------------------------------------------------
// Estado compartilhado DEV para backend offline
// - Evita flood de requisições e de logs quando o backend está caído
// - Compartilhado entre services via window.__S7_DEV_BACKEND_STATE
// ----------------------------------------------------------------------
const IS_DEV = import.meta.env.DEV;
let DEV_BACKEND_STATE = { offline: false, loggedUserPrefsOnce: false };

if (typeof window !== "undefined") {
  window.__S7_DEV_BACKEND_STATE =
    window.__S7_DEV_BACKEND_STATE || { offline: false, loggedUserPrefsOnce: false, loggedNotificationsOnce: false };
  DEV_BACKEND_STATE = window.__S7_DEV_BACKEND_STATE;
}

function inferPrefix(key) {
  const k = String(key ?? "").trim();
  const dot = k.indexOf(".");
  return dot >= 0 ? k.slice(0, dot + 1) : "";
}

function rebuildAll() {
  const all = {};
  for (const prefix of Object.keys(cache.byPrefix)) {
    const data = cache.byPrefix[prefix];
    if (data && typeof data === "object") {
      Object.assign(all, data);
    }
  }
  cache.all = all;
}

function invalidatePrefix(prefix) {
  if (prefix) {
    delete cache.byPrefix[prefix];
  }
  rebuildAll();
}

function invalidateKey(key) {
  const prefix = inferPrefix(key);
  invalidatePrefix(prefix);
}

function updateCacheKey(key, value) {
  const prefix = inferPrefix(key);
  if (!cache.byPrefix[prefix]) cache.byPrefix[prefix] = {};
  cache.byPrefix[prefix][key] = value;
  cache.all[key] = value;
}

function removeCacheKey(key) {
  const prefix = inferPrefix(key);
  if (cache.byPrefix[prefix]) {
    delete cache.byPrefix[prefix][key];
  }
  delete cache.all[key];
}

/**
 * Constrói URL da API. Usa config central (VITE_API_BASE_URL).
 * Não usa window.location — funciona em dev e produção.
 */
function buildUrl(path) {
  return buildApiUrl(path);
}

// ----------------------------------------------------------------------
// API
// ----------------------------------------------------------------------

/**
 * Busca preferências do usuário.
 * Retorna mapa { [key]: value } para uso direto.
 * Usa cache: mesma prefix em curto intervalo evita nova chamada.
 *
 * @param {string} [prefix] - ex: "modal." filtra keys que começam com o prefixo
 * @returns {Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }>}
 */
export async function getPreferences(prefix = null) {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }

  // --------------------------------------------------------------------
  // Curto-circuito em DEV se já sabemos que o backend está offline
  // - Evita novas chamadas de rede (e novos net::ERR_CONNECTION_REFUSED)
  // - Retorna mapa vazio para não travar o dashboard
  // --------------------------------------------------------------------
  if (IS_DEV && DEV_BACKEND_STATE.offline) {
    return { ok: true, data: {} };
  }

  const url = buildUrl("/api/user/preferences");
  if (!url) return { ok: false, error: "URL da API inválida" };

  const params = new URLSearchParams();
  if (prefix && String(prefix).trim()) params.set("prefix", String(prefix).trim());
  const query = params.toString();
  const fullUrl = query ? `${url}?${query}` : url;

  try {
    const result = await apiFetch(fullUrl, {
      method: "GET",
      unauthorizedFallback: {},
    });

    if (result.status === 401) {
      return { ok: true, data: result.data ?? {} };
    }
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const list = result.data?.preferences ?? [];
    const map = {};
    for (const p of list) {
      if (p?.key != null) map[p.key] = p.value ?? {};
    }

    const prefixKey = prefix != null ? String(prefix).trim() : "";
    cache.byPrefix[prefixKey] = map;
    rebuildAll();

  // Se o backend voltar a responder, limpa flag DEV
  if (IS_DEV && DEV_BACKEND_STATE.offline) {
    DEV_BACKEND_STATE.offline = false;
    DEV_BACKEND_STATE.loggedUserPrefsOnce = false;
  }

  return { ok: true, data: map };
  } catch (err) {
  // --------------------------------------------------------------------
  // Fallback em DEV quando backend estiver offline
  // - Evita flood de erros no console
  // - Dashboard continua utilizável com preferências vazias
  // --------------------------------------------------------------------
  if (IS_DEV) {
    DEV_BACKEND_STATE.offline = true;

    if (!DEV_BACKEND_STATE.loggedUserPrefsOnce) {
      console.error(
        "[userPreferencesService] getPreferences: backend offline? usando fallback vazio.",
        err
      );
      DEV_BACKEND_STATE.loggedUserPrefsOnce = true;
    }
    return { ok: true, data: {} };
  }

  console.error("[userPreferencesService] getPreferences:", err);
  return { ok: false, error: err?.message ?? "Erro ao buscar preferências" };
  }
}

/**
 * Salva ou atualiza preferência.
 * Invalida cache após sucesso.
 *
 * @param {string} key - ex: "modal.stock_low"
 * @param {object} value - ex: { hidden: true }
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function setPreference(key, value) {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }

  const token = await getSessionToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/user/preferences");
  if (!url) return { ok: false, error: "URL da API inválida" };

  try {
    const resBody = {
      key: String(key ?? "").trim(),
      value: value != null && typeof value === "object" ? value : {},
    };
    const result = await apiFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resBody),
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const k = String(key ?? "").trim().toLowerCase().replace(/\s+/g, "_");
    updateCacheKey(k, value != null && typeof value === "object" ? value : {});
    return { ok: true };
  } catch (err) {
    console.error("[userPreferencesService] setPreference:", err);
    return { ok: false, error: err?.message ?? "Erro ao salvar preferência" };
  }
}

/**
 * Remove preferência.
 * Invalida cache após sucesso.
 *
 * @param {string} key - ex: "modal.stock_low"
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function deletePreference(key) {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }

  const token = await getSessionToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/user/preferences");
  if (!url) return { ok: false, error: "URL da API inválida" };

  const params = new URLSearchParams({ key: String(key ?? "").trim() });
  const fullUrl = `${url}?${params}`;

  try {
    const result = await apiFetch(fullUrl, {
      method: "DELETE",
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const k = String(key ?? "").trim().toLowerCase().replace(/\s+/g, "_");
    removeCacheKey(k);
    return { ok: true };
  } catch (err) {
    console.error("[userPreferencesService] deletePreference:", err);
    return { ok: false, error: err?.message ?? "Erro ao remover preferência" };
  }
}

/**
 * Reseta preferências por prefixo.
 * Invalida cache após sucesso.
 *
 * @param {string} prefix - ex: "modal."
 * @returns {Promise<{ ok: boolean; count?: number; error?: string }>}
 */
export async function resetPreferences(prefix) {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }

  const token = await getSessionToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/user/preferences/reset");
  if (!url) return { ok: false, error: "URL da API inválida" };

  if (!prefix || String(prefix).trim() === "") {
    return { ok: false, error: "prefix é obrigatório" };
  }

  try {
    const result = await apiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: String(prefix).trim() }),
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    invalidatePrefix(String(prefix).trim());
    return { ok: true, count: result.data?.count ?? 0 };
  } catch (err) {
    console.error("[userPreferencesService] resetPreferences:", err);
    return { ok: false, error: err?.message ?? "Erro ao resetar preferências" };
  }
}

/**
 * Retorna o cache consolidado atual (útil para leitura síncrona após load).
 * Não faz chamada à API.
 */
export function getCache() {
  return { ...cache.all };
}
