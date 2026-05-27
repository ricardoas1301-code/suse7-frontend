import { memo } from "react";
import {
  formatCurrencyBRL,
  formatSalesSyncDateTime,
  resolveCustomerStatusLabel,
  resolveFinancialStatusLabel,
  resolveMarketplaceLabel,
  salesSyncCustomerStatusClassName,
  salesSyncFinancialStatusClassName,
} from "./salesSyncModel";
import "./SalesSyncResultCard.css";

/**
 * @param {{ sale: import("./salesSyncModel").SalesSyncViewModel }} props
 */
function SalesSyncResultCard({ sale }) {
  const marketplaceLabel = resolveMarketplaceLabel(sale.marketplace, sale.marketplaceLabel);

  return (
    <article className="sales-sync-result-card" data-marketplace={sale.marketplace}>
      <header className="sales-sync-result-card__head">
        <div className="sales-sync-result-card__head-copy">
          <span className="sales-sync-result-card__marketplace">{marketplaceLabel}</span>
          <h5 className="sales-sync-result-card__title">Venda {sale.saleId}</h5>
        </div>
        <span className="sales-sync-result-card__order-status">{sale.orderStatus}</span>
      </header>

      <div className="sales-sync-result-card__body">
        <dl className="sales-sync-result-card__grid">
          <div className="sales-sync-result-card__row">
            <dt>Cliente</dt>
            <dd>{sale.customerName}</dd>
          </div>
          <div className="sales-sync-result-card__row">
            <dt>Produto</dt>
            <dd>{sale.productTitle}</dd>
          </div>
          <div className="sales-sync-result-card__row">
            <dt>Valor bruto</dt>
            <dd>{formatCurrencyBRL(sale.grossAmount)}</dd>
          </div>
          <div className="sales-sync-result-card__row">
            <dt>Valor líquido</dt>
            <dd className="sales-sync-result-card__amount">{formatCurrencyBRL(sale.netAmount)}</dd>
          </div>
          <div className="sales-sync-result-card__row">
            <dt>Status financeiro</dt>
            <dd>
              <span className={salesSyncFinancialStatusClassName(sale.financialStatus)}>
                {resolveFinancialStatusLabel(sale.financialStatus)}
              </span>
            </dd>
          </div>
          <div className="sales-sync-result-card__row">
            <dt>Status cliente</dt>
            <dd>
              <span className={salesSyncCustomerStatusClassName(sale.customerStatus)}>
                {resolveCustomerStatusLabel(sale.customerStatus)}
              </span>
            </dd>
          </div>
          <div className="sales-sync-result-card__row">
            <dt>Último sync</dt>
            <dd>{formatSalesSyncDateTime(sale.lastSyncAt)}</dd>
          </div>
          <div className="sales-sync-result-card__row">
            <dt>Criada em</dt>
            <dd>{formatSalesSyncDateTime(sale.createdAt)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default memo(SalesSyncResultCard);
