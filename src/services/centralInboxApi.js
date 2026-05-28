import { buildApiUrl, apiFetch } from "../config/api";

function ensureApiBase() {
  if (!buildApiUrl("/api/notifications/inbox")) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }
  return null;
}

/**
 * @param {{ limit?: number; cursor?: string | null; unread?: boolean }} [params]
 */
export async function listNotificationInbox(params = {}) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;

  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.cursor) qs.set("cursor", String(params.cursor));
  if (params.unread === true) qs.set("unread", "true");

  const url = buildApiUrl(`/api/notifications/inbox${qs.toString() ? `?${qs}` : ""}`);
  const result = await apiFetch(url, {
    method: "GET",
    unauthorizedFallback: { items: [], unread_count: 0, cursor: null, has_more: false },
  });

  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    items: Array.isArray(result.data?.items) ? result.data.items : [],
    unread_count: Number(result.data?.unread_count ?? 0),
    cursor: result.data?.cursor ?? null,
    has_more: Boolean(result.data?.has_more),
  };
}

export async function markInboxItemRead(dispatchId) {
  const id = String(dispatchId ?? "").trim();
  if (!id) return { ok: false, error: "ID inválido" };
  const baseError = ensureApiBase();
  if (baseError) return baseError;

  const url = buildApiUrl(`/api/notifications/inbox/${encodeURIComponent(id)}/read`);
  const result = await apiFetch(url, { method: "PATCH" });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, data: result.data ?? {} };
}

export async function markAllInboxRead() {
  const baseError = ensureApiBase();
  if (baseError) return baseError;

  const url = buildApiUrl("/api/notifications/inbox/read-all");
  const result = await apiFetch(url, { method: "PATCH" });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    updated_count: Number(result.data?.updated_count ?? 0),
    read_at: result.data?.read_at ?? null,
  };
}
