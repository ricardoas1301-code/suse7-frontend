// ======================================================
// Card de identidade — página Precificação Inteligente.
// ID + SKU em uma linha (tipografia Raio-X); copiar só no hover de cada trecho.
// ======================================================

import { useCallback, useState } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import { getMarketplaceThemeCssVars } from "../../theme/marketplaceTheme.js";
import S7Icon from "../ui/S7Icon.jsx";

const COPY_FLASH_MS = 2000;
const COPY_KEY_EXT = "ext";
const COPY_KEY_SKU = "sku";

/**
 * @param {{ row: Record<string, unknown>; theme: import("../../theme/marketplaceTheme.js").MarketplaceTheme }} props
 */
export function PricingProductIdentityCard({ row, theme }) {
  const { addNotification } = useNotifications();
  const [imgBroken, setImgBroken] = useState(false);
  const [copyFlash, setCopyFlash] = useState(/** @type {string | null} */ (null));

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

  const flashExt = copyFlash === COPY_KEY_EXT;
  const flashSku = copyFlash === COPY_KEY_SKU;
  const hasListingId = listingId !== "";
  const hasSku = skuRaw !== "";
  const showIdSkuLine = hasListingId || hasSku;

  const copyText = useCallback(
    async (text, label, flashKey) => {
      const t = String(text ?? "").trim();
      if (t === "") return;
      const okEvent = flashKey === COPY_KEY_SKU ? "LISTING_SKU_COPIED" : "LISTING_ID_COPIED";
      const failEvent = flashKey === COPY_KEY_SKU ? "LISTING_SKU_COPY_FAILED" : "LISTING_ID_COPY_FAILED";
      try {
        await navigator.clipboard.writeText(t);
        setCopyFlash(flashKey);
        window.setTimeout(() => {
          setCopyFlash((k) => (k === flashKey ? null : k));
        }, COPY_FLASH_MS);
        addNotification({
          event_type: okEvent,
          entity_type: "marketplace_listing",
          title: `${label} copiado`,
          message: `${t} foi copiado para a área de transferência.`,
          severity: NOTIFICATION_SEVERITY.INFO,
        });
      } catch {
        addNotification({
          event_type: failEvent,
          entity_type: "marketplace_listing",
          title: "Não foi possível copiar",
          message: "Verifique permissões do navegador ou use HTTPS.",
          severity: NOTIFICATION_SEVERITY.WARNING,
        });
      }
    },
    [addNotification],
  );

  return (
    <div className={shellClass} style={getMarketplaceThemeCssVars(theme)}>
      <div className="anuncios-raiox-shell__frame" aria-hidden />
      <div className="pricing-product-identity__panel-stack">
        {theme?.logoSrc != null && String(theme.logoSrc).trim() !== "" ? (
          <div className="anuncios-raiox-shell__badge pricing-product-identity__badge-overlap">
            <img
              src={String(theme.logoSrc)}
              alt={theme.logoAlt != null && String(theme.logoAlt).trim() !== "" ? String(theme.logoAlt) : theme.displayName}
              loading="lazy"
              decoding="async"
              className="anuncios-raiox-shell__badge-img"
            />
          </div>
        ) : (
          <div className="anuncios-raiox-shell__badge anuncios-raiox-shell__badge--text pricing-product-identity__badge-overlap">
            <span className="anuncios-raiox-shell__badge-fallback">{theme?.displayName ?? "Marketplace"}</span>
          </div>
        )}

        <div
          className="anuncios-sell-popover__panel anuncios-sell-popover__panel--in-shell anuncios-sell-popover__panel--pricing-page-product"
          role="region"
          aria-label="Identidade do anúncio"
        >
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
                    <button
                      type="button"
                      className={`products-catalog__copy-btn s7-tip s7-tip-bottom s7-tip-left anuncios-raiox-compare__toolbar-copy${
                        flashExt ? " products-catalog__copy-btn--ok" : ""
                      }`}
                      data-tip={flashExt ? "Copiado!" : "Copiar ID do anúncio"}
                      aria-label="Copiar ID do anúncio"
                      onClick={() => void copyText(listingId, "ID do anúncio", COPY_KEY_EXT)}
                    >
                      {flashExt ? "✓" : "⧉"}
                    </button>
                  </span>
                ) : null}
                {hasListingId && hasSku ? (
                  <span className="anuncios-raiox-compare__toolbar-meta-sep" aria-hidden="true">
                    |
                  </span>
                ) : null}
                {hasSku ? (
                  <span className="pricing-product-identity__copy-target">
                    <span className="anuncios-raiox-compare__toolbar-meta-sku-prefix">SKU</span>
                    <span className="anuncios-raiox-compare__toolbar-meta-text">{skuRaw}</span>
                    <button
                      type="button"
                      className={`products-catalog__copy-btn s7-tip s7-tip-bottom s7-tip-left anuncios-raiox-compare__toolbar-copy${
                        flashSku ? " products-catalog__copy-btn--ok" : ""
                      }`}
                      data-tip={flashSku ? "Copiado!" : "Copiar SKU"}
                      aria-label="Copiar SKU"
                      onClick={() => void copyText(skuRaw, "SKU", COPY_KEY_SKU)}
                    >
                      {flashSku ? "✓" : "⧉"}
                    </button>
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
