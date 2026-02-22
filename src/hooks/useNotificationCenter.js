// ======================================================================
// SUSE7 — Hook useNotificationCenter
// Estado e ações do Centro de Notificações (sininho + drawer)
// Respeita preferências notify.*.in_app para filtrar exibição
// ======================================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { listNotifications, markRead, markAllRead } from "../services/notificationsService";
import { getPreferences } from "../services/userPreferencesService";

// Tipos que têm preferência in_app (MVP) — alinhado com notify.<TYPE>.in_app
const NOTIFY_TYPES = ["STOCK_LOW", "STOCK_BELOW_MIN", "STOCK_REAL_ZERO"];

/**
 * Filtra notificações considerando preferências in_app.
 * Só inclui types onde notify.<TYPE>.in_app.enabled !== false
 */
function filterByInAppPrefs(notifications, notifyPrefs) {
  if (!Array.isArray(notifications)) return [];
  return notifications.filter((n) => {
    const type = n?.type ?? n?.event_type ?? "";
    if (!type) return true; // sem type, mostra
    const key = `notify.${type}.in_app`;
    const val = notifyPrefs?.[key] ?? notifyPrefs?.[key.toLowerCase?.()];
    return val?.enabled !== false; // default true se não existir
  });
}

export function useNotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ unread: null, active: true });
  const [notifyPrefs, setNotifyPrefs] = useState({});
  const pollRef = useRef(null);

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
      const { unread, active, limit } = { ...filters, ...overrides };
      const { ok, data, error: err } = await listNotifications({
        unread: unread ?? undefined,
        active: active ?? undefined,
        limit: 50,
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
      const { ok } = await markRead({ ids: [id] });
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

  const markManyRead = useCallback(
    async (ids) => {
      const { ok } = await markRead({ ids });
      if (ok) {
        const idSet = new Set(ids.map(String));
        setNotifications((prev) =>
          prev.map((n) =>
            idSet.has(String(n?.id)) ? { ...n, read_at: n.read_at || new Date().toISOString(), read: true } : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - ids.length));
      }
    },
    []
  );

  const markAllReadAction = useCallback(async () => {
    const { ok } = await markAllRead();
    if (ok) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString(), read: true }))
      );
      setUnreadCount(0);
    }
  }, []);

  const setFiltersAction = useCallback((next) => {
    setFilters((prev) => ({ ...prev, ...next }));
  }, []);

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
