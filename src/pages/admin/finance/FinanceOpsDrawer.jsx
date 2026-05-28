import { S7Button } from "../../../components/ui";
import {
  financialHealthClass,
  financialHealthLabel,
  formatFinanceDate,
  formatFinanceWhen,
  formatUsagePercent,
} from "./financeOpsUtils";

/**
 * @param {{
 *   subscriptionId: string | null;
 *   detail: Record<string, unknown> | null;
 *   loading: boolean;
 *   error: string | null;
 *   onClose: () => void;
 * }} props
 */
export default function FinanceOpsDrawer({ subscriptionId, detail, loading, error, onClose }) {
  if (!subscriptionId) return null;

  const sub = detail?.subscription ?? {};
  const financeSummary = detail?.finance_summary ?? {};
  const billingSummary = detail?.billing_summary ?? {};
  const usage = detail?.usage ?? {};
  const timeline = Array.isArray(detail?.timeline) ? detail.timeline : [];
  const payments = Array.isArray(detail?.payments) ? detail.payments : [];
  const alerts = Array.isArray(detail?.alerts) ? detail.alerts : [];
  const observability = detail?.observability ?? {};
  const futureActions = detail?.future_actions ?? {};

  return (
    <div className="dc-drawer-backdrop dc-fin-drawer-backdrop" onClick={onClose}>
      <aside className="dc-drawer dc-fin-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="dc-fin-drawer__head">
          <div className="dc-fin-drawer__identity">
            {sub.seller_photo_url ? (
              <img src={String(sub.seller_photo_url)} alt="" className="dc-fin-drawer__avatar" />
            ) : (
              <span className="dc-fin-drawer__avatar dc-fin-drawer__avatar--placeholder" aria-hidden>
                {String(sub.seller_name || "?").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <p className="dc-fin-drawer__id">{subscriptionId}</p>
              <h3>{sub.seller_name ?? "—"}</h3>
              <p className="dc-fin-drawer__email">{sub.seller_email ?? "—"}</p>
              <div className="dc-fin-drawer__badges">
                <span className={financialHealthClass(sub.financial_health)}>
                  {financialHealthLabel(sub.financial_health)}
                </span>
                <span className="dc-fin-pill dc-fin-pill--neutral">{sub.plan_label ?? "—"}</span>
                <span className="dc-fin-pill dc-fin-pill--neutral">{financeSummary.mrr_brl ?? sub.amount_brl ?? "—"}</span>
              </div>
            </div>
          </div>
          <S7Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </S7Button>
        </header>

        {loading ? <p className="dc-fin-drawer__loading">Carregando ficha financeira…</p> : null}
        {error ? <p className="dc-module__error">{error}</p> : null}

        {!loading && !error && detail ? (
          <div className="dc-fin-drawer__scroll">
            {alerts.length > 0 ? (
              <section className="dc-fin-drawer__section dc-fin-drawer__alerts">
                <h4>Alertas operacionais</h4>
                <ul>
                  {alerts.map((msg) => (
                    <li key={String(msg)}>{String(msg)}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="dc-fin-drawer__section">
              <h4>Resumo financeiro</h4>
              <ul className="dc-drawer-kv">
                <li>
                  <span>MRR</span>
                  <strong>{financeSummary.mrr_brl ?? "—"}</strong>
                </li>
                <li>
                  <span>Receita acumulada</span>
                  <strong>{financeSummary.receita_acumulada_brl ?? "—"}</strong>
                </li>
                <li>
                  <span>Receita pendente</span>
                  <strong>{financeSummary.receita_pendente_brl ?? "—"}</strong>
                </li>
                <li>
                  <span>Renovação</span>
                  <strong>{formatFinanceDate(financeSummary.renewal_date)}</strong>
                </li>
              </ul>
            </section>

            <section className="dc-fin-drawer__section">
              <h4>Histórico pagamentos</h4>
              {payments.length === 0 ? (
                <p className="dc-fin-drawer__empty">Sem pagamentos registrados.</p>
              ) : (
                <ul className="dc-fin-drawer__list">
                  {payments.map((p) => (
                    <li key={String(p.id)}>
                      <div>
                        <strong>{formatFinanceWhen(p.paid_at ?? p.created_at)}</strong>
                        <span>
                          {p.amount_cents != null
                            ? (p.amount_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "—"}{" "}
                          · {p.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dc-fin-drawer__section">
              <h4>Usage vs limits</h4>
              <div className="dc-fin-drawer__usage">
                <strong>{formatUsagePercent(usage.percent)}</strong>
                <div className="dc-fin-drawer__usage-bar" aria-hidden>
                  <span style={{ width: `${Math.min(100, usage.percent ?? 0)}%` }} />
                </div>
                <p>
                  {usage.current ?? 0}
                  {usage.limit != null ? ` / ${usage.limit}` : ""} vendas no ciclo
                </p>
              </div>
            </section>

            <section className="dc-fin-drawer__section">
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
                  <span>Churn risk</span>
                  <strong>{observability.churn_risk ? "Sim" : "Não"}</strong>
                </li>
                <li>
                  <span>Grace crítico</span>
                  <strong>{observability.grace_critical ? "Sim" : "Não"}</strong>
                </li>
              </ul>
            </section>

            <section className="dc-fin-drawer__section">
              <h4>Timeline financeira</h4>
              {timeline.length === 0 ? (
                <p className="dc-fin-drawer__empty">Sem eventos.</p>
              ) : (
                <ol className="dc-fin-drawer__timeline">
                  {timeline.map((evt) => (
                    <li key={String(evt.id)}>
                      <span className="dc-fin-drawer__timeline-dot" aria-hidden />
                      <div>
                        <strong>{evt.label}</strong>
                        <time>{formatFinanceWhen(evt.at)}</time>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="dc-fin-drawer__section">
              <h4>Última cobrança</h4>
              <ul className="dc-drawer-kv">
                <li>
                  <span>Data</span>
                  <strong>{formatFinanceWhen(billingSummary.last_payment_at)}</strong>
                </li>
                <li>
                  <span>Valor</span>
                  <strong>{billingSummary.last_payment_amount_brl ?? "—"}</strong>
                </li>
                <li>
                  <span>Método</span>
                  <strong>{billingSummary.payment_method ?? "—"}</strong>
                </li>
              </ul>
            </section>

            <section className="dc-fin-drawer__section dc-fin-drawer__section--future">
              <h4>Ações financeiras</h4>
              <div className="dc-fin-drawer__actions">
                {Object.values(futureActions).map((action) => (
                  <S7Button key={action.label} type="button" variant="secondary" size="sm" disabled title="Fase futura">
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
