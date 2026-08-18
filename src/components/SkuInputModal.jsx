// ======================================================================
// Modal: informar SKU (ML sem SKU) ou confirmar vínculo quando SKU já existe.
// Backend: POST /api/ml/listings/set-sku — fonte de verdade no servidor.
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import S7Button from "./ui/S7Button.jsx";
import S7Input from "./ui/S7Input";
import S7Icon from "./ui/S7Icon";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "./ui/S7CopyButton";
import { saveListingSkusBatch } from "../features/listings/api/listingSkuApi.js";
import { requestOpenBulkListingSkus } from "../features/dashboard/operationalTasks/operationalTaskActionRequests.js";
import { refreshOperationalTasksAfterListingSkuSaved } from "../features/dashboard/operationalTasks/refreshOperationalTasksAfterListingSkuSaved.js";
import {
  focusListingSkuInput,
  ListingSkuLookupPanel,
  SkuLookupProductItem,
  useListingSkuResolution,
} from "../features/listings/components/listingSkuLookupShared.jsx";
import { shouldRejectListingSkuExistingMatch } from "../features/listings/utils/listingSkuLookupDomain.js";
import "../features/listings/components/listingSkuLookupPanel.css";
import "../styles/tokens/s7-operational-thumb.css";
import "./SkuInputModal.css";

/**
 * @param {unknown} data — corpo JSON da API em erro
 * @param {string} fallback
 */
function formatSetSkuApiError(data, fallback) {
  const d = data && typeof data === "object" ? /** @type {Record<string, unknown>} */ (data) : {};
  const base =
    typeof d.error === "string"
      ? d.error
      : typeof d.message === "string"
        ? d.message
        : fallback;
  const pl = d.product_link && typeof d.product_link === "object" ? /** @type {Record<string, unknown>} */ (d.product_link) : null;
  const errs = pl != null && Array.isArray(pl.errors) ? pl.errors : [];
  if (errs.length > 0) {
    const e0 = errs[0] && typeof errs[0] === "object" ? /** @type {Record<string, unknown>} */ (errs[0]) : {};
    const detail =
      typeof e0.error === "object" &&
      e0.error !== null &&
      typeof /** @type {{ message?: string }} */ (e0.error).message === "string"
        ? String(/** @type {{ message?: string }} */ (e0.error).message)
        : typeof e0.message === "string"
          ? String(e0.message)
          : "";
    if (detail) return `${base} (${detail})`;
  }
  return base;
}

/**
 * @param {{
 *   open: boolean;
 *   listingId: string | null;
 *   listingTitle: string;
 *   externalListingId?: string | null;
 *   listingImageUrl?: string | null;
 *   knownSku?: string | null;
 *   requireExistingProductConfirm?: boolean;
 *   onClose: () => void;
 *   onSaved: () => void | Promise<void>;
 * }} props
 */
export default function SkuInputModal({
  open,
  listingId,
  listingTitle,
  externalListingId = null,
  listingImageUrl = null,
  knownSku = null,
  onClose,
  onSaved,
}) {
  const [sku, setSku] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const trimmedKnown = knownSku != null && String(knownSku).trim() !== "" ? String(knownSku).trim() : "";

  const resolution = useListingSkuResolution({
    enabled: open && Boolean(listingId),
    skuInput: sku,
    readinessMode: "individual",
  });

  useEffect(() => {
    if (open) {
      // Reset transacional ao trocar o anúncio exibido.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSku(trimmedKnown);
      setError("");
      setLoading(false);
    }
  }, [open, listingId, trimmedKnown]);

  const handleToggleProduct = useCallback(
    (productId) => {
      if (
        shouldRejectListingSkuExistingMatch({
          productId,
          selectedProductId: resolution.selectedProductId,
          skuMatchesCount: resolution.skuMatches.length,
        })
      ) {
        setSku("");
        setError("");
        focusListingSkuInput("anuncios-sku-modal-input");
        return;
      }

      resolution.setSelectedProductId((prev) => (prev === productId ? "" : productId));
    },
    [
      resolution.selectedProductId,
      resolution.skuMatches.length,
      resolution.setSelectedProductId,
    ],
  );

  const handleConfirm = useCallback(() => {
    if (!listingId || loading) return;
    const trimmed = resolution.trimmedSku;
    if (!trimmed) {
      setError("Informe o SKU.");
      return;
    }
    if (resolution.skuMatches.length > 1 && !resolution.selectedProductId) {
      setError("Selecione e confirme o produto encontrado para este SKU.");
      return;
    }

    void (async () => {
      setLoading(true);
      setError("");
      const res = await saveListingSkusBatch({
        items: [{
          listing_id: listingId,
          sku: trimmed,
          ...(resolution.selectedProductId
            ? { selected_product_id: resolution.selectedProductId }
            : {}),
        }],
      });
      setLoading(false);
      const rowResult = Array.isArray(res.results)
        ? res.results.find((item) => String(item?.listing_id ?? "") === String(listingId))
        : null;
      if (!res.ok || Number(res.total_updated) < 1 || rowResult?.ok === false) {
        setError(
          rowResult?.message ||
            formatSetSkuApiError(
              res,
              typeof res.error === "string" ? res.error : "Não foi possível concluir o vínculo.",
            ),
        );
        return;
      }
      onClose();
      await refreshOperationalTasksAfterListingSkuSaved();
      await Promise.resolve(onSaved?.());
    })();
  }, [
    listingId,
    loading,
    resolution.trimmedSku,
    resolution.skuMatches.length,
    resolution.selectedProductId,
    onClose,
    onSaved,
  ]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !listingId) return null;

  const title = String(listingTitle || "").trim() || "Anúncio sem título";
  const listingIdDisplay = String(externalListingId || listingId).trim();
  const listingCopyFlashKey = `sku-input-listing-id-${listingId}`;

  const modal = (
    <div className="sku-input-modal__overlay" role="presentation" onMouseDown={() => !loading && onClose()}>
      <section
        className="sku-input-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sku-input-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sku-input-modal__header">
          <h3 id="sku-input-modal-title" className="sku-input-modal__title">Cadastrar SKU do produto</h3>
          <S7Button
            type="button"
            variant="warning"
            size="sm"
            className="sku-input-modal__bulk-btn vendas-page__complete-product-btn"
            disabled={loading}
            onClick={() => {
              requestOpenBulkListingSkus();
              onClose();
            }}
          >
            Cadastrar SKUs em lote
          </S7Button>
        </header>

        <div className="sku-input-modal__identity-card">
          <div className="sku-input-modal__product">
            {listingImageUrl ? (
              <div className="sku-input-modal__thumb-wrap s7-operational-thumb-frame s7-operational-thumb-frame--circle">
                <img
                  src={listingImageUrl}
                  alt=""
                  className="sku-input-modal__thumb s7-operational-thumb"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : (
              <div
                className="sku-input-modal__thumb-wrap sku-input-modal__thumb--placeholder s7-operational-thumb-frame s7-operational-thumb-frame--circle"
                aria-hidden
              >
                <S7Icon name="image" size={24} />
              </div>
            )}
            <div className="sku-input-modal__identity-text">
              <p className="sku-input-modal__name" title={title}>
                {title}
              </p>
              <div
                className="s7-copy-group sku-input-modal__listing-id-row"
                role="presentation"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <span className="anuncios-ad-sku-value">{listingIdDisplay}</span>
                {listingIdDisplay ? (
                  <S7CopyButton
                    value={listingIdDisplay}
                    ariaLabel={`Copiar anúncio ${listingIdDisplay}`}
                    tooltipText="Copiar número do anúncio"
                    toastLabel="Anúncio"
                    showToast
                    iconMode="unicode"
                    flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                    flashKey={listingCopyFlashKey}
                    toastEventType="LISTING_SKU_COPIED"
                    toastFailEventType="LISTING_SKU_COPY_FAILED"
                    toastEntityType="listing"
                    className="sku-input-modal__listing-copy"
                  />
                ) : null}
              </div>
              <div className="s7-copy-group sku-input-modal__sku-row">
                <span className="anuncios-ad-sku-label">SKU</span>
                <span className="anuncios-ad-sku-value">{trimmedKnown || "não informado"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sku-input-modal__body">
          <div className="sku-input-modal__input-col">
            <S7Input
              name="anuncios-sku-modal-input"
              id="anuncios-sku-modal-input"
              label="SKU do produto *"
              value={sku}
              onChange={(e) => {
                setSku(e.target.value);
                setError("");
              }}
              placeholder="Ex.: ABC-123"
              disabled={loading}
              autoComplete="off"
            />
            {error ? <p className="sku-input-modal__error" role="alert">{error}</p> : null}
            <ListingSkuLookupPanel
              trimmedSku={resolution.trimmedSku}
              lookupLoading={resolution.lookupLoading}
              lookupError={resolution.lookupError}
              skuMatches={resolution.skuMatches}
              selectedProductId={resolution.selectedProductId}
              onToggleProduct={handleToggleProduct}
              disabled={loading}
              copyFlashKeyPrefix="sku-input-modal"
            />
          </div>
        </div>

        <footer className="sku-input-modal__actions">
          <button type="button" className="sku-input-modal__save" onClick={handleConfirm} disabled={!resolution.isReady || loading}>
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </footer>
      </section>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
}

// Reexport para compatibilidade de testes/imports legados internos.
export { SkuLookupProductItem };
