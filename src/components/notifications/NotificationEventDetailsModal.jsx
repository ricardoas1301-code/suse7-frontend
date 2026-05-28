// Modal de detalhe do evento: deliveries, resumo e logs (Fase 3).
// Logs técnicos completos apenas em DEV (conforme especificação).

import { useCallback, useEffect, useState } from "react";
import {
  cancelNotificationDelivery,
  fetchNotificationEventDetail,
  retryNotificationDelivery,
} from "../../services/notificationHistoryService";
import NotificationDeliveryRow from "./NotificationDeliveryRow.jsx";
import NotificationStatusBadge from "./NotificationStatusBadge.jsx";

export default function NotificationEventDetailsModal({
  eventId,
  open,
  onClose,
  toast,
  accountsById,
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [retryId, setRetryId] = useState(null);
  const [cancelId, setCancelId] = useState(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    const res = await fetchNotificationEventDetail(eventId);
    setLoading(false);
    if (!res.ok) {
      toast?.({ type: "error", title: "Detalhe", message: res.error ?? "Não foi possível carregar." });
      return;
    }
    setData(res);
  }, [eventId, toast]);

  useEffect(() => {
    if (open && eventId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carregar detalhe ao abrir modal
      void load();
    } else {
      setData(null);
    }
  }, [open, eventId, load]);

  const handleRetry = async (id) => {
    setRetryId(id);
    const res = await retryNotificationDelivery(id);
    setRetryId(null);
    if (!res.ok) {
      toast?.({ type: "error", title: "Reprocessar", message: res.error ?? "Falha ao solicitar retry." });
      return;
    }
    toast?.({ type: "success", title: "Reprocessar", message: "Delivery enfileirada para novo envio." });
    void load();
  };

  const handleCancel = async (id) => {
    setCancelId(id);
    const res = await cancelNotificationDelivery(id);
    setCancelId(null);
    if (!res.ok) {
      toast?.({ type: "error", title: "Cancelar", message: res.error ?? "Não foi possível cancelar." });
      return;
    }
    toast?.({ type: "success", title: "Cancelar", message: "Envio cancelado." });
    void load();
  };

  if (!open) return null;

  const ev = data?.event;
  const summary = data?.summary ?? {};
  const deliveries = Array.isArray(data?.deliveries) ? data.deliveries : [];
  const accountLabel =
    data?.marketplace_account?.account_alias ??
    data?.marketplace_account?.ml_nickname ??
    accountsById?.[ev?.marketplace_account_id] ??
    null;

  return (
    <div className="s7-notif-modal-overlay" role="presentation" onMouseDown={onClose}>
      <aside
        className="s7-notif-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-notif-detail-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="s7-notif-modal-panel__head">
          <div>
            <h3 id="s7-notif-detail-title">{ev?.title ?? "Detalhe do alerta"}</h3>
            {loading ? <p className="s7-notif-modal-panel__loading">Carregando…</p> : null}
          </div>
          <button type="button" className="s7-notif-modal-panel__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className="s7-notif-modal-panel__body">
          {!ev && !loading ? (
            <p>Nenhum dado.</p>
          ) : ev ? (
            <>
              <section className="s7-notif-detail-section">
                <p className="s7-notif-detail-msg">{ev.message}</p>
                <div className="s7-notif-detail-meta">
                  <span>Tipo: {ev.notification_type}</span>
                  <span>Severidade: {ev.severity}</span>
                  <NotificationStatusBadge status={data?.derived_status} />
                  {accountLabel ? <span>Conta: {accountLabel}</span> : null}
                  {data?.seller_company?.trade_name || data?.seller_company?.company_name ? (
                    <span>Empresa: {data.seller_company.trade_name ?? data.seller_company.company_name}</span>
                  ) : null}
                  {ev.entity_type ? (
                    <span>
                      Entidade: {ev.entity_type} {ev.entity_id ? `(${ev.entity_id})` : ""}
                    </span>
                  ) : null}
                  <span>Criado em: {ev.created_at ? new Date(ev.created_at).toLocaleString("pt-BR") : "—"}</span>
                </div>
              </section>

              <section className="s7-notif-detail-section">
                <h4>Resumo dos envios</h4>
                <ul className="s7-notif-detail-summary">
                  <li>Total: {summary.total_deliveries ?? 0}</li>
                  <li>Pendentes: {summary.pending_count ?? 0}</li>
                  <li>Processando: {summary.processing_count ?? 0}</li>
                  <li>Entregues: {summary.delivered_count ?? 0}</li>
                  <li>Falhas: {summary.failed_count ?? 0}</li>
                  <li>Cancelados: {summary.cancelled_count ?? 0}</li>
                </ul>
              </section>

              <section className="s7-notif-detail-section">
                <h4>Envios por canal</h4>
                <div className="s7-notif-detail-deliveries">
                  {deliveries.map((d) => (
                    <div key={d.id} className="s7-notif-detail-delivery-wrap">
                      <NotificationDeliveryRow
                        delivery={d}
                        onRetry={handleRetry}
                        onCancel={handleCancel}
                        retryLoading={retryId === d.id}
                        cancelLoading={cancelId === d.id}
                      />
                      {import.meta.env.DEV && Array.isArray(d.logs) && d.logs.length > 0 ? (
                        <details className="s7-notif-delivery-logs">
                          <summary>Logs da entrega ({d.logs.length})</summary>
                          <ul>
                            {d.logs.map((log) => (
                              <li key={log.id}>
                                <time dateTime={log.created_at}>
                                  {log.created_at ? new Date(log.created_at).toLocaleString("pt-BR") : ""}
                                </time>
                                <span className="s7-notif-log-level">{log.level}</span>
                                <span>{log.message}</span>
                                {log.payload != null ? (
                                  <pre className="s7-notif-log-payload">{JSON.stringify(log.payload, null, 2)}</pre>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
