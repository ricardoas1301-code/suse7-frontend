// ======================================================================
// Modal — incluir anúncios no monitoramento da Concorrência
// Busca por nome, SKU ou ID do anúncio (MLB…).
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import S7Button from "../ui/S7Button";
import S7Icon from "../ui/S7Icon";
import S7Input from "../ui/S7Input";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton";
import { addMonitoredListings, searchListingsForMonitoring } from "../../services/competitionApi";
import {
  formatarIdAnuncioMlbParaCopia,
  formatPrice,
} from "./concorrenciaCompetitorDisplay";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";

function formatListingId(externalId) {
  return formatarIdAnuncioMlbParaCopia(externalId) || String(externalId || "").trim() || "—";
}

function formatIncluirModalVendas(value) {
  const n = Number(value);
  const count = Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
  return count === 1 ? "1 venda" : `${count} vendas`;
}

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   onIncluded?: () => void | Promise<void>;
 * }} props
 */
export default function ConcorrenciaIncluirAnuncioModal({ open, onClose, onIncluded }) {
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setResults([]);
      setSearchError(null);
      setSelectedIds(new Set());
      setSearching(false);
      setSaving(false);
    }
  }, [open]);

  const runSearch = useCallback(async (query) => {
    const q = String(query ?? "").trim();
    if (!q) {
      setResults([]);
      setSearchError(null);
      return;
    }
    setSearching(true);
    setSearchError(null);
    const res = await searchListingsForMonitoring(q, { limit: 50 });
    setSearching(false);
    if (!res.ok) {
      setSearchError(res.error || "Não foi possível buscar anúncios.");
      setResults([]);
      return;
    }
    setResults(Array.isArray(res.results) ? res.results : []);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const q = String(searchQuery ?? "").trim();
    if (!q) {
      setResults([]);
      setSearchError(null);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      void runSearch(q);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [open, searchQuery, runSearch]);

  const selectedCount = selectedIds.size;

  const toggleSelection = useCallback((listingId) => {
    const id = String(listingId || "").trim();
    if (!id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const canConfirm = selectedCount > 0 && !saving;

  const handleConfirm = useCallback(async () => {
    if (!canConfirm) return;
    setSaving(true);
    const ids = [...selectedIds];
    const res = await addMonitoredListings(ids);
    setSaving(false);
    if (!res.ok) {
      addNotification({
        event_type: "GENERIC",
        entity_type: "listing",
        entity_id: null,
        title: "Concorrência",
        message: res.error || "Não foi possível incluir os anúncios.",
        severity: NOTIFICATION_SEVERITY.ERROR,
      });
      return;
    }
    const total = (res.insertedCount ?? 0) + (res.skippedCount ?? 0);
    addNotification({
      event_type: "GENERIC",
      entity_type: "listing",
      entity_id: null,
      title: "Concorrência",
      message:
        total > 0
          ? `${res.insertedCount ?? 0} anúncio(s) incluído(s) no monitoramento.`
          : "Nenhum anúncio novo foi incluído.",
      severity: NOTIFICATION_SEVERITY.SUCCESS,
    });
    await onIncluded?.();
    onClose();
  }, [canConfirm, selectedIds, addNotification, onIncluded, onClose]);

  const emptyHint = useMemo(() => {
    if (searching) return "Buscando anúncios…";
    if (searchError) return searchError;
    if (!String(searchQuery ?? "").trim()) {
      return "Digite o nome do anúncio, SKU ou ID (MLB) para localizar os anúncios disponíveis.";
    }
    return "Nenhum anúncio encontrado para esta busca.";
  }, [searching, searchError, searchQuery]);

  if (!open) return null;

  return createPortal(
    <div className="s7-concorrencia-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="s7-concorrencia-modal s7-concorrencia-modal--pick concorrencia-incluir-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Incluir anúncio para monitoramento"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="s7-concorrencia-modal__head">
          <h2>Incluir anúncio para monitoramento</h2>
          <button type="button" className="s7-concorrencia-modal__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <p className="s7-concorrencia-modal__hint">
          Busque por nome do anúncio, SKU ou ID do anúncio.
        </p>

        <div className="concorrencia-incluir-modal__search">
          <S7Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nome, SKU ou MLB…"
            aria-label="Buscar anúncios"
            autoFocus
          />
        </div>

        {results.length === 0 ? (
          <p className="s7-concorrencia-modal__empty">{emptyHint}</p>
        ) : (
          <ul className="s7-concorrencia-modal__pick-list concorrencia-incluir-modal__list">
            {results.map((row) => {
              const listingId = String(row.marketplace_listing_id ?? "");
              const checked = selectedIds.has(listingId);
              const thumb = row.listing_thumbnail != null ? String(row.listing_thumbnail) : "";
              const title =
                String(row.title || row.product_name || "").trim() || "Anúncio sem título";
              const sku = row.sku != null ? String(row.sku).trim() : "";
              const account = row.account_label != null ? String(row.account_label).trim() : "";
              const mlbExibicao = formatListingId(row.external_listing_id);
              const mlbCopiar = formatarIdAnuncioMlbParaCopia(row.external_listing_id) || mlbExibicao;
              const precoTxt = formatPrice(row.price, row.currency ?? "BRL");
              const vendasTxt = formatIncluirModalVendas(row.sales_count ?? row.sales ?? 0);
              const vendasNumero = (() => {
                const n = Number(row.sales_count ?? row.sales ?? 0);
                return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
              })();
              const exibirPreco = precoTxt !== "—";
              const temMetaAnteriorVendas = Boolean(account || mlbExibicao !== "—" || sku || exibirPreco);

              return (
                <li key={listingId} className="s7-concorrencia-modal__pick-item">
                  <label className="s7-concorrencia-modal__pick-row">
                    <input
                      type="checkbox"
                      className="s7-concorrencia-modal__pick-check"
                      checked={checked}
                      onChange={() => toggleSelection(listingId)}
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
                          <>
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
                                flashKey={`incluir-mlb-${listingId}-${mlbCopiar}`}
                                toastEventType="LISTING_ID_COPIED"
                                toastFailEventType="LISTING_ID_COPY_FAILED"
                                toastEntityType="marketplace_listing"
                              />
                            </span>
                          </>
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
                                flashKey={`incluir-sku-${listingId}-${sku}`}
                                toastEventType="LISTING_SKU_COPIED"
                                toastFailEventType="LISTING_SKU_COPY_FAILED"
                                toastEntityType="product"
                              />
                            </span>
                          </>
                        ) : null}
                        {exibirPreco ? (
                          <>
                            <span className="concorrencia-incluir-modal__meta-sep" aria-hidden>
                              |
                            </span>
                            <span className="concorrencia-incluir-modal__meta-price">{precoTxt}</span>
                          </>
                        ) : null}
                        {temMetaAnteriorVendas ? (
                          <span className="concorrencia-incluir-modal__meta-sep" aria-hidden>
                            |
                          </span>
                        ) : null}
                        <span
                          className={[
                            "concorrencia-incluir-modal__meta-sales",
                            vendasNumero === 0 ? "concorrencia-incluir-modal__meta-sales--zero" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {vendasTxt}
                        </span>
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="s7-concorrencia-modal__foot concorrencia-incluir-modal__foot">
          <span className="concorrencia-incluir-modal__count">
            {selectedCount > 0 ? `${selectedCount} selecionado(s)` : "Nenhum selecionado"}
          </span>
          <S7Button type="button" variant="primary" onClick={() => void handleConfirm()} disabled={!canConfirm}>
            {saving ? (
              <>
                <S7Icon name="loader" size={14} />
                Incluindo…
              </>
            ) : (
              "Confirmar inclusão"
            )}
          </S7Button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
