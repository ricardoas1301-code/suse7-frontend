// ======================================================================
// PÁGINA: Produtos — listagem operacional do catálogo (Suse7)
// Linha clicável → edição; colunas preparadas para anúncios, vendas e MKP.
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { useNotifications } from "../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";
import S7Button from "./ui/S7Button";
import S7ConfirmModal from "./ui/S7ConfirmModal";
import S7EmptyState from "./ui/S7EmptyState";
import S7Icon from "./ui/S7Icon";
import S7Input from "./ui/S7Input";
import { fetchCatalogRankings } from "../services/products/catalogRankingsService";
import { applyCatalogFilter, getCatalogFilterChipsForToolbar } from "../utils/catalogFilterRegistry";
import { filterProductsByCatalogSearch } from "../utils/catalogSearch";
import {
  formatCatalogBRL,
  formatCatalogProfitPercentLabel,
  getCatalogFinancialToneClass,
  getCatalogHealthPresentation,
  getCatalogProfitSemanticBand,
  getContributionMarginPercent,
  getProductCatalogMetrics,
  getProductStockDisplay,
  marketplaceChipLabel,
} from "../utils/productCatalogRow";
import { useProductMainImageSrc } from "../utils/productImageDisplayUrl";
import { computeCatalogProductReadiness } from "../utils/productReadiness";
import "./Products.css";
import "./Anuncios.css";

/** Coluna Marketplaces: dados seguem em `getProductCatalogMetrics`; UI oculta até a visão MKP amadurecer. */
const SHOW_CATALOG_MARKETPLACES_COLUMN = false;

/** Itens por página na listagem paginada. */
const CATALOG_PAGE_SIZE = 33;

/** Textos dos tooltips dos cabeçalhos financeiros / métricas (catálogo). */
const CATALOG_COLUMN_TOOLTIPS = {
  ads: "Quantidade de anúncios vinculados ao produto.",
  sales: "Quantidade total de vendas deste produto.",
  revenue: "Valor total vendido deste produto.",
  cost: "Custo total das vendas deste produto, incluindo custo do produto, taxas, impostos e outros custos da venda.",
  grossProfit:
    "Lucro bruto ou margem de contribuição total deste produto, calculado pelo valor total vendido menos o custo das vendas.",
  profitPct: "Percentual total de lucro deste produto.",
};

/**
 * Cabeçalho de coluna: célula com layout original; tooltip só no rótulo (CSS local, sem S7Tooltip).
 * `lines` = duas linhas como “Saúde do produto” (ex.: Valor / vendido).
 * @param {{ columnClass: string; tip?: string; tipWrap?: boolean; lines?: [string, string]; children?: import("react").ReactNode }} props
 */
function CatalogHeadCell({ columnClass, tip, tipWrap = false, lines, children = null }) {
  const triggerClass = [
    "products-catalog__head-tooltip",
    lines && lines.length === 2 ? "products-catalog__head-tooltip--stacked" : "",
    tipWrap ? "products-catalog__head-tooltip--wide" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const label =
    lines && lines.length === 2 ? (
      <>
        <span className="products-catalog__col-head-line">{lines[0]}</span>
        <span className="products-catalog__col-head-line">{lines[1]}</span>
      </>
    ) : (
      children
    );

  return (
    <div className={`products-catalog__cell ${columnClass} products-catalog__col-head`} role="columnheader">
      {tip ? (
        <span className={triggerClass} data-tooltip={tip} tabIndex={0}>
          {label}
        </span>
      ) : (
        label
      )}
    </div>
  );
}

/**
 * Lista de páginas com null = reticências entre saltos.
 * @param {number} current
 * @param {number} total
 * @returns {(number | null)[]}
 */
function buildPaginationItems(current, total) {
  if (total <= 1) return [1];
  const set = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const p = sorted[i];
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  }
  return out;
}

function ProductCatalogRow({
  product,
  copiedKey,
  onCopy,
  onOpenEdit,
  onRequestDelete,
  showMarketplacesColumn = false,
}) {
  const id = product?.id;
  const name = String(product?.product_name || "Sem nome").trim() || "Sem nome";
  const sku = String(product?.sku || "").trim();
  const nameCopyKey = `name-${id}`;
  const skuCopyKey = `sku-${id}`;
  const showNameCopyCheck = copiedKey === nameCopyKey;
  const showSkuCopyCheck = copiedKey === skuCopyKey;
  const imgUrl = useProductMainImageSrc(product);
  const metrics = getProductCatalogMetrics(product);
  const stock = getProductStockDisplay(product);
  const marginPct = getContributionMarginPercent(product, metrics);
  const profitBand = getCatalogProfitSemanticBand(product, metrics);
  const financialToneClass = getCatalogFinancialToneClass(profitBand);
  const health = getCatalogHealthPresentation(product, metrics);

  const handleRowActivate = useCallback(() => {
    if (id) onOpenEdit(id);
  }, [id, onOpenEdit]);

  const handleRowKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleRowActivate();
      }
    },
    [handleRowActivate]
  );

  const handleCopyNameClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      onCopy(name, nameCopyKey);
    },
    [name, nameCopyKey, onCopy]
  );

  const handleCopySkuClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (sku) onCopy(sku, skuCopyKey);
    },
    [sku, skuCopyKey, onCopy]
  );

  const handleDeleteClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (product) onRequestDelete(product);
    },
    [product, onRequestDelete]
  );

  const catalogIncomplete =
    typeof product?.is_product_ready === "boolean"
      ? !product.is_product_ready
      : product?.catalog_completeness != null && product.catalog_completeness !== "complete";

  return (
    <div
      className={`products-catalog__row${showMarketplacesColumn ? " products-catalog__row--with-marketplaces" : ""}${catalogIncomplete ? " products-catalog__row--incomplete-catalog" : ""}`}
      role="button"
      tabIndex={0}
      onClick={handleRowActivate}
      onKeyDown={handleRowKeyDown}
      aria-label={`Editar produto ${name}`}
      data-product-id={id ?? ""}
    >
      <div className="products-catalog__cell products-catalog__cell--thumb" aria-hidden={false}>
        <div className="products-catalog__thumb-wrap">
          {imgUrl ? (
            <img src={imgUrl} alt="" className="products-catalog__thumb-img" loading="lazy" />
          ) : (
            <div className="products-catalog__thumb-placeholder" title="Sem imagem">
              <S7Icon name="image" size={22} />
            </div>
          )}
        </div>
      </div>

      <div className="products-catalog__cell products-catalog__cell--product">
        <div className="products-catalog__name-row">
          <span
            className={`products-catalog__product-name${catalogIncomplete ? " products-catalog__product-name--incomplete" : ""}`}
          >
            {name}
          </span>
          <button
            type="button"
            className={`products-catalog__copy-btn s7-tip s7-tip-bottom s7-tip-left ${showNameCopyCheck ? "products-catalog__copy-btn--ok" : ""}`}
            data-tip={showNameCopyCheck ? "Copiado!" : "Copiar"}
            onClick={handleCopyNameClick}
            aria-label={`Copiar nome ${name}`}
          >
            {showNameCopyCheck ? "✓" : "⧉"}
          </button>
        </div>
        <div className="products-catalog__sku-row">
          <span className="products-catalog__sku-label">SKU</span>
          <span className="products-catalog__sku-value">{sku || "—"}</span>
          {sku ? (
            <button
              type="button"
              className={`products-catalog__copy-btn s7-tip s7-tip-bottom s7-tip-left ${showSkuCopyCheck ? "products-catalog__copy-btn--ok" : ""}`}
              data-tip={showSkuCopyCheck ? "Copiado!" : "Copiar"}
              onClick={handleCopySkuClick}
              aria-label={`Copiar SKU ${sku}`}
            >
              {showSkuCopyCheck ? "✓" : "⧉"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="products-catalog__cell products-catalog__cell--num">{metrics.adsCount}</div>
      <div className="products-catalog__cell products-catalog__cell--num">{metrics.salesCount}</div>
      <div className="products-catalog__cell products-catalog__cell--money">{formatCatalogBRL(metrics.revenue)}</div>
      <div className="products-catalog__cell products-catalog__cell--money">{formatCatalogBRL(metrics.costTotal)}</div>
      <div
        className={`products-catalog__cell products-catalog__cell--money products-catalog__cell--profit ${financialToneClass}`}
      >
        {formatCatalogBRL(metrics.grossProfit)}
      </div>
      <div
        className={`products-catalog__cell products-catalog__cell--pct products-catalog__cell--profit ${financialToneClass}`}
      >
        {formatCatalogProfitPercentLabel(marginPct)}
      </div>
      <div className="products-catalog__cell products-catalog__cell--health">
        <span className={`products-catalog__health-badge ${health.badgeClass}`} data-health-band={health.band}>
          {health.band !== "unknown" ? <span className="products-catalog__health-badge-dot" aria-hidden /> : null}
          <span className="products-catalog__health-badge-text">
            {health.displayPercent ? `${health.label} · ${health.displayPercent}` : health.label}
          </span>
        </span>
      </div>
      <div className="products-catalog__cell products-catalog__cell--num">{stock}</div>
      {showMarketplacesColumn ? (
        <div className="products-catalog__cell products-catalog__cell--mkts" title="Marketplaces vinculados">
          {metrics.marketplaces.length === 0 ? (
            <span className="products-catalog__mkts-empty">—</span>
          ) : (
            <ul className="products-catalog__mkts-list">
              {metrics.marketplaces.map((slug) => (
                <li key={slug} className="products-catalog__mkt-chip" title={slug}>
                  {marketplaceChipLabel(slug)}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      <div className="products-catalog__cell products-catalog__cell--actions">
        <div className="products-catalog__row-actions">
          <button
            type="button"
            className="products-catalog__row-delete s7-tip"
            data-tip="Excluir produto"
            aria-label={`Excluir produto ${name}`}
            onClick={handleDeleteClick}
          >
            <S7Icon name="trash" size={17} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [rankings, setRankings] = useState({
    top_sales_quantity: [],
    top_revenue: [],
    top_profit: [],
    catalog_summary: {
      top10_sales_quantity_total: 0,
      top10_revenue_brl_total: "0.00",
      top10_profit_brl_total: "0.00",
    },
  });
  const [rankingsLoading, setRankingsLoading] = useState(true);
  const [catalogFilterId, setCatalogFilterId] = useState("all");
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const navigate = useNavigate();
  const { copiedKey, handleCopy } = useCopyFeedback();
  const { addNotification } = useNotifications();
  const catalogFilterChips = useMemo(() => getCatalogFilterChipsForToolbar(), []);

  const searchFilteredProducts = useMemo(
    () => filterProductsByCatalogSearch(products, catalogSearchQuery),
    [products, catalogSearchQuery]
  );

  const displayProducts = useMemo(
    () => applyCatalogFilter(searchFilteredProducts, catalogFilterId),
    [searchFilteredProducts, catalogFilterId]
  );

  const totalFiltered = displayProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / CATALOG_PAGE_SIZE));

  useEffect(() => {
    setCatalogPage(1);
  }, [catalogFilterId, catalogSearchQuery]);

  useEffect(() => {
    if (catalogPage > totalPages) setCatalogPage(totalPages);
  }, [catalogPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (catalogPage - 1) * CATALOG_PAGE_SIZE;
    return displayProducts.slice(start, start + CATALOG_PAGE_SIZE);
  }, [displayProducts, catalogPage]);

  const productSignalCounts = useMemo(() => {
    if (!products.length) return { noSales: 0, needAttention: 0 };
    let noSales = 0;
    let needAttention = 0;
    for (const p of products) {
      const m = getProductCatalogMetrics(p);
      if ((m.salesCount ?? 0) <= 0) noSales += 1;
      const incomplete =
        typeof p?.is_product_ready === "boolean"
          ? !p.is_product_ready
          : p?.catalog_completeness != null && p.catalog_completeness !== "complete";
      if (incomplete) needAttention += 1;
    }
    return { noSales, needAttention };
  }, [products]);

  const hasTop10SalesSignal =
    rankings.top_sales_quantity.length > 0 ||
    rankings.top_revenue.length > 0 ||
    rankings.top_profit.length > 0;

  const paginationItems = useMemo(() => buildPaginationItems(catalogPage, totalPages), [catalogPage, totalPages]);

  const rangeStart = totalFiltered === 0 ? 0 : (catalogPage - 1) * CATALOG_PAGE_SIZE + 1;
  const rangeEnd = Math.min(catalogPage * CATALOG_PAGE_SIZE, totalFiltered);

  const onOpenEdit = useCallback(
    (productId) => {
      navigate(`/produtos/${productId}/editar`);
    },
    [navigate]
  );

  /**
   * Bloqueio com adsCount é espelho da regra de negócio; o backend/RLS deve continuar sendo a fonte da verdade.
   */
  const handleRequestDeleteProduct = useCallback(
    (product) => {
      const metrics = getProductCatalogMetrics(product);
      if (metrics.adsCount > 0) {
        addNotification({
          event_type: "GENERIC",
          entity_type: "product",
          entity_id: product?.id != null ? String(product.id) : null,
          title: "Exclusão bloqueada",
          message:
            "Este produto possui anúncios vinculados. Exclua os anúncios antes de remover o produto.",
          severity: NOTIFICATION_SEVERITY.WARNING,
          dedupeKey: `catalog-delete-blocked-ads-${product?.id}`,
        });
        return;
      }
      setDeleteTarget(product);
    },
    [addNotification]
  );

  const handleConfirmDeleteProduct = useCallback(async () => {
    if (!deleteTarget?.id) return;
    setDeleteSubmitting(true);
    const product = deleteTarget;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { error } = await supabase.from("products").delete().eq("id", product.id).eq("user_id", user.id);

      if (error) {
        const msg = String(error.message || "").toLowerCase();
        const fkHint =
          msg.includes("foreign") ||
          msg.includes("viola") ||
          msg.includes("constraint") ||
          msg.includes("referential");
        addNotification({
          event_type: "GENERIC",
          entity_type: "product",
          entity_id: product?.id != null ? String(product.id) : null,
          title: "Não foi possível excluir",
          message: fkHint
            ? "Remova vínculos (anúncios) antes de excluir o produto, ou tente novamente."
            : error.message || "Erro ao excluir o produto.",
          severity: NOTIFICATION_SEVERITY.CRITICAL,
        });
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setDeleteTarget(null);
      addNotification({
        event_type: "GENERIC",
        entity_type: "product",
        entity_id: product?.id != null ? String(product.id) : null,
        title: "Produto excluído",
        message: "Produto excluído com sucesso.",
        severity: NOTIFICATION_SEVERITY.INFO,
      });
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, addNotification]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRankingsLoading(true);
      const data = await fetchCatalogRankings();
      if (!cancelled) {
        setRankings({
          top_sales_quantity: data.top_sales_quantity,
          top_revenue: data.top_revenue,
          top_profit: data.top_profit,
          catalog_summary: data.catalog_summary,
        });
        setRankingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProductsLoading(false);
        return;
      }

      let { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          product_variants ( id, stock_quantity, attributes, sort_order, cost_price ),
          product_image_links ( storage_path, variant_key, sort_order, is_primary )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        const fallback = await supabase
          .from("products")
          .select("*, product_variants ( id, stock_quantity, attributes, sort_order, cost_price )")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }

      if (error) {
        const fallback2 = await supabase
          .from("products")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        data = fallback2.data;
        error = fallback2.error;
      }

      if (!error) {
        const rows = (data || []).map((row) => {
          const r = computeCatalogProductReadiness(row);
          return {
            ...row,
            is_product_ready: r.is_product_ready,
            missing_fields: r.missing_fields,
            product_completeness_score: r.product_completeness_score,
          };
        });
        setProducts(rows);
      }
      setProductsLoading(false);
    };

    loadProducts();
  }, []);

  const gridMod = SHOW_CATALOG_MARKETPLACES_COLUMN
    ? " products-catalog__grid--with-marketplaces"
    : "";

  return (
    <div className="products-catalog">
      <h1 className="products-catalog__sr-title">Produtos</h1>

      <section className="s7-core-kpis anuncios-catalog__kpis" aria-label="Ranking Top 10 do catálogo">
        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-orange">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Top 10 — Vendas</h2>
          </header>
          <div className="anuncios-catalog__kpi-body">
            <p className="anuncios-catalog__kpi-value">
              {rankingsLoading
                ? "…"
                : !hasTop10SalesSignal
                  ? "Sem dados ainda"
                  : String(rankings.catalog_summary?.top10_sales_quantity_total ?? 0)}
            </p>
            <p className="anuncios-catalog__kpi-hint">Soma das quantidades vendidas no Top 10 (servidor).</p>
          </div>
        </article>

        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-blue">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Top 10 — Faturamento</h2>
          </header>
          <div className="anuncios-catalog__kpi-body">
            <p className="anuncios-catalog__kpi-value">
              {rankingsLoading
                ? "…"
                : !hasTop10SalesSignal
                  ? "Sem dados ainda"
                  : formatCatalogBRL(rankings.catalog_summary?.top10_revenue_brl_total ?? 0)}
            </p>
            <p className="anuncios-catalog__kpi-hint">Soma de faturamento bruto no Top 10 (servidor, Decimal.js).</p>
          </div>
        </article>

        <div className="anuncios-catalog__kpi-minis" aria-label="Indicadores do catálogo">
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--profit">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Top 10 — Lucro bruto</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body">
              <p className="anuncios-catalog__kpi-mini-value">
                {rankingsLoading
                  ? "…"
                  : !hasTop10SalesSignal
                    ? "Sem dados ainda"
                    : formatCatalogBRL(rankings.catalog_summary?.top10_profit_brl_total ?? 0)}
              </p>
            </div>
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--sales">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Sem vendas</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body">
              <p className="anuncios-catalog__kpi-mini-value">
                {productsLoading ? "…" : String(productSignalCounts.noSales)}
              </p>
            </div>
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--warn">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Precisam atenção</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body">
              <p className="anuncios-catalog__kpi-mini-value">
                {productsLoading ? "…" : String(productSignalCounts.needAttention)}
              </p>
            </div>
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--decline">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Em queda</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body">
              <p className="anuncios-catalog__kpi-mini-value">—</p>
              <p className="anuncios-catalog__kpi-mini-hint">Sem dados ainda</p>
            </div>
          </article>
        </div>
      </section>

      {!productsLoading && products.length > 0 ? (
        <div className="products-catalog__controls s7-sticky-filters">
          <div className="products-catalog__controls-top">
            <div className="products-catalog__search-wrap">
              <div className="products-catalog__search-field">
                <span className="products-catalog__search-icon" aria-hidden>
                  <S7Icon name="search" size={18} strokeWidth={1.85} />
                </span>
                <S7Input
                  label=""
                  name="catalog-search"
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  placeholder="Buscar por nome, SKU, EAN, marca ou modelo"
                  className="products-catalog__search-s7"
                  inputClassName="products-catalog__search-input-field"
                  autoComplete="off"
                  aria-label="Buscar produtos por nome, SKU, EAN, marca ou modelo"
                  rightElement={
                    catalogSearchQuery ? (
                      <button
                        type="button"
                        className="products-catalog__search-clear"
                        onClick={(e) => {
                          e.preventDefault();
                          setCatalogSearchQuery("");
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
            <div className="products-catalog__controls-actions">
              <S7Button
                variant="primary"
                iconName="plus"
                className="products-catalog__new-product-btn"
                onClick={() => navigate("/produtos/novo")}
              >
                Novo produto
              </S7Button>
            </div>
          </div>
          <div className="products-catalog__controls-main">
            <div className="products-catalog__filter-row" role="toolbar" aria-label="Filtros rápidos do catálogo">
              {catalogFilterChips.map((def) => {
                const isActive = catalogFilterId === def.id;
                const chipTitle = def.enabled ? def.description : `${def.description} Em breve.`;
                return (
                  <button
                    key={def.id}
                    type="button"
                    className={`products-catalog__filter-chip${isActive ? " products-catalog__filter-chip--active" : ""}${def.enabled ? "" : " products-catalog__filter-chip--disabled"}`}
                    aria-pressed={def.enabled ? isActive : undefined}
                    disabled={!def.enabled}
                    title={chipTitle}
                    data-phase={def.phase}
                    onClick={() => {
                      if (!def.enabled) return;
                      setCatalogFilterId(def.id);
                    }}
                  >
                    <span
                      className={`products-catalog__filter-chip-icon products-catalog__filter-chip-icon--${def.iconTone}`}
                      aria-hidden
                    >
                      <S7Icon name={def.icon} size={15} strokeWidth={1.65} />
                    </span>
                    <span className="products-catalog__filter-chip-label">{def.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="products-catalog__filter-clear"
                disabled={catalogFilterId === "all"}
                title="Remove filtros e volta à listagem padrão"
                onClick={() => setCatalogFilterId("all")}
              >
                <S7Icon name="filter_clear" size={14} strokeWidth={1.75} className="products-catalog__filter-clear-icon" />
                <span>Limpar filtros</span>
              </button>
            </div>
          </div>
        </div>
      ) : !productsLoading ? (
        <div className="products-catalog__toolbar">
          <S7Button
            variant="primary"
            iconName="plus"
            className="products-catalog__new-product-btn"
            onClick={() => navigate("/produtos/novo")}
          >
            Novo produto
          </S7Button>
        </div>
      ) : null}

      {productsLoading ? (
        <p className="products-catalog__loading">Carregando produtos...</p>
      ) : products.length === 0 ? (
        <div className="products-catalog__empty-card">
          <S7EmptyState
            title="Nenhum produto cadastrado"
            description="Cadastre itens para precificar, vincular anúncios e acompanhar resultados por marketplace. Use o botão Novo produto acima."
          />
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="products-catalog__filter-empty-card" role="status">
          {(() => {
            const hasSearch = catalogSearchQuery.trim().length > 0;
            let title = "Nenhum produto neste filtro";
            let description = "Ajuste os filtros ou limpe para ver todo o catálogo.";
            if (hasSearch && searchFilteredProducts.length === 0) {
              title = "Nenhum produto encontrado";
              description = "Nenhum item corresponde à busca. Tente outro termo ou limpe o campo.";
            } else if (hasSearch && searchFilteredProducts.length > 0) {
              description =
                "Nenhum item corresponde à combinação de busca e filtros. Ajuste os filtros ou a busca.";
            }
            return (
              <>
                <S7EmptyState title={title} description={description} />
                <button
                  type="button"
                  className="products-catalog__filter-empty-btn"
                  onClick={() => {
                    setCatalogFilterId("all");
                    setCatalogSearchQuery("");
                  }}
                >
                  Mostrar todos
                </button>
              </>
            );
          })()}
        </div>
      ) : (
        <div className="products-catalog__table-block">
          <div className="products-catalog__table-card">
            <div className="products-catalog__table-hscroll">
              <div className={`products-catalog__grid products-catalog__grid--head${gridMod}`}>
                <div className="products-catalog__cell products-catalog__cell--thumb" aria-hidden />
                <div className="products-catalog__cell products-catalog__cell--product products-catalog__col-head">Produto</div>
                <CatalogHeadCell columnClass="products-catalog__cell--num" tip={CATALOG_COLUMN_TOOLTIPS.ads}>
                  Anúncios
                </CatalogHeadCell>
                <CatalogHeadCell columnClass="products-catalog__cell--num" tip={CATALOG_COLUMN_TOOLTIPS.sales}>
                  Vendas
                </CatalogHeadCell>
                <CatalogHeadCell
                  columnClass="products-catalog__cell--money"
                  tip={CATALOG_COLUMN_TOOLTIPS.revenue}
                  lines={["Valor", "vendido"]}
                />
                <CatalogHeadCell
                  columnClass="products-catalog__cell--money"
                  tip={CATALOG_COLUMN_TOOLTIPS.cost}
                  tipWrap
                  lines={["Custo", "vendas"]}
                />
                <CatalogHeadCell
                  columnClass="products-catalog__cell--money"
                  tip={CATALOG_COLUMN_TOOLTIPS.grossProfit}
                  tipWrap
                  lines={["Lucro", "bruto"]}
                />
                <CatalogHeadCell columnClass="products-catalog__cell--pct" tip={CATALOG_COLUMN_TOOLTIPS.profitPct}>
                  Lucro %
                </CatalogHeadCell>
                <div
                  className="products-catalog__cell products-catalog__cell--health products-catalog__col-head"
                  title="Margem de contribuição e faixa de saúde"
                >
                  Saúde do produto
                </div>
                <div className="products-catalog__cell products-catalog__cell--num products-catalog__col-head">Estoque</div>
                {SHOW_CATALOG_MARKETPLACES_COLUMN ? (
                  <div className="products-catalog__cell products-catalog__cell--mkts products-catalog__col-head">Marketplaces</div>
                ) : null}
                <div className="products-catalog__cell products-catalog__cell--actions products-catalog__cell--actions-head products-catalog__col-head">
                  <span className="products-catalog__sr-only">Ações</span>
                </div>
              </div>

              <div className="products-catalog__body">
                {paginatedProducts.map((product) => (
                  <ProductCatalogRow
                    key={product.id}
                    product={product}
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                    onOpenEdit={onOpenEdit}
                    onRequestDelete={handleRequestDeleteProduct}
                    showMarketplacesColumn={SHOW_CATALOG_MARKETPLACES_COLUMN}
                  />
                ))}
              </div>
            </div>
          </div>

          <footer className="products-catalog__pagination" aria-label="Paginação do catálogo">
            <p className="products-catalog__pagination-meta">
              Mostrando <strong>{rangeStart}</strong>–<strong>{rangeEnd}</strong> de <strong>{totalFiltered}</strong>{" "}
              {totalFiltered === 1 ? "produto" : "produtos"}
            </p>
            {totalPages > 1 ? (
              <nav className="products-catalog__pagination-nav" aria-label="Páginas">
                <button
                  type="button"
                  className="products-catalog__pagination-btn"
                  disabled={catalogPage <= 1}
                  onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <div className="products-catalog__pagination-pages">
                  {paginationItems.map((item, idx) =>
                    item == null ? (
                      <span key={`e-${idx}`} className="products-catalog__pagination-ellipsis" aria-hidden>
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={`products-catalog__pagination-page${item === catalogPage ? " products-catalog__pagination-page--current" : ""}`}
                        aria-current={item === catalogPage ? "page" : undefined}
                        onClick={() => setCatalogPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
                <button
                  type="button"
                  className="products-catalog__pagination-btn products-catalog__pagination-btn--next"
                  disabled={catalogPage >= totalPages}
                  onClick={() => setCatalogPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próximo
                </button>
              </nav>
            ) : null}
          </footer>
        </div>
      )}

      <S7ConfirmModal
        open={deleteTarget != null}
        title="Excluir produto?"
        message={
          deleteTarget
            ? `Tem certeza que deseja excluir o produto "${String(deleteTarget.product_name || "Sem nome").trim() || "Sem nome"}"?\n\nEsta ação não poderá ser desfeita.`
            : ""
        }
        cancelLabel="Cancelar"
        confirmLabel="Excluir produto"
        confirmVariant="danger"
        loading={deleteSubmitting}
        loadingLabel="Excluindo…"
        onCancel={() => {
          if (!deleteSubmitting) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDeleteProduct}
        titleId="products-catalog-delete-modal-title"
      />
    </div>
  );
}
