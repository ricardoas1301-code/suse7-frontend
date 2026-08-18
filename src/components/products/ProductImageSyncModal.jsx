// ======================================================================
// Modal — sincronizar imagens do produto em anúncios vinculados
// Padrão visual: ConcorrenciaIncluirAnuncioModal
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import S7Button from "../ui/S7Button";
import S7Icon from "../ui/S7Icon";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton";
import {
  fetchProductImageSyncListings,
  syncProductImagesToListings,
} from "../../services/productImagesApi";
import {
  formatarIdAnuncioMlbParaCopia,
  formatPrice,
} from "../concorrencia/concorrenciaCompetitorDisplay";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import "../../pages/ConcorrenciaPage.css";
import "./ProductImageSyncModal.css";

/**
 * @param {unknown} value
 */
function formatSyncModalVendas(value) {
  const n = Number(value);
  const count = Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
  return count === 1 ? "1 venda" : `${count} vendas`;
}

/**
 * @param {Record<string, unknown>} row
 */
function formatListingId(row) {
  return formatarIdAnuncioMlbParaCopia(row.external_listing_id) || String(row.external_listing_id || "").trim() || "—";
}

/**
 * @param {{
 *   open: boolean;
 *   productId: string | null;
 *   selectedImageLinkIds: string[];
 *   onClose: () => void;
 *   onSynced?: () => void | Promise<void>;
 * }} props
 */
export default function ProductImageSyncModal({
  open,
  productId,
  selectedImageLinkIds,
  onClose,
  onSynced,
}) {
  const { addNotification } = useNotifications();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [selectedListingIds, setSelectedListingIds] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  useEffect(() => {
    if (!open) {
      setListings([]);
      setLoadError(null);
      setSelectedListingIds(new Set());
      setLoading(false);
      setSaving(false);
      setConfirmReplace(false);
      return undefined;
    }

    const pid = productId != null ? String(productId).trim() : "";
    if (!pid) return undefined;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      const res = await fetchProductImageSyncListings(pid);
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setLoadError(res.error || "Não foi possível carregar anúncios vinculados.");
        setListings([]);
        return;
      }
      setListings(Array.isArray(res.listings) ? res.listings : []);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, productId]);

  const selectedImagesCount = selectedImageLinkIds.length;
  const selectedListingsCount = selectedListingIds.size;

  const toggleListing = useCallback((listingId) => {
    const id = String(listingId || "").trim();
    if (!id) return;
    setSelectedListingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const canConfirm = selectedImagesCount > 0 && selectedListingsCount > 0 && !saving;

  const runSync = useCallback(async () => {
    const pid = productId != null ? String(productId).trim() : "";
    if (!pid || !canConfirm) return;
    setSaving(true);
    const res = await syncProductImagesToListings({
      productId: pid,
      imageLinkIds: selectedImageLinkIds,
      listingIds: [...selectedListingIds],
      syncMarketplace: true,
    });
    setSaving(false);

    if (!res.ok) {
      addNotification({
        event_type: "GENERIC",
        entity_type: "product",
        entity_id: pid,
        title: "Sincronizar imagens",
        message: res.error || "Não foi possível sincronizar as imagens.",
        severity: NOTIFICATION_SEVERITY.ERROR,
      });
      return;
    }

    const summary = res.summary ?? {};
    const synced = Number(summary.synced) || 0;
    const failed = Number(summary.failed) || 0;
    const severity =
      failed > 0 && synced === 0 ? NOTIFICATION_SEVERITY.ERROR : failed > 0 ? NOTIFICATION_SEVERITY.WARNING : NOTIFICATION_SEVERITY.SUCCESS;

    addNotification({
      event_type: "GENERIC",
      entity_type: "product",
      entity_id: pid,
      title: "Sincronizar imagens",
      message:
        failed > 0
          ? `${synced} anúncio(s) sincronizado(s), ${failed} com falha.`
          : `${synced} anúncio(s) sincronizado(s) com sucesso.`,
      severity,
    });

    await onSynced?.();
    onClose();
  }, [
    productId,
    canConfirm,
    selectedImageLinkIds,
    selectedListingIds,
    addNotification,
    onSynced,
    onClose,
  ]);

  const handleConfirmClick = useCallback(() => {
    if (!canConfirm) return;
    if (!confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    void runSync();
  }, [canConfirm, confirmReplace, runSync]);

  const emptyHint = useMemo(() => {
    if (loading) return "Carregando anúncios vinculados…";
    if (loadError) return loadError;
    if (listings.length === 0) return "Nenhum anúncio vinculado a este produto.";
    return "";
  }, [loading, loadError, listings.length]);

  if (!open) return null;

  return createPortal(
    <div className="s7-concorrencia-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="s7-concorrencia-modal s7-concorrencia-modal--pick concorrencia-incluir-modal product-image-sync-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Sincronizar imagens em anúncios"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="s7-concorrencia-modal__head">
          <h2>Sincronizar imagens em anúncios</h2>
          <button type="button" className="s7-concorrencia-modal__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <p className="s7-concorrencia-modal__hint">
          Selecione os anúncios vinculados a este produto que receberão as imagens marcadas.
        </p>

        {confirmReplace ? (
          <p className="product-image-sync-modal__confirm product-image-sync-modal__confirm--warn" role="status">
            Esta ação substituirá as imagens atuais dos anúncios selecionados pelas imagens marcadas.
          </p>
        ) : null}

        {listings.length === 0 ? (
          <p className="s7-concorrencia-modal__empty">{emptyHint}</p>
        ) : (
          <ul className="s7-concorrencia-modal__pick-list concorrencia-incluir-modal__list">
            {listings.map((row) => {
              const listingId = String(row.listing_id ?? "");
              const checked = selectedListingIds.has(listingId);
              const thumb = row.listing_thumbnail != null ? String(row.listing_thumbnail) : "";
              const title = String(row.title || "").trim() || "Anúncio sem título";
              const sku = row.sku != null ? String(row.sku).trim() : "";
              const account = row.account_label != null ? String(row.account_label).trim() : "";
              const mlbExibicao = formatListingId(row);
              const mlbCopiar = formatarIdAnuncioMlbParaCopia(row.external_listing_id) || mlbExibicao;
              const precoTxt = formatPrice(row.price_brl, "BRL");
              const vendasTxt = formatSyncModalVendas(row.sales_count ?? 0);
              const picturesCount =
                row.pictures_count != null && Number.isFinite(Number(row.pictures_count))
                  ? Math.trunc(Number(row.pictures_count))
                  : null;
              const status = row.status != null ? String(row.status).trim() : "";

              return (
                <li key={listingId} className="s7-concorrencia-modal__pick-item">
                  <label className="s7-concorrencia-modal__pick-row">
                    <input
                      type="checkbox"
                      className="s7-concorrencia-modal__pick-check"
                      checked={checked}
                      onChange={() => toggleListing(listingId)}
                      disabled={saving}
                    />
                    <span className="s7-concorrencia-modal__pick-thumb-wrap">
                      {thumb ? (
                        <img src={thumb} alt="" className="s7-concorrencia-modal__pick-thumb" loading="lazy" />
                      ) : (
                        <span
                          className="s7-concorrencia-modal__pick-thumb s7-concorrencia-modal__pick-thumb--ph"
                          aria-hidden
                        />
                      )}
                    </span>
                    <span className="s7-concorrencia-modal__pick-main">
                      <span className="s7-concorrencia-modal__pick-title">{title}</span>
                      <span className="concorrencia-incluir-modal__meta-line">
                        {account ? (
                          <>
                            <span className="concorrencia-incluir-modal__meta-account">{account}</span>
                            <span className="concorrencia-incluir-modal__meta-sep" aria-hidden>
                              |
                            </span>
                          </>
                        ) : null}
                        {mlbExibicao !== "—" ? (
                          <span className="concorrencia-incluir-modal__meta-copy s7-copy-group">
                            <span>{mlbExibicao}</span>
                            <S7CopyButton
                              value={mlbCopiar}
                              ariaLabel="Copiar código MLB"
                              tooltipText="Copiar MLB"
                              toastLabel="MLB"
                              showToast
                              iconMode="unicode"
                              flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                              flashKey={`sync-mlb-${listingId}-${mlbCopiar}`}
                              toastEntityType="marketplace_listing"
                            />
                          </span>
                        ) : null}
                        {sku ? (
                          <>
                            <span className="concorrencia-incluir-modal__meta-sep" aria-hidden>
                              |
                            </span>
                            <span className="concorrencia-incluir-modal__meta-copy s7-copy-group">
                              <span>
                                <span className="anuncios-ad-sku-label">SKU:</span>{" "}
                                <span className="anuncios-ad-sku-value">{sku}</span>
                              </span>
                              <S7CopyButton
                                value={sku}
                                ariaLabel={`Copiar SKU ${sku}`}
                                tooltipText="Copiar SKU"
                                toastLabel="SKU"
                                showToast
                                iconMode="unicode"
                                flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                                flashKey={`sync-sku-${listingId}-${sku}`}
                                toastEntityType="product"
                              />
                            </span>
                          </>
                        ) : null}
                        {precoTxt !== "—" ? (
                          <>
                            <span className="concorrencia-incluir-modal__meta-sep" aria-hidden>
                              |
                            </span>
                            <span className="concorrencia-incluir-modal__meta-price">{precoTxt}</span>
                          </>
                        ) : null}
                        <span className="concorrencia-incluir-modal__meta-sep" aria-hidden>
                          |
                        </span>
                        <span className="concorrencia-incluir-modal__meta-sales">{vendasTxt}</span>
                        {picturesCount != null ? (
                          <>
                            <span className="concorrencia-incluir-modal__meta-sep" aria-hidden>
                              |
                            </span>
                            <span className="product-image-sync-modal__meta-pictures">
                              {picturesCount === 1 ? "1 imagem" : `${picturesCount} imagens`}
                            </span>
                          </>
                        ) : null}
                        {status ? (
                          <>
                            <span className="concorrencia-incluir-modal__meta-sep" aria-hidden>
                              |
                            </span>
                            <span className="product-image-sync-modal__meta-status">{status}</span>
                          </>
                        ) : null}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="s7-concorrencia-modal__foot concorrencia-incluir-modal__foot product-image-sync-modal__foot">
          <span className="product-image-sync-modal__counts">
            <span>{selectedImagesCount} imagem(ns) selecionada(s)</span>
            <span aria-hidden> · </span>
            <span>{selectedListingsCount} anúncio(s) selecionado(s)</span>
          </span>
          <div className="product-image-sync-modal__foot-actions">
            <S7Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </S7Button>
            <S7Button type="button" variant="primary" onClick={() => void handleConfirmClick()} disabled={!canConfirm}>
              {saving ? (
                <>
                  <S7Icon name="loader" size={14} />
                  Sincronizando…
                </>
              ) : confirmReplace ? (
                "Confirmar substituição"
              ) : (
                "Sincronizar imagens"
              )}
            </S7Button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
