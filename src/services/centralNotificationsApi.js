import { API_BASE_URL, buildApiUrl, apiFetch } from "../config/api";

function ensureApiBase() {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }
  return null;
}

export async function fetchNotificationCategories() {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications/categories");
  const result = await apiFetch(url, { method: "GET" });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    categories: result.data?.categories ?? [],
    channels: result.data?.channels ?? [],
  };
}

export async function fetchCentralNotificationPreferences() {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications/preferences");
  const result = await apiFetch(url, { method: "GET" });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    preferences: result.data?.preferences ?? [],
  };
}

export async function patchCentralNotificationPreferences(updates) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications/preferences");
  const result = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: { updates },
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      message: result.data?.message ?? result.error,
    };
  }
  return {
    ok: true,
    preferences: result.data?.preferences ?? [],
  };
}

export async function fetchCentralNotificationRecipients() {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications/recipients");
  const result = await apiFetch(url, { method: "GET" });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    groups: result.data?.groups ?? [],
    recipients: result.data?.recipients ?? [],
  };
}

export async function createCentralNotificationRecipient(payload) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications/recipients");
  const result = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      message: result.data?.message,
      duplicated_field: result.data?.duplicated_field,
      field: result.data?.field,
    };
  }
  return { ok: true, group: result.data?.group ?? null, recipient: result.data?.recipient ?? null };
}

export async function patchCentralNotificationRecipient(id, payload) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/notifications/recipients/${encodeURIComponent(id)}`);
  const result = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      message: result.data?.message,
      duplicated_field: result.data?.duplicated_field,
      field: result.data?.field,
    };
  }
  return { ok: true, group: result.data?.group ?? null, recipient: result.data?.recipient ?? null };
}

export async function deleteCentralNotificationRecipient(id) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/notifications/recipients/${encodeURIComponent(id)}`);
  const result = await apiFetch(url, { method: "DELETE" });
  if (!result.ok) return { ok: false, error: result.error, message: result.data?.message };
  return { ok: true };
}

export async function fetchCentralEventDeliveryRules() {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications/event-delivery-rules");
  const result = await apiFetch(url, { method: "GET" });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    rules: result.data?.rules ?? [],
    updated_at: result.data?.updated_at ?? null,
    rules_version: result.data?.rules_version ?? null,
  };
}

export async function patchCentralEventDeliveryRules(updates) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications/event-delivery-rules");
  const result = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: { updates },
  });
  if (!result.ok) {
    return { ok: false, error: result.error, message: result.data?.message };
  }
  return {
    ok: true,
    rules: result.data?.rules ?? [],
    updated_at: result.data?.updated_at ?? null,
    rules_version: result.data?.rules_version ?? null,
  };
}

export async function fetchDailySalesSummaryAutomationRule() {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications/automation-rules/daily-sales-summary");
  const result = await apiFetch(url, { method: "GET" });
  if (!result.ok) return { ok: false, error: result.error, message: result.data?.message };
  return { ok: true, rule: result.data?.rule ?? null };
}

export async function patchDailySalesSummaryAutomationRule(patch) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/notifications/automation-rules/daily-sales-summary");
  const result = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: patch,
  });
  if (!result.ok) {
    return { ok: false, error: result.error, message: result.data?.message ?? result.error };
  }
  return { ok: true, rule: result.data?.rule ?? null };
}
