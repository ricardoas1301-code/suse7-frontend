import { memo } from "react";
import {
  formatCurrencyBRL,
  formatListingsSyncDateTime,
  listingsSyncHealthClassName,
  listingsSyncProductLinkClassName,
  listingsSyncStatusClassName,
  resolveListingHealthLabel,
  resolveListingStatusLabel,
  resolveListingTypeLabel,
  resolveMarketplaceLabel,
  resolveProductLinkStatusLabel,
} from "./listingsSyncModel";
import "./ListingsSyncResultCard.css";

/**
 * @param {{ listing: import("./listingsSyncModel").ListingsSyncViewModel }} props
 */
function ListingsSyncResultCard({ listing }) {
  const marketplaceLabel = resolveMarketplaceLabel(listing.marketplace, listing.marketplaceLabel);

  return (
    <article className="listings-sync-result-card" data-marketplace={listing.marketplace}>
      <header className="listings-sync-result-card__head">
        <div className="listings-sync-result-card__head-copy">
          <span className="listings-sync-result-card__marketplace">{marketplaceLabel}</span>
          <h5 className="listings-sync-result-card__title">{listing.title}</h5>
          <p className="listings-sync-result-card__subtitle">
            {listing.listingId} · SKU {listing.sku}
          </p>
        </div>
        <span className={listingsSyncStatusClassName(listing.status)}>
          {resolveListingStatusLabel(listing.status)}
        </span>
      </header>

      <div className="listings-sync-result-card__body">
        <dl className="listings-sync-result-card__grid">
          <div className="listings-sync-result-card__row">
            <dt>MLB / ID</dt>
            <dd>{listing.listingId}</dd>
          </div>
          <div className="listings-sync-result-card__row">
            <dt>SKU</dt>
            <dd>{listing.sku}</dd>
          </div>
          <div className="listings-sync-result-card__row">
            <dt>Tipo</dt>
            <dd>{resolveListingTypeLabel(listing.listingType)}</dd>
          </div>
          <div className="listings-sync-result-card__row">
            <dt>Preço</dt>
            <dd className="listings-sync-result-card__amount">{formatCurrencyBRL(listing.price)}</dd>
          </div>
          <div className="listings-sync-result-card__row">
            <dt>Estoque</dt>
            <dd>{listing.availableQuantity}</dd>
          </div>
          <div className="listings-sync-result-card__row">
            <dt>Vendas</dt>
            <dd>{listing.soldQuantity}</dd>
          </div>
          <div className="listings-sync-result-card__row">
            <dt>Saúde</dt>
            <dd>
              <span className={listingsSyncHealthClassName(listing.healthStatus)}>
                {resolveListingHealthLabel(listing.healthStatus)} · {listing.healthScore}
              </span>
            </dd>
          </div>
          <div className="listings-sync-result-card__row">
            <dt>Vínculo produto</dt>
            <dd>
              <span className={listingsSyncProductLinkClassName(listing.productLinkStatus)}>
                {resolveProductLinkStatusLabel(listing.productLinkStatus)}
              </span>
            </dd>
          </div>
          <div className="listings-sync-result-card__row">
            <dt>Último sync</dt>
            <dd>{formatListingsSyncDateTime(listing.lastSyncAt)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default memo(ListingsSyncResultCard);
