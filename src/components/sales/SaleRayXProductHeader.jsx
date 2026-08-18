// ======================================================
// Topo do Raio-x da venda — identificadores MLB / SKU.
// ======================================================

import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton";
import { DASH } from "./saleRayxFormat";

/**
 * @param {{
 *   product?: Record<string, unknown> | null;
 *   general?: Record<string, unknown> | null;
 *   listingId?: string | null;
 *   sku?: string | null;
 *   placement?: "modal" | "card";
 * }} props
 */
export default function SaleRayXProductHeader({
  product,
  general,
  listingId,
  sku,
  placement = "modal",
}) {
  const listingCopyText =
    listingId != null && String(listingId).trim() !== ""
      ? String(listingId).trim().replace(/^#/, "")
      : product?.listing_id_display != null && String(product.listing_id_display).trim() !== ""
        ? String(product.listing_id_display).trim().replace(/^#/, "")
        : general?.listing_id_display != null && String(general.listing_id_display).trim() !== ""
          ? String(general.listing_id_display).trim().replace(/^#/, "")
          : "";
  const listingDisplay = listingCopyText !== "" ? listingCopyText : DASH;
  const skuLabel =
    sku != null && String(sku).trim() !== ""
      ? String(sku).trim()
      : product?.sku_display != null && String(product.sku_display).trim() !== ""
        ? String(product.sku_display).trim()
        : general?.sku_display != null && String(general.sku_display).trim() !== ""
          ? String(general.sku_display).trim()
          : "";

  const rowClass =
    placement === "card"
      ? "anuncios-raiox-compare--spacious vendas-sale-rayx__product-toolbar"
      : "anuncios-raiox-compare--spacious vendas-sale-rayx__toolbar-row";

  return (
    <div className={rowClass} aria-label="Identificadores do anúncio">
      <div className="anuncios-raiox-compare__toolbar">
        <div
          className="anuncios-raiox-compare__toolbar-meta anuncios-raiox-compare__toolbar-meta--with-copy"
          role="group"
          aria-label="Identificadores do anúncio"
        >
          <span className="anuncios-raiox-compare__toolbar-meta-block anuncios-raiox-compare__copy-target">
            <span className="anuncios-raiox-compare__toolbar-meta-text">{listingDisplay}</span>
            {listingCopyText !== "" ? (
              <S7CopyButton
                value={listingCopyText}
                ariaLabel="Copiar ID do anúncio"
                tooltipText="Copiar ID do anúncio"
                toastLabel="ID do anúncio"
                showToast={true}
                iconMode="unicode"
                flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                flashKey="raiox-ext"
                toastEventType="LISTING_ID_COPIED"
                toastFailEventType="LISTING_ID_COPY_FAILED"
                toastEntityType="marketplace_listing"
                className="anuncios-raiox-compare__toolbar-copy"
              />
            ) : null}
          </span>
          {listingCopyText !== "" && skuLabel !== "" ? (
            <span className="anuncios-raiox-compare__toolbar-meta-sep" aria-hidden="true">
              |
            </span>
          ) : null}
          {skuLabel !== "" ? (
            <span className="anuncios-raiox-compare__toolbar-meta-block anuncios-raiox-compare__toolbar-meta-block--sku anuncios-raiox-compare__copy-target">
              <span className="anuncios-ad-sku-label">SKU</span>
              <span className="anuncios-raiox-compare__toolbar-meta-text">{skuLabel}</span>
              <S7CopyButton
                value={skuLabel}
                ariaLabel="Copiar SKU"
                tooltipText="Copiar SKU"
                toastLabel="SKU"
                showToast={true}
                iconMode="unicode"
                flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                flashKey="raiox-sku"
                toastEventType="LISTING_SKU_COPIED"
                toastFailEventType="LISTING_SKU_COPY_FAILED"
                toastEntityType="marketplace_listing"
                className="anuncios-raiox-compare__toolbar-copy"
              />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
