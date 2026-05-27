import { memo } from "react";
import {
  formatProductsSyncDateTime,
  productsSyncListingLinkStatusClassName,
  productsSyncProductStatusClassName,
  resolveListingLinkStatusLabel,
  resolveProductStatusLabel,
} from "./productsSyncModel";
import "./ProductsSyncResultCard.css";

/**
 * @param {{ product: import("./productsSyncModel").ProductsSyncViewModel }} props
 */
function ProductsSyncResultCard({ product }) {
  return (
    <article className="products-sync-result-card">
      <header className="products-sync-result-card__head">
        <div className="products-sync-result-card__head-copy">
          <span className="products-sync-result-card__sku">SKU {product.sku}</span>
          <h5 className="products-sync-result-card__title">{product.title}</h5>
        </div>
        <span className={productsSyncProductStatusClassName(product.productStatus)}>
          {resolveProductStatusLabel(product.productStatus)}
        </span>
      </header>

      <div className="products-sync-result-card__body">
        <dl className="products-sync-result-card__grid">
          <div className="products-sync-result-card__row">
            <dt>Anúncios vinculados</dt>
            <dd>{product.linkedListingsCount}</dd>
          </div>
          <div className="products-sync-result-card__row">
            <dt>Marketplaces</dt>
            <dd>{product.marketplacesCount}</dd>
          </div>
          <div className="products-sync-result-card__row">
            <dt>Contas marketplace</dt>
            <dd>{product.marketplaceAccountsCount}</dd>
          </div>
          <div className="products-sync-result-card__row">
            <dt>Status vínculo</dt>
            <dd>
              <span className={productsSyncListingLinkStatusClassName(product.listingLinkStatus)}>
                {resolveListingLinkStatusLabel(product.listingLinkStatus)}
              </span>
            </dd>
          </div>
          <div className="products-sync-result-card__row">
            <dt>Último sync vínculo</dt>
            <dd>{formatProductsSyncDateTime(product.lastLinkSyncAt)}</dd>
          </div>
          <div className="products-sync-result-card__row">
            <dt>Atualizado em</dt>
            <dd>{formatProductsSyncDateTime(product.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default memo(ProductsSyncResultCard);
