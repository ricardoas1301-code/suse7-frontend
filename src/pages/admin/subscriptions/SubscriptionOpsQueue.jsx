import { S7Button } from "../../../components/ui";
import {
  billingStatusClass,
  billingStatusLabel,
  financialHealthClass,
  financialHealthLabel,
  formatSubscriptionDate,
  formatUsagePercent,
} from "./subscriptionOpsUtils";

/**
 * @param {{
 *   subscriptions: import('./subscriptionOpsTypes').SubscriptionListRow[];
 *   onOpen: (row: import('./subscriptionOpsTypes').SubscriptionListRow) => void;
 * }} props
 */
export default function SubscriptionOpsQueue({ subscriptions, onOpen }) {
  return (
    <div className="dc-table-wrap dc-sub-queue">
      <table className="dc-table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Plano</th>
            <th>Status billing</th>
            <th>Health</th>
            <th>Renovação</th>
            <th>Consumo</th>
            <th>Valor mensal</th>
            <th>Método</th>
            <th>Ciclo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.length === 0 ? (
            <tr>
              <td colSpan={10}>Nenhuma assinatura encontrada com os filtros atuais.</td>
            </tr>
          ) : (
            subscriptions.map((r) => (
              <tr key={r.id} className="dc-sub-queue__row">
                <td>
                  <div className="dc-sub-queue__seller">
                    {r.seller_photo_url ? (
                      <img src={r.seller_photo_url} alt="" className="dc-sub-queue__avatar" />
                    ) : (
                      <span className="dc-sub-queue__avatar dc-sub-queue__avatar--placeholder" aria-hidden>
                        {(r.seller_name || "?").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <strong>{r.seller_name}</strong>
                      <span>{r.seller_email}</span>
                    </div>
                  </div>
                </td>
                <td>{r.plan}</td>
                <td>
                  <span className={billingStatusClass(r.billing_status)}>{billingStatusLabel(r.billing_status)}</span>
                </td>
                <td>
                  <span className={financialHealthClass(r.financial_health)}>
                    {financialHealthLabel(r.financial_health)}
                  </span>
                </td>
                <td className="dc-sub-queue__when">{formatSubscriptionDate(r.renewal_date)}</td>
                <td>
                  <div className="dc-sub-queue__usage">
                    <strong>{formatUsagePercent(r.usage_percent)}</strong>
                    {r.usage_limit != null ? (
                      <span>
                        {r.usage_current ?? 0}/{r.usage_limit}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td>{r.amount_brl ?? "—"}</td>
                <td>{r.payment_method ?? "—"}</td>
                <td>{r.billing_cycle ?? "—"}</td>
                <td className="dc-table__actions">
                  <S7Button type="button" variant="secondary" size="sm" onClick={() => onOpen(r)}>
                    Abrir
                  </S7Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** @param {{ rows?: number }} props */
export function SubscriptionOpsQueueSkeleton({ rows = 6 }) {
  return (
    <div className="dc-table-wrap dc-sub-queue dc-sub-queue--loading">
      <table className="dc-table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Plano</th>
            <th>Status billing</th>
            <th>Health</th>
            <th>Renovação</th>
            <th>Consumo</th>
            <th>Valor mensal</th>
            <th>Método</th>
            <th>Ciclo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td colSpan={10}>
                <div className="dc-sub-skeleton" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
