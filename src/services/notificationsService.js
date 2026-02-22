// ======================================================================
// SUSE7 — Notifications Service (Centro de Notificações)
// Consumo da API de notificações do backend
// ======================================================================

import { supabase } from "../supabaseClient";
import { API_BASE_URL } from "../config/api";

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

  const token = await getToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/notifications");
  if (!url) return { ok: false, error: "URL da API inválida" };

  const params = new URLSearchParams();
  if (unread != null) params.set("unread", String(unread));
  if (active != null) params.set("active", String(active));
  if (limit != null) params.set("limit", String(limit));
  const fullUrl = `${url}?${params}`;

  try {
    const res = await fetch(fullUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message ?? data?.error ?? `Erro ${res.status}`;
      return { ok: false, error: msg };
    }

    const list = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
    return { ok: true, data: list };
  } catch (err) {
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

  const token = await getToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/notifications/mark-read");
  if (!url) return { ok: false, error: "URL da API inválida" };

  try {
    const body = Array.isArray(ids) && ids.length > 0 ? { ids } : { all: true };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message ?? data?.error ?? `Erro ${res.status}`;
      return { ok: false, error: msg };
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
