import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import S7Button from "../../../components/ui/S7Button.jsx";
import S7EmptyState from "../../../components/ui/S7EmptyState.jsx";
import S7Icon from "../../../components/ui/S7Icon.jsx";
import S7Input from "../../../components/ui/S7Input.jsx";
import S7Pagination from "../../../components/ui/S7Pagination.jsx";
import { S7ClearFiltersAction, S7SearchInputBusyIndicator } from "../../../components/searchFilters";
import {
  fetchPendingListingSkus,
  saveListingSkusBatch,
} from "../api/listingSkuApi.js";
import { refreshOperationalTasksAfterListingSkuSaved } from "../../dashboard/operationalTasks/refreshOperationalTasksAfterListingSkuSaved.js";
import { fetchMercadoLivreMarketplaceAccounts } from "../../../services/marketplaceAccountsApi.js";
import { enrichListingRowsAccountVisual } from "../utils/enrichListingRowAccountVisual.js";
import "../../../components/S7OperationalRowCard.css";
import "../../../styles/tokens/s7-operational-thumb.css";
import "../../../components/catalog/S7CatalogListingHeadline.css";
import "../../../components/catalog/S7CatalogAccountCell.css";
import "../../../components/searchFilters/S7SearchFiltersCard.css";
import "../../../components/searchFilters/S7ClearFiltersAction.css";
import "../../../components/searchFilters/S7SearchInputBusyIndicator.css";
import BulkListingSkuRow from "./BulkListingSkuRow.jsx";
import "./listingSkuLookupPanel.css";
import "./BulkListingSkuModal.css";

const PAGE_SIZE = 25;

const HEAD_COLUMNS = [
  { key: "thumb", label: "", align: "center" },
  { key: "listing", label: "Anúncio", align: "center" },
  { key: "account", label: "Conta", align: "center" },
  { key: "channel", label: "Canal", align: "center" },
  { key: "sku", label: "SKU do produto *", align: "center" },
];

function rowKey(row) {
  return String(row.listing_id);
}

function resultError(result) {
  if (!result || typeof result !== "object") return "";
  const status = String(result.status || "").toUpperCase();
  if (result.ok === true || status === "SUCCESS" || status === "UPDATED") return "";
  return String(result.message || result.code || "Não foi possível salvar este SKU.");
}

export default function BulkListingSkuModal({ open, onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [initialLoading, setInitialLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState(() => new Map());
  const [rowErrors, setRowErrors] = useState(() => new Map());
  const [readyVersion, setReadyVersion] = useState(0);
  /** @type {React.MutableRefObject<Map<string, { isReady: boolean; trimmedSku: string; selectedProductId: string }>>} */
  const resolutionsRef = useRef(new Map());
  const requestRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  /** @type {React.MutableRefObject<Record<string, unknown>[]>} */
  const mlAccountsRef = useRef([]);
  /** @type {React.MutableRefObject<ReturnType<typeof setTimeout> | null>} */
  const debounceTimerRef = useRef(null);

  const isListBusy = initialLoading || refreshing;
  const isSearchFetching = isListBusy && hasLoadedOnce;

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setDebouncedSearch(searchInput.trim()), 250);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [debouncedSearch, open]);

  const handleClearSearch = useCallback(() => {
    if (!searchInput.trim()) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
    requestAnimationFrame(() => {
      const input = document.querySelector('input[name="bulk-listing-sku-search"]');
      if (input instanceof HTMLInputElement) input.focus();
    });
  }, [searchInput]);

  const loadPage = useCallback(async () => {
    if (!open) return null;
    const request = ++requestRef.current;
    const isRefresh = hasLoadedOnceRef.current;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }
    setError("");

    if (mlAccountsRef.current.length === 0) {
      const accountsRes = await fetchMercadoLivreMarketplaceAccounts();
      mlAccountsRef.current =
        accountsRes.ok && Array.isArray(accountsRes.data?.accounts)
          ? /** @type {Record<string, unknown>[]} */ (accountsRes.data.accounts)
          : [];
    }

    const result = await fetchPendingListingSkus({ page, pageSize: PAGE_SIZE, q: debouncedSearch });
    if (request !== requestRef.current) return null;

    if (!result.ok) {
      setInitialLoading(false);
      setRefreshing(false);
      setError(result.error || "Não foi possível carregar os anúncios.");
      if (!isRefresh) {
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      }
      return null;
    }

    setInitialLoading(false);
    setRefreshing(false);
    hasLoadedOnceRef.current = true;
    setHasLoadedOnce(true);
    setItems(enrichListingRowsAccountVisual(result.items, mlAccountsRef.current));
    setTotal(result.total);
    setTotalPages(result.total_pages);
    return result.total;
  }, [open, page, debouncedSearch]);

  useEffect(() => {
    if (!open) return undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPage();
    return () => {
      requestRef.current += 1;
    };
  }, [open, loadPage]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchInput("");
      setDebouncedSearch("");
      setPage(1);
      setError("");
      setDrafts(new Map());
      setRowErrors(new Map());
      resolutionsRef.current = new Map();
      setReadyVersion(0);
      setInitialLoading(false);
      setRefreshing(false);
      hasLoadedOnceRef.current = false;
      setHasLoadedOnce(false);
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      requestRef.current += 1;
      mlAccountsRef.current = [];
    }
  }, [open]);

  const readyDrafts = useMemo(() => {
    void readyVersion;
    return [...resolutionsRef.current.entries()]
      .filter(([, resolution]) => resolution.isReady && resolution.trimmedSku)
      .map(([listingId, resolution]) => ({
        listing_id: listingId,
        sku: resolution.trimmedSku,
        ...(resolution.selectedProductId
          ? { selected_product_id: resolution.selectedProductId }
          : {}),
      }));
  }, [readyVersion]);

  const updateDraft = useCallback((listingId, value) => {
    setDrafts((current) => {
      const next = new Map(current);
      next.set(listingId, value);
      return next;
    });
    setRowErrors((current) => {
      const next = new Map(current);
      next.delete(listingId);
      return next;
    });
  }, []);

  const handleResolutionChange = useCallback((listingId, payload) => {
    if (!payload.isReady && !payload.trimmedSku) {
      resolutionsRef.current.delete(listingId);
    } else {
      resolutionsRef.current.set(listingId, payload);
    }
    setReadyVersion((version) => version + 1);
  }, []);

  const handleSave = useCallback(async () => {
    if (saving || readyDrafts.length === 0) return;
    setSaving(true);
    setError("");
    const result = await saveListingSkusBatch({ items: readyDrafts });
    setSaving(false);

    if (!result.ok && result.results.length === 0) {
      setError(result.error || "Não foi possível salvar os SKUs.");
      return;
    }

    const successfulIds = new Set();
    const nextErrors = new Map(rowErrors);
    for (const rowResult of result.results) {
      const key = String(rowResult?.listing_id ?? "");
      const message = resultError(rowResult);
      if (!key) continue;
      if (message) nextErrors.set(key, message);
      else successfulIds.add(key);
    }
    for (const apiError of result.errors) {
      const key = String(apiError?.listing_id ?? "");
      if (key) nextErrors.set(key, String(apiError?.message || apiError?.code || "Erro ao salvar."));
    }
    for (const key of successfulIds) {
      nextErrors.delete(key);
    }
    setDrafts((current) => {
      const next = new Map(current);
      for (const key of successfulIds) next.delete(key);
      return next;
    });
    for (const key of successfulIds) {
      resolutionsRef.current.delete(key);
    }
    setReadyVersion((version) => version + 1);
    setRowErrors(nextErrors);
    if (successfulIds.size > 0) {
      const remainingCount = await loadPage();
      await refreshOperationalTasksAfterListingSkuSaved();
      await Promise.resolve(onSaved?.({
        remainingCount: typeof remainingCount === "number" ? remainingCount : undefined,
        totalUpdated: successfulIds.size,
        totalSkipped: Number(result.total_skipped) || nextErrors.size,
      }));
    }
    if (nextErrors.size > 0) {
      setError("Algumas linhas não foram salvas. Corrija os erros indicados e tente novamente.");
    }
  }, [readyDrafts, loadPage, onSaved, rowErrors, saving]);

  if (!open) return null;

  const showInitialLoading = initialLoading && !hasLoadedOnce;
  const showAllComplete =
    hasLoadedOnce && !isListBusy && total === 0 && !error && !debouncedSearch;
  const showNoSearchResults =
    hasLoadedOnce && !isListBusy && total === 0 && !error && Boolean(debouncedSearch);

  const counterLabel = (() => {
    if (showInitialLoading) return "Carregando anúncios...";
    if (!hasLoadedOnce) return "Carregando anúncios...";
    if (showNoSearchResults) return "Nenhum anúncio encontrado";
    if (total > 0) {
      return `${total.toLocaleString("pt-BR")} anúncio${total === 1 ? "" : "s"} pendente${total === 1 ? "" : "s"}`;
    }
    return "Nenhum anúncio pendente";
  })();

  const modal = (
    <div className="bulk-listing-sku-modal__overlay" role="presentation" onMouseDown={() => !saving && onClose()}>
      <section
        className="bulk-listing-sku-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-listing-sku-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="bulk-listing-sku-modal__header">
          <h2 id="bulk-listing-sku-title" className="bulk-listing-sku-modal__title">
            Cadastrar SKUs em lote
          </h2>
        </header>

        <div className="bulk-listing-sku-modal__toolbar">
          <div className="bulk-listing-sku-modal__search-cluster">
            <div
              className="s7-search-filters-card__title-block s7-search-filters-card__title-block--icon-only"
              aria-hidden
            >
              <span
                className="s7-search-filters-card__header-icon bulk-listing-sku-modal__search-header-icon"
                aria-hidden
              >
                <S7Icon name="search" size={16} strokeWidth={1.85} />
              </span>
            </div>
            <div className="bulk-listing-sku-modal__search-inline">
              <div className="s7-search-filters-card__field s7-search-filters-card__field--search">
                <div
                  className="products-catalog__search-wrap anuncios-catalog__filters-search bulk-listing-sku-modal__search-wrap"
                  aria-busy={isSearchFetching || undefined}
                >
                  <S7Input
                    label=""
                    name="bulk-listing-sku-search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Buscar por anúncio ou ID"
                    disabled={saving}
                    className="products-catalog__search-s7"
                    inputClassName="products-catalog__search-input-field s7-search-filters-card__search-input-field bulk-listing-sku-modal__search-input"
                    autoComplete="off"
                    aria-label="Buscar por anúncio ou ID"
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
          <p className="bulk-listing-sku-modal__counter" aria-live="polite">
            {counterLabel}
          </p>
        </div>

        <div className="bulk-listing-sku-modal__list-area">
          <div className="bulk-listing-sku-modal__content-gutter">
            <div className="bulk-listing-sku-modal__list-shell">
              <div
                className="bulk-listing-sku-modal__grid bulk-listing-sku-modal__grid--head products-catalog__grid products-catalog__grid--head"
                role="row"
              >
                {HEAD_COLUMNS.map((col) => (
                  <div
                    key={col.key}
                    className={[
                      "products-catalog__cell",
                      "products-catalog__col-head",
                      "bulk-listing-sku-modal__cell",
                      `bulk-listing-sku-modal__cell--${col.key}`,
                      `bulk-listing-sku-modal__cell--align-${col.align}`,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    role="columnheader"
                    aria-hidden={col.key === "thumb" ? true : undefined}
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              <div
                className={[
                  "bulk-listing-sku-modal__scroll",
                  showAllComplete || showNoSearchResults ? "bulk-listing-sku-modal__scroll--empty" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {showInitialLoading ? (
                  <div className="bulk-listing-sku-modal__loading-row" role="status" aria-live="polite">
                    <span className="bulk-listing-sku-modal__loading-spinner" aria-hidden />
                    <span>Carregando anúncios...</span>
                  </div>
                ) : null}

                {!showInitialLoading && error && !items.length ? (
                  <p className="bulk-listing-sku-modal__error">{error}</p>
                ) : null}

                {showAllComplete ? (
                  <S7EmptyState
                    title="Nenhum SKU pendente"
                    description="Todos os anúncios deste escopo estão resolvidos."
                  />
                ) : null}

                {showNoSearchResults ? (
                  <p className="bulk-listing-sku-modal__no-results">Nenhum anúncio encontrado.</p>
                ) : null}

                {!showInitialLoading && items.length > 0 ? (
                  <div className="bulk-listing-sku-modal__card-stack">
                    {items.map((row) => {
                      const key = rowKey(row);
                      const value = drafts.get(key) ?? row.seller_sku ?? "";
                      const rowError = rowErrors.get(key) || "";

                      return (
                        <BulkListingSkuRow
                          key={key}
                          row={row}
                          skuValue={String(value ?? "")}
                          rowError={rowError}
                          saving={saving}
                          onSkuChange={updateDraft}
                          onResolutionChange={handleResolutionChange}
                        />
                      );
                    })}
                  </div>
                ) : null}

                {!showInitialLoading && totalPages > 1 ? (
                  <S7Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    noun="anúncios pendentes"
                    ariaLabel="Paginação de anúncios com SKU pendente"
                    onPrevious={() => setPage((value) => Math.max(1, value - 1))}
                    onNext={() => setPage((value) => Math.min(totalPages, value + 1))}
                    disabled={saving}
                    className="bulk-listing-sku-modal__pagination"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <footer className="bulk-listing-sku-modal__footer">
          <span className="bulk-listing-sku-modal__footer-summary" aria-live="polite">
            {readyDrafts.length > 0
              ? `${readyDrafts.length} anúncio${readyDrafts.length === 1 ? "" : "s"} pronto${readyDrafts.length === 1 ? "" : "s"} para salvar`
              : "Informe e valide os SKUs para salvar"}
          </span>
          <div className="bulk-listing-sku-modal__footer-actions">
            {error && items.length > 0 ? (
              <p className="bulk-listing-sku-modal__footer-error" role="alert">
                {error}
              </p>
            ) : null}
            <S7Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void handleSave()}
              disabled={isListBusy || saving || readyDrafts.length === 0}
            >
              {saving ? "Salvando…" : "Salvar SKUs"}
            </S7Button>
          </div>
        </footer>
      </section>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
}
