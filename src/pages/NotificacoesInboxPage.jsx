// ======================================================================
// S7 — Página central de notificações in-app (/notificacoes)
// ======================================================================

import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useS7Inbox } from "../hooks/useS7Inbox";
import {
  categoryLabel,
  formatRelativeTime,
  groupInboxByTime,
  severityTone,
} from "../billing/notificationInboxUi";
import "./NotificacoesInboxPage.css";

function InboxCard({ item, onOpen }) {
  const tone = severityTone(item.severity);
  return (
    <article className={`s7-inbox-card s7-inbox-card--${tone}${item.is_read ? "" : " is-unread"}`}>
      <button type="button" className="s7-inbox-card__main" onClick={() => onOpen(item)}>
        <div className="s7-inbox-card__meta">
          <span className="s7-inbox-card__origin">{categoryLabel(item.category_code)}</span>
          <time dateTime={item.created_at}>{formatRelativeTime(item.created_at)}</time>
        </div>
        <h3>{item.title || "Notificação"}</h3>
        <p>{item.message}</p>
        {item.deep_link && <span className="s7-inbox-card__cta">Abrir</span>}
      </button>
      {!item.is_read && (
        <button
          type="button"
          className="s7-inbox-card__read"
          onClick={() => onOpen(item, { markOnly: true })}
          aria-label="Marcar como lida"
        >
          <CheckCheck size={16} />
        </button>
      )}
    </article>
  );
}

function Section({ title, items, onOpen }) {
  if (!items?.length) return null;
  return (
    <section className="s7-inbox-section">
      <h2>{title}</h2>
      <div className="s7-inbox-section__list">
        {items.map((item) => (
          <InboxCard key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

export default function NotificacoesInboxPage() {
  const navigate = useNavigate();
  const { items, unreadCount, loading, loadingMore, error, refresh, loadMore, hasMore, markOneRead, markAllRead } =
    useS7Inbox({ enabled: true });

  const groups = groupInboxByTime(items);

  const handleOpen = async (item, opts = {}) => {
    if (!item?.is_read) await markOneRead(item.id);
    if (opts.markOnly) {
      refresh();
      return;
    }
    const link = item?.deep_link;
    if (link && String(link).startsWith("/")) navigate(link);
  };

  return (
    <div className="s7-inbox-page">
      <header className="s7-inbox-page__hero">
        <div>
          <p className="s7-inbox-page__eyebrow">Mission Control</p>
          <h1>
            <Bell size={22} aria-hidden />
            Notificações
          </h1>
          <p className="s7-inbox-page__sub">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
              : "Tudo em dia — histórico preservado abaixo."}
          </p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="s7-inbox-page__mark-all" onClick={() => markAllRead().then(() => refresh())}>
            Marcar todas como lidas
          </button>
        )}
      </header>

      {loading && items.length === 0 && <p className="s7-inbox-page__loading">Carregando notificações…</p>}
      {error && <p className="s7-inbox-page__error" role="alert">{error}</p>}

      {!loading && items.length === 0 && !error && (
        <div className="s7-inbox-page__empty">
          <Bell size={40} strokeWidth={1.25} aria-hidden />
          <h2>Nenhuma notificação ainda</h2>
          <p>Quando o motor S7 gerar alertas in-app, eles aparecerão aqui com histórico completo.</p>
        </div>
      )}

      <Section title="Não lidas" items={groups.unread} onOpen={handleOpen} />
      <Section title="Hoje" items={groups.today} onOpen={handleOpen} />
      <Section title="Ontem" items={groups.yesterday} onOpen={handleOpen} />
      <Section title="Esta semana" items={groups.week} onOpen={handleOpen} />
      <Section title="Mais antigas" items={groups.older} onOpen={handleOpen} />

      {hasMore && (
        <div className="s7-inbox-page__more">
          <button type="button" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Carregando…" : "Carregar mais"}
          </button>
        </div>
      )}
    </div>
  );
}
