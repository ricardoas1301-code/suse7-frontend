import { S7Button } from "../../../components/ui";
import {
  billingStatusClass,
  billingStatusLabel,
  financialHealthClass,
  financialHealthLabel,
  formatSubscriptionDate,
  formatSubscriptionWhen,
  formatUsagePercent,
} from "./subscriptionOpsUtils";

/**
 * @param {{
 *   subscriptionId: string | null;
 *   detail: Record<string, unknown> | null;
 *   loading: boolean;
 *   error: string | null;
 *   onClose: () => void;
 * }} props
 */
export default function SubscriptionOpsDrawer({ subscriptionId, detail, loading, error, onClose }) {
  if (!subscriptionId) return null;

  const sub = detail?.subscription ?? {};
  const summary = detail?.billing_summary ?? {};
  const usage = detail?.usage ?? {};
  const timeline = Array.isArray(detail?.timeline) ? detail.timeline : [];
  const payments = Array.isArray(detail?.payments) ? detail.payments : [];
  const alerts = Array.isArray(detail?.alerts) ? detail.alerts : [];
  const failed = Array.isArray(detail?.failed_payments_recent) ? detail.failed_payments_recent : [];
  const futureActions = detail?.future_actions ?? {};

  const usagePercent = usage.percent ?? null;
  const usageLimit = usage.limit ?? null;
  const usageCurrent = usage.current ?? 0;

  return (
    <div className="dc-drawer-backdrop dc-sub-drawer-backdrop" onClick={onClose}>
      <aside
        className="dc-drawer dc-sub-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dc-sub-drawer-title"
      >
        <header className="dc-sub-drawer__head">
          <div className="dc-sub-drawer__identity">
            {sub.seller_photo_url ? (
              <img src={String(sub.seller_photo_url)} alt="" className="dc-sub-drawer__avatar" />
            ) : (
              <span className="dc-sub-drawer__avatar dc-sub-drawer__avatar--placeholder" aria-hidden>
                {String(sub.seller_name || "?").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <p className="dc-sub-drawer__id">{subscriptionId}</p>
              <h3 id="dc-sub-drawer-title">{sub.seller_name ?? "—"}</h3>
              <p className="dc-sub-drawer__email">{sub.seller_email ?? "—"}</p>
              <div className="dc-sub-drawer__badges">
                <span className={billingStatusClass(sub.billing_status)}>{billingStatusLabel(sub.billing_status)}</span>
                <span className={financialHealthClass(sub.financial_health)}>
                  {financialHealthLabel(sub.financial_health)}
                </span>
                <span className="dc-sub-pill dc-sub-pill--neutral">{sub.plan_label ?? sub.plan_display ?? "—"}</span>
                <span className="dc-sub-pill dc-sub-pill--neutral">{sub.amount_brl ?? "—"}</span>
              </div>
            </div>
          </div>
          <S7Button type="button" variant="ghost" size="sm" className="dc-btn-ghost" onClick={onClose}>
            Fechar
          </S7Button>
        </header>

        {loading ? <p className="dc-sub-drawer__loading">Carregando ficha billing…</p> : null}
        {error ? <p className="dc-module__error dc-sub-drawer__error">{error}</p> : null}

        {!loading && !error && detail ? (
          <div className="dc-sub-drawer__scroll">
            {alerts.length > 0 ? (
              <section className="dc-sub-drawer__section dc-sub-drawer__alerts">
                <h4>Alertas operacionais</h4>
                <ul>
                  {alerts.map((msg) => (
                    <li key={String(msg)}>{String(msg)}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="dc-sub-drawer__section">
              <h4>Resumo billing</h4>
              <ul className="dc-drawer-kv">
                <li>
                  <span>Valor mensal</span>
                  <strong>{sub.amount_brl ?? "—"}</strong>
                </li>
                <li>
                  <span>Renovação</span>
                  <strong>{formatSubscriptionDate(summary.renewal_date)}</strong>
                </li>
                <li>
                  <span>Método pagamento</span>
                  <strong>{summary.payment_method ?? "—"}</strong>
                </li>
                <li>
                  <span>Último pagamento</span>
                  <strong>{formatSubscriptionWhen(summary.last_payment_at)}</strong>
                </li>
              </ul>
            </section>

            <section className="dc-sub-drawer__section">
              <h4>Ciclo atual</h4>
              <ul className="dc-drawer-kv">
                <li>
                  <span>Início período</span>
                  <strong>{formatSubscriptionDate(summary.current_period_start)}</strong>
                </li>
                <li>
                  <span>Fim período</span>
                  <strong>{formatSubscriptionDate(summary.current_period_end)}</strong>
                </li>
                <li>
                  <span>Ciclo</span>
                  <strong>{summary.billing_cycle ?? "—"}</strong>
                </li>
                <li>
                  <span>Grace até</span>
                  <strong>{formatSubscriptionWhen(summary.grace_period_ends_at)}</strong>
                </li>
              </ul>
            </section>

            <section className="dc-sub-drawer__section">
              <h4>Usage vs limits</h4>
              <div className="dc-sub-drawer__usage">
                <div className="dc-sub-drawer__usage-head">
                  <strong>{formatUsagePercent(usagePercent)}</strong>
                  <span>
                    {usageCurrent}
                    {usageLimit != null ? ` / ${usageLimit} vendas` : " vendas"}
                  </span>
                </div>
                <div className="dc-sub-drawer__usage-bar" aria-hidden>
                  <span style={{ width: `${Math.min(100, usagePercent ?? 0)}%` }} />
                </div>
                <p className="dc-sub-drawer__usage-meta">
                  Período {formatSubscriptionDate(usage.period_start)} — {formatSubscriptionDate(usage.period_end)}
                </p>
              </div>
            </section>

            <section className="dc-sub-drawer__section">
              <h4>Health financeiro</h4>
              <ul className="dc-drawer-kv">
                <li>
                  <span>Classificação</span>
                  <strong>{financialHealthLabel(sub.financial_health)}</strong>
                </li>
                <li>
                  <span>Score</span>
                  <strong>{detail.revenue_health?.health_score ?? "—"}</strong>
                </li>
                <li>
                  <span>Inadimplência</span>
                  <strong>{summary.delinquency_status ?? "—"}</strong>
                </li>
                <li>
                  <span>Renovação status</span>
                  <strong>{summary.renewal_subscription_status ?? "—"}</strong>
                </li>
              </ul>
            </section>

            <section className="dc-sub-drawer__section">
              <h4>Histórico pagamentos</h4>
              {payments.length === 0 ? (
                <p className="dc-sub-drawer__empty">Sem pagamentos registrados.</p>
              ) : (
                <ul className="dc-sub-drawer__list">
                  {payments.map((p) => (
                    <li key={String(p.id)}>
                      <div>
                        <strong>{formatSubscriptionWhen(p.paid_at ?? p.created_at)}</strong>
                        <span>
                          {p.amount_cents != null
                            ? (p.amount_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "—"}{" "}
                          · {p.status}
                        </span>
                      </div>
                      <span className="dc-sub-pill dc-sub-pill--neutral">{p.payment_method_type ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {failed.length > 0 ? (
              <section className="dc-sub-drawer__section">
                <h4>Falhas recentes</h4>
                <ul className="dc-sub-drawer__list">
                  {failed.map((p) => (
                    <li key={`fail-${String(p.id)}`}>
                      <strong>{formatSubscriptionWhen(p.created_at)}</strong>
                      <span>{p.status}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="dc-sub-drawer__section">
              <h4>Timeline billing</h4>
              {timeline.length === 0 ? (
                <p className="dc-sub-drawer__empty">Sem eventos na timeline.</p>
              ) : (
                <ol className="dc-sub-drawer__timeline">
                  {timeline.map((evt) => (
                    <li key={String(evt.id)}>
                      <span className={`dc-sub-drawer__timeline-dot dc-sub-drawer__timeline-dot--${evt.severity ?? "info"}`} aria-hidden />
                      <div>
                        <strong>{evt.label}</strong>
                        {evt.summary ? <p>{String(evt.summary)}</p> : null}
                        <time>{formatSubscriptionWhen(evt.at)}</time>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="dc-sub-drawer__section dc-sub-drawer__section--future">
              <h4>Ações administrativas</h4>
              <div className="dc-sub-drawer__actions">
                {Object.values(futureActions).map((action) => (
                  <S7Button
                    key={action.label}
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled
                    title="Disponível em fase futura"
                  >
                    {action.label}
                  </S7Button>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
