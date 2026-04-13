// ======================================================================
// Modal: vínculo em massa — um SKU de catálogo aplicado a vários anúncios.
// Backend: POST /api/listings/bulk-set-sku
// Evolução futura: modo avançado com SKU por linha (payload v2 no mesmo endpoint).
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { buildApiUrl, apiFetch } from "../config/api";
import S7ConfirmModal from "./ui/S7ConfirmModal";
import S7FormField from "./ui/forms/S7FormField";
import S7Input from "./ui/S7Input";
import "./AnunciosBulkSkuModal.css";

/**
 * @param {unknown} data
 * @param {string} fallback
 */
function formatBulkSkuApiError(data, fallback) {
  const d = data && typeof data === "object" ? /** @type {Record<string, unknown>} */ (data) : {};
  if (typeof d.error === "string" && d.error.trim() !== "") return d.error.trim();
  if (typeof d.message === "string" && d.message.trim() !== "") return d.message.trim();
  return fallback;
}

/**
 * @param {{
 *   open: boolean;
 *   selectedCount: number;
 *   marketplace: string;
 *   getListingIds: () => string[];
 *   initialSkuHint: string | null;
 *   onClose: () => void;
 *   onCompleted: (result: { kind: "success" | "warning" | "error"; title: string; message: string }) => void | Promise<void>;
 * }} props
 */
export default function AnunciosBulkSkuModal({
  open,
  selectedCount,
  marketplace,
  getListingIds,
  initialSkuHint,
  onClose,
  onCompleted,
}) {
  const [sku, setSku] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const hint = initialSkuHint != null && String(initialSkuHint).trim() !== "" ? String(initialSkuHint).trim() : "";
      setSku(hint);
      setError("");
      setLoading(false);
    }
  }, [open, selectedCount, initialSkuHint]);

  const handleConfirm = useCallback(() => {
    const listingIds = getListingIds();
    if (loading || listingIds.length === 0) return;
    const trimmed = sku.trim();
    if (!trimmed) {
      setError("Informe o SKU.");
      return;
    }

    void (async () => {
      setLoading(true);
      setError("");
      const url = buildApiUrl("/api/listings/bulk-set-sku");
      if (!url) {
        setError("Defina VITE_API_BASE_URL apontando para o backend.");
        setLoading(false);
        return;
      }
      const res = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          marketplace,
          listing_ids: listingIds,
          sku: trimmed,
        },
      });
      setLoading(false);

      const data = res.data && typeof res.data === "object" ? /** @type {Record<string, unknown>} */ (res.data) : {};

      if (!res.ok) {
        const msg = formatBulkSkuApiError(data, typeof res.error === "string" ? res.error : "Não foi possível concluir o vínculo em massa.");
        await Promise.resolve(
          onCompleted?.({
            kind: "error",
            title: "Vínculo em massa",
            message: msg,
          }),
        );
        onClose();
        return;
      }

      const totalUpdated = typeof data.total_updated === "number" ? data.total_updated : 0;
      const totalReceived = typeof data.total_received === "number" ? data.total_received : listingIds.length;
      const totalSkipped = typeof data.total_skipped === "number" ? data.total_skipped : Math.max(0, totalReceived - totalUpdated);

      if (totalUpdated === totalReceived && totalReceived > 0) {
        await Promise.resolve(
          onCompleted?.({
            kind: "success",
            title: "Vínculo concluído",
            message:
              typeof data.message === "string" && data.message.trim() !== ""
                ? data.message.trim()
                : `${totalUpdated} anúncio(s) vinculado(s) ao produto.`,
          }),
        );
        onClose();
        return;
      }

      if (totalUpdated > 0 && totalSkipped > 0) {
        await Promise.resolve(
          onCompleted?.({
            kind: "warning",
            title: "Vínculo parcial",
            message: `${totalUpdated} de ${totalReceived} anúncio(s) vinculado(s). ${totalSkipped} não puderam ser atualizados (ver detalhes no retorno da API, se disponível).`,
          }),
        );
        onClose();
        return;
      }

      await Promise.resolve(
        onCompleted?.({
          kind: "error",
          title: "Nenhum anúncio atualizado",
          message:
            typeof data.message === "string" && data.message.trim() !== ""
              ? data.message.trim()
              : "Não foi possível vincular os anúncios selecionados.",
        }),
      );
      onClose();
    })();
  }, [loading, getListingIds, marketplace, sku, onClose, onCompleted]);

  return (
    <S7ConfirmModal
      open={open && selectedCount > 0}
      title="Vincular anúncios em massa"
      confirmLabel="Confirmar vínculo"
      confirmVariant="primary"
      cancelLabel="Cancelar"
      loading={loading}
      loadingLabel="Vinculando…"
      onCancel={onClose}
      onConfirm={handleConfirm}
      titleId="anuncios-bulk-sku-modal-title"
    >
      <p className="anuncios-bulk-sku-modal__intro">
        Você está vinculando <strong>{selectedCount}</strong> {selectedCount === 1 ? "anúncio selecionado" : "anúncios selecionados"} ao{" "}
        <strong>mesmo produto do catálogo</strong>, identificado pelo SKU abaixo. O SKU deve já existir no Suse7 (incluindo variações).
      </p>
      <p className="anuncios-bulk-sku-modal__hint">
        Esta ação não cria produtos novos em massa — apenas associa anúncios a um produto existente. Para criar produto a partir do ML,
        use o vínculo individual quando necessário. Apenas os anúncios com checkbox marcado entram no vínculo (não há expansão por SKU na
        vitrine).
      </p>
      <S7FormField label="SKU do produto (catálogo)" htmlFor="anuncios-bulk-sku-input" error={error || undefined}>
        <S7Input
          name="anuncios-bulk-sku-input"
          id="anuncios-bulk-sku-input"
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
