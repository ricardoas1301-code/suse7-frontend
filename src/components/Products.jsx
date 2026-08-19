// ======================================================================
// PÁGINA: Produtos — listagem operacional do catálogo (Suse7)
// Linha clicável → edição; colunas preparadas para anúncios, vendas e MKP.
// ======================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuthBootstrap } from "../contexts/AuthBootstrapContext";
import { useNotifications } from "../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";
import S7Button from "./ui/S7Button";
import S7ConfirmModal from "./ui/S7ConfirmModal";
import S7EmptyState from "./ui/S7EmptyState";
import S7Icon from "./ui/S7Icon";
import S7Pagination from "./ui/S7Pagination";
import S7Tooltip from "./ui/S7Tooltip";
import { S7CatalogProductHeadline } from "./catalog/S7CatalogListingHeadline.jsx";
import { applyProductsCatalogFilters } from "../features/products/domain/applyProductsCatalogFilters.js";
import { normalizarIdFiltroRapidoProdutos } from "../features/products/domain/productHealthListClassifiers.js";
import { PRODUCTS_QUICK_FILTER_NEUTRAL_ID } from "../features/products/domain/productHealthConstants.js";
import { filterProductsByCatalogSearch } from "../utils/catalogSearch";
import {
  fetchProductCatalogFinancial,
  mergeProductCatalogFinancialRow,
} from "../services/productCatalogFinancialApi";
import {
  fetchProductCatalogHealthBuckets,
  mergeProductCatalogHealthBucketsRow,
} from "../services/productCatalogHealthBucketsApi";
import {
  formatCatalogBRL,
  getCatalogProfitSemanticBand,
  getContributionMarginPercent,
  getProductCatalogMetrics,
  getProductStockDisplay,
  marketplaceChipLabel,
} from "../utils/productCatalogRow";
import { CatalogProfitHealthHint } from "./catalog/CatalogFinancialMetricUi.jsx";
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
import QuickProductCostsModal from "../features/listings/components/QuickProductCostsModal.jsx";
import { bindCatalogListHorizontalScroll } from "../features/listings/layout/catalogListHorizontalScroll.js";
import ProductHealthCenter from "../features/dashboard/components/ProductHealthCenter.jsx";
import S7OperationalExecutiveBlock from "./dashboard/S7OperationalExecutiveBlock.jsx";
import { S7OperationalListsGate } from "../billing/components/S7EntitlementGates.jsx";
import { useBillingEntitlement } from "../billing/hooks/useBillingEntitlement.js";
import { useBillingEntitlementProfileTransition } from "../billing/hooks/useBillingEntitlementProfileTransition.js";
import { BILLING_ENTITLEMENT_CAPABILITY } from "../billing/billingEntitlementCapabilities.js";
import "./Products.css";
import "./Anuncios.css";
import "../styles/VendasPage.css";
import "./ProductsCatalogGridAlign.css";
import "./S7OperationalRowCardProdutos.css";
import "./catalog/S7CatalogListingHeadline.css";

/** Coluna Marketplaces: dados seguem em `getProductCatalogMetrics`; UI oculta até a visão MKP amadurecer. */
const SHOW_CATALOG_MARKETPLACES_COLUMN = false;
const COMPLETE_PRODUCT_COSTS_LABEL = "Cadastrar Custos";
const COMPLETE_PRODUCT_COSTS_TOOLTIP = "Cadastrar custos do produto para calcular lucro e margem.";

function logProductsListLoadDev(label, payload = {}) {
  if (!import.meta.env.DEV) return;
  console.info(`[S7_PRODUCTS_LIST_FORENSIC] ${label}`, payload);
}

/** Itens por página na listagem paginada. */
const CATALOG_PAGE_SIZE = 100;

/** Identificadores semânticos de coluna — header e body compartilham o mesmo contrato (UI). */
const PRODUTOS_COL = {
  select: "select",
  thumb: "thumb",
  product: "product",
  listings: "listings",
  sales: "sales",
  revenue: "revenue",
  avgTicket: "avg-ticket",
  profitBrl: "profit-brl",
  profitPercent: "profit-percent",
  payout: "payout",
  stock: "stock",
  progress: "progress",
  actions: "actions",
};

/**
 * Cabeçalho de coluna — rótulo estático (sem tooltip; título já é autoexplicativo).
 * `lines` = rótulo estreito ex.: ["Valor","vendido"] → "Valor vendido" (1 linha, fonte compacta).
 * @param {{ columnClass: string; dataCol?: string; lines?: [string, string]; children?: import("react").ReactNode }} props
 */
function CatalogHeadCell({ columnClass, dataCol, lines, children = null }) {
  const tituloCompacto = lines && lines.length === 2 ? rotuloCabecalhoListaUnicaLinha(lines) : null;
  const label = tituloCompacto ?? children;

  return (
    <div
      className={`products-catalog__cell ${columnClass} products-catalog__col-head`}
      data-col={dataCol}
      role="columnheader"
    >
      {label}
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

/** @param {{ label?: string }} props */
function CatalogMetricPending({ label = "Carregando métricas" }) {
  return (
    <span className="vendas-page__fin-missing" title={label} aria-label={label}>
      …
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
 * Célula métrica do catálogo com tokens visuais da página Vendas.
 * @param {{
 *   columnClass: string;
 *   dataCol: string;
 *   variant?: "neutral" | "money" | "profit" | "margin";
 *   toneClass?: string;
 *   children: import("react").ReactNode;
 * }} props
 */
function CatalogMetricCell({ columnClass, dataCol, variant = "neutral", toneClass = "", children }) {
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
      data-col={dataCol}
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
  onOpenCosts,
  onRequestDelete,
  showMarketplacesColumn = false,
  catalogFinancialReady = false,
  selected = false,
  onToggleSelected,
  selectionDisabled = false,
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
  const pendingFinancial = !catalogFinancialReady;

  const revenueDisplay =
    pendingFinancial ? "…" : catalogFinancialReady && hasSalesHistory ? formatCatalogBRL(metrics.revenue) : "—";
  const ticketDisplay =
    pendingFinancial
      ? "…"
      : catalogFinancialReady && hasSalesHistory && metrics.averageTicket != null
      ? formatCatalogBRL(metrics.averageTicket)
      : "—";
  const profitDisplay =
    pendingFinancial
      ? "…"
      : catalogFinancialReady && hasSalesHistory && metrics.grossProfit != null
      ? formatCatalogBRL(metrics.grossProfit)
      : "—";
  const marginDisplay =
    pendingFinancial ? "…" : catalogFinancialReady && hasSalesHistory ? formatCatalogPctVendasStyle(marginPct) : null;
  const repasseDisplay =
    pendingFinancial
      ? "…"
      : catalogFinancialReady && hasSalesHistory
        ? formatCatalogBRL(metrics.repasse ?? 0)
        : "—";

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
      className={[
        "products-catalog__row",
        "s7-operational-row-card",
        showMarketplacesColumn ? "products-catalog__row--with-marketplaces" : "",
        catalogIncomplete ? "products-catalog__row--incomplete-catalog s7-operational-row-card--critical" : "",
        selected ? "products-catalog__row--selected s7-operational-row-card--selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="button"
      tabIndex={0}
      onClick={handleRowActivate}
      onKeyDown={handleRowKeyDown}
      aria-label={`Editar produto ${name}`}
      data-product-id={id ?? ""}
    >
      <div
        className="products-catalog__cell products-catalog__cell--select anuncios-catalog__cell--select"
        data-col={PRODUTOS_COL.select}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <input
          type="checkbox"
          className="anuncios-catalog__select-checkbox"
          checked={selected}
          disabled={selectionDisabled}
          onChange={() => {
            if (!id) return;
            onToggleSelected?.(String(id));
          }}
          aria-label={`Selecionar produto ${name}`}
        />
      </div>
      <div className="products-catalog__cell products-catalog__cell--thumb" data-col={PRODUTOS_COL.thumb} aria-hidden={false}>
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

      <div className="products-catalog__cell products-catalog__cell--product" data-col={PRODUTOS_COL.product}>
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
                <S7Tooltip content={COMPLETE_PRODUCT_COSTS_TOOLTIP} placement="bottom-start" offset={6} wrap>
                  <span className="anuncios-completar-tooltip-anchor">
                    <S7Button
                      type="button"
                      variant="warning"
                      size="sm"
                      className="products-catalog__complete-product-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (id) {
                          onOpenCosts?.({
                            productId: String(id),
                            sku: sku || null,
                            productTitle: name,
                            productImageUrl: imgUrl || null,
                          });
                        }
                      }}
                    >
                      {COMPLETE_PRODUCT_COSTS_LABEL}
                    </S7Button>
                  </span>
                </S7Tooltip>
        </div>
            ) : null
          }
        />
      </div>

      <CatalogMetricCell dataCol={PRODUTOS_COL.listings} columnClass="products-catalog__cell--num" variant="money">
        <CatalogMetricNumSingle>
          {catalogFinancialReady ? metrics.adsCount : <CatalogMetricPending label="Carregando anúncios" />}
        </CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell dataCol={PRODUTOS_COL.sales} columnClass="products-catalog__cell--num" variant="money">
        <CatalogMetricNumSingle>
          {catalogFinancialReady ? metrics.salesCount : <CatalogMetricPending label="Carregando vendas" />}
        </CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell dataCol={PRODUTOS_COL.revenue} columnClass="products-catalog__cell--money" variant="money">
        <CatalogMetricNumSingle>{renderCatalogMoneyDisplay(revenueDisplay)}</CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell dataCol={PRODUTOS_COL.avgTicket} columnClass="products-catalog__cell--money" variant="money">
        <CatalogMetricNumSingle>{renderCatalogMoneyDisplay(ticketDisplay)}</CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell dataCol={PRODUTOS_COL.profitBrl} columnClass="products-catalog__cell--money" variant="profit" toneClass={financialToneClass}>
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
      <CatalogMetricCell dataCol={PRODUTOS_COL.profitPercent} columnClass="products-catalog__cell--pct" variant="margin" toneClass={financialToneClass}>
        <CatalogMetricNumSingle>
          <span className="vendas-page__fin-value-row">
            <span className={`vendas-page__fin-value ${financialValueClass}`}>
              {marginDisplay != null
                ? marginDisplay
                : pendingFinancial
                  ? <CatalogMetricPending label="Carregando margem" />
                  : <CatalogMetricMissing />}
            </span>
            {catalogFinancialReady && hasSalesHistory ? (
              <CatalogProfitHealthHint toneClass={financialToneClass} />
            ) : null}
          </span>
        </CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell dataCol={PRODUTOS_COL.payout} columnClass="products-catalog__cell--money" variant="money">
        <CatalogMetricNumSingle>{renderCatalogMoneyDisplay(repasseDisplay)}</CatalogMetricNumSingle>
      </CatalogMetricCell>
      <CatalogMetricCell dataCol={PRODUTOS_COL.stock} columnClass="products-catalog__cell--num" variant="money">
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
        data-col={PRODUTOS_COL.progress}
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
      <div className="products-catalog__cell products-catalog__cell--actions" data-col={PRODUTOS_COL.actions}>
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
  const {
    loading: authBootstrapLoading,
    ready: authReady,
    signedOut,
    accessToken,
  } = useAuthBootstrap();
  const { loading: entitlementLoading, can } = useBillingEntitlement();
  const canFetchProductLists = can(BILLING_ENTITLEMENT_CAPABILITY.VIEW_STORED_LISTS);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [catalogFinancialById, setCatalogFinancialById] = useState(
    /** @type {Record<string, Record<string, unknown>>} */ ({}),
  );
  const [catalogFinancialAdsCounts, setCatalogFinancialAdsCounts] = useState(
    /** @type {Record<string, number>} */ ({}),
  );
  const [catalogHealthBucketsById, setCatalogHealthBucketsById] = useState(
    /** @type {Record<string, Record<string, unknown>>} */ ({}),
  );
  const [catalogFinancialLoading, setCatalogFinancialLoading] = useState(true);
  const [catalogFilterId, setCatalogFilterId] = useState(PRODUCTS_QUICK_FILTER_NEUTRAL_ID);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [editModalProductId, setEditModalProductId] = useState(/** @type {string | null} */ (null));
  const [costsModal, setCostsModal] = useState(
    /** @type {{ productId: string; sku: string | null; productTitle: string; productImageUrl: string | null } | null} */ (null),
  );
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(() => new Set());
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const addNotificationRef = useRef(addNotification);
  const catalogFinancialFetchGenRef = useRef(0);
  const financialFetchInFlightRef = useRef(false);

  useBillingEntitlementProfileTransition({
    onEnterExecutiveOnly: () => {
      catalogFinancialFetchGenRef.current += 1;
      financialFetchInFlightRef.current = false;
      setProducts([]);
      setCatalogFinancialById({});
      setCatalogFinancialAdsCounts({});
      setCatalogHealthBucketsById({});
      setCatalogFinancialLoading(false);
      setProductsLoading(false);
    },
    onEnterArchiveReadOnly: () => {
      catalogFinancialFetchGenRef.current += 1;
      financialFetchInFlightRef.current = false;
    },
    onEnterFinancialRecovery: () => {
      catalogFinancialFetchGenRef.current += 1;
      financialFetchInFlightRef.current = false;
      setProducts([]);
      setCatalogFinancialById({});
      setCatalogFinancialAdsCounts({});
      setCatalogHealthBucketsById({});
      setCatalogFinancialLoading(false);
      setProductsLoading(false);
    },
  });

  const lastSuccessfulFinancialKeyRef = useRef("");
  const hadModalOpenRef = useRef(false);
  const lastModalProductRef = useRef({ id: null, sku: null });
  const selectAllPageRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const catalogTableBlockRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const productsExecutiveRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const productsFiltersRef = useRef(/** @type {HTMLElement | null} */ (null));

  const handleCatalogFilterChange = useCallback((nextFilterId) => {
    setCatalogFilterId(normalizarIdFiltroRapidoProdutos(nextFilterId));
  }, []);

  const productsWithFinancial = useMemo(
    () =>
      products.map((product) => {
        const withFinancial = mergeProductCatalogFinancialRow(
          product,
          catalogFinancialById,
          catalogFinancialAdsCounts,
        );
        return mergeProductCatalogHealthBucketsRow(withFinancial, catalogHealthBucketsById);
      }),
    [products, catalogFinancialById, catalogFinancialAdsCounts, catalogHealthBucketsById],
  );

  const searchFilteredProducts = useMemo(
    () => filterProductsByCatalogSearch(productsWithFinancial, catalogSearchQuery),
    [productsWithFinancial, catalogSearchQuery],
  );

  const displayProducts = useMemo(
    () => applyProductsCatalogFilters(searchFilteredProducts, catalogFilterId),
    [searchFilteredProducts, catalogFilterId]
  );

  const totalFiltered = displayProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / CATALOG_PAGE_SIZE));

  useEffect(() => {
    setCatalogPage(1);
  }, [catalogFilterId, catalogSearchQuery]);

  useEffect(() => {
    setSelectedProductIds(new Set());
  }, [catalogFilterId, catalogSearchQuery]);

  useEffect(() => {
    if (catalogPage > totalPages) setCatalogPage(totalPages);
  }, [catalogPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (catalogPage - 1) * CATALOG_PAGE_SIZE;
    return displayProducts.slice(start, start + CATALOG_PAGE_SIZE);
  }, [displayProducts, catalogPage]);

  const pageSelectableIds = useMemo(
    () =>
      paginatedProducts
        .map((product) => String(product?.id ?? "").trim())
        .filter(Boolean),
    [paginatedProducts],
  );

  const allPageSelected = useMemo(
    () => pageSelectableIds.length > 0 && pageSelectableIds.every((id) => selectedProductIds.has(id)),
    [pageSelectableIds, selectedProductIds],
  );

  const somePageSelected = useMemo(
    () => pageSelectableIds.some((id) => selectedProductIds.has(id)) && !allPageSelected,
    [pageSelectableIds, selectedProductIds, allPageSelected],
  );

  useEffect(() => {
    const el = selectAllPageRef.current;
    if (el) el.indeterminate = somePageSelected;
  }, [somePageSelected]);

  const toggleProductSelection = useCallback((productId) => {
    const id = String(productId ?? "").trim();
    if (!id) return;
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllPageProducts = useCallback(() => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      const shouldSelectAll = !allPageSelected;
      for (const id of pageSelectableIds) {
        if (shouldSelectAll) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, [allPageSelected, pageSelectableIds]);

  const selectedProducts = useMemo(
    () => displayProducts.filter((product) => selectedProductIds.has(String(product?.id ?? "").trim())),
    [displayProducts, selectedProductIds],
  );

  const reportProducts = useMemo(
    () => (selectedProducts.length > 0 ? selectedProducts : displayProducts),
    [selectedProducts, displayProducts],
  );

  const reportContext = useMemo(
    () =>
      buildProdutosReportContext({
        listFilterId: catalogFilterId,
        searchQuery: catalogSearchQuery,
        scopeProductsCount: reportProducts.length,
        pageProducts: reportProducts,
      }),
    [catalogFilterId, catalogSearchQuery, reportProducts],
  );

  const aggregatedReport = useMemo(
    () => buildProdutosAggregatedReport(reportContext, { products: reportProducts }),
    [reportContext, reportProducts],
  );

  const productsFinancialKey = useMemo(
    () =>
      products
        .map((p) => String(p?.id ?? p?.product_id ?? p?.sku ?? "").trim())
        .filter(Boolean)
        .join("|"),
    [products],
  );

  const catalogFinancialReady = !catalogFinancialLoading;
  const productsReady = !productsLoading;

  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  useEffect(() => {
    const effectSnapshot = {
      authBootstrapLoading,
      authReady,
      signedOut,
      hasAccessToken: Boolean(accessToken),
      productsLoading,
      productsReady,
      productsCount: products.length,
      productsFinancialKeyLength: productsFinancialKey.length,
      catalogFinancialLoading,
      alreadyFetching: financialFetchInFlightRef.current,
      lastSuccessfulFinancialKeyLength: lastSuccessfulFinancialKeyRef.current.length,
    };
    logProductsListLoadDev("financial_effect_check", effectSnapshot);

    if (authBootstrapLoading || entitlementLoading) {
      logProductsListLoadDev("financial_skip_reason", { reason: "auth_bootstrap_loading" });
      return;
    }

    if (!canFetchProductLists) {
      logProductsListLoadDev("financial_skip_reason", { reason: "entitlement_lists_blocked" });
      setCatalogFinancialById({});
      setCatalogFinancialAdsCounts({});
      setCatalogHealthBucketsById({});
      lastSuccessfulFinancialKeyRef.current = "";
      setCatalogFinancialLoading(false);
      return;
    }

    if (productsLoading) {
      logProductsListLoadDev("financial_skip_reason", { reason: "products_loading" });
      return;
    }

    if (signedOut) {
      logProductsListLoadDev("financial_skip_reason", { reason: "signed_out" });
      setCatalogFinancialById({});
      setCatalogFinancialAdsCounts({});
      lastSuccessfulFinancialKeyRef.current = "";
      setCatalogFinancialLoading(false);
      return;
    }

    if (!accessToken) {
      logProductsListLoadDev("financial_skip_reason", { reason: "no_token" });
      return;
    }

    if (!productsFinancialKey) {
      logProductsListLoadDev("financial_skip_reason", { reason: "no_products" });
      setCatalogFinancialById({});
      setCatalogFinancialAdsCounts({});
      lastSuccessfulFinancialKeyRef.current = "";
      setCatalogFinancialLoading(false);
      return;
    }

    const hasSuccessForKey = lastSuccessfulFinancialKeyRef.current === productsFinancialKey;
    if (hasSuccessForKey) {
      setCatalogFinancialLoading(false);
      logProductsListLoadDev("financial_skip_reason", { reason: "already_loaded_for_products_key" });
      return;
    }

    if (financialFetchInFlightRef.current) {
      logProductsListLoadDev("financial_skip_reason", { reason: "already_fetching" });
      return;
    }

    const fetchGen = ++catalogFinancialFetchGenRef.current;
    financialFetchInFlightRef.current = true;
    setCatalogFinancialLoading(true);
    const perfLabel = `[S7_PRODUCTS_LIST_PERF] catalog-financial gen=${fetchGen}`;
    const requestStartedAt = Date.now();
    if (import.meta.env.DEV) {
      console.time(perfLabel);
      console.info("[S7_PRODUCTS_LIST_PERF] financial_fetch_start", {
        fetchGen,
        startedAt: requestStartedAt,
        productsCount: products.length,
      });
    }
    logProductsListLoadDev("financial_request_start", {
      fetchGen,
      hasToken: Boolean(accessToken),
      productsCount: products.length,
      productsKeyPreview: productsFinancialKey.split("|").slice(0, 5),
    });

    let aborted = false;
    void (async () => {
      try {
        const [res, healthRes] = await Promise.all([
          fetchProductCatalogFinancial(),
          fetchProductCatalogHealthBuckets(),
        ]);
        if (import.meta.env.DEV) {
          console.info("[S7_PRODUCTS_LIST_PERF] financial_fetch_response_received", {
            fetchGen,
            status: res.status,
            elapsedMs: res.elapsedMs ?? null,
          });
          console.info("[S7_PRODUCTS_LIST_PERF] financial_fetch_json_parsed", {
            fetchGen,
            rowsCount: Object.keys(res.byProductId ?? {}).length,
          });
        }
        if (aborted || catalogFinancialFetchGenRef.current !== fetchGen) {
          logProductsListLoadDev("financial_skip_reason", {
            reason: "stale_generation",
            fetchGen,
            currentGen: catalogFinancialFetchGenRef.current,
            status: res.status,
          });
          return;
        }

        const rows = Object.entries(res.byProductId ?? {});
        logProductsListLoadDev("financial_request_done", {
          fetchGen,
          ok: res.ok,
          status: res.status,
          elapsedMs: res.elapsedMs ?? null,
          financialRowsLength: rows.length,
          sample: rows.slice(0, 3).map(([pid, row]) => ({
            product_id: pid,
            sku: row?.sku ?? null,
            listing_count: row?.linked_listings_count ?? null,
            sales_count: row?.quantity_sold ?? null,
            gross_sales: row?.gross_sales_brl ?? null,
            net_profit: row?.contribution_profit_brl ?? null,
            margin: row?.contribution_margin_percent ?? null,
          })),
        });

        if (res.ok) {
          setCatalogFinancialById(res.byProductId);
          setCatalogFinancialAdsCounts(res.adsLinkedCountByProductId);
          setCatalogHealthBucketsById(healthRes.ok ? healthRes.byProductId : {});
          lastSuccessfulFinancialKeyRef.current = productsFinancialKey;
          if (import.meta.env.DEV) {
            const finishedAt = Date.now();
            console.info("[S7_PRODUCTS_LIST_PERF] financial_network_timing", {
              startedAt: requestStartedAt,
              finishedAt,
              durationMs: finishedAt - requestStartedAt,
              status: res.status,
              rowsCount: Object.keys(res.byProductId ?? {}).length,
            });
            console.info("[S7_PRODUCTS_LIST_PERF] financial_merge_done", {
              fetchGen,
              productsCount: products.length,
              financialRows: Object.keys(res.byProductId ?? {}).length,
            });
          }
          return;
        }

        setCatalogFinancialById({});
        setCatalogFinancialAdsCounts({});
        setCatalogHealthBucketsById({});
        logProductsListLoadDev("financial_fetch_failed", {
          fetchGen,
          status: res.status,
          error: res.error,
          timedOut: res.timedOut ?? false,
        });
        if (import.meta.env.DEV) {
          console.info("[S7_PRODUCTS_CATALOG_CONNECTIVITY] request_error", {
            status: res.status ?? 0,
            error_message: res.error ?? null,
            is_network_error: Boolean(res.connectionError),
            is_http_error: Boolean(res.status && res.status >= 400),
            retry_exhausted: true,
            retry_attempt: 3,
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
        if (import.meta.env.DEV) {
          console.info("[S7_PRODUCTS_CATALOG_CONNECTIVITY] backend_unreachable_toast_shown", {
            status: res.status ?? 0,
            message: res.error ?? null,
          });
        }
      } catch (err) {
        if (aborted || catalogFinancialFetchGenRef.current !== fetchGen) return;
        setCatalogFinancialById({});
        setCatalogFinancialAdsCounts({});
        setCatalogHealthBucketsById({});
        logProductsListLoadDev("financial_fetch_exception", { fetchGen, err });
        addNotificationRef.current?.({
          severity: NOTIFICATION_SEVERITY.warning,
          title: "Métricas do catálogo indisponíveis",
          message: "Não foi possível carregar vendas e lucro da lista de produtos. Tente recarregar a página.",
          dedupeKey: "catalog-financial-fetch-exception",
        });
        if (import.meta.env.DEV) {
          console.info("[S7_PRODUCTS_CATALOG_CONNECTIVITY] request_error", {
            status: 0,
            error_name: err?.name ?? "UnknownError",
            error_message: err?.message ?? String(err),
            is_network_error: true,
            is_http_error: false,
            retry_exhausted: true,
          });
          console.info("[S7_PRODUCTS_CATALOG_CONNECTIVITY] backend_unreachable_toast_shown", {
            status: 0,
            message: err?.message ?? String(err),
          });
        }
      } finally {
        if (catalogFinancialFetchGenRef.current === fetchGen) {
          financialFetchInFlightRef.current = false;
          setCatalogFinancialLoading(false);
          if (import.meta.env.DEV) {
            console.timeEnd(perfLabel);
          }
        }
      }
    })();

    return () => {
      aborted = true;
      financialFetchInFlightRef.current = false;
      catalogFinancialFetchGenRef.current += 1;
      logProductsListLoadDev("financial_fetch_invalidated", { fetchGen });
    };
  }, [
    authBootstrapLoading,
    authReady,
    signedOut,
    accessToken,
    productsLoading,
    productsReady,
    products.length,
    productsFinancialKey,
  ]);

  useEffect(() => {
    if (!catalogFinancialReady || productsLoading) return;

    const productIds = products.map((p) => String(p.id ?? "").trim()).filter(Boolean);
    const finIds = Object.keys(catalogFinancialById);
    const matchedIds = productIds.filter((id) => finIds.includes(id));
    const missingMetricsIds = productIds.filter(
      (id) => !finIds.includes(id) && !(Number(catalogFinancialAdsCounts[id]) > 0),
    );

    logProductsListLoadDev("merge_result", {
      productsLength: productIds.length,
      financialRowsLength: finIds.length,
      matchedCount: matchedIds.length,
      missingCount: missingMetricsIds.length,
      sampleMissing: missingMetricsIds.slice(0, 5).map((id) => {
        const p = products.find((row) => String(row?.id ?? "") === id);
        return {
          id,
          sku: p?.sku ?? null,
          title: p?.product_name ?? null,
        };
      }),
      sampleFinancialKeys: finIds.slice(0, 5),
    });

    logProductsListLoadDev("list_enrichment_settled", {
      productsCount: productIds.length,
      financialCount: finIds.length,
      missingMetricsCount: missingMetricsIds.length,
      missingMetricsSample: missingMetricsIds.slice(0, 5),
      catalogFinancialReady,
    });
  }, [
    catalogFinancialReady,
    productsLoading,
    products,
    catalogFinancialById,
    catalogFinancialAdsCounts,
  ]);

  useEffect(() => {
    if (productsLoading || displayProducts.length === 0) return;

    const sample = displayProducts.slice(0, 3).map((product) => {
      const metrics = getProductCatalogMetrics(product);
      const hasSalesHistory = metrics.salesCount > 0;
      const marginPct = getContributionMarginPercent(product, metrics);
      return {
        title: product?.product_name ?? null,
        sku: product?.sku ?? null,
        listing_count_rendered: catalogFinancialReady ? metrics.adsCount : "—",
        sales_count_rendered: catalogFinancialReady ? metrics.salesCount : "—",
        faturamento_rendered:
          catalogFinancialReady && hasSalesHistory ? formatCatalogBRL(metrics.revenue) : "—",
        lucro_rendered:
          catalogFinancialReady && hasSalesHistory && metrics.grossProfit != null
            ? formatCatalogBRL(metrics.grossProfit)
            : "—",
        lucro_percent_rendered:
          catalogFinancialReady && hasSalesHistory ? formatCatalogPctVendasStyle(marginPct) : "—",
        financial_source_found: Boolean(catalogFinancialById?.[String(product?.id ?? "")]),
      };
    });

    if (!hadModalOpenRef.current) {
      logProductsListLoadDev("render_row_sample_before_modal", sample);
      if (import.meta.env.DEV && catalogFinancialReady) {
        console.info("[S7_PRODUCTS_LIST_PERF] financial_render_done", {
          phase: "before_modal",
          renderedRows: displayProducts.length,
          withFinancialRows: Object.keys(catalogFinancialById ?? {}).length,
        });
      }
      return;
    }

    if (hadModalOpenRef.current && editModalProductId == null) {
      logProductsListLoadDev("render_row_sample_after_modal", sample);
      if (import.meta.env.DEV && catalogFinancialReady) {
        console.info("[S7_PRODUCTS_LIST_PERF] financial_render_done", {
          phase: "after_modal",
          renderedRows: displayProducts.length,
          withFinancialRows: Object.keys(catalogFinancialById ?? {}).length,
        });
      }
    }
  }, [
    productsLoading,
    displayProducts,
    catalogFinancialReady,
    catalogFinancialById,
    editModalProductId,
  ]);

  const canShowRelatorios = canOfferProdutosReport(displayProducts.length);
  const relatoriosDisabled = productsLoading || !canShowRelatorios;

  const openReportModal = useCallback(() => {
    setReportModalOpen(true);
  }, []);

  const onOpenEdit = useCallback((productId) => {
    if (!productId) return;
    const row = products.find((p) => String(p?.id ?? "") === String(productId));
    lastModalProductRef.current = {
      id: String(productId),
      sku: row?.sku != null ? String(row.sku) : null,
    };
    hadModalOpenRef.current = true;
    logProductsListLoadDev("modal_open", {
      productId: String(productId),
      sku: row?.sku ?? null,
    });
    setEditModalProductId(String(productId));
  }, [products]);

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
    logProductsListLoadDev("modal_close", {
      productId: lastModalProductRef.current.id,
      sku: lastModalProductRef.current.sku,
      triggeredRefetch: false,
      source: "onClose",
    });
    setEditModalProductId(null);
  }, []);

  const handleEditModalSaved = useCallback(
    async (productId) => {
      await refreshCatalogProductRow(productId);
      logProductsListLoadDev("modal_saved", {
        productId: String(productId),
        sku: products.find((p) => String(p?.id ?? "") === String(productId))?.sku ?? lastModalProductRef.current.sku ?? null,
        triggeredRefetch: true,
        source: "onSaved",
        modalKeptOpen: true,
      });
    },
    [refreshCatalogProductRow, products],
  );

  const handleCostsModalSaved = useCallback(async () => {
    if (!costsModal?.productId) return;
    await refreshCatalogProductRow(costsModal.productId);
  }, [costsModal?.productId, refreshCatalogProductRow]);

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
      logProductsListLoadDev("products_fetch_start");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        logProductsListLoadDev("products_fetch_skip_no_user");
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
        logProductsListLoadDev("products_state_after_fetch", {
          productsLength: rows.length,
          sample: rows.slice(0, 3).map((row) => ({
            id: row?.id ?? null,
            product_id: row?.product_id ?? null,
            sku: row?.sku ?? null,
            title: row?.product_name ?? null,
            marketplace_ids: row?.marketplace_ids ?? row?.linked_marketplaces ?? null,
          })),
        });
        logProductsListLoadDev("products_fetch_done", {
          productsCount: rows.length,
        });
      } else {
        logProductsListLoadDev("products_fetch_failed", { error: error?.message ?? String(error) });
      }
      setProductsLoading(false);
    };

    loadProducts();
  }, []);

  const gridMod = SHOW_CATALOG_MARKETPLACES_COLUMN
    ? " products-catalog__grid--with-marketplaces"
    : "";

  useEffect(() => {
    const pageContent = catalogTableBlockRef.current?.closest(".page-content");
    if (!pageContent || !catalogTableBlockRef.current) {
      return undefined;
    }
    return bindCatalogListHorizontalScroll(pageContent, catalogTableBlockRef.current);
  }, [displayProducts.length, productsLoading, catalogPage]);

  const catalogGridHead = (
    <div className={`products-catalog__grid products-catalog__grid--head${gridMod}`}>
      <div
        className="products-catalog__cell products-catalog__cell--select anuncios-catalog__cell--select products-catalog__col-head"
        data-col={PRODUTOS_COL.select}
      >
        <input
          ref={selectAllPageRef}
          type="checkbox"
          className="anuncios-catalog__select-checkbox"
          checked={allPageSelected}
          disabled={paginatedProducts.length === 0}
          aria-label="Selecionar todos os produtos da página"
          onChange={toggleAllPageProducts}
        />
      </div>
      <div className="products-catalog__cell products-catalog__cell--thumb" data-col={PRODUTOS_COL.thumb} aria-hidden />
      <div
        className="products-catalog__cell products-catalog__cell--product products-catalog__col-head"
        data-col={PRODUTOS_COL.product}
      >
        Produto
      </div>
      <CatalogHeadCell dataCol={PRODUTOS_COL.listings} columnClass="products-catalog__cell--num">
        Anúncios
      </CatalogHeadCell>
      <CatalogHeadCell dataCol={PRODUTOS_COL.sales} columnClass="products-catalog__cell--num">
        Vendas
      </CatalogHeadCell>
      <CatalogHeadCell dataCol={PRODUTOS_COL.revenue} columnClass="products-catalog__cell--money">
        Faturamento
      </CatalogHeadCell>
      <CatalogHeadCell
        dataCol={PRODUTOS_COL.avgTicket}
        columnClass="products-catalog__cell--money"
        lines={["Ticket", "Médio"]}
      />
      <CatalogHeadCell
        dataCol={PRODUTOS_COL.profitBrl}
        columnClass="products-catalog__cell--money"
        lines={["Lucro", "(R$)"]}
      />
      <CatalogHeadCell dataCol={PRODUTOS_COL.profitPercent} columnClass="products-catalog__cell--pct">
        Lucro (%)
      </CatalogHeadCell>
      <CatalogHeadCell dataCol={PRODUTOS_COL.payout} columnClass="products-catalog__cell--money">
        Repasse
      </CatalogHeadCell>
      <CatalogHeadCell dataCol={PRODUTOS_COL.stock} columnClass="products-catalog__cell--num">
        Estoque
      </CatalogHeadCell>
      <div
        className="products-catalog__cell products-catalog__cell--progress products-catalog__col-head"
        data-col={PRODUTOS_COL.progress}
        aria-hidden="true"
      />
      {SHOW_CATALOG_MARKETPLACES_COLUMN ? (
        <div className="products-catalog__cell products-catalog__cell--mkts products-catalog__col-head">Marketplaces</div>
      ) : null}
      <div
        className="products-catalog__cell products-catalog__cell--actions products-catalog__cell--actions-head products-catalog__col-head"
        data-col={PRODUTOS_COL.actions}
      >
        <span className="products-catalog__sr-only">Ações</span>
      </div>
    </div>
  );

  return (
    <div className="products-catalog">
      <h1 className="products-catalog__sr-title">Produtos</h1>

      <S7OperationalExecutiveBlock ref={productsExecutiveRef}>
        <ProductHealthCenter
          className="dashboard-page__products-health"
          sectionJumpDownTargetRef={productsFiltersRef}
          sectionJumpDownAriaLabel="Ir para busca e filtros"
        />
      </S7OperationalExecutiveBlock>

      <S7OperationalListsGate>
      <div ref={catalogTableBlockRef} className="products-catalog__table-block">
        <div className="products-catalog__list-sticky-chrome" aria-label="Busca, filtros e cabeçalho da lista">
          <div className="products-catalog__sticky-top-spacer" aria-hidden="true" />

          <ProductsFiltersCard
            ref={productsFiltersRef}
            listFilter={catalogFilterId}
            onListFilterChange={handleCatalogFilterChange}
            searchInput={catalogSearchQuery}
            onSearchInputChange={setCatalogSearchQuery}
            hasActiveFilters={
              catalogFilterId !== PRODUCTS_QUICK_FILTER_NEUTRAL_ID ||
              catalogSearchQuery.trim().length > 0
            }
            onClearAll={() => {
              setCatalogFilterId(PRODUCTS_QUICK_FILTER_NEUTRAL_ID);
              setCatalogSearchQuery("");
            }}
            onNewProductClick={() => navigate("/produtos/novo")}
            showRelatorios={canShowRelatorios}
            relatoriosDisabled={relatoriosDisabled}
            onRelatoriosClick={openReportModal}
            selectedCount={selectedProductIds.size}
            sectionJumpUpTargetRef={productsExecutiveRef}
            sectionJumpUpAriaLabel="Voltar para a Central de Saúde do Produto"
          />

          <div className="products-catalog__list-header-slot">
            <div className="products-catalog__table-hscroll products-catalog__table-hscroll--head">
              {catalogGridHead}
            </div>
          </div>
        </div>

        <div className="products-catalog__list-operational">
          {productsLoading ? (
            <p className="products-catalog__loading">Carregando produtos...</p>
          ) : products.length === 0 ? (
            <div className="products-catalog__empty-card">
              <S7EmptyState
                title="Nenhum produto cadastrado"
                description="Cadastre itens para precificar, vincular anúncios e acompanhar resultados por marketplace."
                action={
                  <S7Button type="button" variant="primary" onClick={() => navigate("/produtos/novo")}>
                    Novo produto
                  </S7Button>
                }
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
                        setCatalogFilterId(PRODUCTS_QUICK_FILTER_NEUTRAL_ID);
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
            <div className="products-catalog__table-card products-catalog__table-card--scroll-viewport s7-operational-row-card-viewport">
              <div className="products-catalog__table-hscroll products-catalog__table-hscroll--body">
                <div className="products-catalog__body s7-operational-row-card-stack">
                  {paginatedProducts.map((product) => (
                    <ProductCatalogRow
                      key={product.id}
                      product={product}
                      onOpenEdit={onOpenEdit}
                      onOpenCosts={setCostsModal}
                      onRequestDelete={handleRequestDeleteProduct}
                      showMarketplacesColumn={SHOW_CATALOG_MARKETPLACES_COLUMN}
                      catalogFinancialReady={catalogFinancialReady}
                      selected={selectedProductIds.has(String(product?.id ?? "").trim())}
                      onToggleSelected={toggleProductSelection}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {displayProducts.length > 0 ? (
          <S7Pagination
            page={catalogPage}
            totalPages={totalPages}
            total={totalFiltered}
            noun="produtos"
            ariaLabel="Paginação do catálogo"
            onPrevious={() => setCatalogPage((p) => Math.max(1, p - 1))}
            onNext={() => setCatalogPage((p) => Math.min(totalPages, p + 1))}
          />
        ) : null}
      </div>
      </S7OperationalListsGate>

      <ProductEditModal
        open={editModalProductId != null}
        productId={editModalProductId}
        onClose={handleEditModalClose}
        onSaved={handleEditModalSaved}
      />

      <QuickProductCostsModal
        open={costsModal != null}
        productId={costsModal?.productId ?? null}
        sku={costsModal?.sku ?? null}
        productTitle={costsModal?.productTitle ?? "Produto"}
        productImageUrl={costsModal?.productImageUrl ?? null}
        onClose={() => setCostsModal(null)}
        onSaved={handleCostsModalSaved}
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
