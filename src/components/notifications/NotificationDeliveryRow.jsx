// Linha de delivery com ações Reprocessar / Cancelar (Fase 3). Estado de loading por ID no pai.

import NotificationStatusBadge from "./NotificationStatusBadge.jsx";

const RETRYABLE = new Set(["failed", "pending", "processing"]);
const CANCELLABLE = new Set(["pending", "processing"]);
const MAX_MANUAL = 5;

export default function NotificationDeliveryRow({
  delivery,
  onRetry,
  onCancel,
  retryLoading,
  cancelLoading,
}) {
  const status = String(delivery.status ?? "").toLowerCase();
  const manual = Number(delivery.manual_retry_count ?? 0);
  const canRetry = RETRYABLE.has(status) && manual < MAX_MANUAL;
  const canCancel = CANCELLABLE.has(status);

  const dest = delivery.destination_masked ?? "—";
  const contactName = delivery.contact?.name ? ` · ${delivery.contact.name}` : "";

  return (
    <div className="s7-notif-delivery-row">
      <div className="s7-notif-delivery-row__info">
        <div className="s7-notif-delivery-row__head">
          <span className="s7-notif-delivery-row__channel">{delivery.notification_channel}</span>
          <NotificationStatusBadge status={status} />
        </div>
        <p className="s7-notif-delivery-row__dest">
          {dest}
          {contactName}
        </p>
        <p className="s7-notif-delivery-row__provider">
          Provider: {delivery.provider ?? "—"} · tentativas: {delivery.attempts ?? 0}
          {manual > 0 ? ` · retries manuais: ${manual}/${MAX_MANUAL}` : null}
        </p>
        <p className="s7-notif-delivery-row__times">
          Última tentativa: {delivery.last_attempt_at ? new Date(delivery.last_attempt_at).toLocaleString("pt-BR") : "—"}
          {" · "}
          Próximo retry: {delivery.next_retry_at ? new Date(delivery.next_retry_at).toLocaleString("pt-BR") : "—"}
        </p>
        {delivery.error_message ? (
          <p className="s7-notif-delivery-row__err">{String(delivery.error_message).slice(0, 280)}</p>
        ) : null}
      </div>
      <div className="s7-notif-delivery-row__actions">
        {canRetry ? (
          <button
            type="button"
            className="s7-btn s7-btn--secondary s7-btn--sm"
            disabled={retryLoading}
            onClick={() => onRetry(delivery.id)}
          >
            {retryLoading ? "Aguarde…" : "Reprocessar"}
          </button>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            className="s7-btn s7-btn--ghost s7-btn--sm"
            disabled={cancelLoading}
            onClick={() => onCancel(delivery.id)}
          >
            {cancelLoading ? "Aguarde…" : "Cancelar"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
