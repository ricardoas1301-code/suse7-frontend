import { useEffect, useMemo, useRef, useState } from "react";
import S7Icon from "../../../components/ui/S7Icon.jsx";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../../../components/ui/S7CopyButton.jsx";
import { useProductMainImageSrc } from "../../../utils/productImageDisplayUrl.js";
import {
  LISTING_SKU_LOOKUP_DEBOUNCE_MS,
  LISTING_SKU_LOOKUP_MSG_SEARCHING,
  LISTING_SKU_LOOKUP_SAVE_ACTION_INDIVIDUAL,
  buildListingSkuLookupNotFoundMessage,
  evaluateListingSkuIndividualConfirmReady,
  evaluateListingSkuRowReady,
  normalizeListingSkuInput,
} from "../utils/listingSkuLookupDomain.js";
import { fetchListingSkuLookup } from "../utils/listingSkuLookup.js";
import "./listingSkuLookupPanel.css";

/**
 * @param {string} inputElementId
 */
export function focusListingSkuInput(inputElementId) {
  requestAnimationFrame(() => {
    const input = document.getElementById(inputElementId);
    if (input instanceof HTMLInputElement && !input.disabled) {
      input.focus({ preventScroll: true });
    }
  });
}

/**
 * @param {{
 *   item: {
 *     id: string;
 *     productName: string;
 *     sku: string | null;
 *     matchedBy?: string;
 *     matchedVariantSku?: string | null;
 *     productImages?: unknown;
 *     productImageLinks?: unknown[];
 *   };
 *   checked: boolean;
 *   disabled?: boolean;
 *   onToggle: () => void;
 *   compact?: boolean;
 *   copyFlashKeyPrefix?: string;
 * }} props
 */
export function SkuLookupProductItem({
  item,
  checked,
  disabled = false,
  onToggle,
  compact = false,
  copyFlashKeyPrefix = "sku-lookup",
}) {
  const thumbUrl = useProductMainImageSrc({
    id: item.id,
    format: "simple",
    product_images: item.productImages,
    product_image_links: item.productImageLinks,
  });

  return (
    <label
      className={[
        "anuncios-sku-modal__lookup-item",
        compact ? "anuncios-sku-modal__lookup-item--compact" : "",
        checked ? "anuncios-sku-modal__lookup-item--selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} disabled={disabled} />
      <span className="anuncios-sku-modal__lookup-thumb" aria-hidden>
        {thumbUrl ? (
          <img src={thumbUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        ) : (
          <span className="anuncios-sku-modal__lookup-thumb-fallback">
            <S7Icon name="image" size={14} strokeWidth={1.8} />
          </span>
        )}
      </span>
      <span className="anuncios-sku-modal__lookup-text">
        <strong>{item.productName}</strong>
        <span className="anuncios-sku-modal__lookup-sku s7-copy-group">
          <span>SKU: {item.sku || "—"}</span>
          {!compact && item.sku ? (
            <S7CopyButton
              value={item.sku}
              ariaLabel={`Copiar SKU ${item.sku}`}
              tooltipText="Copiar SKU"
              toastLabel="SKU"
              showToast
              iconMode="unicode"
              flashMs={S7_COPY_OFFICIAL_FLASH_MS}
              flashKey={`${copyFlashKeyPrefix}-copy-${item.id}`}
              toastEventType="LISTING_SKU_COPIED"
              toastFailEventType="LISTING_SKU_COPY_FAILED"
              toastEntityType="product"
            />
          ) : null}
          {item.matchedBy === "variant" && item.matchedVariantSku
            ? ` · Variação: ${item.matchedVariantSku}`
            : ""}
        </span>
      </span>
    </label>
  );
}

/**
 * @param {{
 *   enabled: boolean;
 *   skuInput: string;
 *   readinessMode?: "batch" | "individual";
 * }} props
 */
export function useListingSkuResolution({
  enabled,
  skuInput,
  readinessMode = "batch",
}) {
  const trimmedSku = useMemo(() => normalizeListingSkuInput(skuInput), [skuInput]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [skuMatches, setSkuMatches] = useState(/** @type {ReturnType<typeof mapProdutoSkuLookup>[]} */ ([]));
  const [selectedProductId, setSelectedProductId] = useState("");
  const [lookupSettledSku, setLookupSettledSku] = useState("");
  const requestSeqRef = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;

    requestSeqRef.current += 1;
    const requestSeq = requestSeqRef.current;

    setSkuMatches([]);
    setSelectedProductId("");
    setLookupError("");
    setLookupSettledSku("");

    const query = trimmedSku;
    if (!query || query.length < 2) {
      setLookupLoading(false);
      if (query) setLookupSettledSku(query);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLookupLoading(true);
        setLookupError("");
        const result = await fetchListingSkuLookup(query);
        if (cancelled || requestSeq !== requestSeqRef.current) return;

        setLookupLoading(false);
        if (!result.ok) {
          setSkuMatches([]);
          setSelectedProductId("");
          setLookupError(result.error);
          return;
        }

        setLookupSettledSku(result.query);
        setSkuMatches(result.products);
        setSelectedProductId((prev) => {
          if (prev && result.products.some((entry) => entry.id === prev)) return prev;
          return result.products.length === 1 ? result.products[0].id : "";
        });
      })();
    }, LISTING_SKU_LOOKUP_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, trimmedSku]);

  const resolutionState = {
    trimmedSku,
    lookupLoading,
    lookupSettledSku,
    skuMatches,
    selectedProductId,
    lookupError,
  };

  const isReady =
    readinessMode === "individual"
      ? evaluateListingSkuIndividualConfirmReady(resolutionState)
      : evaluateListingSkuRowReady(resolutionState);

  return {
    trimmedSku,
    lookupLoading,
    lookupError,
    skuMatches,
    selectedProductId,
    setSelectedProductId,
    lookupSettledSku,
    isReady,
    showLookupPanel: Boolean(trimmedSku),
  };
}

/**
 * @param {{
 *   trimmedSku: string;
 *   lookupLoading: boolean;
 *   lookupError: string;
 *   skuMatches: Parameters<typeof SkuLookupProductItem>[0]["item"][];
 *   selectedProductId: string;
 *   onToggleProduct: (productId: string) => void;
 *   disabled?: boolean;
 *   compact?: boolean;
 *   copyFlashKeyPrefix?: string;
 *   notFoundSaveActionLabel?: string;
 * }} props
 */
export function ListingSkuLookupPanel({
  trimmedSku,
  lookupLoading,
  lookupError,
  skuMatches,
  selectedProductId,
  onToggleProduct,
  disabled = false,
  compact = false,
  copyFlashKeyPrefix = "sku-lookup",
  notFoundSaveActionLabel = LISTING_SKU_LOOKUP_SAVE_ACTION_INDIVIDUAL,
}) {
  if (!trimmedSku) return null;

  return (
    <div className="anuncios-sku-modal__lookup listing-sku-lookup-panel">
      {lookupLoading ? (
        <p className="anuncios-sku-modal__lookup-state" role="status" aria-live="polite">
          {LISTING_SKU_LOOKUP_MSG_SEARCHING}
        </p>
      ) : lookupError ? (
        <p className="anuncios-sku-modal__lookup-state anuncios-sku-modal__lookup-state--error" role="alert">
          {lookupError}
        </p>
      ) : skuMatches.length > 0 ? (
        <>
          <div
            className="anuncios-sku-modal__lookup-list"
            role="group"
            aria-label="Produtos encontrados para o SKU"
          >
            {skuMatches.map((item) => (
              <SkuLookupProductItem
                key={item.id}
                item={item}
                checked={selectedProductId === item.id}
                disabled={disabled}
                compact={compact}
                copyFlashKeyPrefix={copyFlashKeyPrefix}
                onToggle={() => onToggleProduct(item.id)}
              />
            ))}
          </div>
          {skuMatches.length > 1 ? (
            <p className="anuncios-sku-modal__confirm-hint">
              Marque o produto correto para habilitar o vínculo deste anúncio.
            </p>
          ) : null}
        </>
      ) : (
        <p className="anuncios-sku-modal__lookup-state">
          {buildListingSkuLookupNotFoundMessage(notFoundSaveActionLabel)}
        </p>
      )}
    </div>
  );
}
