// ======================================================================
// S7 — Centro de notificações in-app (sininho + dropdown)
// ======================================================================

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CreditCard, AlertTriangle, Info, Package } from "lucide-react";
import { useS7Inbox } from "../../hooks/useS7Inbox";
import {
  categoryLabel,
  formatRelativeTime,
  severityTone,
} from "../../billing/notificationInboxUi";
import { emitOpenDailySalesSummaryModal } from "./central/dailySalesSummaryModalBus";
import "./S7NotificationCenter.css";

function InboxIcon({ item }) {
  const tone = severityTone(item?.severity);
  const cat = String(item?.category_code ?? "").toUpperCase();
  if (cat === "BILLING") return <CreditCard size={18} aria-hidden />;
  if (tone === "critical" || tone === "warning") return <AlertTriangle size={18} aria-hidden />;
  if (cat === "PRODUCTS" || cat === "INVENTORY") return <Package size={18} aria-hidden />;
  return <Info size={18} aria-hidden />;
}

function isDailySalesSummaryItem(item) {
  const eventType = String(item?.event_type_key ?? "").toUpperCase();
  if (eventType === "SALES:DAILY_SALES_SUMMARY") return true;
  const category = String(item?.category_code ?? "").toUpperCase();
  const type = String(item?.type_key ?? "").toUpperCase();
  return category === "SALES" && type === "DAILY_SALES_SUMMARY";
}

export default function S7NotificationCenter({ interactionLocked = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const navigate = useNavigate();
  const {
    items,
    unreadCount,
    loading,
    error,
    refresh,
    markOneRead,
    markAllRead,
  } = useS7Inbox({ enabled: true, pollWhenOpen: open });

  useEffect(() => {
    const onDoc = (e) => {
      if (!open || !rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const preview = items.slice(0, 8);
  const badge = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  const openItem = async (item) => {
    if (!item?.is_read) await markOneRead(item.id);
    setOpen(false);
    if (isDailySalesSummaryItem(item)) {
      emitOpenDailySalesSummaryModal(item, "inbox_click");
      return;
    }
    const link = item?.deep_link;
    if (link && String(link).startsWith("/")) navigate(link);
  };

  useEffect(() => {
    if (interactionLocked && open) setOpen(false);
  }, [interactionLocked, open]);

  const handleBellClick = () => {
    if (interactionLocked) return;
    setOpen((v) => !v);
  };

  const handleBellKeyDown = (event) => {
    if (interactionLocked) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div
      className={["s7-nc", interactionLocked ? "s7-nc--locked" : ""].filter(Boolean).join(" ")}
      ref={rootRef}
    >
      <button
        type="button"
        className="s7-nc__bell"
        onClick={handleBellClick}
        onKeyDown={handleBellKeyDown}
        disabled={interactionLocked}
        tabIndex={interactionLocked ? -1 : undefined}
        aria-disabled={interactionLocked || undefined}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ""}`}
      >
        <Bell size={22} strokeWidth={2} aria-hidden />
        {badge && (
          <span className="s7-nc__badge" aria-hidden>
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="s7-nc__panel" role="dialog" aria-label="Central de notificações">
          <div className="s7-nc__head">
            <h2>Central de notificações</h2>
            {unreadCount > 0 && (
              <button type="button" className="s7-nc__mark-all" onClick={() => markAllRead()}>
                Marcar todas
              </button>
            )}
          </div>

          <div className="s7-nc__body">
            {loading && preview.length === 0 && (
              <p className="s7-nc__state" role="status">
                Carregando…
              </p>
            )}
            {error && (
              <p className="s7-nc__state s7-nc__state--error" role="alert">
                {error}
              </p>
            )}
            {!loading && !error && preview.length === 0 && (
              <div className="s7-nc__empty">
                <Bell size={32} strokeWidth={1.5} aria-hidden />
                <p>Você está em dia</p>
                <span>Nenhuma notificação nova no momento.</span>
              </div>
            )}
            <ul className="s7-nc__list">
              {preview.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`s7-nc__item${item.is_read ? " is-read" : " is-unread"}`}
                    onClick={() => openItem(item)}
                  >
                    <span className={`s7-nc__icon s7-nc__icon--${severityTone(item.severity)}`}>
                      <InboxIcon item={item} />
                    </span>
                    <span className="s7-nc__copy">
                      <strong>{item.title || "Notificação"}</strong>
                      <span>{item.message}</span>
                    </span>
                    <time dateTime={item.created_at}>{formatRelativeTime(item.created_at)}</time>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <footer className="s7-nc__foot">
            <Link to="/notificacoes" onClick={() => setOpen(false)}>
              Ver todas
            </Link>
          </footer>
        </div>
      )}
    </div>
  );
}
