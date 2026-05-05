// ======================================================================
// SUSE7 — Notifications Drawer
// Painel lateral com lista de notificações, filtros e ações
// ======================================================================

import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import NotificationFilters from "./notifications/NotificationFilters";
import NotificationList from "./notifications/NotificationList";
import "./NotificationsDrawer.css";

export default function NotificationsDrawer({
  open = false,
  onClose,
  notifications = [],
  loading = false,
  error = null,
  filters = {},
  onSetFilters,
  onRefresh,
  onMarkOneRead,
  onMarkAllRead,
}) {
  const navigate = useNavigate();
  const unreadList = notifications.filter((n) => !n.read_at && !n.read);
  const criticalCount = notifications.filter(
    (n) => String(n?.priority ?? "").toLowerCase() === "critical"
  ).length;
  const hasActiveFilters = [
    filters?.status,
    filters?.category,
    filters?.priority,
    filters?.notification_type,
  ].some((value) => value && value !== "all");

  if (!open) return null;

  const handleVerProduto = (n) => {
    const entityId = n?.entity_id ?? n?.payload?.entity_id ?? n?.payload?.product_id;
    if (entityId) {
      onClose?.();
      navigate(`/produtos/${entityId}/editar?tab=stock`);
    }
  };

  return createPortal(
    <div className="nd-overlay" onClick={onClose} role="presentation">
      <div className="nd-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="nd-title">
        <div className="nd-header">
          <h2 id="nd-title">Notificações</h2>
          <button type="button" className="nd-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="nd-counters">
          <span>{notifications.length} notificações</span>
          <span>{unreadList.length} não lidas</span>
          <span>{criticalCount} críticas</span>
        </div>

        <NotificationFilters
          filters={filters}
          onChange={onSetFilters}
          hasActiveFilters={hasActiveFilters}
          onClear={() =>
            onSetFilters?.({
              status: "all",
              category: "all",
              priority: "all",
              notification_type: "all",
              page: 1,
            })
          }
        />

        <div className="nd-body">
          <NotificationList
            notifications={notifications}
            loading={loading}
            error={error}
            onMarkOneRead={onMarkOneRead}
            onOpenEntity={handleVerProduto}
          />
        </div>

        <div className="nd-footer">
          {unreadList.length > 0 && (
            <button type="button" className="nd-btn-mark-all" onClick={() => onMarkAllRead?.()}>
              Marcar todas como lidas
            </button>
          )}
          <button type="button" className="nd-btn-close" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
