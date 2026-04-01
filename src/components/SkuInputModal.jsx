// ======================================================================
// Modal: informar SKU em anúncio ML sem SKU (backend cria/vincula produto).
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { buildApiUrl, apiFetch } from "../config/api";
import S7ConfirmModal from "./ui/S7ConfirmModal";
import S7FormField from "./ui/forms/S7FormField";
import S7Input from "./ui/S7Input";

/**
 * @param {{
 *   open: boolean;
 *   listingId: string | null;
 *   listingTitle: string;
 *   onClose: () => void;
 *   onSaved: () => void | Promise<void>;
 * }} props
 */
export default function SkuInputModal({ open, listingId, listingTitle, onClose, onSaved }) {
  const [sku, setSku] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSku("");
      setError("");
      setLoading(false);
    }
  }, [open, listingId]);

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
          typeof res.data?.error === "string"
            ? res.data.error
            : res.data?.message || res.error || "Não foi possível salvar o SKU."
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
      title="Informar SKU"
      confirmLabel="Salvar e vincular"
      confirmVariant="primary"
      cancelLabel="Cancelar"
      loading={loading}
      loadingLabel="Salvando..."
      onCancel={onClose}
      onConfirm={handleConfirm}
      titleId="sku-input-modal-title"
    >
      <p className="anuncios-sku-modal__intro">
        O Mercado Livre não enviou SKU neste anúncio. Informe o mesmo SKU do seu estoque para vincular ou criar o
        produto no Suse7 (processamento no servidor).
      </p>
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
