import { S7Button } from "../../../components/ui";
import {
  financialHealthClass,
  financialHealthLabel,
  formatFinanceDate,
  formatFinanceWhen,
  formatUsagePercent,
  paymentStatusClass,
  paymentStatusLabel,
} from "./financeOpsUtils";

/**
 * @param {{
 *   rows: import('./financeOpsTypes').FinanceListRow[];
 *   onOpen: (row: import('./financeOpsTypes').FinanceListRow) => void;
 * }} props
 */
export default function FinanceOpsQueue({ rows, onOpen }) {
  return (
    <div className="dc-table-wrap dc-fin-queue">
      <table className="dc-table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Plano</th>
            <th>MRR</th>
            <th>Status pagamento</th>
            <th>Health</th>
            <th>Renovação</th>
            <th>Consumo</th>
            <th>Método</th>
            <th>Última cobrança</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={10}>Nenhum registro financeiro encontrado.</td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="dc-fin-queue__row">
                <td>
                  <div className="dc-fin-queue__seller">
                    {r.seller_photo_url ? (
                      <img src={r.seller_photo_url} alt="" className="dc-fin-queue__avatar" />
                    ) : (
                      <span className="dc-fin-queue__avatar dc-fin-queue__avatar--placeholder" aria-hidden>
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
                <td>{r.mrr_brl ?? "—"}</td>
                <td>
                  <span className={paymentStatusClass(r.payment_status)}>{paymentStatusLabel(r.payment_status)}</span>
                </td>
                <td>
                  <span className={financialHealthClass(r.financial_health)}>{financialHealthLabel(r.financial_health)}</span>
                </td>
                <td>{formatFinanceDate(r.renewal_date)}</td>
                <td>{formatUsagePercent(r.usage_percent)}</td>
                <td>{r.payment_method ?? "—"}</td>
                <td className="dc-fin-queue__when">
                  <strong>{r.last_charge_brl ?? "—"}</strong>
                  <span>{formatFinanceWhen(r.last_charge_at)}</span>
                </td>
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
export function FinanceOpsQueueSkeleton({ rows = 6 }) {
  return (
    <div className="dc-table-wrap dc-fin-queue dc-fin-queue--loading">
      <table className="dc-table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Plano</th>
            <th>MRR</th>
            <th>Status pagamento</th>
            <th>Health</th>
            <th>Renovação</th>
            <th>Consumo</th>
            <th>Método</th>
            <th>Última cobrança</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td colSpan={10}>
                <div className="dc-fin-skeleton" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
