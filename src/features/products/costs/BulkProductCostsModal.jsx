import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  PRODUCT_EXPEDITION_SUPPLIES_LABEL_COMPACT,
  PRODUCT_EXPEDITION_SUPPLIES_TOOLTIP,
} from "../../../domain/costs/costSemanticsPresentation.js";
import S7Tooltip from "../../../components/ui/S7Tooltip.jsx";
import S7Button from "../../../components/ui/S7Button.jsx";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../../../components/ui/S7CopyButton.jsx";
import S7Icon from "../../../components/ui/S7Icon.jsx";
import S7Input from "../../../components/ui/S7Input.jsx";
import S7Pagination from "../../../components/ui/S7Pagination.jsx";
import S7EmptyState from "../../../components/ui/S7EmptyState.jsx";
import { S7ClearFiltersAction, S7SearchInputBusyIndicator } from "../../../components/searchFilters";
import { useNotifications } from "../../../contexts/NotificationContext.jsx";
import { NOTIFICATION_SEVERITY } from "../../../services/notificationTypes.js";
import {
  clearSignupFieldValidityForField,
  showSignupFieldValidation,
} from "../../../components/signupFormPresentation.js";
import { useProductMainImageSrc } from "../../../utils/productImageDisplayUrl.js";
import {
  formatBrlFromApiValue,
  formatBrlTypingWithSymbol,
  validateProductCostsDraft,
} from "./productCostsDomain.js";
import { fetchPendingProductCosts, saveProductCostsBatch } from "./productCostsApi.js";
import { notifyProductCostsSaved } from "../../dashboard/operationalTasks/operationalTasksApi.js";
import { enrichPendingProductsCatalogMedia } from "./enrichPendingProductsCatalogMedia.js";
import "../../../components/S7OperationalRowCard.css";
import "../../../components/catalog/S7CatalogListingHeadline.css";
import "../../../components/searchFilters/S7SearchFiltersCard.css";
import "../../../components/searchFilters/S7ClearFiltersAction.css";
import "../../../components/searchFilters/S7SearchInputBusyIndicator.css";
import "./BulkProductCostsModal.css";

const PAGE_SIZE = 25;
const PRODUCT_COST_REQUIRED_MSG = "Informe o custo do produto.";

const HEAD_COLUMNS = [
  { key: "thumb", label: "", align: "center" },
  { key: "product", label: "Produto", align: "center" },
  { key: "sku", label: "SKU", align: "center" },
  { key: "listings", label: "Anúncios", align: "center" },
  { key: "cost_price", label: "Custo do produto", align: "center", required: true },
  { key: "packaging_cost", label: "Custo da embalagem", align: "center" },
  { key: "operational_cost", label: PRODUCT_EXPEDITION_SUPPLIES_LABEL_COMPACT, align: "center", tooltip: PRODUCT_EXPEDITION_SUPPLIES_TOOLTIP },
];

/**
 * @param {Record<string, unknown>} row
 */
function toProductImageSnapshot(row) {
  return {
    id: row?.product_id,
    product_image_links: row?.product_image_links,
    product_images: row?.product_images,
    format: row?.format,
    product_variants: row?.product_variants,
  };
}

/**
 * @param {{ row: Record<string, unknown> }} props
 */
function ProductCostBulkThumb({ row }) {
  const snapshot = useMemo(
    () => toProductImageSnapshot(row),
    [
      row?.product_id,
      row?.product_image_links,
      row?.product_images,
      row?.format,
      row?.product_variants,
    ]
  );
  const src = useProductMainImageSrc(snapshot);

  return (
    <div className="bulk-product-costs-modal__thumb-cell">
      {src ? (
        <span
          className="bulk-product-costs-modal__thumb-wrap s7-operational-thumb-frame s7-operational-thumb-frame--circle"
          aria-hidden
        >
          <img
            src={src}
            alt=""
            className="bulk-product-costs-modal__thumb s7-operational-thumb"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </span>
      ) : (
        <span className="bulk-product-costs-modal__thumb-slot" aria-hidden />
      )}
    </div>
  );
}

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   onSaved?: (payload?: { remainingCount: number }) => void | Promise<void>;
 * }} props
 */
export default function BulkProductCostsModal({ open, onClose, onSaved }) {
  const { addNotification } = useNotifications();
  const [initialLoading, setInitialLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [draftTick, setDraftTick] = useState(0);

  /** @type {React.MutableRefObject<ReturnType<typeof setTimeout> | null>} */
  const debounceTimerRef = useRef(null);

  /** @type {React.MutableRefObject<Map<string, { dirty: boolean; cost_price: string; packaging_cost: string; operational_cost: string; rowError?: string }>>} */
  const draftsRef = useRef(new Map());
  /** @type {React.MutableRefObject<number>} */
  const loadRequestSeqRef = useRef(0);
  /** @type {React.MutableRefObject<boolean>} */
  const hasLoadedOnceRef = useRef(false);

  /** @type {React.MutableRefObject<Map<string, string>>} */
  const rowErrorsRef = useRef(new Map());
  /** @type {React.MutableRefObject<Set<string>>} */
  const attemptedInvalidCostRef = useRef(new Set());
  const formRef = useRef(/** @type {HTMLFormElement | null} */ (null));

  const isListBusy = initialLoading || refreshing;
  const isSearchFetching = isListBusy && hasLoadedOnce;

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setDebouncedSearch(searchInput.trim()), 220);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    if (!searchInput.trim()) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
    requestAnimationFrame(() => {
      const input = document.querySelector('input[name="bulk-product-costs-search"]');
      if (input instanceof HTMLInputElement) input.focus();
    });
  }, [searchInput]);

  const loadPage = useCallback(async () => {
    if (!open) return null;
    const seq = ++loadRequestSeqRef.current;
    const isRefresh = hasLoadedOnceRef.current;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }
    setError("");

    const result = await fetchPendingProductCosts({
      page,
      pageSize: PAGE_SIZE,
      q: debouncedSearch || undefined,
    });

    if (seq !== loadRequestSeqRef.current) return null;

    if (!result.ok) {
      setInitialLoading(false);
      setRefreshing(false);
      setError(result.error || "Não foi possível carregar os produtos.");
      if (!isRefresh) {
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      }
      return null;
    }

    const enriched = await enrichPendingProductsCatalogMedia(result.items);
    if (seq !== loadRequestSeqRef.current) return null;

    setInitialLoading(false);
    setRefreshing(false);
    hasLoadedOnceRef.current = true;
    setHasLoadedOnce(true);
    setItems(enriched);
    setTotal(result.total);
    setTotalPages(result.total_pages);
    return result.total;
  }, [open, page, debouncedSearch]);

  useEffect(() => {
    if (!open) return;
    void loadPage();
  }, [open, loadPage]);

  useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [debouncedSearch, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      draftsRef.current.clear();
      rowErrorsRef.current.clear();
      setSearchInput("");
      setDebouncedSearch("");
      setPage(1);
      setError("");
      setDraftTick(0);
      setInitialLoading(false);
      setRefreshing(false);
      hasLoadedOnceRef.current = false;
      setHasLoadedOnce(false);
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      loadRequestSeqRef.current += 1;
    }
  }, [open]);

  const getDraftForRow = useCallback((row) => {
    const pid = String(row.product_id);
    const existing = draftsRef.current.get(pid);
    if (existing) return existing;
    return {
      dirty: false,
      cost_price: formatBrlFromApiValue(row.cost_price),
      packaging_cost: formatBrlFromApiValue(row.packaging_cost),
      operational_cost: formatBrlFromApiValue(row.operational_cost),
    };
  }, []);

  const updateDraft = useCallback((productId, patch) => {
    const pid = String(productId);
    const prev = draftsRef.current.get(pid) || { dirty: false, cost_price: "", packaging_cost: "", operational_cost: "" };
    draftsRef.current.set(pid, { ...prev, ...patch, dirty: true });
    rowErrorsRef.current.delete(pid);
    if (Object.prototype.hasOwnProperty.call(patch, "cost_price")) {
      attemptedInvalidCostRef.current.delete(pid);
      clearSignupFieldValidityForField(formRef.current, `bulk-cost-${pid}-product`);
    }
    setDraftTick((n) => n + 1);
  }, []);

  const readyDrafts = useMemo(() => {
    void draftTick;
    /** @type {Array<{ product_id: string; cost_price: string; packaging_cost: string; operational_cost: string }>} */
    const out = [];
    for (const [productId, draft] of draftsRef.current.entries()) {
      if (!draft.dirty) continue;
      const validation = validateProductCostsDraft(draft);
      if (validation.ok && validation.costs) {
        out.push({ product_id: productId, ...validation.costs });
      }
    }
    return out;
  }, [draftTick]);

  const readyCount = readyDrafts.length;

  const handleSave = async () => {
    if (saving) return;

    void draftTick;
    /** @type {string[]} */
    const invalidDirtyIds = [];
    for (const [productId, draft] of draftsRef.current.entries()) {
      if (!draft.dirty) continue;
      const validation = validateProductCostsDraft(draft);
      if (!validation.ok) {
        invalidDirtyIds.push(productId);
        rowErrorsRef.current.set(productId, PRODUCT_COST_REQUIRED_MSG);
      }
    }
    if (invalidDirtyIds.length > 0) {
      for (const id of invalidDirtyIds) attemptedInvalidCostRef.current.add(id);
      setDraftTick((n) => n + 1);
      addNotification({
        event_type: "PRODUCT_COSTS_REQUIRED",
        entity_type: "product",
        entity_id: null,
        title: "Campos obrigatórios",
        message: PRODUCT_COST_REQUIRED_MSG,
        severity: NOTIFICATION_SEVERITY.ERROR,
      });
      const firstPid = invalidDirtyIds[0];
      showSignupFieldValidation(
        formRef.current,
        `bulk-cost-${firstPid}-product`,
        PRODUCT_COST_REQUIRED_MSG,
      );
      return;
    }

    if (readyCount === 0) return;
    setSaving(true);
    setError("");
    const result = await saveProductCostsBatch(readyDrafts);
    setSaving(false);

    const savedIds = new Set((result.saved || []).map((s) => String(s.product_id)));
    for (const id of savedIds) {
      draftsRef.current.delete(id);
      rowErrorsRef.current.delete(id);
    }

    for (const fail of result.failed || []) {
      const pid = String(fail.product_id || "");
      if (pid) rowErrorsRef.current.set(pid, String(fail.message || "Erro ao salvar"));
    }

    if (savedIds.size > 0) {
      setItems((prev) => prev.filter((row) => !savedIds.has(String(row.product_id))));
      setDraftTick((n) => n + 1);

      const remainingCount = await loadPage();
      if (typeof remainingCount === "number") {
        notifyProductCostsSaved({ remainingCount });
        void onSaved?.({ remainingCount });
      }
    }

    const failedCount = (result.failed || []).length;
    if (savedIds.size > 0 && failedCount === 0) {
      addNotification({
        event_type: "GENERIC",
        entity_type: "product",
        title: "Custos salvos",
        message: `${savedIds.size} produto${savedIds.size === 1 ? "" : "s"} tiveram seus custos salvos com sucesso.`,
        severity: NOTIFICATION_SEVERITY.INFO,
      });
    } else if (savedIds.size > 0 && failedCount > 0) {
      addNotification({
        event_type: "GENERIC",
        entity_type: "product",
        title: "Salvamento parcial",
        message: `${savedIds.size} produto${savedIds.size === 1 ? "" : "s"} salvos. ${failedCount} precisam de atenção.`,
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
    } else if (!result.ok) {
      setError(result.error || "Não foi possível salvar os custos.");
    } else if (failedCount > 0) {
      setError("Revise os produtos com erro e tente novamente.");
    } else {
      setDraftTick((n) => n + 1);
    }
  };

  if (!open) return null;

  const showInitialLoading = initialLoading && !hasLoadedOnce;
  const showAllComplete =
    hasLoadedOnce && !isListBusy && total === 0 && !error && !debouncedSearch;
  const showNoSearchResults =
    hasLoadedOnce && !isListBusy && total === 0 && !error && Boolean(debouncedSearch);

  const counterLabel = (() => {
    if (showInitialLoading) return "Carregando produtos...";
    if (!hasLoadedOnce) return "Carregando produtos...";
    if (showNoSearchResults) return "Nenhum produto encontrado";
    if (total > 0) {
      return `${total.toLocaleString("pt-BR")} produto${total === 1 ? "" : "s"} pendente${total === 1 ? "" : "s"}`;
    }
    return "Nenhum produto pendente";
  })();

  const modalNode = (
    <div
      className="bulk-product-costs-modal__overlay"
      onMouseDown={() => (!saving ? onClose() : undefined)}
      role="presentation"
    >
      <div
        className="bulk-product-costs-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-product-costs-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="bulk-product-costs-modal__header">
          <h3 id="bulk-product-costs-modal-title" className="bulk-product-costs-modal__title">
            Cadastrar custos em lote
          </h3>
        </div>

        <div className="bulk-product-costs-modal__toolbar">
          <div className="bulk-product-costs-modal__search-cluster">
            <div
              className="s7-search-filters-card__title-block s7-search-filters-card__title-block--icon-only"
              aria-hidden
            >
              <span
                className="s7-search-filters-card__header-icon bulk-product-costs-modal__search-header-icon"
                aria-hidden
              >
                <S7Icon name="search" size={16} strokeWidth={1.85} />
              </span>
            </div>
            <div className="bulk-product-costs-modal__search-inline">
              <div className="s7-search-filters-card__field s7-search-filters-card__field--search">
                <div
                  className="products-catalog__search-wrap anuncios-catalog__filters-search bulk-product-costs-modal__search-wrap"
                  aria-busy={isSearchFetching || undefined}
                >
                  <S7Input
                    label=""
                    name="bulk-product-costs-search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Nome do produto ou SKU"
                    disabled={saving}
                    className="products-catalog__search-s7"
                    inputClassName="products-catalog__search-input-field s7-search-filters-card__search-input-field bulk-product-costs-modal__search-input"
                    autoComplete="off"
                    aria-label="Buscar por nome do produto ou SKU"
                    rightElement={isSearchFetching ? <S7SearchInputBusyIndicator /> : null}
                  />
                </div>
              </div>
              <div className="s7-search-filters-card__field s7-search-filters-card__field--clear">
                <S7ClearFiltersAction
                  label="Limpar"
                  ariaLabel="Limpar busca"
                  disabled={!searchInput.trim() || saving}
                  onClick={handleClearSearch}
                />
              </div>
            </div>
          </div>
          <p className="bulk-product-costs-modal__counter" aria-live="polite">
            {counterLabel}
          </p>
        </div>

        <form
          ref={formRef}
          className="bulk-product-costs-modal__list-area"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <div className="bulk-product-costs-modal__content-gutter">
            <div className="bulk-product-costs-modal__list-shell">
              <div
                className="bulk-product-costs-modal__grid bulk-product-costs-modal__grid--head products-catalog__grid products-catalog__grid--head"
                role="row"
              >
              {HEAD_COLUMNS.map((col) => (
                <div
                  key={col.key}
                  className={[
                    "products-catalog__cell",
                    "products-catalog__col-head",
                    "bulk-product-costs-modal__cell",
                    `bulk-product-costs-modal__cell--${col.key}`,
                    `bulk-product-costs-modal__cell--align-${col.align}`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  role="columnheader"
                  aria-hidden={col.key === "thumb" ? true : undefined}
                >
                  {col.tooltip ? (
                    <span className="bulk-product-costs-modal__head-label-wrap">
                      <span>
                        {col.label}
                        {col.required ? (
                          <span className="s7-input__required" aria-hidden="true">
                            {" "}
                            *
                          </span>
                        ) : null}
                      </span>
                      <S7Tooltip content={col.tooltip} placement="top" offset={6} wrap>
                        <button
                          type="button"
                          className="bulk-product-costs-modal__head-info-btn"
                          aria-label={`Informações sobre ${col.label}`}
                        >
                          <S7Icon name="info" size={12} strokeWidth={2} />
                        </button>
                      </S7Tooltip>
                    </span>
                  ) : (
                    <span>
                      {col.label}
                      {col.required ? (
                        <span className="s7-input__required" aria-hidden="true">
                          {" "}
                          *
                        </span>
                      ) : null}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div
              className={[
                "bulk-product-costs-modal__scroll",
                showAllComplete || showNoSearchResults ? "bulk-product-costs-modal__scroll--empty" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {showInitialLoading ? (
                <div className="bulk-product-costs-modal__loading-row" role="status" aria-live="polite">
                  <span className="bulk-product-costs-modal__loading-spinner" aria-hidden />
                  <span>Carregando produtos...</span>
                </div>
              ) : null}
              {!showInitialLoading && error ? (
                <p className="bulk-product-costs-modal__error">{error}</p>
              ) : null}

              {showAllComplete ? (
                <S7EmptyState
                  title="Tudo certo!"
                  description="Todos os produtos já possuem os custos cadastrados."
                />
              ) : null}

              {showNoSearchResults ? (
                <p className="bulk-product-costs-modal__no-results">Nenhum produto encontrado.</p>
              ) : null}

              {!showInitialLoading && !error && items.length > 0 ? (
                <div className="bulk-product-costs-modal__card-stack">
                  {items.map((row) => {
                    const pid = String(row.product_id);
                    void draftTick;
                    const draft = getDraftForRow(row);
                    const rowError = rowErrorsRef.current.get(pid) || "";
                    const validation = validateProductCostsDraft(draft);
                    const showCostRequiredUx =
                      attemptedInvalidCostRef.current.has(pid) && draft.dirty && !validation.ok;
                    const productName = String(row.product_name || "Sem nome").trim() || "Sem nome";
                    const skuText = String(row.sku || "").trim();
                    const linkedCount = Math.max(0, Number(row.linked_listings_count) || 0);
                    const linkedCountLabel = linkedCount.toLocaleString("pt-BR");

                    return (
                      <div
                        key={pid}
                        className={[
                          "bulk-product-costs-modal__row",
                          "s7-operational-row-card",
                          rowError ? "bulk-product-costs-modal__row--error" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        role="row"
                      >
                        <div className="bulk-product-costs-modal__cell bulk-product-costs-modal__cell--thumb" role="cell">
                          <ProductCostBulkThumb row={row} />
                        </div>

                        <div className="bulk-product-costs-modal__cell bulk-product-costs-modal__cell--product" role="cell">
                          <div
                            className="bulk-product-costs-modal__product-headline products-catalog__headline-vendas-parity"
                            role="presentation"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <div className="bulk-product-costs-modal__product-title-flow products-catalog__name-inline s7-catalog-headline__title-slot">
                              <span className="bulk-product-costs-modal__product-name s7-catalog-headline__title">
                                <span
                                  className="bulk-product-costs-modal__product-title-float-spacer"
                                  aria-hidden
                                />
                                <span className="bulk-product-costs-modal__product-copy-slot">
                                  <S7CopyButton
                                    value={productName}
                                    ariaLabel={`Copiar nome do produto ${productName}`}
                                    tooltipText="Copiar nome do produto"
                                    toastLabel="Nome do produto"
                                    showToast={true}
                                    iconMode="unicode"
                                    flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                                    flashKey={`bulk-product-name-${pid}`}
                                    toastEntityType="product"
                                  />
                                </span>
                                <span className="bulk-product-costs-modal__product-name-text">
                                  {productName}
                                </span>
                              </span>
                            </div>
                            {rowError ? (
                              <p className="bulk-product-costs-modal__row-error-msg">{rowError}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="bulk-product-costs-modal__cell bulk-product-costs-modal__cell--sku" role="cell">
                          <span
                            className="s7-copy-group bulk-product-costs-modal__sku-group products-catalog__sku-row"
                            role="presentation"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <span className="bulk-product-costs-modal__sku-value anuncios-ad-sku-value">
                              {skuText || "—"}
                            </span>
                            {skuText ? (
                              <S7CopyButton
                                value={skuText}
                                ariaLabel={`Copiar SKU ${skuText}`}
                                tooltipText="Copiar SKU"
                                toastLabel="SKU"
                                showToast={true}
                                iconMode="unicode"
                                flashMs={S7_COPY_OFFICIAL_FLASH_MS}
                                flashKey={`bulk-product-sku-${pid}`}
                                toastEventType="LISTING_SKU_COPIED"
                                toastFailEventType="LISTING_SKU_COPY_FAILED"
                                toastEntityType="product"
                              />
                            ) : null}
                          </span>
                        </div>

                        <div
                          className="bulk-product-costs-modal__cell bulk-product-costs-modal__cell--listings"
                          role="cell"
                          aria-label={
                            linkedCount === 1
                              ? `${linkedCountLabel} anúncio`
                              : `${linkedCountLabel} anúncios`
                          }
                        >
                          {linkedCountLabel}
                        </div>

                        <div className="bulk-product-costs-modal__cell bulk-product-costs-modal__cell--cost" role="cell">
                          <S7Input
                            label=""
                            name={`bulk-cost-${pid}-product`}
                            value={draft.cost_price}
                            onChange={(e) =>
                              updateDraft(pid, { cost_price: formatBrlTypingWithSymbol(e.target.value) })
                            }
                            placeholder="R$ 0,00"
                            disabled={saving}
                            error={Boolean(showCostRequiredUx)}
                          />
                        </div>

                        <div className="bulk-product-costs-modal__cell bulk-product-costs-modal__cell--cost" role="cell">
                          <S7Input
                            label=""
                            name={`bulk-cost-${pid}-packaging`}
                            value={draft.packaging_cost}
                            onChange={(e) =>
                              updateDraft(pid, { packaging_cost: formatBrlTypingWithSymbol(e.target.value) })
                            }
                            placeholder="R$ 0,00"
                            disabled={saving}
                            error={false}
                          />
                        </div>

                        <div className="bulk-product-costs-modal__cell bulk-product-costs-modal__cell--cost" role="cell">
                          <S7Input
                            label=""
                            name={`bulk-cost-${pid}-operational`}
                            value={draft.operational_cost}
                            onChange={(e) =>
                              updateDraft(pid, { operational_cost: formatBrlTypingWithSymbol(e.target.value) })
                            }
                            placeholder="R$ 0,00"
                            disabled={saving}
                            error={false}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {!showInitialLoading && totalPages > 1 ? (
                <S7Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  noun="produtos pendentes"
                  onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={saving}
                  className="bulk-product-costs-modal__pagination"
                />
              ) : null}
              </div>
            </div>
          </div>
        </form>

        <div className="bulk-product-costs-modal__footer">
          <span className="bulk-product-costs-modal__footer-summary" aria-live="polite">
            {readyCount > 0
              ? `${readyCount} produto${readyCount === 1 ? "" : "s"} pronto${readyCount === 1 ? "" : "s"} para salvar`
              : "Preencha os custos para salvar"}
          </span>
          <S7Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isListBusy || saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Salvando custos…" : "Salvar custos"}
          </S7Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : modalNode;
}
