import { memo } from "react";
import {
  resolveLinkedListingHealthLabel,
  resolveLinkedListingStatusLabel,
  resolveMarketplaceLabel,
} from "./productsSyncModel";
import "./ProductsSyncLinkedListings.css";

/**
 * @param {{ linkedListings: import("./productsSyncModel").ProductsSyncLinkedListingViewModel[] }} props
 */
function ProductsSyncLinkedListings({ linkedListings }) {
  if (!linkedListings?.length) return null;

  return (
    <section className="products-sync-linked-listings" aria-label="Anúncios vinculados ao produto">
      <header className="products-sync-linked-listings__head">
        <h5 className="products-sync-linked-listings__title">Anúncios vinculados</h5>
        <p className="products-sync-linked-listings__desc">
          Vínculos SKU ↔ anúncio por marketplace e conta.
        </p>
      </header>

      <ul className="products-sync-linked-listings__list">
        {linkedListings.map((item) => {
          const marketplaceLabel = resolveMarketplaceLabel(item.marketplace, item.marketplaceLabel);

          return (
            <li
              key={`${item.listingId}-${item.accountLabel}`}
              className="products-sync-linked-listings__item"
              data-marketplace={item.marketplace}
            >
              <div className="products-sync-linked-listings__item-main">
                <span className="products-sync-linked-listings__listing-id">{item.listingId}</span>
                <span className="products-sync-linked-listings__marketplace">{marketplaceLabel}</span>
              </div>
              <div className="products-sync-linked-listings__item-meta">
                <span className="products-sync-linked-listings__account">{item.accountLabel}</span>
                <span className="products-sync-linked-listings__badge products-sync-linked-listings__badge--status">
                  {resolveLinkedListingStatusLabel(item.status)}
                </span>
                <span
                  className={`products-sync-linked-listings__badge products-sync-linked-listings__badge--health-${item.healthStatus}`}
                >
                  {resolveLinkedListingHealthLabel(item.healthStatus)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default memo(ProductsSyncLinkedListings);
