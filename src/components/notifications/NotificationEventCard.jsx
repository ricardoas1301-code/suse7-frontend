// Card de linha na lista de histórico de notificações (Fase 3).

import NotificationStatusBadge from "./NotificationStatusBadge.jsx";

function channelLines(channel_breakdown) {
  const cb = channel_breakdown ?? {};
  /** @type {{ id: string; label: string }[]} */
  const order = [
    { id: "app", label: "App" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "email", label: "E-mail" },
  ];
  return order.map(({ id, label }) => {
    const b = cb[id];
    if (!b || (b.delivered === 0 && b.failed === 0 && b.pending === 0)) return null;
    const env = b.delivered ?? 0;
    const fal = b.failed ?? 0;
    const pend = b.pending ?? 0;
    let text = `${label}: ${env} enviados`;
    if (fal > 0) text += ` / ${fal} falhas`;
    if (pend > 0) text += ` · ${pend} pendentes`;
    return (
      <span key={id} className="s7-notif-event-card__channel-line">
        {text}
      </span>
    );
  });
}

export default function NotificationEventCard({ item, marketplaceLabel, onOpenDetail }) {
  const title = item.title ?? item.notification_type ?? "Alerta";
  const message = item.message ?? "";
  const shortMsg = message.length > 140 ? `${message.slice(0, 137)}…` : message;

  return (
    <article className="s7-notif-event-card">
      <div className="s7-notif-event-card__main">
        <header className="s7-notif-event-card__head">
          <h4 className="s7-notif-event-card__title">{title}</h4>
          <NotificationStatusBadge status={item.derived_status} />
        </header>
        <p className="s7-notif-event-card__msg">{shortMsg}</p>
        <div className="s7-notif-event-card__meta">
          <span className="s7-notif-event-card__pill">{item.notification_type}</span>
          {item.severity ? (
            <span className={`s7-notif-event-card__sev s7-notif-event-card__sev--${item.severity}`}>
              {item.severity}
            </span>
          ) : null}
          {marketplaceLabel ? <span className="s7-notif-event-card__pill">{marketplaceLabel}</span> : null}
          <time className="s7-notif-event-card__time" dateTime={item.created_at}>
            {item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "—"}
          </time>
        </div>
        <div className="s7-notif-event-card__channels">{channelLines(item.channel_breakdown)}</div>
      </div>
      <div className="s7-notif-event-card__actions">
        <button type="button" className="s7-btn s7-btn--primary s7-btn--sm" onClick={() => onOpenDetail(item.id)}>
          Ver detalhes
        </button>
      </div>
    </article>
  );
}
