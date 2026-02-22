// ======================================================================
// SUSE7 — User Preferences Service
// Consumo da API de preferências (backend como fonte de verdade).
// Cache segmentado por prefixo (evita overwrite entre modal./tooltip./etc).
// ======================================================================

import { supabase } from "../supabaseClient";
import { API_BASE_URL } from "../config/api";

// ----------------------------------------------------------------------
// Cache segmentado por prefixo
// load("modal.") e load("tooltip.") não sobrescrevem um ao outro
// ----------------------------------------------------------------------
let cache = {
  byPrefix: {},
  all: {},
};

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
  if (!API_BASE_URL) return null;
  const base = API_BASE_URL.replace(/\/+$/, "");
  const suffix = base.endsWith("/api") ? path.replace(/^\/api/, "") : path;
  return `${base}${suffix}`;
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
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

  const token = await getToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/user/preferences");
  if (!url) return { ok: false, error: "URL da API inválida" };

  const params = new URLSearchParams();
  if (prefix && String(prefix).trim()) params.set("prefix", String(prefix).trim());
  const query = params.toString();
  const fullUrl = query ? `${url}?${query}` : url;

  try {
    const res = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message ?? data?.error ?? `Erro ${res.status}`;
      return { ok: false, error: msg };
    }

    const list = data?.preferences ?? [];
    const map = {};
    for (const p of list) {
      if (p?.key != null) map[p.key] = p.value ?? {};
    }

    const prefixKey = prefix != null ? String(prefix).trim() : "";
    cache.byPrefix[prefixKey] = map;
    rebuildAll();

    return { ok: true, data: map };
  } catch (err) {
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

  const token = await getToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/user/preferences");
  if (!url) return { ok: false, error: "URL da API inválida" };

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        key: String(key ?? "").trim(),
        value: value != null && typeof value === "object" ? value : {},
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message ?? data?.error ?? `Erro ${res.status}`;
      return { ok: false, error: msg };
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

  const token = await getToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/user/preferences");
  if (!url) return { ok: false, error: "URL da API inválida" };

  const params = new URLSearchParams({ key: String(key ?? "").trim() });
  const fullUrl = `${url}?${params}`;

  try {
    const res = await fetch(fullUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message ?? data?.error ?? `Erro ${res.status}`;
      return { ok: false, error: msg };
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

  const token = await getToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/user/preferences/reset");
  if (!url) return { ok: false, error: "URL da API inválida" };

  if (!prefix || String(prefix).trim() === "") {
    return { ok: false, error: "prefix é obrigatório" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prefix: String(prefix).trim() }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message ?? data?.error ?? `Erro ${res.status}`;
      return { ok: false, error: msg };
    }

    invalidatePrefix(String(prefix).trim());
    return { ok: true, count: data?.count ?? 0 };
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
