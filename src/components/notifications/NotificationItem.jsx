import { getNotificationPriorityLabel, getNotificationTypeLabel } from "../../utils/notificationLabels";

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Agora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

function getMessage(n) {
  return n?.payload?.message ?? n?.message ?? n?.title ?? "—";
}

export default function NotificationItem({ notification, onMarkRead, onOpenEntity }) {
  const isUnread = !notification?.read_at && !notification?.read;
  const type = notification?.notification_type ?? notification?.type ?? notification?.event_type ?? "";
  const hasEntity = Boolean(notification?.entity_id ?? notification?.payload?.entity_id ?? notification?.payload?.product_id);

  return (
    <li className={`nd-item ${isUnread ? "nd-item--unread" : ""}`}>
      <div className="nd-item-type">{getNotificationTypeLabel(type)}</div>
      <div className="nd-item-message">{getMessage(notification)}</div>
      <div className="nd-item-badges">
        <span className={`nd-priority nd-priority--${String(notification?.priority ?? "info").toLowerCase()}`}>
          {getNotificationPriorityLabel(notification?.priority ?? "info")}
        </span>
      </div>
      <div className="nd-item-meta">
        <span className="nd-item-time">{formatDate(notification?.created_at)}</span>
        {isUnread ? (
          <button type="button" className="nd-item-mark" onClick={() => onMarkRead?.(notification.id)}>
            Marcar como lida
          </button>
        ) : null}
        {hasEntity ? (
          <button type="button" className="nd-item-action" onClick={() => onOpenEntity?.(notification)}>
            Ver item
          </button>
        ) : null}
      </div>
    </li>
  );
}

