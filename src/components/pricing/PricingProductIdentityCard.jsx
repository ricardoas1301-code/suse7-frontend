// ======================================================
// Card de identidade — página Precificação Inteligente.
// ID + SKU em uma linha (tipografia Raio-X); copiar só no hover de cada trecho.
// ======================================================

import { useState } from "react";
import { getMarketplaceThemeCssVars } from "../../theme/marketplaceTheme.js";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton.jsx";
import S7Icon from "../ui/S7Icon.jsx";

/**
 * @param {{ row: Record<string, unknown>; theme: import("../../theme/marketplaceTheme.js").MarketplaceTheme }} props
 */
export function PricingProductIdentityCard({ row, theme }) {
  const [imgBroken, setImgBroken] = useState(false);

  const cover =
    row?.coverThumbnailUrl != null && String(row.coverThumbnailUrl).trim() !== ""
      ? String(row.coverThumbnailUrl).trim()
      : "";
  const title = row?.adTitle != null && String(row.adTitle).trim() !== "" ? String(row.adTitle).trim() : "—";
  const skuRaw = row?.sku != null && String(row.sku).trim() !== "" ? String(row.sku).trim() : "";
  const listingId =
    row?.externalId != null && String(row.externalId).trim() !== "" ? String(row.externalId).trim() : "";

  const priceLabel =
    row?.price != null && Number.isFinite(Number(row.price))
      ? Number(row.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "—";

  const shellClass = ["anuncios-raiox-shell", "anuncios-raiox-shell--embedded-pricing-page", theme?.shellModifierClass]
    .filter(Boolean)
    .join(" ");

  const hasListingId = listingId !== "";
  const hasSku = skuRaw !== "";
  const showIdSkuLine = hasListingId || hasSku;

  return (
    <div className={shellClass} style={getMarketplaceThemeCssVars(theme)}>
      <div className="anuncios-raiox-shell__frame" aria-hidden />
      <div className="pricing-product-identity__panel-stack">
        <div
          className="anuncios-sell-popover__panel anuncios-sell-popover__panel--in-shell anuncios-sell-popover__panel--pricing-page-product"
          role="region"
          aria-label="Identidade do anúncio"
        >
          <div className="pricing-product-identity__mkt-badge-wrap">
            {theme?.logoSrc != null && String(theme.logoSrc).trim() !== "" ? (
              <div className="anuncios-raiox-shell__badge">
                <img
                  src={String(theme.logoSrc)}
                  alt={theme.logoAlt != null && String(theme.logoAlt).trim() !== "" ? String(theme.logoAlt) : theme.displayName}
                  loading="lazy"
                  decoding="async"
                  className="anuncios-raiox-shell__badge-img"
                />
              </div>
            ) : (
              <div className="anuncios-raiox-shell__badge anuncios-raiox-shell__badge--text">
                <span className="anuncios-raiox-shell__badge-fallback">{theme?.displayName ?? "Marketplace"}</span>
              </div>
            )}
          </div>

          <div className="anuncios-raiox-chart-mini__context pricing-product-identity__context" aria-label="Contexto do anúncio">
            <div className="pricing-product-identity__hero">
              {cover !== "" && !imgBroken ? (
                <img
                  src={cover}
                  alt=""
                  className="pricing-product-identity__hero-img"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => setImgBroken(true)}
                />
              ) : (
                <div className="pricing-product-identity__hero-fallback" aria-hidden>
                  <S7Icon name="image" size={40} strokeWidth={1.35} />
                </div>
              )}
            </div>

            <div className="anuncios-raiox-chart-mini__context-name-row pricing-product-identity__name-row" title={title}>
              <div className="anuncios-raiox-chart-mini__context-name anuncios-raiox-chart-mini__context-name--plain">
                <span className="anuncios-raiox-chart-mini__context-name-text">{title}</span>
              </div>
            </div>

            {showIdSkuLine ? (
              <div
                className="pricing-product-identity__raiox-meta"
                role="group"
                aria-label="Identificadores do anúncio"
              >
                {hasListingId ? (
                  <span className="pricing-product-identity__copy-target">
                    <span className="anuncios-raiox-compare__toolbar-meta-text">{listingId}</span>
                    <S7CopyButton
                      value={listingId}
                      ariaLabel="Copiar ID do anúncio"
                      tooltipText="Copiar ID do anúncio"
                      toastLabel="ID do anúncio"
                      showToast={true}
                      iconMode="unicode"
                      flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                      flashKey="pricing-identity-ext"
                      toastEventType="LISTING_ID_COPIED"
                      toastFailEventType="LISTING_ID_COPY_FAILED"
                      toastEntityType="marketplace_listing"
                      className="anuncios-raiox-compare__toolbar-copy"
                    />
                  </span>
                ) : null}
                {hasListingId && hasSku ? (
                  <span className="anuncios-raiox-compare__toolbar-meta-sep" aria-hidden="true">
                    |
                  </span>
                ) : null}
                {hasSku ? (
                  <span className="pricing-product-identity__copy-target">
                    <span className="anuncios-ad-sku-label">SKU</span>
                    <span className="anuncios-ad-sku-value">{skuRaw}</span>
                    <S7CopyButton
                      value={skuRaw}
                      ariaLabel="Copiar SKU"
                      tooltipText="Copiar SKU"
                      toastLabel="SKU"
                      showToast={true}
                      iconMode="unicode"
                      flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                      flashKey="pricing-identity-sku"
                      toastEventType="LISTING_SKU_COPIED"
                      toastFailEventType="LISTING_SKU_COPY_FAILED"
                      toastEntityType="marketplace_listing"
                      className="anuncios-raiox-compare__toolbar-copy"
                    />
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="pricing-product-identity__price-block">
              <span className="pricing-product-identity__price-label">Preço atual</span>
              <p className="pricing-product-identity__price-value">{priceLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
