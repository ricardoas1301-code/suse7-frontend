// ======================================================================

// Modal — incluir anúncios no monitoramento da Concorrência

// Busca por título, SKU ou número do anúncio (multi-marketplace).

// ======================================================================



import { useCallback, useEffect, useMemo, useState } from "react";

import { createPortal } from "react-dom";

import S7Button from "../ui/S7Button";

import S7Icon from "../ui/S7Icon";

import S7Input from "../ui/S7Input";

import ConcorrenciaIncluirAnuncioCursorTooltip from "../../features/concorrencia/incluirAnuncio/ConcorrenciaIncluirAnuncioCursorTooltip.jsx";

import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton";

import { S7ClearFiltersAction } from "../searchFilters";

import { addMonitoredListings, searchListingsForMonitoring } from "../../services/competitionApi";

import {

  formatarIdAnuncioMlbParaCopia,

  formatPrice,

} from "./concorrenciaCompetitorDisplay";

import {

  criarSetMarketplaceListingsMonitorados,

  extrairChaveMarketplaceListingIncluirModal,

  mesclarResultadosBuscaIncluirModal,

  resolverMensagemVazioBuscaIncluirModal,

} from "../../features/concorrencia/incluirAnuncio/concorrenciaIncluirAnuncioSearchPresentation.js";

import incluirAnuncioAvatar from "../../assets/s7-concorrencia-incluir-anuncio-avatar.png";

import { useNotifications } from "../../contexts/NotificationContext";

import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";

import "../../components/searchFilters/S7SearchFiltersCard.css";



const INCLUIR_MODAL_SEARCH_INPUT_ID = "concorrencia-incluir-modal-search";

const TOOLTIP_ANUNCIO_JA_MONITORADO = "Este anúncio já está sendo monitorado.";



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

 *   row: Record<string, unknown>;

 *   selectedIds: ReadonlySet<string>;

 *   saving: boolean;

 *   onToggleSelection: (listingId: string) => void;

 * }} props

 */

function IncluirAnuncioResultadoRow({ row, selectedIds, saving, onToggleSelection }) {

  const listingId = extrairChaveMarketplaceListingIncluirModal(row);

  const isAlreadyMonitored = Boolean(row.isAlreadyMonitored);

  const checked = !isAlreadyMonitored && selectedIds.has(listingId);

  const thumb = row.listing_thumbnail != null ? String(row.listing_thumbnail) : "";

  const title = String(row.title || row.product_name || "").trim() || "Anúncio sem título";

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



  const metaLine = (

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

            flashKey={`incluir-mlb-${listingId}-${mlbCopiar}`}

            toastEventType="LISTING_ID_COPIED"

            toastFailEventType="LISTING_ID_COPY_FAILED"

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

  );



  const thumbNode = (

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

  );



  const rowClasses = [
    "s7-concorrencia-modal__pick-row",
    isAlreadyMonitored ? "concorrencia-incluir-modal__pick-row--is-already-monitored" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const rowContent = (
    <>
      {isAlreadyMonitored ? (
        <span className="s7-concorrencia-modal__pick-check-slot" aria-hidden="true" />
      ) : (
        <input
          type="checkbox"
          className="s7-concorrencia-modal__pick-check"
          checked={checked}
          onChange={() => onToggleSelection(listingId)}
          disabled={saving}
        />
      )}
      {thumbNode}
      <span className="s7-concorrencia-modal__pick-main">
        <span className="s7-concorrencia-modal__pick-title">{title}</span>
        {metaLine}
      </span>
    </>
  );

  return (
    <li
      className={[
        "s7-concorrencia-modal__pick-item",
        isAlreadyMonitored ? "concorrencia-incluir-modal__pick-item--monitored" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isAlreadyMonitored ? (
        <ConcorrenciaIncluirAnuncioCursorTooltip content={TOOLTIP_ANUNCIO_JA_MONITORADO} wrap>
          <div
            className={rowClasses}
            aria-disabled="true"
            tabIndex={0}
            role="group"
            aria-label={`${title} — indisponível para seleção`}
          >
            {rowContent}
          </div>
        </ConcorrenciaIncluirAnuncioCursorTooltip>
      ) : (
        <label className={rowClasses}>{rowContent}</label>
      )}
    </li>
  );
}



/**

 * @param {{

 *   open: boolean;

 *   onClose: () => void;

 *   onIncluded?: () => void | Promise<void>;

 *   monitoredListings?: readonly Record<string, unknown>[];

 * }} props

 */

export default function ConcorrenciaIncluirAnuncioModal({

  open,

  onClose,

  onIncluded,

  monitoredListings = [],

}) {

  const { addNotification } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");

  const [apiResults, setApiResults] = useState([]);

  const [searching, setSearching] = useState(false);

  const [searchError, setSearchError] = useState(null);

  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [saving, setSaving] = useState(false);



  const monitoredIdsSet = useMemo(

    () => criarSetMarketplaceListingsMonitorados(monitoredListings),

    [monitoredListings],

  );



  useEffect(() => {

    if (!open) {

      setSearchQuery("");

      setApiResults([]);

      setSearchError(null);

      setSelectedIds(new Set());

      setSearching(false);

      setSaving(false);

    }

  }, [open]);



  const runSearch = useCallback(async (query) => {

    const q = String(query ?? "").trim();

    if (!q) {

      setApiResults([]);

      setSearchError(null);

      return;

    }

    setSearching(true);

    setSearchError(null);

    const res = await searchListingsForMonitoring(q, { limit: 50 });

    setSearching(false);

    if (!res.ok) {

      setSearchError(res.error || "Não foi possível buscar anúncios.");

      setApiResults([]);

      return;

    }

    setApiResults(Array.isArray(res.results) ? res.results : []);

  }, []);



  useEffect(() => {

    if (!open) return undefined;

    const q = String(searchQuery ?? "").trim();

    if (!q) {

      setApiResults([]);

      setSearchError(null);

      return undefined;

    }

    const timer = window.setTimeout(() => {

      void runSearch(q);

    }, 320);

    return () => window.clearTimeout(timer);

  }, [open, searchQuery, runSearch]);



  const hasSearchText = Boolean(String(searchQuery ?? "").trim());



  const mergedSearch = useMemo(

    () =>

      mesclarResultadosBuscaIncluirModal(

        apiResults,

        monitoredListings,

        monitoredIdsSet,

        searchQuery,

      ),

    [apiResults, monitoredListings, monitoredIdsSet, searchQuery],

  );



  const displayItems = mergedSearch.items;



  const emptyPresentation = useMemo(

    () =>

      resolverMensagemVazioBuscaIncluirModal({

        searching,

        searchError,

        hasSearchText,

        hasAnyMatch: mergedSearch.hasAnyMatch,

        allMonitored: mergedSearch.allMonitored,

      }),

    [searching, searchError, hasSearchText, mergedSearch.hasAnyMatch, mergedSearch.allMonitored],

  );



  const selectedCount = selectedIds.size;



  const toggleSelection = useCallback((listingId) => {

    const id = String(listingId || "").trim();

    if (!id || monitoredIdsSet.has(id)) return;

    setSelectedIds((prev) => {

      const next = new Set(prev);

      if (next.has(id)) next.delete(id);

      else next.add(id);

      return next;

    });

  }, [monitoredIdsSet]);



  const canConfirm = selectedCount > 0 && !saving;

  const showAllMonitoredHint =

    hasSearchText && mergedSearch.hasAnyMatch && mergedSearch.allMonitored && !searching && !searchError;



  const handleClearSearch = useCallback(() => {

    if (!String(searchQuery ?? "").trim()) return;

    setSearchQuery("");

    window.requestAnimationFrame(() => {

      document.getElementById(INCLUIR_MODAL_SEARCH_INPUT_ID)?.focus();

    });

  }, [searchQuery]);



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
        </header>



        <div className="concorrencia-incluir-modal__content">

          <div className="concorrencia-incluir-modal__main">

            <div className="concorrencia-incluir-modal__search">

              <div className="concorrencia-incluir-modal__search-row">

                <span

                  className="s7-search-filters-card__header-icon concorrencia-incluir-modal__search-icon-box"

                  aria-hidden="true"

                >

                  <S7Icon name="search" size={16} strokeWidth={1.85} />

                </span>

                <div className="concorrencia-incluir-modal__search-field-wrap">

                  <S7Input

                    label=""

                    name={INCLUIR_MODAL_SEARCH_INPUT_ID}

                    value={searchQuery}

                    onChange={(e) => setSearchQuery(e.target.value)}

                    placeholder="Título, SKU ou número do anúncio"

                    className="concorrencia-incluir-modal__search-s7"

                    inputClassName="concorrencia-incluir-modal__search-input-field"

                    autoComplete="off"

                    aria-label="Buscar anúncio por título, SKU ou número do anúncio"

                    autoFocus

                  />

                </div>

                <S7ClearFiltersAction

                  label="Limpar"

                  ariaLabel="Limpar busca"

                  disabled={!hasSearchText}

                  onClick={handleClearSearch}

                />

              </div>

            </div>



            <div className="concorrencia-incluir-modal__results">

              {showAllMonitoredHint ? (

                <p className="concorrencia-incluir-modal__all-monitored-hint">

                  Todos os anúncios encontrados já estão sendo monitorados.

                </p>

              ) : null}



              {displayItems.length === 0 ? (

                emptyPresentation.message ? (

                  <p className="s7-concorrencia-modal__empty">{emptyPresentation.message}</p>

                ) : null

              ) : (

                <ul className="s7-concorrencia-modal__pick-list concorrencia-incluir-modal__list">

                  {displayItems.map((row) => (

                    <IncluirAnuncioResultadoRow

                      key={extrairChaveMarketplaceListingIncluirModal(row)}

                      row={row}

                      selectedIds={selectedIds}

                      saving={saving}

                      onToggleSelection={toggleSelection}

                    />

                  ))}

                </ul>

              )}

            </div>

          </div>



          <aside className="concorrencia-incluir-modal__avatar-col" aria-hidden="true">

            <img

              src={incluirAnuncioAvatar}

              alt=""

              className="concorrencia-incluir-modal__avatar"

              loading="lazy"

              decoding="async"

            />

          </aside>

        </div>



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


