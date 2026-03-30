// ======================================================================
// PÁGINA: Anúncios — listagem operacional (Suse7), espelhando Produtos.
// Fonte: GET /api/ml/listings
// Sincronização completa (um clique): POST /api/ml/sync-listings → POST /api/ml/sync-sales
//   → GET /api/ml/listings → GET /api/ml/sales-summary (resumo agregado no servidor)
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildApiUrl, apiFetch } from "../config/api";
import S7Button from "./ui/S7Button";
import S7EmptyState from "./ui/S7EmptyState";
import S7Icon from "./ui/S7Icon";
import S7Input from "./ui/S7Input";
import { applyAdsCatalogFilter, getAdsFilterChipsForToolbar } from "../utils/adsFilterRegistry";
import { filterAdsByCatalogSearch } from "../utils/adsCatalogSearch";
import { formatCatalogBRL, marketplaceChipLabel } from "../utils/productCatalogRow";
import MarketplaceBadge from "./MarketplaceBadge.jsx";
import AnunciosSyncModal from "./AnunciosSyncModal.jsx";
import "./Products.css";
import "./Anuncios.css";

const ADS_PAGE_SIZE = 25;

const ADS_COLUMN_TOOLTIPS = {
  cover: "Imagem principal do anúncio importada do marketplace.",
  listingNo: "Identificador público do anúncio no marketplace (MLB…).",
  adTitle: "Título público do anúncio no marketplace.",
  product: "Produto interno vinculado ao anúncio.",
  marketplace: "Canal de venda onde o anúncio está publicado.",
  price: "Preço de venda exibido no anúncio.",
  sales: "Unidades vendidas via este anúncio (métricas importadas).",
  revenue: "Faturamento bruto associado ao anúncio.",
  netReceive:
    "Valor líquido por venda quando o marketplace expõe no item (sale_fee_details). Caso vazio, ainda não há dado de health.",
  commissionPct:
    "Percentual de comissão do marketplace (sale_fee_details no sync). Passe o mouse para ver o tipo do anúncio (Clássico/Premium).",
  commissionBrl: "Valor monetário estimado da comissão (sale_fee_details), quando informado pelo marketplace.",
  shipping: "Custo de frete explícito no anúncio, quando a API retornar.",
  promotion: "Preço promocional efetivo quando há original_price acima do preço atual.",
  visits: "Total de visitas ao anúncio (API de visitas do ML, quando disponível).",
  listingQuality: "Nível ou score de qualidade da publicação (endpoint performance/health do ML).",
  buyingExperience: "Indicador de experiência de compra quando retornado pelo ML.",
  status: "Status operacional no marketplace.",
  adHealth: "Indicador de saúde numérica do anúncio no payload do item (ML).",
};

/**
 * @param {{ columnClass: string; tip?: string; tipWrap?: boolean; lines?: [string, string]; children?: import("react").ReactNode }} props
 */
function AdsCatalogHeadCell({ columnClass, tip, tipWrap = false, lines, children = null }) {
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

const HEALTH_BADGE_CLASS = {
  healthy: "products-catalog__health-badge--healthy",
  warn: "products-catalog__health-badge--warn",
  loss: "products-catalog__health-badge--loss",
  unknown: "products-catalog__health-badge--unknown",
};

const DASH = "—";
const SEM_DADO = "Sem dado";

/** Valores decimais serializados como string pela API — só formatação local. */
function formatBrlFromApiString(s) {
  if (s == null || s === "") return DASH;
  const n = Number(s);
  if (!Number.isFinite(n)) return DASH;
  return formatCatalogBRL(n);
}

/** @param {number | null | undefined} v */
function formatMoneyOrDash(v) {
  if (v == null || !Number.isFinite(Number(v))) return DASH;
  return formatCatalogBRL(Number(v));
}

/** @param {string | null | undefined} pct */
function formatPercentFromApiString(pct) {
  if (pct == null || pct === "") return DASH;
  const n = Number(String(pct).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

/**
 * @param {string | null | undefined} status
 * @param {number | null | undefined} score
 */
function qualityBadgeClass(status, score) {
  const s = String(status || "").toLowerCase();
  if (s.includes("prof") || s.includes("good") || s.includes("alto")) return "anuncios-catalog__metric-badge--good";
  if (s.includes("stand") || s.includes("med")) return "anuncios-catalog__metric-badge--mid";
  if (s.includes("basic") || s.includes("bajo") || s.includes("baix")) return "anuncios-catalog__metric-badge--low";
  if (score != null && Number.isFinite(Number(score))) {
    const n = Number(score) <= 1 ? Number(score) * 100 : Number(score);
    if (n >= 70) return "anuncios-catalog__metric-badge--good";
    if (n >= 40) return "anuncios-catalog__metric-badge--mid";
    return "anuncios-catalog__metric-badge--low";
  }
  return "anuncios-catalog__metric-badge--neutral";
}

/**
 * @param {string | null | undefined} status
 */
function experienceBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("green") || s.includes("good") || s.includes("ok") || s.includes("ótim") || s.includes("excel"))
    return "anuncios-catalog__metric-badge--good";
  if (s.includes("yellow") || s.includes("warn") || s.includes("med")) return "anuncios-catalog__metric-badge--mid";
  if (s.includes("red") || s.includes("bad") || s.includes("poor")) return "anuncios-catalog__metric-badge--low";
  return "anuncios-catalog__metric-badge--neutral";
}

// ----------------------------------------------------------------------
// Mapa API GET /api/ml/listings → linhas do catálogo (UI existente)
// ----------------------------------------------------------------------
/** @param {string | null | undefined} status */
function mlStatusToUi(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return { statusKey: "active", statusLabel: "Ativo" };
  if (s === "paused") return { statusKey: "paused", statusLabel: "Pausado" };
  if (s === "closed") return { statusKey: "paused", statusLabel: "Encerrado" };
  if (s === "not_yet_active" || s === "inactive") return { statusKey: "paused", statusLabel: "Inativo" };
  return { statusKey: "active", statusLabel: status ? String(status) : "—" };
}

/** Payload consolidado GET /api/ml/listings (grid). */
/** @param {Record<string, unknown>} g */
function mapGridApiToCatalogRow(g) {
  const { statusKey, statusLabel } = mlStatusToUi(/** @type {string} */ (g.status));
  const healthNum = g.health_percent != null ? Number(g.health_percent) : null;

  let healthBand = "unknown";
  let healthLabel = "Sem histórico";
  if (healthNum != null && Number.isFinite(healthNum)) {
    healthLabel = "Saúde ML";
    if (healthNum >= 70) healthBand = "healthy";
    else if (healthNum >= 40) healthBand = "warn";
    else healthBand = "loss";
  }

  const picN = g.pictures_count != null ? Number(g.pictures_count) : null;
  const varN = g.variations_count != null ? Number(g.variations_count) : null;

  const salesCount = g.sold_quantity != null ? Math.trunc(Number(g.sold_quantity)) || 0 : 0;
  const soldQtyMl =
    g.sold_quantity_ml_listing != null && Number.isFinite(Number(g.sold_quantity_ml_listing))
      ? Math.trunc(Number(g.sold_quantity_ml_listing))
      : null;
  const grossMissing = Boolean(g.gross_revenue_missing);
  const revenueNumeric =
    !grossMissing && g.gross_revenue_brl != null ? Number(g.gross_revenue_brl) : grossMissing ? 0 : Number(g.gross_revenue_brl) || 0;

  const qScore = g.health_listing_quality_score;
  const qScoreNum = qScore != null && Number.isFinite(Number(qScore)) ? Number(qScore) : null;
  const qStatus = g.health_listing_quality_status != null ? String(g.health_listing_quality_status) : null;
  const expStatus = g.health_experience_status != null ? String(g.health_experience_status) : null;

  const uiFlags = {};
  if ((healthNum != null && healthNum < 40) || /basic|bajo|baix/i.test(qStatus || "")) {
    uiFlags.needs_attention = true;
  }

  const visitsAbsent = Boolean(g.visits_absent);
  const visitCountForFilter = visitsAbsent || g.visits == null ? 0 : Number(g.visits) || 0;

  const m = String(g.marketplace || "");
  const marketplaceSlug = m === "mercado_livre" ? "mercadolivre" : m || "mercadolivre";

  return {
    id: String(g.id),
    sku: g.sku != null && String(g.sku).trim() !== "" ? String(g.sku).trim() : null,
    adCount: 0,
    adTitle: g.title ? String(g.title) : DASH,
    picturesCount: picN != null && Number.isFinite(picN) ? picN : null,
    variationsCount: varN != null && Number.isFinite(varN) ? varN : null,
    productName: DASH,
    marketplaceSlug,
    marketplaceRaw: m,
    productCost: 0,
    price:
      g.price_brl != null && String(g.price_brl).trim() !== ""
        ? Number(g.price_brl)
        : null,
    salesCount,
    soldQuantityMlListing: soldQtyMl,
    revenue: revenueNumeric,
    grossRevenueMissing: grossMissing,
    grossRevenueBrl: g.gross_revenue_brl != null ? String(g.gross_revenue_brl) : null,
    profit: 0,
    marginPct: 0,
    statusKey,
    statusLabel,
    healthBand,
    healthLabel,
    healthPercent: healthNum != null && Number.isFinite(healthNum) ? Math.round(healthNum) : null,
    externalId: g.external_listing_id ? String(g.external_listing_id) : "",
    listingNumber: g.external_listing_id ? String(g.external_listing_id) : DASH,
    coverThumbnailUrl:
      g.cover_thumbnail_url != null && String(g.cover_thumbnail_url).trim() !== ""
        ? String(g.cover_thumbnail_url).trim()
        : null,
    visitCount: visitCountForFilter,
    visitsAbsent,
    visitsText: g.visits != null ? String(g.visits) : null,
    netReceiveBrl: g.net_receive_brl != null ? String(g.net_receive_brl) : null,
    commissionPercent: g.commission_percent != null ? String(g.commission_percent) : null,
    commissionAmountBrl: g.commission_amount_brl != null ? String(g.commission_amount_brl) : null,
    shippingCostBrl: g.shipping_cost_brl != null ? String(g.shipping_cost_brl) : null,
    promotionPriceBrl: g.promotional_price_brl != null ? String(g.promotional_price_brl) : null,
    shippingLogisticType: g.health_shipping_logistic_type != null ? String(g.health_shipping_logistic_type) : null,
    listingTypeTooltip: g.listing_type_tooltip != null ? String(g.listing_type_tooltip) : null,
    listingQualityScore: qScoreNum,
    listingQualityStatus: qStatus,
    experienceStatus: expStatus,
    uiFlags,
  };
}

function AdsCatalogRow({ row }) {
  const healthClass = HEALTH_BADGE_CLASS[row.healthBand] || HEALTH_BADGE_CLASS.unknown;

  const freightTitle = [
    row.shippingCostBrl ? formatBrlFromApiString(row.shippingCostBrl) : null,
    row.shippingLogisticType ? String(row.shippingLogisticType) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const hasQualityData =
    (row.listingQualityStatus != null && row.listingQualityStatus !== "") ||
    (row.listingQualityScore != null && Number.isFinite(Number(row.listingQualityScore)));
  const hasExperienceData = row.experienceStatus != null && String(row.experienceStatus).trim() !== "";

  const qualityLabel =
    row.listingQualityStatus ||
    (row.listingQualityScore != null && Number.isFinite(Number(row.listingQualityScore))
      ? `${Math.round(Number(row.listingQualityScore) <= 1 ? Number(row.listingQualityScore) * 100 : Number(row.listingQualityScore))}%`
      : null);

  const metaParts = [
    row.sku ? `SKU: ${row.sku}` : null,
    row.picturesCount != null ? `${row.picturesCount} foto(s)` : null,
    row.variationsCount != null ? `${row.variationsCount} var.` : null,
  ].filter(Boolean);

  const visitsCell =
    row.visitsAbsent ? DASH : row.visitsText == null ? SEM_DADO : row.visitsText;

  const revenueCell = row.grossRevenueMissing ? DASH : formatBrlFromApiString(row.grossRevenueBrl);

  return (
    <div className="anuncios-catalog__row anuncios-catalog--dense" role="row">
      <div className="products-catalog__cell anuncios-catalog__cell--thumb" title={row.adTitle}>
        <div className="anuncios-catalog__thumb-wrap">
          {row.coverThumbnailUrl ? (
            <img
              src={row.coverThumbnailUrl}
              alt=""
              className="anuncios-catalog__thumb-img"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="anuncios-catalog__thumb-placeholder" aria-hidden />
          )}
        </div>
      </div>
      <div
        className="products-catalog__cell anuncios-catalog__cell--listing-no"
        title={row.listingNumber !== DASH ? row.listingNumber : undefined}
      >
        {row.listingNumber}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--title">
        <span className="anuncios-catalog__ad-title" title={row.adTitle}>
          {row.adTitle}
        </span>
        {metaParts.length > 0 ? <span className="anuncios-catalog__ad-meta">{metaParts.join(" · ")}</span> : null}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--product">
        <span className="anuncios-catalog__product-link" title={row.productName}>
          {row.productName}
        </span>
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--mkt">
        <MarketplaceBadge marketplace={row.marketplaceRaw || row.marketplaceSlug} />
      </div>
      <div className="products-catalog__cell products-catalog__cell--money">
        {row.price != null && Number.isFinite(row.price) ? formatCatalogBRL(row.price) : DASH}
      </div>
      <div
        className="products-catalog__cell products-catalog__cell--num"
        title={
          row.soldQuantityMlListing != null && row.soldQuantityMlListing !== row.salesCount
            ? `No ML o anúncio acumula ${row.soldQuantityMlListing} vendas; aqui mostra-se ${row.salesCount} unidade(s) já consolidada(s) nos pedidos importados (Suse7).`
            : undefined
        }
      >
        {row.salesCount}
      </div>
      <div
        className="products-catalog__cell products-catalog__cell--money"
        title={row.grossRevenueMissing ? "Faturamento ainda não consolidado nas vendas importadas para este anúncio." : undefined}
      >
        {revenueCell}
      </div>
      <div className="products-catalog__cell products-catalog__cell--money">{formatBrlFromApiString(row.netReceiveBrl)}</div>
      <div className="products-catalog__cell products-catalog__cell--pct anuncios-catalog__cell--compact-num">
        {row.commissionPercent != null && row.commissionPercent !== "" ? (
          <span
            className={row.listingTypeTooltip ? "anuncios-catalog__cell-tooltip" : undefined}
            data-tooltip={row.listingTypeTooltip || undefined}
            tabIndex={row.listingTypeTooltip ? 0 : undefined}
          >
            {formatPercentFromApiString(row.commissionPercent)}
          </span>
        ) : (
          DASH
        )}
      </div>
      <div className="products-catalog__cell products-catalog__cell--money anuncios-catalog__cell--compact-num">
        {formatBrlFromApiString(row.commissionAmountBrl)}
      </div>
      <div
        className="products-catalog__cell products-catalog__cell--money anuncios-catalog__cell--compact-num"
        title={freightTitle || undefined}
      >
        {formatBrlFromApiString(row.shippingCostBrl)}
      </div>
      <div className="products-catalog__cell products-catalog__cell--money anuncios-catalog__cell--promo">
        {formatBrlFromApiString(row.promotionPriceBrl)}
      </div>
      <div className="products-catalog__cell products-catalog__cell--num anuncios-catalog__cell--compact-num">
        {visitsCell}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--metric">
        {hasQualityData ? (
          <span
            className={`anuncios-catalog__metric-badge ${qualityBadgeClass(row.listingQualityStatus, row.listingQualityScore)}`}
          >
            {qualityLabel}
          </span>
        ) : (
          <span className="anuncios-catalog__metric-muted">Sem dado</span>
        )}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--metric">
        {hasExperienceData ? (
          <span className={`anuncios-catalog__metric-badge ${experienceBadgeClass(row.experienceStatus)}`}>
            {row.experienceStatus}
          </span>
        ) : (
          <span className="anuncios-catalog__metric-muted">Sem dado</span>
        )}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--status">
        <span
          className={`anuncios-catalog__status-pill${row.statusKey === "paused" ? " anuncios-catalog__status-pill--paused" : ""}`}
        >
          {row.statusLabel}
        </span>
      </div>
      <div className="products-catalog__cell products-catalog__cell--health">
        <span className={`products-catalog__health-badge ${healthClass}`} data-health-band={row.healthBand}>
          {row.healthBand !== "unknown" ? <span className="products-catalog__health-badge-dot" aria-hidden /> : null}
          <span className="products-catalog__health-badge-text">
            {row.healthPercent != null ? `${row.healthLabel} · ${row.healthPercent}%` : row.healthLabel}
          </span>
        </span>
      </div>
    </div>
  );
}

export default function Anuncios() {
  const [adsFilterId, setAdsFilterId] = useState("all");
  const [adsSearchQuery, setAdsSearchQuery] = useState("");
  const [adsPage, setAdsPage] = useState(1);

  const [catalogRows, setCatalogRows] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  /** @type {"idle" | "listings" | "sales" | "reload"} */
  const [syncPhase, setSyncPhase] = useState("idle");
  /** Modal bloqueante durante POST + reload (evita cliques repetidos). */
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncError, setSyncError] = useState(null);
  /** Aviso pós-sync (ex.: vendas falharam, anúncios ok). */
  const [syncWarningMessage, setSyncWarningMessage] = useState(null);
  /** Mensagem de sucesso com resumo vindo dos endpoints (sem recalcular no front). */
  const [syncSuccessMessage, setSyncSuccessMessage] = useState(null);
  /** Resposta GET /api/ml/sales-summary após sync (totais oficiais do backend). */
  const [salesSummary, setSalesSummary] = useState(null);

  const filterChips = useMemo(() => getAdsFilterChipsForToolbar(), []);

  const fetchListings = useCallback(async () => {
    const url = buildApiUrl("/api/ml/listings");
    if (!url) {
      setListError("Defina VITE_API_BASE_URL apontando para o backend.");
      setCatalogRows([]);
      setListLoading(false);
      return false;
    }
    setListLoading(true);
    setListError(null);
    const res = await apiFetch(url);
    setListLoading(false);
    if (!res.ok) {
      const msg = res.error || res.data?.error || "Não foi possível carregar os anúncios.";
      setListError(msg);
      setCatalogRows([]);
      return false;
    }
    const listings = Array.isArray(res.data?.listings) ? res.data.listings : [];
    setCatalogRows(listings.map(mapGridApiToCatalogRow));
    return true;
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // ------------------------------
  // Resumo de vendas (servidor) — opcional para KPI / consistência pós-sync
  // ------------------------------
  const fetchSalesSummary = useCallback(async () => {
    const url = buildApiUrl("/api/ml/sales-summary");
    if (!url) return { ok: false, skipped: true };
    const res = await apiFetch(url);
    if (res.ok && res.data?.ok) {
      setSalesSummary(res.data);
      return { ok: true };
    }
    setSalesSummary(null);
    return {
      ok: false,
      message: res.data?.error || res.error || "Não foi possível carregar o resumo de vendas.",
    };
  }, []);

  // ------------------------------
  // Orquestração: anúncios → vendas → listagem → resumo (só chamadas HTTP + UI)
  // Modal abre no clique e fecha no finally; feedback final por estado (erro / aviso / sucesso).
  // ------------------------------
  const handleFullSync = useCallback(async () => {
    const baseUrl = buildApiUrl("/api/ml/sync-listings");
    if (!baseUrl) {
      setSyncError("Defina VITE_API_BASE_URL apontando para o backend.");
      return;
    }

    setSyncModalOpen(true);
    setSyncLoading(true);
    setSyncPhase("listings");
    setSyncError(null);
    setSyncWarningMessage(null);
    setSyncSuccessMessage(null);

    const postOpts = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {},
    };

    let finalError = null;
    let finalWarning = null;
    let finalSuccess = null;
    /** @type {number | null} */
    let listingsImported = null;
    /** @type {number | null} */
    let ordersProcessed = null;
    let salesHttpOk = false;

    try {
      const resListings = await apiFetch(buildApiUrl("/api/ml/sync-listings"), postOpts);
      if (!resListings.ok) {
        finalError =
          resListings.data?.error ||
          resListings.error ||
          "Não foi possível sincronizar anúncios.";
        return;
      }

      const ls = resListings.data?.summary;
      if (ls && typeof ls.imported === "number") listingsImported = ls.imported;
      else if (ls && typeof ls.processed === "number") listingsImported = ls.processed;

      setSyncPhase("sales");
      const resSales = await apiFetch(buildApiUrl("/api/ml/sync-sales"), postOpts);
      salesHttpOk = !!resSales.ok;
      if (!resSales.ok) {
        finalWarning =
          "Os anúncios foram sincronizados, mas as vendas não puderam ser atualizadas agora.";
      } else {
        const ss = resSales.data?.summary;
        if (ss && typeof ss.processed === "number") ordersProcessed = ss.processed;
        else if (ss && typeof ss.scanned === "number") ordersProcessed = ss.scanned;
      }

      setSyncPhase("reload");
      const listingsReloadOk = await fetchListings();
      if (!listingsReloadOk) {
        if (finalWarning) {
          finalError = `${finalWarning} Além disso, não foi possível recarregar a listagem agora.`;
          finalWarning = null;
        } else {
          finalError = "Sincronização gravada no servidor, mas houve erro ao recarregar a listagem.";
        }
        return;
      }

      const summaryResult = await fetchSalesSummary();
      if (!summaryResult.ok && !summaryResult.skipped && summaryResult.message) {
        finalWarning = finalWarning
          ? `${finalWarning} (${summaryResult.message})`
          : `Sincronização concluída, mas o resumo de vendas não pôde ser atualizado: ${summaryResult.message}`;
      }

      if (!finalError && !finalWarning) {
        const parts = [];
        if (typeof listingsImported === "number" && Number.isFinite(listingsImported)) {
          parts.push(
            `${listingsImported} ${listingsImported === 1 ? "anúncio atualizado" : "anúncios atualizados"}`
          );
        }
        if (salesHttpOk && typeof ordersProcessed === "number" && Number.isFinite(ordersProcessed)) {
          parts.push(
            `${ordersProcessed} ${ordersProcessed === 1 ? "pedido processado" : "pedidos processados"}`
          );
        }
        finalSuccess =
          parts.length > 0
            ? `Sincronização concluída com sucesso. ${parts.join(" e ")}.`
            : "Sincronização concluída com sucesso.";
      }
    } catch (e) {
      finalError = e?.message || "Não foi possível concluir a sincronização.";
    } finally {
      setSyncModalOpen(false);
      setSyncLoading(false);
      setSyncPhase("idle");
      setSyncError(finalError);
      setSyncWarningMessage(finalWarning);
      setSyncSuccessMessage(finalSuccess);
    }
  }, [fetchListings, fetchSalesSummary]);

  const syncButtonLabel = useMemo(() => {
    if (!syncLoading) return "Sincronizar anúncios";
    return "Sincronizando…";
  }, [syncLoading]);

  const activeCount = useMemo(
    () => catalogRows.filter((r) => r.statusKey === "active").length,
    [catalogRows]
  );

  const totalAdsRevenueFromRows = useMemo(
    () =>
      catalogRows.reduce((sum, r) => {
        if (r.grossRevenueMissing) return sum;
        return sum + (Number(r.revenue) || 0);
      }, 0),
    [catalogRows]
  );

  const totalAdsRevenueKpi = useMemo(() => {
    const g = salesSummary?.gross_revenue_total;
    if (g != null && Number.isFinite(Number(g))) return Number(g);
    return totalAdsRevenueFromRows;
  }, [salesSummary, totalAdsRevenueFromRows]);

  const rowsWithLabels = useMemo(
    () =>
      catalogRows.map((r) => ({
        ...r,
        marketplaceLabel: marketplaceChipLabel(r.marketplaceSlug),
      })),
    [catalogRows]
  );

  const searchFiltered = useMemo(
    () => filterAdsByCatalogSearch(rowsWithLabels, adsSearchQuery),
    [rowsWithLabels, adsSearchQuery]
  );

  const displayRows = useMemo(() => applyAdsCatalogFilter(searchFiltered, adsFilterId), [searchFiltered, adsFilterId]);

  const totalFiltered = displayRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ADS_PAGE_SIZE));

  useEffect(() => {
    setAdsPage(1);
  }, [adsFilterId, adsSearchQuery]);

  useEffect(() => {
    if (adsPage > totalPages) setAdsPage(totalPages);
  }, [adsPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (adsPage - 1) * ADS_PAGE_SIZE;
    return displayRows.slice(start, start + ADS_PAGE_SIZE);
  }, [displayRows, adsPage]);

  const paginationItems = useMemo(() => buildPaginationItems(adsPage, totalPages), [adsPage, totalPages]);
  const rangeStart = totalFiltered === 0 ? 0 : (adsPage - 1) * ADS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(adsPage * ADS_PAGE_SIZE, totalFiltered);

  return (
    <div className="anuncios-catalog">
      <AnunciosSyncModal open={syncModalOpen} phase={syncPhase} />

      <h1 className="products-catalog__sr-title">Anúncios</h1>

      <section className="anuncios-catalog__kpis" aria-label="Resumo de anúncios">
        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-blue">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Anúncios ativos</h2>
          </header>
          <div className="anuncios-catalog__kpi-body">
            <p className="anuncios-catalog__kpi-value">{listLoading ? "…" : activeCount}</p>
            <p className="anuncios-catalog__kpi-hint">Anúncios com status ativo na última importação do ML.</p>
          </div>
        </article>

        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-orange">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Faturamento dos anúncios</h2>
          </header>
          <div className="anuncios-catalog__kpi-body">
            <p className="anuncios-catalog__kpi-value">
              {listLoading ? "…" : formatCatalogBRL(totalAdsRevenueKpi)}
            </p>
            <p className="anuncios-catalog__kpi-hint">
              Faturamento bruto importado das vendas (resumo do servidor após sincronizar). Lucro e margem dependem
              de custo interno.
            </p>
          </div>
        </article>

        <div className="anuncios-catalog__kpi-minis" aria-label="Indicadores rápidos">
          {[
            { key: "sales", label: "Vendas", variant: "sales" },
            { key: "profit", label: "Lucro", variant: "profit" },
            { key: "attention", label: "Precisam atenção", variant: "warn" },
            { key: "decline", label: "Em queda", variant: "decline" },
          ].map(({ key, label, variant }) => (
            <article
              key={key}
              className={`anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--${variant}`}
            >
              <div className="anuncios-catalog__kpi-mini-head">
                <h3 className="anuncios-catalog__kpi-mini-title">{label}</h3>
              </div>
              <div className="anuncios-catalog__kpi-mini-body">
                <p className="anuncios-catalog__kpi-mini-value">—</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="products-catalog__controls">
        <div className="products-catalog__controls-top">
          <div className="products-catalog__search-wrap">
            <div className="products-catalog__search-field">
              <span className="products-catalog__search-icon" aria-hidden>
                <S7Icon name="search" size={18} strokeWidth={1.85} />
              </span>
              <S7Input
                label=""
                name="ads-catalog-search"
                value={adsSearchQuery}
                onChange={(e) => setAdsSearchQuery(e.target.value)}
                placeholder="Buscar por título do anúncio, produto ou marketplace"
                className="products-catalog__search-s7"
                inputClassName="products-catalog__search-input-field"
                autoComplete="off"
                aria-label="Buscar anúncios por título, produto ou marketplace"
                rightElement={
                  adsSearchQuery ? (
                    <button
                      type="button"
                      className="products-catalog__search-clear"
                      onClick={(e) => {
                        e.preventDefault();
                        setAdsSearchQuery("");
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
              iconName="download"
              className="products-catalog__new-product-btn"
              disabled={syncLoading || listLoading}
              title="Atualiza anúncios e vendas no Mercado Livre (conta conectada): importa vitrine, importa pedidos e recarrega a tela."
              onClick={handleFullSync}
            >
              {syncButtonLabel}
            </S7Button>
          </div>
        </div>
        <div className="products-catalog__controls-main">
          <div className="products-catalog__filter-row" role="toolbar" aria-label="Filtros rápidos de anúncios">
            {filterChips.map((def) => {
              const isActive = adsFilterId === def.id;
              return (
                <button
                  key={def.id}
                  type="button"
                  className={`products-catalog__filter-chip${isActive ? " products-catalog__filter-chip--active" : ""}${def.enabled ? "" : " products-catalog__filter-chip--disabled"}`}
                  aria-pressed={def.enabled ? isActive : undefined}
                  disabled={!def.enabled}
                  title={def.description}
                  onClick={() => {
                    if (!def.enabled) return;
                    setAdsFilterId(def.id);
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
              disabled={adsFilterId === "all"}
              title="Remove filtros e volta à listagem padrão"
              onClick={() => setAdsFilterId("all")}
            >
              <S7Icon name="filter_clear" size={14} strokeWidth={1.75} className="products-catalog__filter-clear-icon" />
              <span>Limpar filtros</span>
            </button>
          </div>
        </div>
      </div>

      {syncSuccessMessage ? (
        <div
          className="products-catalog__filter-empty-card anuncios-catalog__sync-feedback--success"
          role="status"
        >
          <p>{syncSuccessMessage}</p>
          <button
            type="button"
            className="products-catalog__filter-empty-btn"
            onClick={() => setSyncSuccessMessage(null)}
          >
            Fechar
          </button>
        </div>
      ) : null}

      {syncWarningMessage ? (
        <div className="products-catalog__filter-empty-card anuncios-catalog__sync-feedback--warn" role="alert">
          <p>{syncWarningMessage}</p>
          <button
            type="button"
            className="products-catalog__filter-empty-btn"
            onClick={() => setSyncWarningMessage(null)}
          >
            Entendi
          </button>
        </div>
      ) : null}

      {syncError ? (
        <div className="products-catalog__filter-empty-card" role="alert">
          <p style={{ color: "#b91c1c", marginBottom: 8 }}>{syncError}</p>
          <button type="button" className="products-catalog__filter-empty-btn" onClick={() => setSyncError(null)}>
            Fechar aviso
          </button>
        </div>
      ) : null}

      {listError ? (
        <div className="products-catalog__filter-empty-card" role="alert">
          <S7EmptyState title="Erro ao carregar anúncios" description={listError} />
          <button type="button" className="products-catalog__filter-empty-btn" onClick={() => fetchListings()}>
            Tentar novamente
          </button>
        </div>
      ) : listLoading ? (
        <div className="products-catalog__filter-empty-card" role="status">
          <p>Carregando anúncios…</p>
        </div>
      ) : displayRows.length === 0 ? (
        <div className="products-catalog__filter-empty-card" role="status">
          {(() => {
            const hasSearch = adsSearchQuery.trim().length > 0;
            let title = "Nenhum anúncio neste filtro";
            let description = "Ajuste os filtros ou limpe para ver a listagem completa.";
            if (catalogRows.length === 0 && !hasSearch && adsFilterId === "all") {
              title = "Nenhum anúncio importado";
              description =
                "Conecte o Mercado Livre em Perfil → Integrações e use Sincronizar anúncios para importar vitrine e vendas.";
            } else if (hasSearch && searchFiltered.length === 0) {
              title = "Nenhum anúncio encontrado";
              description = "Nenhum item corresponde à busca. Tente outro termo ou limpe o campo.";
            } else if (hasSearch && searchFiltered.length > 0) {
              description = "Nenhum item corresponde à combinação de busca e filtros.";
            }
            return (
              <>
                <S7EmptyState title={title} description={description} />
                <button
                  type="button"
                  className="products-catalog__filter-empty-btn"
                  onClick={() => {
                    setAdsFilterId("all");
                    setAdsSearchQuery("");
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
              <div className="anuncios-catalog__grid anuncios-catalog__grid--head anuncios-catalog--dense">
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--thumb" tip={ADS_COLUMN_TOOLTIPS.cover}>
                  Capa
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--listing-no" tip={ADS_COLUMN_TOOLTIPS.listingNo}>
                  Nº
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--title" tip={ADS_COLUMN_TOOLTIPS.adTitle}>
                  Anúncio
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--product" tip={ADS_COLUMN_TOOLTIPS.product}>
                  Produto
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--mkt" tip={ADS_COLUMN_TOOLTIPS.marketplace}>
                  Mkt
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="products-catalog__cell--money" tip={ADS_COLUMN_TOOLTIPS.price}>
                  Preço
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="products-catalog__cell--num" tip={ADS_COLUMN_TOOLTIPS.sales}>
                  Vendas
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell
                  columnClass="products-catalog__cell--money"
                  tip={ADS_COLUMN_TOOLTIPS.revenue}
                  lines={["Fatura-", "mento"]}
                />
                <AdsCatalogHeadCell
                  columnClass="products-catalog__cell--money"
                  tip={ADS_COLUMN_TOOLTIPS.netReceive}
                  lines={["Você", "recebe"]}
                />
                <AdsCatalogHeadCell
                  columnClass="products-catalog__cell--pct"
                  tip={ADS_COLUMN_TOOLTIPS.commissionPct}
                  lines={["Com.", "%"]}
                />
                <AdsCatalogHeadCell
                  columnClass="products-catalog__cell--money"
                  tip={ADS_COLUMN_TOOLTIPS.commissionBrl}
                  lines={["Com.", "R$"]}
                />
                <AdsCatalogHeadCell columnClass="products-catalog__cell--money" tip={ADS_COLUMN_TOOLTIPS.shipping}>
                  Frete
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="products-catalog__cell--money" tip={ADS_COLUMN_TOOLTIPS.promotion}>
                  Promoção
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="products-catalog__cell--num" tip={ADS_COLUMN_TOOLTIPS.visits}>
                  Visitas
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell
                  columnClass="anuncios-catalog__cell--metric"
                  tip={ADS_COLUMN_TOOLTIPS.listingQuality}
                >
                  Qualidade
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell
                  columnClass="anuncios-catalog__cell--metric"
                  tip={ADS_COLUMN_TOOLTIPS.buyingExperience}
                  lines={["Experi-", "ência"]}
                />
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--status" tip={ADS_COLUMN_TOOLTIPS.status}>
                  Status
                </AdsCatalogHeadCell>
                <AdsCatalogHeadCell columnClass="products-catalog__cell--health" tip={ADS_COLUMN_TOOLTIPS.adHealth}>
                  Saúde
                </AdsCatalogHeadCell>
              </div>

              <div className="products-catalog__body">
                {paginatedRows.map((row) => (
                  <AdsCatalogRow key={row.id} row={row} />
                ))}
              </div>
            </div>
          </div>

          <footer className="products-catalog__pagination" aria-label="Paginação de anúncios">
            <p className="products-catalog__pagination-meta">
              Mostrando <strong>{rangeStart}</strong>–<strong>{rangeEnd}</strong> de <strong>{totalFiltered}</strong>{" "}
              {totalFiltered === 1 ? "anúncio" : "anúncios"}
            </p>
            {totalPages > 1 ? (
              <nav className="products-catalog__pagination-nav" aria-label="Páginas">
                <button
                  type="button"
                  className="products-catalog__pagination-btn"
                  disabled={adsPage <= 1}
                  onClick={() => setAdsPage((p) => Math.max(1, p - 1))}
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
                        className={`products-catalog__pagination-page${item === adsPage ? " products-catalog__pagination-page--current" : ""}`}
                        aria-current={item === adsPage ? "page" : undefined}
                        onClick={() => setAdsPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
                <button
                  type="button"
                  className="products-catalog__pagination-btn products-catalog__pagination-btn--next"
                  disabled={adsPage >= totalPages}
                  onClick={() => setAdsPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próximo
                </button>
              </nav>
            ) : null}
          </footer>
        </div>
      )}
    </div>
  );
}
