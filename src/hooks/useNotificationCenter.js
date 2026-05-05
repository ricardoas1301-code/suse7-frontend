// ======================================================================
// SUSE7 — Hook useNotificationCenter
// Estado e ações do Centro de Notificações (sininho + drawer)
// Respeita preferências notify.*.in_app para filtrar exibição
// ======================================================================

import { useState, useCallback, useEffect } from "react";
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationsApi";
import { getPreferences } from "../services/userPreferencesService";

/**
 * Filtra notificações considerando preferências in_app.
 * Só inclui types onde notify.<TYPE>.in_app.enabled !== false
 */
function filterByInAppPrefs(notifications, notifyPrefs) {
  if (!Array.isArray(notifications)) return [];
  return notifications.filter((n) => {
    const type = n?.type ?? n?.event_type ?? "";
    if (!type) return true; // sem type, mostra
    const modernKey = `notify.${type}`;
    const modern = notifyPrefs?.[modernKey] ?? notifyPrefs?.[modernKey.toLowerCase?.()];
    if (modern && typeof modern === "object") {
      const enabled = modern?.channel_app_enabled ?? modern?.channels?.app?.enabled;
      if (typeof enabled === "boolean") return enabled;
    }
    const legacyKey = `notify.${type}.in_app`;
    const legacyVal = notifyPrefs?.[legacyKey] ?? notifyPrefs?.[legacyKey.toLowerCase?.()];
    return legacyVal?.enabled !== false; // default true se não existir
  });
}

export function useNotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    priority: "all",
    notification_type: "all",
    page: 1,
    page_size: 20,
  });
  const [notifyPrefs, setNotifyPrefs] = useState({});

  const loadNotifyPrefs = useCallback(async () => {
    const { ok, data } = await getPreferences("notify.");
    const prefs = ok && data ? data : {};
    setNotifyPrefs(prefs);
    return prefs;
  }, []);

  const refresh = useCallback(
    async (overrides = {}, prefsOverride = null) => {
      setLoading(true);
      setError(null);
      const prefs = prefsOverride ?? notifyPrefs;
      const merged = { ...filters, ...overrides };
      const unread =
        merged.status === "unread" ? true : merged.status === "read" ? false : undefined;
      const { ok, notifications: data, error: err } = await listNotifications({
        page: merged.page ?? 1,
        page_size: merged.page_size ?? 20,
        unread,
        category: merged.category,
        priority: merged.priority,
        notification_type: merged.notification_type,
      });
      setLoading(false);
      if (!ok) {
        setError(err ?? "Erro ao carregar");
        return;
      }
      const raw = Array.isArray(data) ? data : [];
      const filtered = filterByInAppPrefs(raw, prefs);
      setNotifications(filtered);
      const count = filtered.filter((n) => !n.read_at && !n.read).length;
      setUnreadCount(count);
    },
    [filters, notifyPrefs]
  );

  const markOneRead = useCallback(
    async (id) => {
      const { ok } = await markNotificationAsRead(id);
      if (ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            String(n?.id) === String(id) ? { ...n, read_at: n.read_at || new Date().toISOString(), read: true } : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    },
    []
  );

  const markManyRead = useCallback(async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const results = await Promise.all(ids.map((id) => markNotificationAsRead(id)));
    const okIds = ids.filter((_, idx) => results[idx]?.ok);
    if (okIds.length > 0) {
      const idSet = new Set(okIds.map(String));
      setNotifications((prev) =>
        prev.map((n) =>
          idSet.has(String(n?.id)) ? { ...n, read_at: n.read_at || new Date().toISOString(), read: true } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - okIds.length));
    }
  }, []);

  const markAllReadAction = useCallback(async () => {
    const payload = {
      category: filters.category !== "all" ? filters.category : undefined,
      priority: filters.priority !== "all" ? filters.priority : undefined,
      notification_type:
        filters.notification_type !== "all" ? filters.notification_type : undefined,
    };
    const result = await markAllNotificationsAsRead(payload);
    if (result?.ok) {
      const readAt = result.read_at || new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => (n.read_at || n.read ? n : { ...n, read_at: readAt, read: true }))
      );
      setUnreadCount(0);
      return;
    }

    // Fallback DEV: preserva UX mesmo se endpoint bulk falhar localmente
    if (import.meta.env.DEV) {
      const unreadIds = notifications.filter((n) => !n.read_at && !n.read).map((n) => n.id);
      await markManyRead(unreadIds);
    }
  }, [notifications, markManyRead, filters]);

  const setFiltersAction = useCallback((next) => {
    const changingCriteria =
      Object.prototype.hasOwnProperty.call(next, "status") ||
      Object.prototype.hasOwnProperty.call(next, "category") ||
      Object.prototype.hasOwnProperty.call(next, "priority") ||
      Object.prototype.hasOwnProperty.call(next, "notification_type");
    setFilters((prev) => ({
      ...prev,
      ...next,
      ...(changingCriteria ? { page: 1 } : {}),
    }));
  }, []);

  useEffect(() => {
    const onEngineInAppNotification = (event) => {
      const payload = event?.detail?.notification;
      if (!payload) return;

      const normalized = {
        id: payload.id ?? `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        event_type: payload.notification_type ?? payload.event_type ?? "GENERIC",
        type: payload.notification_type ?? payload.event_type ?? "GENERIC",
        title: payload.title ?? "Notificação",
        message: payload.message ?? "Novo alerta disponível.",
        payload: payload.data ?? {},
        entity_id: payload.entity_id ?? null,
        read: false,
        read_at: null,
        created_at: payload.created_at ?? new Date().toISOString(),
        source: "notification-engine",
        category: payload.category ?? null,
        priority: payload.priority ?? null,
        notification_type: payload.notification_type ?? payload.type ?? payload.event_type ?? null,
      };

      setNotifications((prev) => {
        if (!matchesCurrentFilters(normalized, filters)) return prev;
        if (prev.some((n) => String(n.id) === String(normalized.id))) return prev;
        return [normalized, ...prev].slice(0, 50);
      });
      setUnreadCount((count) => count + (payload.read_at || payload.read ? 0 : 1));
    };

    window.addEventListener("suse7:notification-engine:in-app", onEngineInAppNotification);
    return () =>
      window.removeEventListener("suse7:notification-engine:in-app", onEngineInAppNotification);
  }, [filters]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    filters,
    refresh,
    markOneRead,
    markManyRead,
    markAllRead: markAllReadAction,
    setFilters: setFiltersAction,
    loadNotifyPrefs,
    notifyPrefs,
  };
}

function matchesCurrentFilters(notification, filters) {
  const isRead = Boolean(notification?.read_at || notification?.read);
  if (filters.status === "unread" && isRead) return false;
  if (filters.status === "read" && !isRead) return false;
  if (filters.category !== "all" && String(notification?.category ?? "") !== filters.category) return false;
  if (filters.priority !== "all" && String(notification?.priority ?? "") !== filters.priority) return false;
  const type = String(
    notification?.notification_type ?? notification?.type ?? notification?.event_type ?? ""
  ).toUpperCase();
  if (filters.notification_type !== "all" && type !== String(filters.notification_type).toUpperCase()) {
    return false;
  }
  return true;
}
