import { memo } from "react";
import {
  customersSyncCustomer360StatusClassName,
  customersSyncCustomerStatusClassName,
  formatCurrencyBRL,
  formatCustomersSyncDateTime,
  resolveCustomer360StatusLabel,
  resolveCustomerStatusLabel,
} from "./customersSyncModel";
import "./CustomersSyncResultCard.css";

/**
 * @param {{ customer: import("./customersSyncModel").CustomersSyncViewModel }} props
 */
function CustomersSyncResultCard({ customer }) {
  return (
    <article className="customers-sync-result-card">
      <header className="customers-sync-result-card__head">
        <div className="customers-sync-result-card__head-copy">
          <span className="customers-sync-result-card__id">ID {customer.customerId}</span>
          <h5 className="customers-sync-result-card__title">{customer.customerName}</h5>
        </div>
        <span className={customersSyncCustomerStatusClassName(customer.customerStatus)}>
          {resolveCustomerStatusLabel(customer.customerStatus)}
        </span>
      </header>

      <div className="customers-sync-result-card__body">
        <dl className="customers-sync-result-card__grid">
          <div className="customers-sync-result-card__row">
            <dt>E-mail</dt>
            <dd>{customer.email}</dd>
          </div>
          <div className="customers-sync-result-card__row">
            <dt>Telefone</dt>
            <dd>{customer.phone}</dd>
          </div>
          <div className="customers-sync-result-card__row">
            <dt>Documento</dt>
            <dd>{customer.document}</dd>
          </div>
          <div className="customers-sync-result-card__row">
            <dt>Status Cliente360</dt>
            <dd>
              <span className={customersSyncCustomer360StatusClassName(customer.customer360Status)}>
                {resolveCustomer360StatusLabel(customer.customer360Status)}
              </span>
            </dd>
          </div>
          <div className="customers-sync-result-card__row">
            <dt>Total pedidos</dt>
            <dd>{customer.totalOrders}</dd>
          </div>
          <div className="customers-sync-result-card__row">
            <dt>Valor total gasto</dt>
            <dd>{formatCurrencyBRL(customer.totalSpent)}</dd>
          </div>
          <div className="customers-sync-result-card__row">
            <dt>Marketplaces vinculados</dt>
            <dd>{customer.marketplaceCustomersCount}</dd>
          </div>
          <div className="customers-sync-result-card__row">
            <dt>Primeiro pedido</dt>
            <dd>{formatCustomersSyncDateTime(customer.firstOrderAt)}</dd>
          </div>
          <div className="customers-sync-result-card__row">
            <dt>Último pedido</dt>
            <dd>{formatCustomersSyncDateTime(customer.lastOrderAt)}</dd>
          </div>
          <div className="customers-sync-result-card__row">
            <dt>Último sync Cliente360</dt>
            <dd>{formatCustomersSyncDateTime(customer.lastCustomer360SyncAt)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default memo(CustomersSyncResultCard);
