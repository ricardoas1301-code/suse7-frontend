// ======================================================================
// SUSE7 — NOTIFICATION TOAST
// Exibição in-app não bloqueante. Um toast por notificação.
// Auto-dismiss: 7s (warning), 11s (critical). Pause on hover.
// Futuro: botão "Ver detalhes" abrindo central de notificações.
// ======================================================================

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { NotificationContext } from "../contexts/NotificationContext";
import "./NotificationToast.css";

const AUTO_DISMISS_MS = {
  warning: 7000,
  critical: 11000,
  info: 7000,
};

function ToastItem({ notification, onDismiss, markAsRead, removeNotification }) {
  const [paused, setPaused] = useState(false);
  const startedAtRef = useRef(Date.now());
  const remainingRef = useRef(
    AUTO_DISMISS_MS[notification.severity] ?? 7000
  );

  useEffect(() => {
    if (paused) return;

    const duration = remainingRef.current;
    startedAtRef.current = Date.now();
    const timeout = setTimeout(() => {
      onDismiss(notification.id);
    }, duration);

    return () => {
      clearTimeout(timeout);
      const elapsed = Date.now() - startedAtRef.current;
      remainingRef.current = Math.max(0, duration - elapsed);
    };
  }, [paused, notification.id, onDismiss]);

  const handleDismiss = () => {
    markAsRead(notification.id);
    removeNotification(notification.id);
  };

  return (
    <div
      key={notification.id}
      className={`s7-notification-toast s7-notification-toast--${notification.severity}`}
      role="alert"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="s7-notification-toast__content">
        <span className="s7-notification-toast__title">{notification.title}</span>
        <p className="s7-notification-toast__message">{notification.message}</p>
      </div>
      <button
        type="button"
        className="s7-notification-toast__close"
        onClick={handleDismiss}
        aria-label="Fechar notificação"
      >
        ×
      </button>
    </div>
  );
}

export default function NotificationToast() {
  const { notifications, markAsRead, removeNotification } = useContext(
    NotificationContext
  );

  const unread = notifications.filter((n) => !n.read);

  const handleAutoDismiss = useCallback(
    (id) => {
      markAsRead(id);
      removeNotification(id);
    },
    [markAsRead, removeNotification]
  );

  if (unread.length === 0) return null;

  return (
    <div className="s7-notification-toast-container" role="region" aria-label="Notificações">
      {unread.map((n) => (
        <ToastItem
          key={n.id}
          notification={n}
          onDismiss={handleAutoDismiss}
          markAsRead={markAsRead}
          removeNotification={removeNotification}
        />
      ))}
    </div>
  );
}
