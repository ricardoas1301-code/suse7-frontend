import { memo } from "react";
import {
  formatCurrencyBRL,
  formatCustomersSyncDateTime,
  resolveMarketplaceLabel,
} from "./customersSyncModel";
import "./CustomersSyncRecentSales.css";

/**
 * @param {{ recentSales: import("./customersSyncModel").CustomersSyncRecentSaleViewModel[] }} props
 */
function CustomersSyncRecentSales({ recentSales }) {
  if (!recentSales?.length) return null;

  return (
    <section className="customers-sync-recent-sales" aria-label="Vendas recentes do cliente">
      <header className="customers-sync-recent-sales__head">
        <h5 className="customers-sync-recent-sales__title">Vendas recentes</h5>
        <p className="customers-sync-recent-sales__desc">Últimas compras registradas para este cliente.</p>
      </header>

      <ul className="customers-sync-recent-sales__list">
        {recentSales.map((sale) => (
          <li key={sale.saleId} className="customers-sync-recent-sales__item" data-marketplace={sale.marketplace}>
            <div className="customers-sync-recent-sales__item-main">
              <span className="customers-sync-recent-sales__sale-id">{sale.saleId}</span>
              <span className="customers-sync-recent-sales__marketplace">
                {resolveMarketplaceLabel(sale.marketplace)}
              </span>
            </div>
            <div className="customers-sync-recent-sales__item-meta">
              <span className="customers-sync-recent-sales__amount">{formatCurrencyBRL(sale.grossAmount)}</span>
              <span className="customers-sync-recent-sales__date">
                {formatCustomersSyncDateTime(sale.createdAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default memo(CustomersSyncRecentSales);
