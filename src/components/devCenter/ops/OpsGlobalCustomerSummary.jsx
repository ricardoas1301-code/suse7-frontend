import OpsEmptyState from "./OpsEmptyState";
import { OPS_DRAWER_EMPTY } from "./opsDrawerEmptyCopy";
import { formatOptionalCount, formatOptionalMasked, formatOptionalMoney } from "./opsPresentation";
import "./ops.css";

/**
 * Resumo do cliente global — prioridade customer + overview (S_4.7.4).
 * @param {{
 *   customer?: Record<string, unknown> | null;
 *   overview?: Record<string, unknown> | null;
 * }} props
 */
export default function OpsGlobalCustomerSummary({ customer = null, overview = null }) {
  const source = customer && typeof customer === "object" ? customer : null;
  const ov = overview && typeof overview === "object" ? overview : null;

  const hasIdentity =
    Boolean(String(source?.name ?? "").trim()) ||
    Boolean(String(source?.document_masked ?? source?.document ?? "").trim()) ||
    Boolean(String(source?.email_masked ?? source?.email ?? "").trim());

  const hasMetrics =
    (source?.total_orders_global != null && source?.total_orders_global !== "") ||
    (source?.total_spent_global != null && source?.total_spent_global !== "") ||
    (source?.total_sellers_related != null && source?.total_sellers_related !== "") ||
    (ov?.total_orders_global != null && ov?.total_orders_global !== "") ||
    (ov?.total_spent_global != null && ov?.total_spent_global !== "") ||
    (ov?.total_sellers_related != null && ov?.total_sellers_related !== "");

  if (!hasIdentity && !hasMetrics) {
    return (
      <section className="ops-drawer-block">
        <h3>Resumo</h3>
        <OpsEmptyState compact {...OPS_DRAWER_EMPTY.NO_CUSTOMER} />
      </section>
    );
  }

  const orders = source?.total_orders_global ?? ov?.total_orders_global;
  const spent = source?.total_spent_global ?? ov?.total_spent_global;
  const sellers = source?.total_sellers_related ?? ov?.total_sellers_related;

  return (
    <section className="ops-drawer-block">
      <h3>Resumo</h3>
      <dl className="ops-kv">
        <div>
          <dt>Documento</dt>
          <dd>{formatOptionalMasked(source?.document_masked ?? source?.document)}</dd>
        </div>
        <div>
          <dt>E-mail</dt>
          <dd>{formatOptionalMasked(source?.email_masked ?? source?.email)}</dd>
        </div>
        <div>
          <dt>Telefone</dt>
          <dd>{formatOptionalMasked(source?.phone_masked ?? source?.phone)}</dd>
        </div>
        <div>
          <dt>Pedidos global</dt>
          <dd>{formatOptionalCount(orders)}</dd>
        </div>
        <div>
          <dt>Total gasto</dt>
          <dd>{formatOptionalMoney(spent)}</dd>
        </div>
        <div>
          <dt>Sellers relacionados</dt>
          <dd>{formatOptionalCount(sellers)}</dd>
        </div>
      </dl>
    </section>
  );
}
