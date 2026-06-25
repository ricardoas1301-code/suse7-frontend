// ======================================================================
// Modal: informar SKU (ML sem SKU) ou confirmar vínculo quando SKU já existe.
// Backend: POST /api/ml/listings/set-sku — fonte de verdade no servidor.
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildApiUrl, apiFetch } from "../config/api";
import S7ConfirmModal from "./ui/S7ConfirmModal";
import S7FormField from "./ui/forms/S7FormField";
import S7Input from "./ui/S7Input";
import S7Icon from "./ui/S7Icon";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "./ui/S7CopyButton";
import { useProductMainImageSrc } from "../utils/productImageDisplayUrl";

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
 * @param {Record<string, unknown>} payload
 */
function mapProdutoSkuLookup(payload) {
  return {
    id: payload?.id != null ? String(payload.id).trim() : "",
    productName:
      payload?.product_name != null && String(payload.product_name).trim() !== ""
        ? String(payload.product_name).trim()
        : "Produto sem nome",
    sku:
      payload?.sku != null && String(payload.sku).trim() !== ""
        ? String(payload.sku).trim()
        : null,
    matchedBy: payload?.matched_by === "variant" ? "variant" : "product",
    matchedVariantSku:
      payload?.matched_variant_sku != null && String(payload.matched_variant_sku).trim() !== ""
        ? String(payload.matched_variant_sku).trim()
        : null,
    productImages:
      payload?.product_images != null
        ? payload.product_images
        : null,
    productImageLinks: Array.isArray(payload?.product_image_links) ? payload.product_image_links : [],
  };
}

function SkuLookupProductItem({ item, checked, disabled, onToggle }) {
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
          {item.sku ? (
            <S7CopyButton
              value={item.sku}
              ariaLabel={`Copiar SKU ${item.sku}`}
              tooltipText="Copiar SKU"
              toastLabel="SKU"
              showToast
              iconMode="unicode"
              flashMs={S7_COPY_OFFICIAL_FLASH_MS}
              flashKey={`sku-lookup-copy-${item.id}`}
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
 *   open: boolean;
 *   listingId: string | null;
 *   listingTitle: string;
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
  knownSku = null,
  requireExistingProductConfirm = false,
  onClose,
  onSaved,
}) {
  const [sku, setSku] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [skuMatches, setSkuMatches] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const trimmedKnown = knownSku != null && String(knownSku).trim() !== "" ? String(knownSku).trim() : "";
  const isLinkConfirm = Boolean(trimmedKnown);
  const trimmedSku = useMemo(() => String(sku || "").trim(), [sku]);

  useEffect(() => {
    if (open) {
      setSku(trimmedKnown);
      setError("");
      setLoading(false);
      setLookupLoading(false);
      setLookupError("");
      setSkuMatches([]);
      setSelectedProductId("");
    }
  }, [open, listingId, trimmedKnown]);

  useEffect(() => {
    if (!open) return undefined;
    const query = trimmedSku;
    if (!query || query.length < 2) {
      setSkuMatches([]);
      setLookupError("");
      setLookupLoading(false);
      setSelectedProductId("");
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLookupLoading(true);
        setLookupError("");
        const url = buildApiUrl(`/api/ml/listings/sku-lookup?sku=${encodeURIComponent(query)}`);
        if (!url) {
          setLookupLoading(false);
          return;
        }
        const response = await apiFetch(url, { method: "GET" });
        if (cancelled) return;
        setLookupLoading(false);
        if (!response.ok) {
          setSkuMatches([]);
          setSelectedProductId("");
          setLookupError(
            typeof response.error === "string" ? response.error : "Não foi possível localizar o produto por SKU.",
          );
          return;
        }
        const matches = Array.isArray(response.data?.products)
          ? response.data.products.map((entry) =>
              mapProdutoSkuLookup(
                entry && typeof entry === "object" ? /** @type {Record<string, unknown>} */ (entry) : {},
              ),
            )
          : [];
        setSkuMatches(matches.filter((entry) => entry.id));
        setSelectedProductId((prev) =>
          prev && matches.some((entry) => entry.id === prev) ? prev : "",
        );
      })();
    }, 320);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, trimmedSku]);

  const hasSkuMatchSelection = useMemo(
    () => Boolean(selectedProductId) && skuMatches.some((entry) => entry.id === selectedProductId),
    [selectedProductId, skuMatches],
  );

  const canConfirm = useMemo(() => {
    if (!listingId || loading || !trimmedSku) return false;
    if (!requireExistingProductConfirm) return true;
    return hasSkuMatchSelection;
  }, [hasSkuMatchSelection, listingId, loading, requireExistingProductConfirm, trimmedSku]);

  const handleConfirm = useCallback(() => {
    if (!listingId || loading) return;
    const trimmed = trimmedSku;
    if (!trimmed) {
      setError("Informe o SKU.");
      return;
    }
    if (requireExistingProductConfirm && !hasSkuMatchSelection) {
      setError("Selecione e confirme o produto encontrado para este SKU.");
      return;
    }

    void (async () => {
      setLoading(true);
      setError("");
      const url = buildApiUrl("/api/ml/listings/set-sku");
      if (!url) {
        setError("Defina VITE_API_BASE_URL apontando para o backend.");
        setLoading(false);
        return;
      }
      const res = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          listing_id: listingId,
          seller_sku: trimmed,
          selected_product_id: hasSkuMatchSelection ? selectedProductId : null,
        },
      });
      setLoading(false);
      if (!res.ok) {
        setError(
          formatSetSkuApiError(
            res.data,
            typeof res.error === "string" ? res.error : "Não foi possível concluir o vínculo.",
          ),
        );
        return;
      }
      onClose();
      await Promise.resolve(onSaved?.());
    })();
  }, [
    listingId,
    trimmedSku,
    loading,
    requireExistingProductConfirm,
    hasSkuMatchSelection,
    selectedProductId,
    onClose,
    onSaved,
  ]);

  return (
    <S7ConfirmModal
      open={open && Boolean(listingId)}
      title={isLinkConfirm ? "Vincular produto" : "Informar SKU"}
      confirmLabel={isLinkConfirm ? "Confirmar vínculo" : "Salvar e vincular"}
      confirmVariant="primary"
      cancelLabel="Cancelar"
      loading={loading}
      loadingLabel={isLinkConfirm ? "Vinculando..." : "Salvando..."}
      confirmDisabled={!canConfirm}
      onCancel={onClose}
      onConfirm={handleConfirm}
      titleId="sku-input-modal-title"
    >
      {isLinkConfirm ? (
        <p className="anuncios-sku-modal__intro">
          Este anúncio já possui SKU. Confirme o SKU para vincular ao produto correspondente no Suse7 ou concluir o
          vínculo corretamente (ajuste só se estiver incorreto).
        </p>
      ) : (
        <p className="anuncios-sku-modal__intro">
          O Mercado Livre não enviou SKU neste anúncio. Informe o mesmo SKU do seu estoque para vincular ou criar o
          produto no Suse7 (processamento no servidor).
        </p>
      )}
      {listingTitle ? (
        <p className="anuncios-sku-modal__listing-title" title={listingTitle}>
          {listingTitle}
        </p>
      ) : null}
      <S7FormField label="SKU do produto" htmlFor="anuncios-sku-modal-input" error={error || undefined}>
        <S7Input
          name="anuncios-sku-modal-input"
          id="anuncios-sku-modal-input"
          label=""
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="Ex.: ABC-123"
          disabled={loading}
          autoComplete="off"
        />
      </S7FormField>
      {trimmedSku ? (
        <div className="anuncios-sku-modal__lookup">
          {lookupLoading ? (
            <p className="anuncios-sku-modal__lookup-state">Buscando produto para este SKU...</p>
          ) : lookupError ? (
            <p className="anuncios-sku-modal__lookup-state anuncios-sku-modal__lookup-state--error">{lookupError}</p>
          ) : skuMatches.length > 0 ? (
            <div className="anuncios-sku-modal__lookup-list" role="group" aria-label="Produtos encontrados para o SKU">
              {skuMatches.map((item) => {
                const checked = selectedProductId === item.id;
                return (
                  <SkuLookupProductItem
                    key={item.id}
                    item={item}
                    checked={checked}
                    disabled={loading}
                    onToggle={() => setSelectedProductId((prev) => (prev === item.id ? "" : item.id))}
                  />
                );
              })}
            </div>
          ) : (
            <p className="anuncios-sku-modal__lookup-state">
              Nenhum produto encontrado com este SKU no seu catálogo.
            </p>
          )}
        </div>
      ) : null}
      {requireExistingProductConfirm ? (
        <p className="anuncios-sku-modal__confirm-hint">
          Marque o produto correto para habilitar o vínculo deste anúncio.
        </p>
      ) : null}
    </S7ConfirmModal>
  );
}
