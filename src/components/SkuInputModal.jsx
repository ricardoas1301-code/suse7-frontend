// ======================================================================
// Modal: informar SKU (ML sem SKU) ou confirmar vínculo quando SKU já existe.
// Backend: POST /api/ml/listings/set-sku — fonte de verdade no servidor.
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { buildApiUrl, apiFetch } from "../config/api";
import S7ConfirmModal from "./ui/S7ConfirmModal";
import S7FormField from "./ui/forms/S7FormField";
import S7Input from "./ui/S7Input";

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
 *   knownSku?: string | null;
 *   onClose: () => void;
 *   onSaved: () => void | Promise<void>;
 * }} props
 */
export default function SkuInputModal({
  open,
  listingId,
  listingTitle,
  knownSku = null,
  onClose,
  onSaved,
}) {
  const [sku, setSku] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const trimmedKnown = knownSku != null && String(knownSku).trim() !== "" ? String(knownSku).trim() : "";
  const isLinkConfirm = Boolean(trimmedKnown);

  useEffect(() => {
    if (open) {
      setSku(trimmedKnown);
      setError("");
      setLoading(false);
    }
  }, [open, listingId, trimmedKnown]);

  const handleConfirm = useCallback(() => {
    if (!listingId || loading) return;
    const trimmed = sku.trim();
    if (!trimmed) {
      setError("Informe o SKU.");
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
        body: { listing_id: listingId, seller_sku: trimmed },
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
  }, [listingId, sku, loading, onClose, onSaved]);

  return (
    <S7ConfirmModal
      open={open && Boolean(listingId)}
      title={isLinkConfirm ? "Vincular produto" : "Informar SKU"}
      confirmLabel={isLinkConfirm ? "Confirmar vínculo" : "Salvar e vincular"}
      confirmVariant="primary"
      cancelLabel="Cancelar"
      loading={loading}
      loadingLabel={isLinkConfirm ? "Vinculando..." : "Salvando..."}
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
    </S7ConfirmModal>
  );
}
