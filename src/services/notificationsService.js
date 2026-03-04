// ======================================================================
// SUSE7 — Notifications Service (Centro de Notificações)
// Consumo da API de notificações do backend.
// Usa fetch central (config/api) com Bearer token e tratamento 401.
// ======================================================================

import { API_BASE_URL, buildApiUrl, apiFetch, getSessionToken } from "../config/api";

// ----------------------------------------------------------------------
// Estado compartilhado DEV para backend offline
// - Reaproveita o mesmo objeto usado em userPreferencesService
// ----------------------------------------------------------------------
const IS_DEV = import.meta.env.DEV;
let DEV_BACKEND_STATE = { offline: false, loggedUserPrefsOnce: false, loggedNotificationsOnce: false };

if (typeof window !== "undefined") {
  window.__S7_DEV_BACKEND_STATE =
    window.__S7_DEV_BACKEND_STATE || { offline: false, loggedUserPrefsOnce: false, loggedNotificationsOnce: false };
  DEV_BACKEND_STATE = window.__S7_DEV_BACKEND_STATE;
}

function buildUrl(path) {
  return buildApiUrl(path);
}

/**
 * Lista notificações.
 *
 * @param {object} opts
 * @param {boolean} [opts.unread] - filtrar só não lidas
 * @param {boolean} [opts.active] - filtrar só ativas
 * @param {number} [opts.limit=50]
 * @returns {Promise<{ ok: boolean; data?: object[]; error?: string }>}
 */
export async function listNotifications({ unread, active, limit = 50 } = {}) {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }

  // ------------------------------------------------------------------
  // Curto-circuito em DEV se backend já foi marcado como offline
  // - Evita novas chamadas de rede e novos erros no console
  // ------------------------------------------------------------------
  if (IS_DEV && DEV_BACKEND_STATE.offline) {
    return { ok: true, data: [] };
  }

  const url = buildUrl("/api/notifications");
  if (!url) return { ok: false, error: "URL da API inválida" };

  const params = new URLSearchParams();
  if (unread != null) params.set("unread", String(unread));
  if (active != null) params.set("active", String(active));
  if (limit != null) params.set("limit", String(limit));
  const fullUrl = `${url}?${params}`;

  try {
    const result = await apiFetch(fullUrl, {
      method: "GET",
      unauthorizedFallback: [],
    });

    if (result.status === 401) {
      return { ok: true, data: Array.isArray(result.data) ? result.data : [] };
    }
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const list = Array.isArray(result.data?.notifications)
      ? result.data.notifications
      : Array.isArray(result.data)
        ? result.data
        : [];
    // Se o backend voltar a responder, limpa flag DEV
    if (IS_DEV && DEV_BACKEND_STATE.offline) {
      DEV_BACKEND_STATE.offline = false;
      DEV_BACKEND_STATE.loggedNotificationsOnce = false;
    }

    return { ok: true, data: list };
  } catch (err) {
    // ------------------------------------------------------------------
    // Fallback em DEV quando backend estiver offline
    // - Evita flood de erros no console
    // - Dashboard continua utilizável com lista vazia
    // ------------------------------------------------------------------
    if (IS_DEV) {
      DEV_BACKEND_STATE.offline = true;

      if (!DEV_BACKEND_STATE.loggedNotificationsOnce) {
        console.error(
          "[notificationsService] listNotifications: backend offline? usando lista vazia.",
          err
        );
        DEV_BACKEND_STATE.loggedNotificationsOnce = true;
      }
      return { ok: true, data: [] };
    }

    console.error("[notificationsService] listNotifications:", err);
    return { ok: false, error: err?.message ?? "Erro ao buscar notificações" };
  }
}

/**
 * Marca notificações como lidas.
 *
 * @param {object} opts
 * @param {string[]} [opts.ids] - ids específicos
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function markRead({ ids } = {}) {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }

  const token = await getSessionToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/notifications/mark-read");
  if (!url) return { ok: false, error: "URL da API inválida" };

  try {
    const body = Array.isArray(ids) && ids.length > 0 ? { ids } : { all: true };
    const result = await apiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return { ok: true };
  } catch (err) {
    console.error("[notificationsService] markRead:", err);
    return { ok: false, error: err?.message ?? "Erro ao marcar como lido" };
  }
}

/**
 * Marca todas as notificações como lidas.
 */
export async function markAllRead() {
  return markRead({});
}
