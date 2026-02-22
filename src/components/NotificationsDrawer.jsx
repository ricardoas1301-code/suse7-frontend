// ======================================================================
// SUSE7 — Notifications Drawer
// Painel lateral com lista de notificações, filtros e ações
// ======================================================================

import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import "./NotificationsDrawer.css";

const TYPE_LABELS = {
  STOCK_LOW: "Estoque baixo",
  STOCK_BELOW_MIN: "Estoque abaixo do mínimo",
  STOCK_REAL_ZERO: "Estoque zerado",
};

function getTypeLabel(type) {
  return TYPE_LABELS[type] ?? type ?? "Notificação";
}

function getMessage(n) {
  return n?.payload?.message ?? n?.message ?? n?.title ?? "—";
}

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

        <div className="nd-filters">
          <button
            type="button"
            className={filters.active === true && filters.unread == null ? "active" : ""}
            onClick={() => onSetFilters?.({ unread: null, active: true })}
          >
            Ativas
          </button>
          <button
            type="button"
            className={filters.unread === true ? "active" : ""}
            onClick={() => onSetFilters?.({ unread: true, active: null })}
          >
            Não lidas
          </button>
          <button
            type="button"
            className={filters.unread === null && filters.active === null ? "active" : ""}
            onClick={() => onSetFilters?.({ unread: null, active: null })}
          >
            Todas
          </button>
        </div>

        <div className="nd-body">
          {loading && (
            <div className="nd-loading">Carregando…</div>
          )}
          {error && (
            <div className="nd-error">{error}</div>
          )}
          {!loading && !error && notifications.length === 0 && (
            <div className="nd-empty">Nenhuma notificação.</div>
          )}
          {!loading && !error && notifications.length > 0 && (
            <ul className="nd-list">
              {notifications.map((n) => {
                const isUnread = !n.read_at && !n.read;
                const type = n?.type ?? n?.event_type ?? "";
                const isStockLow = ["STOCK_LOW", "STOCK_BELOW_MIN", "STOCK_REAL_ZERO"].includes(type);
                return (
                  <li key={n?.id ?? n?.created_at ?? Math.random()} className={`nd-item ${isUnread ? "nd-item--unread" : ""}`}>
                    <div className="nd-item-type">{getTypeLabel(type)}</div>
                    <div className="nd-item-message">{getMessage(n)}</div>
                    <div className="nd-item-meta">
                      <span className="nd-item-time">{formatDate(n?.created_at)}</span>
                      {isUnread && (
                        <button
                          type="button"
                          className="nd-item-mark"
                          onClick={() => onMarkOneRead?.(n.id)}
                        >
                          Marcar como lida
                        </button>
                      )}
                      {isStockLow && (n?.entity_id ?? n?.payload?.entity_id ?? n?.payload?.product_id) && (
                        <button
                          type="button"
                          className="nd-item-action"
                          onClick={() => handleVerProduto(n)}
                        >
                          Ver produto
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
