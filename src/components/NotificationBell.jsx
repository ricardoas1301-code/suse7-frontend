// ======================================================================
// SUSE7 — Notification Bell (sininho + badge)
// Abre o drawer de notificações ao clicar.
// Só chama APIs quando houver sessão (auth ready), evitando 401 desnecessários.
// ======================================================================

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useNotificationCenter } from "../hooks/useNotificationCenter";
import { getSessionToken } from "../config/api";
import NotificationsDrawer from "./NotificationsDrawer";
import "./NotificationBell.css";

export default function NotificationBell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    unreadCount,
    refresh,
    loadNotifyPrefs,
    markOneRead,
    markAllRead,
    setFilters,
    filters,
    notifications,
    loading,
    error,
  } = useNotificationCenter();
  const pollRef = useRef(null);

  // --------------------------------------------------------------------
  // Só carrega preferências e notificações quando houver sessão (auth ready)
  // --------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    getSessionToken().then((token) => {
      if (cancelled || !token) return;
      loadNotifyPrefs().then((prefs) => {
        if (cancelled) return;
        refresh({}, prefs ?? {});
      });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    getSessionToken().then((token) => {
      if (!token) return;
      loadNotifyPrefs().then((prefs) => refresh({}, prefs ?? {}));
    });
    pollRef.current = setInterval(() => refresh(), 60000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [drawerOpen]);

  useEffect(() => {
    const onPrefsChange = () => loadNotifyPrefs().then((prefs) => refresh({}, prefs ?? {}));
    window.addEventListener("suse7:notifyPrefsChanged", onPrefsChange);
    return () => window.removeEventListener("suse7:notifyPrefsChanged", onPrefsChange);
  }, []);

  useEffect(() => {
    if (drawerOpen) refresh();
  }, [filters]);

  return (
    <>
      <button
        type="button"
        className="nb-bell"
        onClick={() => setDrawerOpen(true)}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
      >
        <Bell className="nb-icon" size={22} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="nb-badge" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        loading={loading}
        error={error}
        filters={filters}
        onSetFilters={setFilters}
        onRefresh={() => refresh()}
        onMarkOneRead={markOneRead}
        onMarkAllRead={markAllRead}
      />
    </>
  );
}
