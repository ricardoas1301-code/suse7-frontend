import OpsGlobalCustomerSummary from "./OpsGlobalCustomerSummary";
import OpsGlobalOperationalContext from "./OpsGlobalOperationalContext";
import OpsTimeline from "./OpsTimeline";
import OpsEmptyState from "./OpsEmptyState";
import { OPS_DRAWER_EMPTY } from "./opsDrawerEmptyCopy";
import { formatOptionalText } from "./opsPresentation";
import "./ops.css";

const DASH = "—";

/**
 * @param {{ sellers?: unknown }} props
 */
function RelatedSellersList({ sellers }) {
  const rows = Array.isArray(sellers) ? sellers.filter((e) => e && typeof e === "object") : [];

  if (!rows.length) {
    return <OpsEmptyState compact {...OPS_DRAWER_EMPTY.NO_SELLERS} />;
  }

  return (
    <ul className="ops-related-sellers">
      {rows.map((entry, idx) => {
        const e = /** @type {Record<string, unknown>} */ (entry);
        return (
          <li key={`${e.user_id}-${e.external_customer_id}-${idx}`} className="ops-related-sellers__item">
            <strong>{formatOptionalText(e.marketplace ?? "marketplace")}</strong>
            <span>
              Conta:{" "}
              {e.marketplace_account_id ? `${String(e.marketplace_account_id).slice(0, 8)}…` : DASH}
            </span>
            <span>Buyer: {formatOptionalText(e.external_customer_id)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Corpo do drawer global — hierarquia customer → overview → activity → metadata/quality/ingestion.
 * Sem fetch extra; estados vazios derivados do contrato (S_4.7.4).
 * @param {{
 *   contract?: Record<string, unknown> | null;
 *   customer?: Record<string, unknown> | null;
 *   timelineItems?: Array<{ id: string; label: string; at?: string | null; tone?: string }>;
 * }} props
 */
export default function OpsGlobalDrawerBody({ contract = null, customer = null, timelineItems = [] }) {
  const resolvedCustomer =
    customer && typeof customer === "object"
      ? customer
      : contract?.customer && typeof contract.customer === "object"
        ? /** @type {Record<string, unknown>} */ (contract.customer)
        : null;

  const overview =
    contract?.overview && typeof contract.overview === "object"
      ? /** @type {Record<string, unknown>} */ (contract.overview)
      : null;

  const activity =
    contract?.activity && typeof contract.activity === "object"
      ? /** @type {Record<string, unknown>} */ (contract.activity)
      : null;

  return (
    <>
      <OpsGlobalCustomerSummary customer={resolvedCustomer} overview={overview} />

      <section className="ops-drawer-block">
        <h3>Timeline</h3>
        <OpsTimeline items={timelineItems} emptyCopy={OPS_DRAWER_EMPTY.NO_TIMELINE} />
      </section>

      <section className="ops-drawer-block">
        <h3>Saúde operacional (Global)</h3>
        <OpsGlobalOperationalContext contract={contract} />
      </section>

      <section className="ops-drawer-block">
        <h3>Sellers relacionados</h3>
        <RelatedSellersList sellers={activity?.related_sellers ?? resolvedCustomer?.related_sellers} />
      </section>
    </>
  );
}
