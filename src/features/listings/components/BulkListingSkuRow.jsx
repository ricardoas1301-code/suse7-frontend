import { useCallback, useEffect } from "react";
import S7Input from "../../../components/ui/S7Input.jsx";
import S7CatalogListingHeadline from "../../../components/catalog/S7CatalogListingHeadline.jsx";
import S7CatalogAccountCell, {
  pickCatalogAccountFields,
  S7CatalogChannelCell,
} from "../../../components/catalog/S7CatalogAccountCell.jsx";
import {
  LISTING_SKU_LOOKUP_SAVE_ACTION_BATCH,
  shouldRejectListingSkuExistingMatch,
} from "../utils/listingSkuLookupDomain.js";
import {
  focusListingSkuInput,
  ListingSkuLookupPanel,
  useListingSkuResolution,
} from "./listingSkuLookupShared.jsx";

/** @param {{ row: Record<string, unknown> }} props */
function BulkListingSkuThumb({ row }) {
  const src = row.image != null && String(row.image).trim() ? String(row.image).trim() : null;
  return (
    <div className="bulk-listing-sku-modal__thumb-cell">
      {src ? (
        <span
          className="bulk-listing-sku-modal__thumb-wrap s7-operational-thumb-frame s7-operational-thumb-frame--circle"
          aria-hidden
        >
          <img
            src={src}
            alt=""
            className="bulk-listing-sku-modal__thumb s7-operational-thumb"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </span>
      ) : (
        <span className="bulk-listing-sku-modal__thumb-slot" aria-hidden />
      )}
    </div>
  );
}

/**
 * @param {{
 *   row: Record<string, unknown>;
 *   skuValue: string;
 *   rowError?: string;
 *   saving: boolean;
 *   onSkuChange: (listingId: string, value: string) => void;
 *   onResolutionChange: (listingId: string, payload: {
 *     isReady: boolean;
 *     trimmedSku: string;
 *     selectedProductId: string;
 *   }) => void;
 * }} props
 */
export default function BulkListingSkuRow({
  row,
  skuValue,
  rowError = "",
  saving,
  onSkuChange,
  onResolutionChange,
}) {
  const listingId = String(row.listing_id ?? "").trim();
  const accountFields = pickCatalogAccountFields(row);
  const listingIdDisplay = String(row.external_listing_id || listingId).trim();
  const listingTitle = String(row.title || "Anúncio sem título").trim() || "Anúncio sem título";

  const resolution = useListingSkuResolution({
    enabled: Boolean(listingId),
    skuInput: skuValue,
    readinessMode: "batch",
  });

  useEffect(() => {
    if (!listingId) return;
    onResolutionChange(listingId, {
      isReady: resolution.isReady,
      trimmedSku: resolution.trimmedSku,
      selectedProductId: resolution.selectedProductId,
    });
  }, [
    listingId,
    onResolutionChange,
    resolution.isReady,
    resolution.trimmedSku,
    resolution.selectedProductId,
  ]);

  const handleToggleProduct = useCallback(
    (productId) => {
      if (
        shouldRejectListingSkuExistingMatch({
          productId,
          selectedProductId: resolution.selectedProductId,
          skuMatchesCount: resolution.skuMatches.length,
        })
      ) {
        onSkuChange(listingId, "");
        focusListingSkuInput(`bulk-listing-sku-${listingId}`);
        return;
      }

      resolution.setSelectedProductId((prev) => (prev === productId ? "" : productId));
    },
    [
      listingId,
      onSkuChange,
      resolution.selectedProductId,
      resolution.skuMatches.length,
      resolution.setSelectedProductId,
    ],
  );

  return (
    <div
      className={[
        "bulk-listing-sku-modal__row-wrap",
        resolution.showLookupPanel ? "bulk-listing-sku-modal__row-wrap--has-resolution" : "",
        resolution.isReady ? "bulk-listing-sku-modal__row-wrap--ready" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <article
        className={[
          "bulk-listing-sku-modal__row",
          "s7-operational-row-card",
          rowError ? "bulk-listing-sku-modal__row--error" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="row"
      >
        <div className="bulk-listing-sku-modal__cell bulk-listing-sku-modal__cell--thumb" role="cell">
          <BulkListingSkuThumb row={row} />
        </div>

        <div className="bulk-listing-sku-modal__cell bulk-listing-sku-modal__cell--listing" role="cell">
          <div
            className="bulk-listing-sku-modal__listing-headline products-catalog__headline-vendas-parity"
            role="presentation"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <S7CatalogListingHeadline
              layout="stacked"
              className="bulk-listing-sku-modal__listing-headline-inner"
              title={listingTitle}
              titleTooltip={listingTitle}
              listingId={listingIdDisplay}
              listingIdCopyValue={listingIdDisplay}
              stopTitlePropagation
              copyListingFlashKey={`bulk-listing-sku-id-${listingId}`}
            />
            {rowError ? <p className="bulk-listing-sku-modal__row-error-msg">{rowError}</p> : null}
          </div>
        </div>

        <div className="bulk-listing-sku-modal__cell bulk-listing-sku-modal__cell--account" role="cell">
          <S7CatalogAccountCell
            compact
            marketplaceAccountId={accountFields.marketplaceAccountId}
            accountAlias={accountFields.accountAlias}
            accountLogoUrl={accountFields.accountLogoUrl}
          />
        </div>

        <div className="bulk-listing-sku-modal__cell bulk-listing-sku-modal__cell--channel" role="cell">
          <S7CatalogChannelCell
            marketplace={row.marketplace ?? row.canal ?? null}
            marketplaceLabel={null}
          />
        </div>

        <div className="bulk-listing-sku-modal__cell bulk-listing-sku-modal__cell--sku" role="cell">
          <S7Input
            label=""
            name={`bulk-listing-sku-${listingId}`}
            value={skuValue}
            onChange={(event) => onSkuChange(listingId, event.target.value)}
            placeholder="Informe o SKU"
            disabled={saving}
            autoComplete="off"
          />
        </div>
      </article>

      {resolution.showLookupPanel ? (
        <div className="bulk-listing-sku-modal__row-resolution">
          <ListingSkuLookupPanel
            trimmedSku={resolution.trimmedSku}
            lookupLoading={resolution.lookupLoading}
            lookupError={resolution.lookupError}
            skuMatches={resolution.skuMatches}
            selectedProductId={resolution.selectedProductId}
            onToggleProduct={handleToggleProduct}
            disabled={saving}
            compact
            copyFlashKeyPrefix={`bulk-listing-sku-${listingId}`}
            notFoundSaveActionLabel={LISTING_SKU_LOOKUP_SAVE_ACTION_BATCH}
          />
        </div>
      ) : null}
    </div>
  );
}
