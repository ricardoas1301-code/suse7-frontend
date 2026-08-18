// ======================================================================
// Modal — sincronizar título do produto em anúncios vinculados
// Padrão visual: ProductImageSyncModal / ConcorrenciaIncluirAnuncioModal
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import S7Button from "../ui/S7Button";
import S7Icon from "../ui/S7Icon";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton";
import S7Tooltip from "../ui/S7Tooltip";
import {
  fetchProductTitleSyncListings,
  syncProductTitleToListings,
} from "../../services/productTitlesApi";
import {
  formatarIdAnuncioMlbParaCopia,
  formatPrice,
} from "../concorrencia/concorrenciaCompetitorDisplay";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import "../../pages/ConcorrenciaPage.css";
import "./ProductTitleSyncModal.css";

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
 *   selectedTitle: string;
 *   onClose: () => void;
 *   onSynced?: () => void | Promise<void>;
 * }} props
 */
export default function ProductTitleSyncModal({
  open,
  productId,
  selectedTitle,
  onClose,
  onSynced,
}) {
  const { addNotification } = useNotifications();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  useEffect(() => {
    if (!open) {
      setListings([]);
      setLoadError(null);
      setSelectedListingId(null);
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
      const res = await fetchProductTitleSyncListings(pid);
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

  const titleText = String(selectedTitle ?? "").trim();
  const selectedListingsCount = selectedListingId ? 1 : 0;

  const selectListing = useCallback((listingId, canUpdate) => {
    if (!canUpdate) return;
    const id = String(listingId || "").trim();
    if (!id) return;
    setSelectedListingId(id);
  }, []);

  const canConfirm = titleText !== "" && selectedListingId != null && !saving;

  const buildResultMessage = useCallback((summary, results) => {
    const synced = Number(summary?.synced) || 0;
    const blocked = Number(summary?.blocked) || 0;
    const failed = Number(summary?.failed) || 0;
    const parts = [];
    if (synced > 0) parts.push(`${synced} sincronizado(s)`);
    if (blocked > 0) parts.push(`${blocked} bloqueado(s)`);
    if (failed > 0) parts.push(`${failed} com erro`);
    const base = parts.length > 0 ? parts.join(", ") + "." : "Nenhum anúncio processado.";

    const detailLines = (Array.isArray(results) ? results : [])
      .filter((r) => r && (r.status === "failed" || r.status === "blocked"))
      .slice(0, 5)
      .map((r) => {
        const ext = formatListingId(r);
        const reason = r.reason != null ? String(r.reason) : r.status === "blocked" ? "Bloqueado" : "Falha";
        return `${ext}: ${reason}`;
      });
    if (detailLines.length === 0) return base;
    return `${base} ${detailLines.join(" · ")}`;
  }, []);

  const runSync = useCallback(async () => {
    const pid = productId != null ? String(productId).trim() : "";
    if (!pid || !canConfirm) return;
    setSaving(true);
    const res = await syncProductTitleToListings({
      productId: pid,
      title: titleText,
      listingIds: selectedListingId ? [selectedListingId] : [],
      syncMarketplace: true,
    });
    setSaving(false);

    if (!res.ok) {
      addNotification({
        event_type: "GENERIC",
        entity_type: "product",
        entity_id: pid,
        title: "Sincronizar título",
        message: res.error || "Não foi possível sincronizar o título.",
        severity: NOTIFICATION_SEVERITY.ERROR,
      });
      return;
    }

    const summary = res.summary ?? {};
    const synced = Number(summary.synced) || 0;
    const failed = Number(summary.failed) || 0;
    const blocked = Number(summary.blocked) || 0;
    const severity =
      failed > 0 && synced === 0
        ? NOTIFICATION_SEVERITY.ERROR
        : failed > 0 || blocked > 0
          ? NOTIFICATION_SEVERITY.WARNING
          : NOTIFICATION_SEVERITY.SUCCESS;

    addNotification({
      event_type: "GENERIC",
      entity_type: "product",
      entity_id: pid,
      title: "Sincronizar título",
      message: buildResultMessage(summary, res.results),
      severity,
    });

    await onSynced?.();
    onClose();
  }, [
    productId,
    canConfirm,
    titleText,
    selectedListingId,
    addNotification,
    buildResultMessage,
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
        className="s7-concorrencia-modal s7-concorrencia-modal--pick concorrencia-incluir-modal product-title-sync-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Sincronizar título em anúncios"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="s7-concorrencia-modal__head">
          <h2>Sincronizar título em anúncios</h2>
          <button type="button" className="s7-concorrencia-modal__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <p className="s7-concorrencia-modal__hint">
          Selecione o anúncio vinculado a este produto que receberá o título escolhido.
        </p>

        <div className="product-title-sync-modal__preview">
          <span className="product-title-sync-modal__preview-label">Título selecionado</span>
          <span className="product-title-sync-modal__preview-value">{titleText || "—"}</span>
        </div>

        {confirmReplace ? (
          <p className="product-title-sync-modal__confirm" role="status">
            Você está prestes a substituir o título dos anúncios selecionados pelo título escolhido. Deseja continuar?
          </p>
        ) : null}

        {listings.length === 0 ? (
          <p className="s7-concorrencia-modal__empty">{emptyHint}</p>
        ) : (
          <ul className="s7-concorrencia-modal__pick-list concorrencia-incluir-modal__list">
            {listings.map((row) => {
              const listingId = String(row.listing_id ?? "");
              const canUpdate = row.can_update_title === true;
              const blockedReason =
                row.blocked_reason != null ? String(row.blocked_reason).trim() : "";
              const checked = selectedListingId === listingId;
              const thumb = row.listing_thumbnail != null ? String(row.listing_thumbnail) : "";
              const title = String(row.title || "").trim() || "Anúncio sem título";
              const sku = row.sku != null ? String(row.sku).trim() : "";
              const account = row.account_label != null ? String(row.account_label).trim() : "";
              const mlbExibicao = formatListingId(row);
              const mlbCopiar = formatarIdAnuncioMlbParaCopia(row.external_listing_id) || mlbExibicao;
              const priceRaw =
                row.display_price_brl != null
                  ? String(row.display_price_brl)
                  : row.price_brl != null
                    ? String(row.price_brl)
                    : null;
              const precoTxt = formatPrice(priceRaw, "BRL");
              const vendasOficiais =
                row.official_sales_count != null
                  ? row.official_sales_count
                  : row.sales_count != null
                    ? row.sales_count
                    : 0;
              const vendasTxt = formatSyncModalVendas(vendasOficiais);
              const status = row.status != null ? String(row.status).trim() : "";

              const rowInner = (
                <label
                  className={`s7-concorrencia-modal__pick-row${canUpdate ? "" : " s7-concorrencia-modal__pick-row--disabled"}`}
                >
                  <input
                    type="radio"
                    name="product-title-sync-listing"
                    className="s7-concorrencia-modal__pick-check"
                    checked={checked}
                    onChange={() => selectListing(listingId, canUpdate)}
                    disabled={!canUpdate || saving}
                    aria-disabled={!canUpdate}
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
                            flashKey={`title-sync-mlb-${listingId}-${mlbCopiar}`}
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
                              flashKey={`title-sync-sku-${listingId}-${sku}`}
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
                        {status ? (
                          <>
                            <span className="concorrencia-incluir-modal__meta-sep" aria-hidden>
                              |
                            </span>
                            <span className="product-title-sync-modal__meta-status">{status}</span>
                          </>
                        ) : null}
                        {canUpdate ? (
                          <>
                            <span className="concorrencia-incluir-modal__meta-sep" aria-hidden>
                              |
                            </span>
                            <span className="product-title-sync-modal__eligibility product-title-sync-modal__eligibility--ok">
                              Elegível
                            </span>
                          </>
                        ) : blockedReason ? (
                          <>
                            <span className="concorrencia-incluir-modal__meta-sep" aria-hidden>
                              |
                            </span>
                            <S7Tooltip content={blockedReason} placement="top-start" offset={4} wrap>
                              <span
                                className="product-title-sync-modal__blocked-badge"
                                aria-label={blockedReason}
                              >
                                <S7Icon name="billing_lock" size={14} />
                              </span>
                            </S7Tooltip>
                          </>
                        ) : null}
                      </span>
                  </span>
                </label>
              );

              return (
                <li
                  key={listingId}
                  className={`s7-concorrencia-modal__pick-item${canUpdate ? "" : " product-title-sync-modal__pick-item--blocked"}`}
                >
                  {rowInner}
                </li>
              );
            })}
          </ul>
        )}

        <footer className="s7-concorrencia-modal__foot concorrencia-incluir-modal__foot product-title-sync-modal__foot">
          <span className="product-title-sync-modal__counts">
            <span>1 título selecionado</span>
            <span aria-hidden> · </span>
            <span>{selectedListingsCount} anúncio selecionado</span>
          </span>
          <div className="product-title-sync-modal__foot-actions">
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
                "Sincronizar título"
              )}
            </S7Button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
