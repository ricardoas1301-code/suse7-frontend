// ======================================================================
// Página Vendas — cards + filtros + tabela; agregados via GET /api/sales/summary (Decimal no servidor).
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildApiUrl, apiFetch } from "../config/api";
import { fetchMercadoLivreMarketplaceAccounts } from "../services/marketplaceAccountsApi";
import SaleDetailModal from "../components/sales/SaleDetailModal";
import S7Input from "../components/ui/S7Input";
import S7Icon from "../components/ui/S7Icon";
import { getSaleHealthUi } from "../utils/saleHealthUi";
import { SALES_FILTER_CHIPS } from "../utils/salesToolbarFilters";
import S7CatalogAccountCell, {
  S7CatalogChannelCell,
  pickCatalogAccountFields,
} from "../components/catalog/S7CatalogAccountCell.jsx";
import S7CopyButton from "../components/ui/S7CopyButton";
import S7Button from "../components/ui/S7Button";
import QuickProductCostsModal from "../features/listings/components/QuickProductCostsModal.jsx";
import { resolveSalesRowProductThumbUrl, salesRowThumbCacheKey } from "../utils/resolveSalesRowProductThumbUrl.js";
import "../components/Products.css";
import "../components/Anuncios.css";
import "../styles/VendasPage.css";

const DASH = "—";
const DEFAULT_PAGE_SIZE = 50;

/** @returns {{ date: string; time: string } | null} */
function formatSaleDateParts(iso) {
  if (iso == null || String(iso).trim() === "") return null;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  return {
    date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

/** @param {string | undefined} name */
function buyerInitials(name) {
  const s = name != null ? String(name).trim() : "";
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Avatar comprador: foto ML ou iniciais; se a URL falhar, cai para iniciais. */
function VendasBuyerAvatarStack({ photoUrl, displayName }) {
  const [broken, setBroken] = useState(false);
  const photo = photoUrl != null && String(photoUrl).trim() !== "" ? String(photoUrl).trim() : "";
  useEffect(() => {
    setBroken(false);
  }, [photo]);
  const showPhoto = photo !== "" && !broken;
  if (showPhoto) {
    return (
      <img
        className="vendas-page__buyer-avatar"
        src={photo}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className="vendas-page__buyer-avatar vendas-page__buyer-avatar--initials" aria-hidden>
      {buyerInitials(displayName || undefined)}
    </span>
  );
}

/** Thumbnail do produto — mesma resolução que catálogo (https + galeria + links + raw ML). */
function VendasSalesProductThumb({ row }) {
  const [src, setSrc] = useState("");
  const [broken, setBroken] = useState(false);
  const cacheKey = useMemo(() => salesRowThumbCacheKey(/** @type {Record<string, unknown>} */ (row)), [row]);

  useEffect(() => {
    let cancelled = false;
    setSrc("");
    setBroken(false);
    (async () => {
      const u = await resolveSalesRowProductThumbUrl(/** @type {Record<string, unknown>} */ (row));
      if (!cancelled) setSrc(u != null && String(u).trim() !== "" ? String(u).trim() : "");
    })();
    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  const showImg = src !== "" && !broken;
  if (showImg) {
    return (
      <img
        className="vendas-page__product-thumb"
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }
  return <span className="vendas-page__product-thumb-slot" aria-hidden />;
}

/**
 * Segunda linha: [copiar] número do anúncio · SKU valor [copiar] — hover no trecho revela o botão.
 * @param {{ listingId: string; sku: string }} props
 */
function VendasProductIdSkuLine({ listingId, sku }) {
  const lid = listingId != null && String(listingId).trim() !== "" ? String(listingId).trim() : "";
  const sk = sku != null && String(sku).trim() !== "" ? String(sku).trim() : "";
  if (!lid && !sk) {
    return <span className="vendas-page__product-meta--muted">—</span>;
  }
  return (
    <div className="vendas-page__product-meta">
      {lid ? (
        <span className="s7-copy-group vendas-page__product-meta-ad">
          <span className="vendas-page__meta-value vendas-page__meta-value--listing">{lid}</span>
          <S7CopyButton value={lid} ariaLabel="Copiar código do anúncio" size={13} />
        </span>
      ) : null}
      {sk ? (
        <span className="s7-copy-group vendas-page__product-meta-sku">
          <span className="anuncios-ad-sku-label">SKU</span>
          <span className="anuncios-ad-sku-value">{sk}</span>
          <S7CopyButton value={sk} ariaLabel="Copiar SKU" size={13} />
        </span>
      ) : null}
    </div>
  );
}

/** @param {string | null | undefined} s */
function formatBrlApi(s) {
  if (s == null || String(s).trim() === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** @param {string | null | undefined} s */
function formatPctApi(s) {
  if (s == null || String(s).trim() === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/** Cabeçalho em duas linhas (título composto) — reduz largura da coluna. */
function VendasThStack({ className = "", line1, line2 }) {
  return (
    <th className={className}>
      <span className="vendas-page__th-stack">
        <span className="vendas-page__th-stack-row">{line1}</span>
        <span className="vendas-page__th-stack-row vendas-page__th-stack-row--sub">{line2}</span>
      </span>
    </th>
  );
}

/** @param {Record<string, unknown> | null | undefined} a */
function vendasMlAccountLabel(a) {
  if (!a || typeof a !== "object") return "Conta";
  if (a.ml_nickname != null && String(a.ml_nickname).trim() !== "") return String(a.ml_nickname).trim();
  if (a.account_alias != null && String(a.account_alias).trim() !== "") return String(a.account_alias).trim();
  if (a.external_seller_id != null) return String(a.external_seller_id);
  return "Conta";
}

export default function VendasPage() {
  /** Contas ML para o filtro “Conta”. */
  const [mlAccounts, setMlAccounts] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [mlAccountsReady, setMlAccountsReady] = useState(false);

  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [truncatedList, setTruncatedList] = useState(false);
  const [marketplace, setMarketplace] = useState("");
  /** marketplace_accounts.id — vazio = todas as contas */
  const [accountFilter, setAccountFilter] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [summary, setSummary] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [summaryTruncated, setSummaryTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(/** @type {string | null} */ (null));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(/** @type {string | null} */ (null));
  /** @type {[null | { productId: string; sku: string | null; productTitle: string; productImageUrl: string | null }, (v: null | { productId: string; sku: string | null; productTitle: string; productImageUrl: string | null }) => void]} */
  const [costsModal, setCostsModal] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 220);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchMercadoLivreMarketplaceAccounts();
      if (cancelled) return;
      setMlAccountsReady(true);
      const list =
        res.ok && Array.isArray(res.data?.accounts) ? /** @type {Record<string, unknown>[]} */ (res.data.accounts) : [];
      setMlAccounts(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = useMemo(() => {
    if (!Number.isFinite(total) || total <= 0) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;
  const load = useCallback(async () => {
    const listBase = buildApiUrl("/api/sales");
    const summaryBase = buildApiUrl("/api/sales/summary");
    if (!listBase || !summaryBase) {
      setErr("Configure VITE_API_BASE_URL para carregar as vendas.");
      setRows([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    const qsList = new URLSearchParams();
    qsList.set("page", String(page));
    qsList.set("page_size", String(pageSize));
    if (marketplace.trim()) qsList.set("marketplace", marketplace.trim());
    if (accountFilter.trim()) qsList.set("marketplace_account_id", accountFilter.trim());
    if (filter && filter !== "all") qsList.set("filter", filter);
    if (debouncedSearch) qsList.set("q", debouncedSearch);

    const qsSummary = new URLSearchParams();
    if (marketplace.trim()) qsSummary.set("marketplace", marketplace.trim());
    if (accountFilter.trim()) qsSummary.set("marketplace_account_id", accountFilter.trim());
    if (filter && filter !== "all") qsSummary.set("filter", filter);
    if (debouncedSearch) qsSummary.set("q", debouncedSearch);

    setLoading(true);
    setErr(null);
    const [resList, resSum] = await Promise.all([
      apiFetch(`${listBase}?${qsList.toString()}`, { method: "GET" }),
      apiFetch(`${summaryBase}?${qsSummary.toString()}`, { method: "GET" }),
    ]);
    setLoading(false);

    if (!resList.ok) {
      setErr(resList.error ?? "Não foi possível carregar as vendas.");
      setRows([]);
      setTotal(0);
      setTruncatedList(false);
    } else {
      const data = resList.data;
      const rowsArr = Array.isArray(data?.rows) ? data.rows : [];
      setRows(rowsArr);
      const rawTotal = data?.pagination?.total ?? data?.total ?? 0;
      const t =
        typeof rawTotal === "number" && Number.isFinite(rawTotal)
          ? Math.max(0, Math.floor(rawTotal))
          : Number.parseInt(String(rawTotal ?? ""), 10) || 0;
      setTotal(t);
      setTruncatedList(Boolean(data?.pagination?.truncated_scan));

      const apiTp = data?.pagination?.total_pages ?? data?.total_pages;
      const derivedTp = t <= 0 ? 1 : Math.max(1, Math.ceil(t / pageSize));
      const tp =
        typeof apiTp === "number" && Number.isFinite(apiTp) && apiTp >= 1 ? Math.floor(apiTp) : derivedTp;
      const hasNext = typeof data?.pagination?.has_next === "boolean" ? data.pagination.has_next : page < tp;
      const hasPrev =
        typeof data?.pagination?.has_previous === "boolean" ? data.pagination.has_previous : page > 1;

      if (import.meta.env.DEV) {
        console.log("[S7][sales-pagination-debug]", {
          page,
          pageSize,
          total: t,
          totalPages: tp,
          hasNext,
          hasPrevious: hasPrev,
          rowsLength: rowsArr.length,
        });
      }
    }

    if (resSum.ok && resSum.data?.ok && resSum.data?.summary != null && typeof resSum.data.summary === "object") {
      setSummary(/** @type {Record<string, unknown>} */ (resSum.data.summary));
      setSummaryTruncated(Boolean(resSum.data?.truncated_scan));
    } else {
      setSummary(null);
      setSummaryTruncated(false);
    }
  }, [page, pageSize, marketplace, accountFilter, filter, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [marketplace, accountFilter, filter, debouncedSearch]);

  const openDetail = useCallback((itemId) => {
    if (!itemId) return;
    setSelectedItemId(String(itemId));
    setModalOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setModalOpen(false);
    setSelectedItemId(null);
  }, []);

  return (
    <div className="vendas-page">
      <h1 className="products-catalog__sr-title">Vendas</h1>

      <section className="s7-core-kpis anuncios-catalog__kpis" aria-label="Resumo das vendas filtradas">
        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-blue">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Receita de produtos</h2>
          </header>
          <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
        </article>

        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-orange">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Total líquido</h2>
          </header>
          <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
        </article>

        <div className="anuncios-catalog__kpi-minis" aria-label="Indicadores rápidos">
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--profit">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Vendas</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--warn">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Ticket médio</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--decline">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Reembolsos / cancel.</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--sales">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Linhas negativas</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
          </article>
        </div>
      </section>

      <div className="products-catalog__controls vendas-page__controls s7-sticky-filters">
        <div className="products-catalog__controls-top vendas-page__filters-row">
          <div className="vendas-page__filter-field">
            <label className="vendas-page__muted" htmlFor="vendas-account">
              Conta
            </label>
            <select
              id="vendas-account"
              className="vendas-page__select vendas-page__select--filter"
              value={accountFilter}
              disabled={!mlAccountsReady}
              onChange={(e) => setAccountFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {mlAccounts.map((a) => {
                const id = a.id != null ? String(a.id).trim() : "";
                if (!id) return null;
                return (
                  <option key={id} value={id}>
                    {vendasMlAccountLabel(a)}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="vendas-page__filter-field">
            <label className="vendas-page__muted" htmlFor="vendas-mkt">
              Canal
            </label>
            <select
              id="vendas-mkt"
              className="vendas-page__select vendas-page__select--filter"
              value={marketplace}
              onChange={(e) => {
                setMarketplace(e.target.value);
              }}
            >
              <option value="">Todos</option>
              <option value="mercado_livre">Mercado Livre</option>
            </select>
          </div>
          <div className="vendas-page__filter-field vendas-page__filter-field--search">
            <label className="vendas-page__muted" htmlFor="vendas-catalog-search-input">
              Buscar
            </label>
            <div className="products-catalog__search-wrap">
              <div className="products-catalog__search-field">
                <span className="products-catalog__search-icon" aria-hidden>
                  <S7Icon name="search" size={18} strokeWidth={1.85} />
                </span>
                <S7Input
                  label=""
                  name="vendas-catalog-search-input"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar por título, comprador, SKU, código da venda ou rastreio"
                  className="products-catalog__search-s7"
                  inputClassName="products-catalog__search-input-field"
                  autoComplete="off"
                  aria-label="Buscar vendas por título, comprador, SKU, código ou rastreio"
                  rightElement={
                    searchInput ? (
                      <button
                        type="button"
                        className="products-catalog__search-clear"
                        onClick={(e) => {
                          e.preventDefault();
                          setSearchInput("");
                        }}
                        aria-label="Limpar busca"
                      >
                        <S7Icon name="close" size={16} strokeWidth={2} />
                      </button>
                    ) : null
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <div className="products-catalog__controls-main">
          <div className="products-catalog__filter-row" role="toolbar" aria-label="Filtros de vendas">
            {SALES_FILTER_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`products-catalog__filter-chip ${filter === c.id ? "products-catalog__filter-chip--active" : ""}`}
                onClick={() => setFilter(c.id)}
              >
                <span
                  className={`products-catalog__filter-chip-icon products-catalog__filter-chip-icon--${c.iconTone}`}
                  aria-hidden
                >
                  <S7Icon name={c.icon} size={15} strokeWidth={1.65} />
                </span>
                <span className="products-catalog__filter-chip-label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {truncatedList || summaryTruncated ? (
        <p className="vendas-page__scan-note" role="status">
          Atenção: a análise foi limitada (volume alto). Ajuste filtros ou canal para refinar.
        </p>
      ) : null}

      {err ? (
        <p className="vendas-page__error" role="alert">
          {err}
        </p>
      ) : null}

      <div className="vendas-page__table-block">
        <div className="vendas-page__table-card">
          <div className="vendas-page__table-hscroll">
            <table className="vendas-page__table">
              <thead>
                <tr>
                  <th className="vendas-page__col-venda">Venda</th>
                  <th className="vendas-page__col-product">Produto</th>
                  <th className="vendas-page__col-account">Conta</th>
                  <th className="vendas-page__col-channel">Canal</th>
                  <th className="vendas-page__col-buyer">Comprador</th>
                  <VendasThStack line1="Valor" line2="da venda" />
                  <VendasThStack line1="Custo" line2="do produto" />
                  <th>Comissão</th>
                  <th>Frete</th>
                  <th>Impostos</th>
                  <VendasThStack line1="Valor" line2="recebido" />
                  <VendasThStack line1="Lucro" line2="(R$)" />
                  <VendasThStack line1="Margem" line2="(%)" />
                  <VendasThStack line1="Saúde" line2="da venda" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={14} className="vendas-page__empty">
                      Carregando…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="vendas-page__empty">
                      Nenhuma venda encontrada para os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, rowIndex) => {
                    const f = r.financials ?? {};
                    const hid =
                      String(r.item_id ?? r.sale_item_id ?? "").trim() ||
                      `${String(r.external_order_id ?? r.sale_display_code ?? "ord")}-${String(r.external_order_item_id ?? r.external_item_id ?? "line")}-${rowIndex}`;
                    const healthUi = getSaleHealthUi(f);
                    const dateParts = formatSaleDateParts(r.sale_date);
                    const buyerName =
                      r.buyer_display_name != null && String(r.buyer_display_name).trim() !== ""
                        ? String(r.buyer_display_name).trim()
                        : "";
                    const listingIdForMeta =
                      r.listing_id_display != null && String(r.listing_id_display).trim() !== ""
                        ? String(r.listing_id_display).trim()
                        : "";
                    const skuForMeta =
                      r.sku_display != null && String(r.sku_display).trim() !== ""
                        ? String(r.sku_display).trim()
                        : r.product_sku_line != null && String(r.product_sku_line).trim() !== ""
                          ? String(r.product_sku_line).trim()
                          : "";
                    const accountFields = pickCatalogAccountFields(r);
                    return (
                      <tr
                        key={hid}
                        tabIndex={0}
                        onClick={() => openDetail(hid)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetail(hid);
                          }
                        }}
                      >
                        <td className="vendas-page__col-venda">
                          <div className="vendas-page__venda-cell">
                            <div className="vendas-page__venda-id">
                              {r.sale_display_code != null && String(r.sale_display_code).trim() !== "" ? (
                                <span className="s7-copy-group vendas-page__sale-code-group">
                                  <span className="vendas-page__sale-code">{String(r.sale_display_code).trim()}</span>
                                  <S7CopyButton
                                    value={String(r.sale_display_code).trim()}
                                    ariaLabel="Copiar número da venda"
                                    size={13}
                                  />
                                </span>
                              ) : (
                                DASH
                              )}
                            </div>
                            {dateParts ? (
                              <div className="vendas-page__venda-datetime">
                                <span className="vendas-page__venda-date">{dateParts.date}</span>
                                <span className="vendas-page__venda-time">{dateParts.time}</span>
                              </div>
                            ) : (
                              <div className="vendas-page__venda-datetime vendas-page__venda-datetime--empty">
                                <span className="vendas-page__venda-date">{DASH}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="vendas-page__col-product">
                          <div className="vendas-page__product-cell">
                            <VendasSalesProductThumb row={r} />
                            <div className="vendas-page__product-text">
                              <span className="vendas-page__product-title">
                                {r.product_display_title != null && String(r.product_display_title).trim() !== ""
                                  ? String(r.product_display_title)
                                  : "Produto não identificado"}
                              </span>
                              <VendasProductIdSkuLine listingId={listingIdForMeta} sku={skuForMeta} />
                              {r.needs_product_completion === true &&
                              r.product_id != null &&
                              String(r.product_id).trim() !== "" ? (
                                <div
                                  className="vendas-page__product-actions"
                                  role="presentation"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                                  <S7Button
                                    type="button"
                                    variant="warning"
                                    size="sm"
                                    className="vendas-page__complete-product-btn"
                                    onClick={async () => {
                                      const productImageUrl =
                                        (await resolveSalesRowProductThumbUrl(/** @type {Record<string, unknown>} */ (r))) ||
                                        null;
                                      setCostsModal({
                                        productId: String(r.product_id).trim(),
                                        sku: skuForMeta || null,
                                        productTitle:
                                          r.product_display_title != null &&
                                          String(r.product_display_title).trim() !== ""
                                            ? String(r.product_display_title).trim()
                                            : "Produto",
                                        productImageUrl: productImageUrl || null,
                                      });
                                    }}
                                  >
                                    Completar cadastro
                                  </S7Button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="vendas-page__col-account">
                          <S7CatalogAccountCell
                            variant="stacked"
                            marketplaceAccountId={accountFields.marketplaceAccountId}
                            accountAlias={accountFields.accountAlias}
                            accountLogoUrl={accountFields.accountLogoUrl}
                          />
                        </td>
                        <td className="vendas-page__col-channel">
                          <S7CatalogChannelCell
                            variant="stacked"
                            marketplace={r.marketplace}
                            marketplaceLabel={r.marketplace_label != null && String(r.marketplace_label).trim() !== "" ? String(r.marketplace_label) : null}
                          />
                        </td>
                        <td className="vendas-page__col-buyer">
                          <div className="vendas-page__buyer-cell vendas-page__buyer-cell--stacked">
                            <VendasBuyerAvatarStack
                              photoUrl={r.buyer_thumbnail_url}
                              displayName={buyerName || undefined}
                            />
                            <span className="vendas-page__buyer-name">{buyerName || DASH}</span>
                          </div>
                        </td>
                        <td>{formatBrlApi(f.sale_price)}</td>
                        <td>{formatBrlApi(r.product_cost_only_brl)}</td>
                        <td>{formatBrlApi(f.commission)}</td>
                        <td>{formatBrlApi(f.shipping_cost)}</td>
                        <td>{formatBrlApi(f.taxes)}</td>
                        <td>{formatBrlApi(f.net_received)}</td>
                        <td>{formatBrlApi(f.profit_brl)}</td>
                        <td>{formatPctApi(f.margin_percent)}</td>
                        <td>
                          <span className={`vendas-health-badge ${healthUi.badgeClass}`}>
                            {healthUi.showDot ? <span className="vendas-health-badge-dot" aria-hidden /> : null}
                            <span className="vendas-health-badge-text">{healthUi.label}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="vendas-page__pagination">
        <span>
          Página {page} de {totalPages}
          {total > 0 ? ` · ${total} linha(s)` : ""}
        </span>
        <button
          type="button"
          disabled={loading || !hasPreviousPage}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={loading || !hasNextPage}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Próxima
        </button>
      </div>

      <SaleDetailModal open={modalOpen} itemId={selectedItemId} onClose={closeDetail} />

      <QuickProductCostsModal
        open={Boolean(costsModal)}
        productId={costsModal?.productId ?? null}
        sku={costsModal?.sku ?? null}
        productTitle={costsModal?.productTitle ?? "Produto"}
        productImageUrl={costsModal?.productImageUrl ?? null}
        onClose={() => setCostsModal(null)}
        onSaved={async () => {
          await load();
        }}
      />
    </div>
  );
}
