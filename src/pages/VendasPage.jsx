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

/** @param {string | null | undefined} name */
function buyerInitials(name) {
  const s = name != null ? String(name).trim() : "";
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
      {lid && sk ? <span className="vendas-page__meta-between" aria-hidden /> : null}
      {sk ? (
        <span className="s7-copy-group vendas-page__product-meta-sku">
          <span className="vendas-page__sku-legend">SKU</span>
          <span className="vendas-page__meta-value vendas-page__meta-value--sku">{sk}</span>
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

/** @param {string | null | undefined} iso */
function formatLastSyncPtBr(iso) {
  if (iso == null || String(iso).trim() === "") return null;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return null;
  return new Date(t).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VendasPage() {
  /** Contas ML (status de atualização automática; sem ação manual na página). */
  const [mlAccounts, setMlAccounts] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [mlAccountsLoading, setMlAccountsLoading] = useState(true);
  const [mlAccountsFetchFailed, setMlAccountsFetchFailed] = useState(false);

  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [truncatedList, setTruncatedList] = useState(false);
  const [marketplace, setMarketplace] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [summary, setSummary] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [summaryTruncated, setSummaryTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(/** @type {string | null} */ (null));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMlAccountsLoading(true);
      const res = await fetchMercadoLivreMarketplaceAccounts();
      if (cancelled) return;
      setMlAccountsLoading(false);
      if (!res.ok) {
        setMlAccountsFetchFailed(true);
        setMlAccounts([]);
        return;
      }
      setMlAccountsFetchFailed(false);
      const list =
        Array.isArray(res.data?.accounts) ? /** @type {Record<string, unknown>[]} */ (res.data.accounts) : [];
      setMlAccounts(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const vendasAutoSyncUi = useMemo(() => {
    if (mlAccountsLoading) {
      return {
        pill: "…",
        pillClass: "vendas-page__sync-pill--muted",
        title: "Atualização automática ativa",
        lines: ["Carregando status da integração…"],
      };
    }
    if (mlAccountsFetchFailed) {
      return {
        pill: "Sistema",
        pillClass: "vendas-page__sync-pill--danger",
        title: "Atualização automática ativa",
        lines: [
          "Não foi possível carregar contas de integração.",
          "Aplique no Supabase a migration 20260506110000_marketplace_accounts_ml_sales_sync_cursor.sql (colunas de sync) e recarregue a página.",
        ],
      };
    }
    if (mlAccounts.length === 0) {
      return {
        pill: "Integração",
        pillClass: "vendas-page__sync-pill--warn",
        title: "Atualização automática ativa",
        lines: [
          "Nenhuma conta Mercado Livre conectada.",
          "Conecte em Perfil → Integrações para receber vendas automaticamente.",
        ],
      };
    }
    const now = Date.now();
    const skewMs = 120000;
    const anyExpired = mlAccounts.some((a) => {
      const raw = a.token_expires_at;
      if (raw == null) return false;
      const exp = Date.parse(String(raw));
      return Number.isFinite(exp) && exp < now - skewMs;
    });
    if (anyExpired) {
      return {
        pill: "Conexão",
        pillClass: "vendas-page__sync-pill--danger",
        title: "Atualização automática ativa",
        lines: ["Token expirado ou inválido — reconecte o Mercado Livre em Integrações."],
      };
    }
    const syncMillis = mlAccounts
      .map((a) => a.ml_sales_last_sync_at)
      .filter((x) => x != null && String(x).trim() !== "")
      .map((s) => Date.parse(String(s)))
      .filter((n) => Number.isFinite(n));
    const maxSync = syncMillis.length ? Math.max(...syncMillis) : null;

    const nickPart = (a) =>
      a.ml_nickname != null && String(a.ml_nickname).trim() !== ""
        ? String(a.ml_nickname).trim()
        : a.account_alias != null && String(a.account_alias).trim() !== ""
          ? String(a.account_alias).trim()
          : a.external_seller_id != null
            ? String(a.external_seller_id)
            : "Conta";

    const accountLine =
      mlAccounts.length === 1
        ? `Conta: ${nickPart(mlAccounts[0])}`
        : `${mlAccounts.length} contas: ${mlAccounts.map(nickPart).join(" · ")}`;

    const lastLine =
      maxSync != null
        ? `Última atualização: ${formatLastSyncPtBr(new Date(maxSync).toISOString())}`
        : "Aguardando primeira sincronização automática.";

    return {
      pill: "Online",
      pillClass: "vendas-page__sync-pill--ok",
      title: "Atualização automática ativa",
      lines: [accountLine, lastLine],
    };
  }, [mlAccounts, mlAccountsLoading, mlAccountsFetchFailed]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize) || 1), [total, pageSize]);

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
    if (filter && filter !== "all") qsList.set("filter", filter);
    if (debouncedSearch) qsList.set("q", debouncedSearch);

    const qsSummary = new URLSearchParams();
    if (marketplace.trim()) qsSummary.set("marketplace", marketplace.trim());
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
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      const t = data?.pagination?.total;
      setTotal(typeof t === "number" ? t : 0);
      setTruncatedList(Boolean(data?.pagination?.truncated_scan));
    }

    if (resSum.ok && resSum.data?.ok && resSum.data?.summary != null && typeof resSum.data.summary === "object") {
      setSummary(/** @type {Record<string, unknown>} */ (resSum.data.summary));
      setSummaryTruncated(Boolean(resSum.data?.truncated_scan));
    } else {
      setSummary(null);
      setSummaryTruncated(false);
    }
  }, [page, pageSize, marketplace, filter, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [marketplace, filter, debouncedSearch]);

  const openDetail = useCallback((itemId) => {
    if (!itemId) return;
    setSelectedItemId(String(itemId));
    setModalOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setModalOpen(false);
    setSelectedItemId(null);
  }, []);

  const s = summary;

  return (
    <div className="vendas-page">
      <h1 className="products-catalog__sr-title">Vendas</h1>

      <section className="s7-core-kpis anuncios-catalog__kpis" aria-label="Resumo das vendas filtradas">
        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-orange">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Receita de produtos</h2>
          </header>
          <div className="anuncios-catalog__kpi-body">
            <p className="anuncios-catalog__kpi-value">
              {loading ? "…" : formatBrlApi(s?.gross_revenue_brl != null ? String(s.gross_revenue_brl) : null)}
            </p>
            <p className="anuncios-catalog__kpi-hint">Soma de receita de produtos (product_revenue_brl) das linhas filtradas.</p>
          </div>
        </article>

        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-blue">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Total líquido</h2>
          </header>
          <div className="anuncios-catalog__kpi-body">
            <p className="anuncios-catalog__kpi-value">
              {loading ? "…" : formatBrlApi(s?.net_total_brl != null ? String(s.net_total_brl) : null)}
            </p>
            <p className="anuncios-catalog__kpi-hint">Soma do campo Total (BRL) por linha (calculado no servidor).</p>
          </div>
        </article>

        <div className="anuncios-catalog__kpi-minis" aria-label="Indicadores rápidos">
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--sales">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Vendas</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body">
              <p className="anuncios-catalog__kpi-mini-value">
                {loading ? "…" : String(s?.total_sales_count ?? s?.orders_count ?? "—")}
              </p>
            </div>
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--sales">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Unidades</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body">
              <p className="anuncios-catalog__kpi-mini-value">{loading ? "…" : String(s?.total_units ?? "—")}</p>
            </div>
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--warn">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Ticket médio</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body">
              <p className="anuncios-catalog__kpi-mini-value">
                {loading
                  ? "…"
                  : formatBrlApi(
                      s?.average_ticket_brl != null
                        ? String(s.average_ticket_brl)
                        : s?.avg_ticket_brl != null
                          ? String(s.avg_ticket_brl)
                          : null
                    )}
              </p>
            </div>
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--profit">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Taxas e comissões</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body">
              <p className="anuncios-catalog__kpi-mini-value">
                {loading ? "…" : formatBrlApi(s?.total_fees_brl != null ? String(s.total_fees_brl) : null)}
              </p>
            </div>
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--warn">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Frete (taxas)</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body">
              <p className="anuncios-catalog__kpi-mini-value">
                {loading ? "…" : formatBrlApi(s?.total_shipping_fees_brl != null ? String(s.total_shipping_fees_brl) : null)}
              </p>
            </div>
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--decline">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Reembolsos / cancel.</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body">
              <p className="anuncios-catalog__kpi-mini-value">
                {loading ? "…" : formatBrlApi(s?.total_refunds_brl != null ? String(s.total_refunds_brl) : null)}
              </p>
            </div>
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--decline">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Linhas negativas</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body">
              <p className="anuncios-catalog__kpi-mini-value">{loading ? "…" : String(s?.loss_orders_count ?? "—")}</p>
            </div>
          </article>
        </div>
      </section>

      <div className="products-catalog__controls vendas-page__controls s7-sticky-filters">
        <div className="products-catalog__controls-top">
          <div className="vendas-page__channel-wrap">
            <label className="vendas-page__muted" htmlFor="vendas-mkt">
              Canal
            </label>
            <select
              id="vendas-mkt"
              className="vendas-page__select"
              value={marketplace}
              onChange={(e) => {
                setMarketplace(e.target.value);
              }}
            >
              <option value="">Todos</option>
              <option value="mercado_livre">Mercado Livre</option>
            </select>
          </div>
          <div className="vendas-page__auto-sync-status" role="status" aria-live="polite">
            <span className="vendas-page__auto-sync-status-icon" aria-hidden>
              <S7Icon name="info" size={16} strokeWidth={1.75} />
            </span>
            <div className="vendas-page__auto-sync-status-body">
              <div className="vendas-page__auto-sync-status-head">
                <span className="vendas-page__auto-sync-status-title">{vendasAutoSyncUi.title}</span>
                <span className={`vendas-page__sync-pill ${vendasAutoSyncUi.pillClass}`}>{vendasAutoSyncUi.pill}</span>
              </div>
              {vendasAutoSyncUi.lines.map((line, i) => (
                <span key={i} className="vendas-page__auto-sync-status-line">
                  {line}
                </span>
              ))}
            </div>
          </div>
          <div className="products-catalog__search-wrap">
            <div className="products-catalog__search-field">
              <span className="products-catalog__search-icon" aria-hidden>
                <S7Icon name="search" size={18} strokeWidth={1.85} />
              </span>
              <S7Input
                label=""
                name="vendas-catalog-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por título, comprador, SKU, código da venda ou rastreio"
                className="products-catalog__search-s7"
                inputClassName="products-catalog__search-input-field"
                autoComplete="off"
                aria-label="Buscar vendas por título"
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
        <div className="products-catalog__controls-main">
          <div className="products-catalog__filter-row" role="toolbar" aria-label="Filtros de vendas">
            {SALES_FILTER_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`products-catalog__filter-chip ${filter === c.id ? "products-catalog__filter-chip--active" : ""}`}
                onClick={() => setFilter(c.id)}
              >
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
                  <th className="vendas-page__col-date">Data</th>
                  <th>Venda</th>
                  <th className="vendas-page__col-product">Produto</th>
                  <th className="vendas-page__col-account">Conta</th>
                  <th className="vendas-page__col-channel">Canal</th>
                  <th className="vendas-page__col-buyer">Comprador</th>
                  <th>Valor da venda</th>
                  <th>Custo do produto</th>
                  <th>Comissão</th>
                  <th>Frete</th>
                  <th>Impostos</th>
                  <th>Valor recebido</th>
                  <th>Lucro (R$)</th>
                  <th>Margem (%)</th>
                  <th>Saúde da venda</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={15} className="vendas-page__empty">
                      Carregando…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="vendas-page__empty">
                      Nenhuma venda encontrada para os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const f = r.financials ?? {};
                    const hid = String(r.item_id ?? "");
                    const healthUi = getSaleHealthUi(f);
                    const dateParts = formatSaleDateParts(r.sale_date);
                    const buyerName =
                      r.buyer_display_name != null && String(r.buyer_display_name).trim() !== ""
                        ? String(r.buyer_display_name).trim()
                        : "";
                    const buyerPhoto =
                      r.buyer_thumbnail_url != null && String(r.buyer_thumbnail_url).trim() !== ""
                        ? String(r.buyer_thumbnail_url).trim()
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
                        <td className="vendas-page__col-date">
                          {dateParts ? (
                            <div className="vendas-page__date-stack">
                              <span className="vendas-page__date-line">{dateParts.date}</span>
                              <span className="vendas-page__time-line">{dateParts.time}</span>
                            </div>
                          ) : (
                            <span className="vendas-page__date-line">{DASH}</span>
                          )}
                        </td>
                        <td>
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
                        </td>
                        <td className="vendas-page__col-product">
                          <div className="vendas-page__product-cell">
                            {r.product_thumbnail_url != null && String(r.product_thumbnail_url).trim() !== "" ? (
                              <img
                                className="vendas-page__product-thumb"
                                src={String(r.product_thumbnail_url)}
                                alt=""
                                loading="lazy"
                              />
                            ) : (
                              <span className="vendas-page__product-thumb vendas-page__product-thumb--placeholder" aria-hidden />
                            )}
                            <div className="vendas-page__product-text">
                              <span className="vendas-page__product-title">
                                {r.product_display_title != null && String(r.product_display_title).trim() !== ""
                                  ? String(r.product_display_title)
                                  : "Produto não identificado"}
                              </span>
                              <VendasProductIdSkuLine listingId={listingIdForMeta} sku={skuForMeta} />
                            </div>
                          </div>
                        </td>
                        <td className="vendas-page__col-account">
                          <S7CatalogAccountCell
                            marketplaceAccountId={accountFields.marketplaceAccountId}
                            accountAlias={accountFields.accountAlias}
                            accountLogoUrl={accountFields.accountLogoUrl}
                          />
                        </td>
                        <td className="vendas-page__col-channel">
                          <S7CatalogChannelCell
                            marketplace={r.marketplace}
                            marketplaceLabel={r.marketplace_label != null && String(r.marketplace_label).trim() !== "" ? String(r.marketplace_label) : null}
                          />
                        </td>
                        <td className="vendas-page__col-buyer">
                          <div className="vendas-page__buyer-cell">
                            {buyerPhoto ? (
                              <img className="vendas-page__buyer-avatar" src={buyerPhoto} alt="" loading="lazy" />
                            ) : (
                              <span
                                className="vendas-page__buyer-avatar vendas-page__buyer-avatar--initials"
                                aria-hidden
                              >
                                {buyerInitials(buyerName || undefined)}
                              </span>
                            )}
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
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Anterior
        </button>
        <button
          type="button"
          disabled={loading || page >= totalPages || rows.length === 0}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </button>
      </div>

      <SaleDetailModal open={modalOpen} itemId={selectedItemId} onClose={closeDetail} />
    </div>
  );
}
