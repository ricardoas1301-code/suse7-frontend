import NotificationItem from "./NotificationItem";
import NotificationEmptyState from "./NotificationEmptyState";

export default function NotificationList({ notifications, loading, error, onMarkOneRead, onOpenEntity }) {
  if (loading) return <div className="nd-loading">Carregando…</div>;
  if (error) return <div className="nd-error">{error}</div>;
  if (!notifications?.length) return <NotificationEmptyState />;

  return (
    <ul className="nd-list">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification?.id ?? notification?.created_at}
          notification={notification}
          onMarkRead={onMarkOneRead}
          onOpenEntity={onOpenEntity}
        />
      ))}
    </ul>
  );
}

