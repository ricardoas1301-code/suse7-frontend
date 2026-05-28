// ======================================================
// Modal Comparativo de Ofertas S7 (gráfico) — compartilhado Anúncios + Vendas.
// ======================================================

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import precificaS7Icon from "../../assets/precifica-s7-icon.png";
import { MercadoLivrePricingScenarioCompareChart } from "../MercadoLivrePricingScenarioCompareChart.jsx";
import "../Anuncios.css";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton.jsx";
import S7Icon from "../ui/S7Icon";
import { computeRaioxChartMiniDialogWidthPx } from "../../features/listings/utils/raioxCatalogLayout.js";
import { DASH } from "../sales/saleRayxFormat.js";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   scenarios: unknown[];
 *   listingTitle?: string | null;
 *   thumbnailUrl?: string | null;
 *   listingIdDisplay?: string | null;
 *   listingIdCopyText?: string | null;
 *   skuLabel?: string | null;
 *   skuCopyText?: string | null;
 *   onOpenPricing?: () => void;
 *   stackAboveSaleRayx?: boolean;
 *   layerRef?: import("react").RefObject<HTMLDivElement | null>;
 * }} props
 */
export default function RaioxOfferComparisonChartModal({
  open,
  onClose,
  scenarios,
  listingTitle = null,
  thumbnailUrl = null,
  listingIdDisplay = null,
  listingIdCopyText = null,
  skuLabel = null,
  skuCopyText = null,
  onOpenPricing,
  stackAboveSaleRayx = false,
  layerRef = null,
}) {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 390,
  );

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const scenarioList = Array.isArray(scenarios) ? scenarios : [];
  const dialogWidthPx = useMemo(
    () => computeRaioxChartMiniDialogWidthPx(scenarioList.length, viewportWidth),
    [scenarioList.length, viewportWidth],
  );

  const listingDisplay =
    listingIdDisplay != null && String(listingIdDisplay).trim() !== ""
      ? String(listingIdDisplay).trim()
      : listingIdCopyText != null && String(listingIdCopyText).trim() !== ""
        ? String(listingIdCopyText).trim()
        : DASH;
  const listingCopy =
    listingIdCopyText != null && String(listingIdCopyText).trim() !== ""
      ? String(listingIdCopyText).trim().replace(/^#/, "")
      : listingDisplay !== DASH
        ? String(listingDisplay).replace(/^#/, "")
        : "";
  const skuText = skuLabel != null && String(skuLabel).trim() !== "" ? String(skuLabel).trim() : "";
  const skuCopy = skuCopyText != null && String(skuCopyText).trim() !== "" ? String(skuCopyText).trim() : skuText;
  const titleText = listingTitle != null ? String(listingTitle).trim() : "";
  const thumb = thumbnailUrl != null ? String(thumbnailUrl).trim() : "";

  if (!open || scenarioList.length === 0 || typeof document === "undefined") return null;

  const layerClass = [
    "anuncios-raiox-chart-mini-layer",
    stackAboveSaleRayx ? "anuncios-raiox-chart-mini-layer--above-sale-rayx" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      ref={layerRef}
      className={layerClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="anuncios-raiox-chart-mini-title"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="anuncios-raiox-chart-mini__backdrop"
        aria-hidden
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <div
        className="anuncios-raiox-chart-mini__dialog"
        style={{
          ["--s7-raiox-chart-mini-dialog-width"]: `${dialogWidthPx}px`,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="anuncios-compare-modal__head-row">
          <h4
            id="anuncios-raiox-chart-mini-title"
            className="anuncios-raiox-chart-mini__title s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available"
          >
            Comparativo de ofertas S7
          </h4>
          <button
            type="button"
            className="anuncios-compare-modal__close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Fechar"
          >
            <S7Icon name="close" size={18} strokeWidth={2} />
          </button>
        </div>
        <div
          className="anuncios-raiox-chart-mini__context"
          aria-label="Contexto do anúncio"
          onClick={(e) => e.stopPropagation()}
        >
          {titleText !== "" ? (
            <div className="anuncios-raiox-chart-mini__context-name-row" title={titleText}>
              {thumb !== "" ? (
                <img
                  src={thumb}
                  alt=""
                  className="anuncios-raiox-chart-mini__context-name-thumb"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.remove();
                  }}
                />
              ) : null}
              <div className="anuncios-raiox-chart-mini__context-name anuncios-raiox-chart-mini__context-name--plain">
                <span className="anuncios-raiox-chart-mini__context-name-text">{titleText}</span>
              </div>
            </div>
          ) : null}
          <div className="anuncios-raiox-chart-mini__context-row">
            {onOpenPricing ? (
              <button
                type="button"
                className="anuncios-raiox-chart-mini__context-pricing s7-tip s7-tip-bottom s7-tip-left"
                data-tip="Precificação inteligente"
                aria-label="Abrir precificação inteligente"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPricing();
                }}
              >
                <img
                  src={precificaS7Icon}
                  alt=""
                  className="anuncios-raiox-chart-mini__context-pricing-icon"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ) : null}
            <span className="anuncios-raiox-chart-mini__context-meta">
              <span className="anuncios-raiox-chart-mini__context-meta-value">{listingDisplay}</span>
              {listingCopy !== "" ? (
                <S7CopyButton
                  value={listingCopy}
                  ariaLabel="Copiar ID do anúncio"
                  tooltipText="Copiar ID do anúncio"
                  toastLabel="ID do anúncio"
                  showToast={true}
                  iconMode="unicode"
                  flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                  flashKey="raiox-chart-ext"
                  toastEventType="LISTING_ID_COPIED"
                  toastFailEventType="LISTING_ID_COPY_FAILED"
                  toastEntityType="marketplace_listing"
                  className="anuncios-raiox-chart-mini__context-copy"
                />
              ) : null}
            </span>
            {skuText !== "" ? (
              <>
                <span className="anuncios-raiox-chart-mini__context-sep" aria-hidden="true">
                  |
                </span>
                <span className="anuncios-raiox-chart-mini__context-meta anuncios-raiox-chart-mini__context-meta--sku">
                  <span className="anuncios-ad-sku-label">SKU</span>
                  <span className="anuncios-raiox-chart-mini__context-meta-value">{skuText}</span>
                  {skuCopy !== "" ? (
                    <S7CopyButton
                      value={skuCopy}
                      ariaLabel="Copiar SKU"
                      tooltipText="Copiar SKU"
                      toastLabel="SKU"
                      showToast={true}
                      iconMode="unicode"
                      flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                      flashKey="raiox-chart-sku"
                      toastEventType="LISTING_SKU_COPIED"
                      toastFailEventType="LISTING_SKU_COPY_FAILED"
                      toastEntityType="marketplace_listing"
                      className="anuncios-raiox-chart-mini__context-copy"
                    />
                  ) : null}
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className="anuncios-raiox-chart-mini__body">
          <MercadoLivrePricingScenarioCompareChart scenarios={scenarioList} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
