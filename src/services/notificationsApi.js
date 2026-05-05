import { API_BASE_URL, buildApiUrl, apiFetch } from "../config/api";

function ensureApiBase() {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }
  return null;
}

export async function createNotification(payload) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications");
  if (!url) return { ok: false, error: "URL da API inválida" };

  const result = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ?? {},
  });

  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    notification: result.data?.notification ?? null,
    deduped: Boolean(result.data?.deduped),
  };
}

export async function listNotifications({
  page = 1,
  page_size = 20,
  unread,
  category,
  priority,
  notification_type,
} = {}) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications");
  if (!url) return { ok: false, error: "URL da API inválida" };

  const params = new URLSearchParams({
    page: String(page),
    page_size: String(page_size),
  });
  if (unread != null) params.set("unread", String(unread));
  if (category && category !== "all") params.set("category", String(category));
  if (priority && priority !== "all") params.set("priority", String(priority));
  if (notification_type && notification_type !== "all") {
    params.set("notification_type", String(notification_type));
  }

  const result = await apiFetch(`${url}?${params.toString()}`, {
    method: "GET",
    unauthorizedFallback: { notifications: [], pagination: { page, page_size, total: 0 } },
  });

  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    notifications: Array.isArray(result.data?.notifications) ? result.data.notifications : [],
    pagination: result.data?.pagination ?? null,
  };
}

export async function markNotificationAsRead(notificationId) {
  const id = String(notificationId ?? "").trim();
  if (!id) return { ok: false, error: "notificationId inválido" };
  const baseError = ensureApiBase();
  if (baseError) return baseError;

  const url = buildApiUrl(`/api/notifications/${encodeURIComponent(id)}/read`);
  if (!url) return { ok: false, error: "URL da API inválida" };

  const result = await apiFetch(url, { method: "PATCH" });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, notification: result.data?.notification ?? null };
}

export async function markAllNotificationsAsRead(filters = {}) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications/read-all");
  if (!url) return { ok: false, error: "URL da API inválida" };

  const payload = {};
  if (filters?.category) payload.category = String(filters.category).trim();
  if (filters?.notification_type) payload.notification_type = String(filters.notification_type).trim();
  if (filters?.priority) payload.priority = String(filters.priority).trim();

  const result = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    success: Boolean(result.data?.success),
    updated_count: Number(result.data?.updated_count ?? 0),
    read_at: result.data?.read_at ?? new Date().toISOString(),
  };
}

export async function sendNotificationEmail(notificationId) {
  return sendNotificationByChannel("email", notificationId);
}

export async function sendNotificationWhatsapp(notificationId) {
  return sendNotificationByChannel("whatsapp", notificationId);
}

async function sendNotificationByChannel(channel, notificationId) {
  const id = String(notificationId ?? "").trim();
  if (!id) return { ok: false, error: "notificationId inválido" };
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/notifications/channels/${channel}`);
  if (!url) return { ok: false, error: "URL da API inválida" };

  const result = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { notification_id: id },
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, data: result.data ?? {} };
}

