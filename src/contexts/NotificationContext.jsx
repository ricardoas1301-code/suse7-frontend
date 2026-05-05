// ======================================================================
// SUSE7 — NOTIFICATION CONTEXT
// Serviço de notificações in-app (toast). Preparado para futuros canais
// (Email, WhatsApp). Sem integração com banco nesta fase.
// ======================================================================

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createNotificationEvent } from "../services/notificationTypes";
import { supabase } from "../supabaseClient";
import { setNotificationChannelDispatcher } from "../services/notificationEngine";
import {
  sendNotificationEmail,
  sendNotificationWhatsapp,
} from "../services/notificationsApi";
import NotificationToast from "../components/NotificationToast";

// ----------------------------------------------------------------------
// Context
// ----------------------------------------------------------------------
export const NotificationContext = createContext(null);

// ----------------------------------------------------------------------
// Provider
// ----------------------------------------------------------------------
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    };
    loadUser();
  }, []);

  const addNotification = useCallback(
    (options) => {
      const dedupeKey = options.dedupeKey ?? null;
      if (dedupeKey) {
        setNotifications((prev) => {
          const hasUnreadDuplicate = prev.some(
            (n) => !n.read && n.dedupeKey === dedupeKey
          );
          if (hasUnreadDuplicate) return prev;
          const event = createNotificationEvent({
            ...options,
            user_id: userId ?? options.user_id ?? null,
            dedupeKey,
          });
          return [event, ...prev].slice(0, 50);
        });
      } else {
        const event = createNotificationEvent({
          ...options,
          user_id: userId ?? options.user_id ?? null,
        });
        setNotifications((prev) => [event, ...prev].slice(0, 50));
      }
    },
    [userId]
  );

  useEffect(() => {
    setNotificationChannelDispatcher("app", async (notification) => {
      addNotification({
        event_type: notification.notification_type ?? notification.event_type ?? "GENERIC",
        entity_type: notification.entity_type ?? "system",
        entity_id: notification.entity_id ?? null,
        title: notification.title ?? "Notificação",
        message: notification.message ?? "Novo alerta disponível.",
        severity: notification.priority ?? notification.severity ?? "info",
        created_at: notification.created_at ?? new Date().toISOString(),
        read: false,
        dedupeKey:
          notification.dedupeKey ??
          `${notification.notification_type ?? "GENERIC"}|${notification.entity_id ?? "global"}|${new Date()
            .toISOString()
            .slice(0, 10)}`,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("suse7:notification-engine:in-app", {
            detail: { notification, context: { source: "notification-context-bridge" } },
          })
        );
      }
      return true;
    });

    setNotificationChannelDispatcher("email", async (notification) => {
      const result = await sendNotificationEmail(notification?.id);
      return result.ok === true;
    });

    setNotificationChannelDispatcher("whatsapp", async (notification) => {
      const result = await sendNotificationWhatsapp(notification?.id);
      return result.ok === true;
    });
  }, [addNotification]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = {
    notifications,
    addNotification,
    markAsRead,
    clearNotifications,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast />
    </NotificationContext.Provider>
  );
}

// ----------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
