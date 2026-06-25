// ======================================================================
// PÁGINA: Produtos — listagem operacional do catálogo (Suse7)
// Linha clicável → edição; colunas preparadas para anúncios, vendas e MKP.
// ======================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useNotifications } from "../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";
import S7Button from "./ui/S7Button";
import S7ConfirmModal from "./ui/S7ConfirmModal";
import S7EmptyState from "./ui/S7EmptyState";
import S7Icon from "./ui/S7Icon";
import S7Pagination from "./ui/S7Pagination";
import { S7CatalogProductHeadline } from "./catalog/S7CatalogListingHeadline.jsx";
import { applyCatalogFilter, getCatalogFilterChipsForToolbar } from "../utils/catalogFilterRegistry";
import { filterProductsByCatalogSearch } from "../utils/catalogSearch";
import {
  fetchProductCatalogFinancial,
  mergeProductCatalogFinancialRow,
} from "../services/productCatalogFinancialApi";
import {
  formatCatalogBRL,
  getCatalogProfitSemanticBand,
  getContributionMarginPercent,
  getProductCatalogMetrics,
  getProductStockDisplay,
  marketplaceChipLabel,
} from "../utils/productCatalogRow";
import { useProductMainImageSrc } from "../utils/productImageDisplayUrl";
import { calcCatalogFormProgressPercentFromProductRow } from "../utils/formProgress";
import { computeCatalogProductReadiness } from "../utils/productReadiness";
import ProductHealthProgress from "./ProductHealthProgress.jsx";
import { rotuloCabecalhoListaUnicaLinha } from "../utils/rotuloCabecalhoLista.js";
import ProductsFiltersCard from "../features/products/filters/ProductsFiltersCard.jsx";
import ProdutosGerarRelatorioModal from "../features/products/reports/ProdutosGerarRelatorioModal.jsx";
import {
  buildProdutosReportContext,
  canOfferProdutosReport,
} from "../features/products/reports/buildProdutosReportContext.js";
import { buildProdutosAggregatedReport } from "../features/products/reports/buildProdutosAggregatedReport.js";
import ProductEditModal from "./products/ProductEditModal.jsx";
import "./Products.css";
import "./Anuncios.css";
import "../styles/VendasPage.css";
import "./ProductsCatalogGridAlign.css";

/** Coluna Marketplaces: dados seguem em `getProductCatalogMetrics`; UI oculta até a visão MKP amadurecer. */
const SHOW_CATALOG_MARKETPLACES_COLUMN = false;

/** Itens por página na listagem paginada. */
const CATALOG_PAGE_SIZE = 100;

/** Textos dos tooltips dos cabeçalhos financeiros / métricas (catálogo). */
const CATALOG_COLUMN_TOOLTIPS = {
  ads: "Quantidade de anúncios vinculados ao produto.",
  sales: "Quantidade total vendida (soma das unidades de todos os anúncios vinculados).",
  revenue: "Faturamento histórico consolidado do produto (SSOT vendas).",
  ticket: "Ticket médio histórico: faturamento total ÷ quantidade vendida.",
  profitBrl: "Lucro histórico consolidado (margem de contribuição agregada, SSOT).",
  profitPct: "Margem consolidada do produto sobre o faturamento (SSOT).",
};

/**
 * Cabeçalho de coluna: célula com layout original; tooltip só no rótulo (CSS local, sem S7Tooltip).
 * `lines` = rótulo estreito ex.: ["Valor","vendido"] → "Valor vendido" (1 linha, fonte compacta).
 * @param {{ columnClass: string; tip?: string; tipWrap?: boolean; lines?: [string, string]; children?: import("react").ReactNode }} props
 */
function CatalogHeadCell({ columnClass, tip, tipWrap = false, lines, children = null }) {
  const tituloCompacto = lines && lines.length === 2 ? rotuloCabecalhoListaUnicaLinha(lines) : null;
  const triggerClass = [
    "products-catalog__head-tooltip",
    tituloCompacto ? "products-catalog__head-tooltip--compact" : "",
    tipWrap ? "products-catalog__head-tooltip--wide" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const label = tituloCompacto ?? children;

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

/** @typedef {import("../utils/productCatalogRow.js").CatalogProfitBand} CatalogProfitBand */

/**
 * Paridade visual com VendasPage — valor ausente discreto (UI-only).
 * @param {{ children?: import("react").ReactNode }} props
 */
function CatalogMetricMissing({ children = "—" }) {
  return (
    <span className="vendas-page__fin-missing" title="Sem dado informado">
      {children}
    </span>
  );
}

/** @param {{ children: import("react").ReactNode }} props */
function CatalogMetricNumSingle({ children }) {
  return (
    <div className="vendas-page__num-stack">
      <span className="vendas-page__num-stack-primary">{children}</span>
      <span className="vendas-page__num-stack-secondary-slot" aria-hidden="true" />
    </div>
  );
}

/**
 * Banda SSOT do catálogo → classes de saúde financeira da Vendas (somente visual).
 * @param {CatalogProfitBand} band
 */
function catalogBandToVendasFinTone(band) {
  switch (band) {
    case "healthy":
      return "vendas-page__fin--health-healthy";
    case "warn":
      return "vendas-page__fin--health-warn";
    case "loss":
      return "vendas-page__fin--health-critical";
    default:
      return "vendas-page__fin--empty";
  }
}

/** @param {string} toneClass */
function catalogVendasFinValueClass(toneClass) {
  if (toneClass === "vendas-page__fin--health-critical") return "vendas-page__fin-value--health-critical";
  if (toneClass === "vendas-page__fin--health-warn") return "vendas-page__fin-value--health-warn";
  if (toneClass === "vendas-page__fin--health-healthy") return "vendas-page__fin-value--health-healthy";
  if (toneClass === "vendas-page__fin--empty") return "vendas-page__fin-value--empty";
  return "";
}

/**
 * Indicador compacto de saúde (paridade Vendas): ▲ saudável, ● margem crítica, ▼ prejuízo.
 * @param {{ toneClass: string }} props
 */
function CatalogProfitHealthHint({ toneClass }) {
  if (toneClass === "vendas-page__fin--health-critical") {
    return (
      <span
        className="vendas-page__profit-hint vendas-page__profit-hint--down"
        title="Prejuízo"
        aria-label="Prejuízo"
      />
    );
  }
  if (toneClass === "vendas-page__fin--health-warn") {
    return (
      <span
        className="vendas-page__profit-hint vendas-page__profit-hint--dot"
        title="Margem crítica"
        aria-label="Margem crítica"
      />
    );
  }
  if (toneClass === "vendas-page__fin--health-healthy") {
    return (
      <span
        className="vendas-page__profit-hint vendas-page__profit-hint--up"
        title="Saudável"
        aria-label="Saudável"
      />
    );
  }
  return null;
}

/**
 * Célula métrica do catálogo com tokens visuais da página Vendas.
 * @param {{
 *   columnClass: string;
 *   variant?: "neutral" | "money" | "profit" | "margin";
 *   toneClass?: string;
 *   children: import("react").ReactNode;
 * }} props
 */
function CatalogMetricCell({ columnClass, variant = "neutral", toneClass = "", children }) {
  const variantClass =
    variant === "money"
      ? "vendas-page__num-cell--sale"
      : variant === "profit"
        ? "vendas-page__num-cell--profit"
        : variant === "margin"
          ? "vendas-page__num-cell--margin"
          : "";
  return (
    <div
      className={[
        "products-catalog__cell",
        columnClass,
        "products-catalog__cell--metric-vendas",
        "vendas-page__num-cell",
        variantClass,
        toneClass,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

/** @param {string} display */
function renderCatalogMoneyDisplay(display) {
  if (display === "—") return <CatalogMetricMissing />;
  return display;
}

/**
 * Rótulo % com tipografia da Vendas (UI-only; não altera cálculo SSOT).
 * @param {number | null | undefined} marginPct
 */
function formatCatalogPctVendasStyle(marginPct) {
  if (marginPct == null || !Number.isFinite(marginPct)) return null;
  return `${marginPct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/**
 * Lista de páginas com null = reticências entre saltos.
 * @param {number} current
 * @param {number} total
 * @returns {(number | null)[]}
 */
function ProductCatalogRow({
  product,
  onOpenEdit,
  onRequestDelete,
  showMarketplacesColumn = false,
  catalogFinancialReady = false,
}) {
  const id = product?.id;
  const name = String(product?.product_name || "Sem nome").trim() || "Sem nome";
  const sku = String(product?.sku || "").trim();
  const imgUrl = useProductMainImageSrc(product);
  const metrics = getProductCatalogMetrics(product);
  const stock = getProductStockDisplay(product);
  const hasSalesHistory = metrics.salesCount > 0;
  const marginPct = getContributionMarginPercent(product, metrics);
  const profitBand = getCatalogProfitSemanticBand(product, metrics);
  const financialToneClass =
    catalogFinancialReady && hasSalesHistory ? catalogBandToVendasFinTone(profitBand) : "vendas-page__fin--empty";
  const financialValueClass = catalogVendasFinValueClass(financialToneClass);

  const revenueDisplay =
    catalogFinancialReady && hasSalesHistory ? formatCatalogBRL(metrics.revenue) : "—";
  const ticketDisplay =
    catalogFinancialReady && hasSalesHistory && metrics.averageTicket != null
      ? formatCatalogBRL(metrics.averageTicket)
      : "—";
  const profitDisplay =
    catalogFinancialReady && hasSalesHistory && metrics.grossProfit != null
      ? formatCatalogBRL(metrics.grossProfit)
      : "—";
  const marginDisplay =
    catalogFinancialReady && hasSalesHistory ? formatCatalogPctVendasStyle(marginPct) : null;

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

  const cadastroProgressPercent =
    typeof product?.catalog_form_progress_percent === "number" &&
    Number.isFinite(product.catalog_form_progress_percent)
      ? Math.max(0, Math.min(100, Math.round(product.catalog_form_progress_percent)))
      : 0;

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
        {imgUrl ? (
          <span
            className="products-catalog__thumb-wrap s7-operational-thumb-frame s7-operational-thumb-frame--circle"
            aria-hidden
          >
            <img
              src={imgUrl}
              alt=""
              className="products-catalog__thumb-img s7-operational-thumb"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </span>
        ) : (
          <span className="products-catalog__thumb-slot" aria-hidden />
        )}
      </div>

      <div className="products-catalog__cell products-catalog__cell--product">
        <S7CatalogProductHeadline
          title={name}
          sku={sku}
          incomplete={catalogIncomplete}
          titleTooltip={name}
          copyNameFlashKey={`product-name-${id}`}
          copySkuFlashKey={`product-sku-${id}`}
          actions={
            catalogIncomplete ? (
              <div role="presentation" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                <S7Button
                  type="button"
                  variant="warning"
                  size="sm"
                  className="products-catalog__complete-product-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (id) onOpenEdit(id);
                  }}
                >
                  Completar cadastro
                </S7Button>
              </div>
            ) : null
          }
        />
      </div>

      <CatalogMetricCell columnClass="products-catalog__cell--num" variant="money">
        <CatalogMetricNumSingle>{metrics.adsCount}</CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell columnClass="products-catalog__cell--num" variant="money">
        <CatalogMetricNumSingle>{metrics.salesCount}</CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell columnClass="products-catalog__cell--money" variant="money">
        <CatalogMetricNumSingle>{renderCatalogMoneyDisplay(revenueDisplay)}</CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell columnClass="products-catalog__cell--money" variant="money">
        <CatalogMetricNumSingle>{renderCatalogMoneyDisplay(ticketDisplay)}</CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell columnClass="products-catalog__cell--money" variant="profit" toneClass={financialToneClass}>
        <CatalogMetricNumSingle>
          <span className="vendas-page__fin-value-row">
            <span className={`vendas-page__fin-value ${financialValueClass}`}>
              {renderCatalogMoneyDisplay(profitDisplay)}
            </span>
            {catalogFinancialReady && hasSalesHistory ? (
              <CatalogProfitHealthHint toneClass={financialToneClass} />
            ) : null}
          </span>
        </CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell columnClass="products-catalog__cell--pct" variant="margin" toneClass={financialToneClass}>
        <CatalogMetricNumSingle>
          <span className="vendas-page__fin-value-row">
            <span className={`vendas-page__fin-value ${financialValueClass}`}>
              {marginDisplay != null ? marginDisplay : <CatalogMetricMissing />}
            </span>
            {catalogFinancialReady && hasSalesHistory ? (
              <CatalogProfitHealthHint toneClass={financialToneClass} />
            ) : null}
          </span>
        </CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell columnClass="products-catalog__cell--num" variant="money">
        <CatalogMetricNumSingle>
          {stock === 0 ? (
            <span className="products-catalog__stock-zero-value" title="Sem estoque">
              {stock}
            </span>
          ) : (
            stock
          )}
        </CatalogMetricNumSingle>
      </CatalogMetricCell>
      <div
        className="products-catalog__cell products-catalog__cell--progress"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="products-catalog__progress-compact" title={`Cadastro ${cadastroProgressPercent}%`}>
          <ProductHealthProgress
            percent={cadastroProgressPercent}
            showLabel={false}
            variant="semi"
          />
        </div>
      </div>
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
  const [catalogFinancialById, setCatalogFinancialById] = useState(
    /** @type {Record<string, Record<string, unknown>>} */ ({}),
  );
  const [catalogFinancialAdsCounts, setCatalogFinancialAdsCounts] = useState(
    /** @type {Record<string, number>} */ ({}),
  );
  const [catalogFinancialLoading, setCatalogFinancialLoading] = useState(true);
  const [catalogFilterId, setCatalogFilterId] = useState("all");
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [editModalProductId, setEditModalProductId] = useState(/** @type {string | null} */ (null));
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const addNotificationRef = useRef(addNotification);
  const catalogFilterChips = useMemo(() => getCatalogFilterChipsForToolbar(), []);

  const productsWithFinancial = useMemo(
    () =>
      products.map((product) =>
        mergeProductCatalogFinancialRow(product, catalogFinancialById, catalogFinancialAdsCounts),
      ),
    [products, catalogFinancialById, catalogFinancialAdsCounts],
  );

  const searchFilteredProducts = useMemo(
    () => filterProductsByCatalogSearch(productsWithFinancial, catalogSearchQuery),
    [productsWithFinancial, catalogSearchQuery],
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

  const reportContext = useMemo(
    () =>
      buildProdutosReportContext({
        listFilterId: catalogFilterId,
        searchQuery: catalogSearchQuery,
        scopeProductsCount: displayProducts.length,
        pageProducts: paginatedProducts,
      }),
    [catalogFilterId, catalogSearchQuery, displayProducts.length, paginatedProducts],
  );

  const aggregatedReport = useMemo(
    () => buildProdutosAggregatedReport(reportContext, { products: displayProducts }),
    [displayProducts, reportContext],
  );

  const catalogFinancialReady = !catalogFinancialLoading;

  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setCatalogFinancialLoading(true);
        const res = await fetchProductCatalogFinancial();
        if (cancelled) {
          if (import.meta.env.DEV) {
            console.warn("[S7][Products] catalog-financial cancelado (unmount/strict mode)", {
              ok: res.ok,
              status: res.status,
              elapsedMs: res.elapsedMs ?? null,
            });
          }
          return;
        }
        if (res.ok) {
          setCatalogFinancialById(res.byProductId);
          setCatalogFinancialAdsCounts(res.adsLinkedCountByProductId);

          if (import.meta.env.DEV) {
            const finIds = Object.keys(res.byProductId ?? {});
            const adsIds = Object.keys(res.adsLinkedCountByProductId ?? {});
            console.info("[S7][Products] catalog-financial merge", {
              elapsedMs: res.elapsedMs ?? null,
              financialCount: finIds.length,
              adsCount: adsIds.length,
              withSalesCount: finIds.filter(
                (id) => Number(res.byProductId?.[id]?.quantity_sold) > 0,
              ).length,
            });
          }
          return;
        }
        setCatalogFinancialById({});
        setCatalogFinancialAdsCounts({});
        if (import.meta.env.DEV) {
          console.warn("[S7][Products] catalog-financial falhou", {
            status: res.status,
            error: res.error,
            timedOut: res.timedOut ?? false,
          });
        }
        addNotificationRef.current?.({
          severity: NOTIFICATION_SEVERITY.warning,
          title: "Métricas do catálogo indisponíveis",
          message:
            res.error ??
            "Não foi possível carregar vendas e lucro da lista de produtos. Tente recarregar a página.",
          dedupeKey: "catalog-financial-fetch-failed",
        });
      } catch (err) {
        if (!cancelled) {
          setCatalogFinancialById({});
          setCatalogFinancialAdsCounts({});
          if (import.meta.env.DEV) {
            console.error("[S7][Products] catalog-financial exception", err);
          }
          addNotificationRef.current?.({
            severity: NOTIFICATION_SEVERITY.warning,
            title: "Métricas do catálogo indisponíveis",
            message: "Não foi possível carregar vendas e lucro da lista de produtos. Tente recarregar a página.",
            dedupeKey: "catalog-financial-fetch-exception",
          });
        }
      } finally {
        if (!cancelled) {
          setCatalogFinancialLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canShowRelatorios = canOfferProdutosReport(displayProducts.length);
  const relatoriosDisabled = productsLoading || !canShowRelatorios;

  const openReportModal = useCallback(() => {
    setReportModalOpen(true);
  }, []);

  const onOpenEdit = useCallback((productId) => {
    if (!productId) return;
    setEditModalProductId(String(productId));
  }, []);

  const refreshCatalogProductRow = useCallback(async (productId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id || !productId) return;

    let { data, error } = await supabase
      .from("products")
      .select(
        `
          *,
          product_variants ( id, stock_quantity, attributes, sort_order, cost_price ),
          product_image_links ( storage_path, variant_key, sort_order, is_primary )
        `
      )
      .eq("id", productId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      const fallback = await supabase
        .from("products")
        .select("*, product_variants ( id, stock_quantity, attributes, sort_order, cost_price )")
        .eq("id", productId)
        .eq("user_id", user.id)
        .maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) return;

    const readiness = computeCatalogProductReadiness(data);
    const nextRow = {
      ...data,
      is_product_ready: readiness.is_product_ready,
      missing_fields: readiness.missing_fields,
      product_completeness_score: readiness.product_completeness_score,
      catalog_form_progress_percent: calcCatalogFormProgressPercentFromProductRow(data),
    };

    setProducts((prev) => {
      const idx = prev.findIndex((p) => String(p.id) === String(productId));
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...nextRow };
      return copy;
    });
  }, []);

  const handleEditModalClose = useCallback(() => {
    setEditModalProductId(null);
  }, []);

  const handleEditModalSaved = useCallback(
    async (productId) => {
      await refreshCatalogProductRow(productId);
      setEditModalProductId(null);
    },
    [refreshCatalogProductRow],
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
            catalog_form_progress_percent: calcCatalogFormProgressPercentFromProductRow(row),
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

      <ProductsFiltersCard
        filterChips={catalogFilterChips}
        listFilter={catalogFilterId}
        onListFilterChange={setCatalogFilterId}
        searchInput={catalogSearchQuery}
        onSearchInputChange={setCatalogSearchQuery}
        hasActiveFilters={catalogFilterId !== "all" || catalogSearchQuery.trim().length > 0}
        onClearAll={() => {
          setCatalogFilterId("all");
          setCatalogSearchQuery("");
        }}
        onNewProductClick={() => navigate("/produtos/novo")}
        showRelatorios={canShowRelatorios}
        relatoriosDisabled={relatoriosDisabled}
        onRelatoriosClick={openReportModal}
      />

      {productsLoading ? (
        <p className="products-catalog__loading">Carregando produtos...</p>
      ) : products.length === 0 ? (
        <div className="products-catalog__empty-card">
          <S7EmptyState
            title="Nenhum produto cadastrado"
            description="Cadastre itens para precificar, vincular anúncios e acompanhar resultados por marketplace. Use o botão Novo produto na barra de filtros."
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
                <CatalogHeadCell columnClass="products-catalog__cell--money" tip={CATALOG_COLUMN_TOOLTIPS.revenue}>
                  Faturamento
                </CatalogHeadCell>
                <CatalogHeadCell
                  columnClass="products-catalog__cell--money"
                  tip={CATALOG_COLUMN_TOOLTIPS.ticket}
                  tipWrap
                  lines={["Ticket", "Médio"]}
                />
                <CatalogHeadCell
                  columnClass="products-catalog__cell--money"
                  tip={CATALOG_COLUMN_TOOLTIPS.profitBrl}
                  tipWrap
                  lines={["Lucro", "(R$)"]}
                />
                <CatalogHeadCell columnClass="products-catalog__cell--pct" tip={CATALOG_COLUMN_TOOLTIPS.profitPct}>
                  Lucro (%)
                </CatalogHeadCell>
                <div className="products-catalog__cell products-catalog__cell--num products-catalog__col-head">Estoque</div>
                <div
                  className="products-catalog__cell products-catalog__cell--progress products-catalog__col-head"
                  aria-hidden="true"
                />
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
                    onOpenEdit={onOpenEdit}
                    onRequestDelete={handleRequestDeleteProduct}
                    showMarketplacesColumn={SHOW_CATALOG_MARKETPLACES_COLUMN}
                    catalogFinancialReady={catalogFinancialReady}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Paginação padrão Suse7 (modelo Vendas): "Página X de Y · Z produtos no total" */}
          <S7Pagination
            page={catalogPage}
            totalPages={totalPages}
            total={totalFiltered}
            noun="produtos"
            ariaLabel="Paginação do catálogo"
            onPrevious={() => setCatalogPage((p) => Math.max(1, p - 1))}
            onNext={() => setCatalogPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      )}

      <ProductEditModal
        open={editModalProductId != null}
        productId={editModalProductId}
        onClose={handleEditModalClose}
        onSaved={handleEditModalSaved}
      />

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

      <ProdutosGerarRelatorioModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportContext={reportContext}
        aggregatedReport={aggregatedReport}
      />
    </div>
  );
}
