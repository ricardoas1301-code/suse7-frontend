// ======================================================
// Topo do Raio-x da venda — título + toolbar (padrão Anúncios).
// ======================================================

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import precificaS7Icon from "../../assets/precifica-s7-icon.png";
import comparativoOfertasS7Icon from "../../assets/comparativo-ofertas-s7-icon.png";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import { DASH } from "./saleRayxFormat";

const COPY_FLASH_MS = 2000;
const COPY_KEY_EXT = "raiox-ext";
const COPY_KEY_SKU = "raiox-sku";

/**
 * @param {{
 *   product?: Record<string, unknown> | null;
 *   general?: Record<string, unknown> | null;
 *   listingId?: string | null;
 *   sku?: string | null;
 *   listingInternalId?: string | null;
 *   onClose?: () => void;
 *   onOpenOfferCompare?: () => void;
 *   placement?: "modal" | "card";
 * }} props
 */
export default function SaleRayXProductHeader({
  product,
  general,
  listingId,
  sku,
  listingInternalId,
  onClose,
  onOpenOfferCompare,
  placement = "modal",
}) {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [copyFlashKey, setCopyFlashKey] = useState(/** @type {string | null} */ (null));

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
  const pricingListingId =
    listingInternalId != null && String(listingInternalId).trim() !== ""
      ? String(listingInternalId).trim()
      : "";
  const showExtCopyOk = copyFlashKey === COPY_KEY_EXT;
  const showSkuCopyOk = copyFlashKey === COPY_KEY_SKU;

  const copyText = useCallback(
    async (text, label, flashKey) => {
      const t = String(text ?? "").trim();
      if (t === "") return;
      const okEvent = flashKey === COPY_KEY_SKU ? "LISTING_SKU_COPIED" : "LISTING_ID_COPIED";
      const failEvent = flashKey === COPY_KEY_SKU ? "LISTING_SKU_COPY_FAILED" : "LISTING_ID_COPY_FAILED";
      try {
        await navigator.clipboard.writeText(t);
        setCopyFlashKey(flashKey);
        window.setTimeout(() => {
          setCopyFlashKey((k) => (k === flashKey ? null : k));
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

  const openPricing = useCallback(() => {
    if (pricingListingId === "") return;
    onClose?.();
    navigate(`/precificacoes/inteligente/${encodeURIComponent(pricingListingId)}`);
  }, [navigate, onClose, pricingListingId]);

  const openCompare = useCallback(() => {
    if (onOpenOfferCompare) {
      onOpenOfferCompare();
      return;
    }
    onClose?.();
    navigate("/anuncios");
  }, [navigate, onClose, onOpenOfferCompare]);

  const rowClass =
    placement === "card"
      ? "anuncios-raiox-compare--spacious vendas-sale-rayx__product-toolbar"
      : "anuncios-raiox-compare--spacious vendas-sale-rayx__toolbar-row";

  return (
    <div className={rowClass} aria-label="Ações do anúncio">
      <div className="anuncios-raiox-compare__toolbar">
          <button
            type="button"
            className="anuncios-raiox-compare__pricing-btn s7-tip s7-tip-bottom s7-tip-left"
            data-tip={pricingListingId !== "" ? "Precificação inteligente" : "Vincule o anúncio para abrir a Precificação Inteligente"}
            aria-label="Abrir precificação inteligente"
            disabled={pricingListingId === ""}
            onClick={(e) => {
              e.stopPropagation();
              openPricing();
            }}
          >
            <img
              src={precificaS7Icon}
              alt=""
              className="anuncios-raiox-compare__pricing-btn-icon"
              loading="lazy"
              decoding="async"
            />
          </button>
          <button
            type="button"
            className="anuncios-raiox-compare__chart-btn anuncios-raiox-compare__chart-btn--icon-only s7-tip s7-tip-bottom s7-tip-left"
            data-tip="Comparativo de ofertas S7"
            aria-label="Abrir Comparativo de ofertas S7"
            onClick={(e) => {
              e.stopPropagation();
              openCompare();
            }}
          >
            <img
              src={comparativoOfertasS7Icon}
              alt=""
              className="anuncios-raiox-compare__chart-btn-icon"
              loading="lazy"
              decoding="async"
            />
          </button>
          <div
            className="anuncios-raiox-compare__toolbar-meta anuncios-raiox-compare__toolbar-meta--with-copy"
            role="group"
            aria-label="Identificadores do anúncio"
          >
            <span className="anuncios-raiox-compare__toolbar-meta-block vendas-sale-rayx__copy-target">
              <span className="anuncios-raiox-compare__toolbar-meta-text">{listingDisplay}</span>
              {listingCopyText !== "" ? (
                <button
                  type="button"
                  className={`products-catalog__copy-btn s7-tip s7-tip-bottom s7-tip-left anuncios-raiox-compare__toolbar-copy${
                    showExtCopyOk ? " products-catalog__copy-btn--ok" : ""
                  }`}
                  data-tip={showExtCopyOk ? "Copiado!" : "Copiar ID do anúncio"}
                  aria-label="Copiar ID do anúncio"
                  onClick={() => {
                    void copyText(listingCopyText, "ID do anúncio", COPY_KEY_EXT);
                  }}
                >
                  {showExtCopyOk ? "✓" : "⧉"}
                </button>
              ) : null}
            </span>
            {listingCopyText !== "" && skuLabel !== "" ? (
              <span className="anuncios-raiox-compare__toolbar-meta-sep" aria-hidden="true">
                |
              </span>
            ) : null}
            {skuLabel !== "" ? (
              <span className="anuncios-raiox-compare__toolbar-meta-block anuncios-raiox-compare__toolbar-meta-block--sku vendas-sale-rayx__copy-target">
                <span className="anuncios-ad-sku-label">SKU</span>
                <span className="anuncios-raiox-compare__toolbar-meta-text">{skuLabel}</span>
                <button
                  type="button"
                  className={`products-catalog__copy-btn s7-tip s7-tip-bottom s7-tip-left anuncios-raiox-compare__toolbar-copy${
                    showSkuCopyOk ? " products-catalog__copy-btn--ok" : ""
                  }`}
                  data-tip={showSkuCopyOk ? "Copiado!" : "Copiar SKU"}
                  aria-label="Copiar SKU"
                  onClick={() => {
                    void copyText(skuLabel, "SKU", COPY_KEY_SKU);
                  }}
                >
                  {showSkuCopyOk ? "✓" : "⧉"}
                </button>
              </span>
            ) : null}
          </div>
      </div>
    </div>
  );
}
