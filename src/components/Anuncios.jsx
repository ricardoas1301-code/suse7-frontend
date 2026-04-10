// ======================================================================
// ⚠️ Esta página consome o Suse7 Pricing Protocol v1. Não inferir promo/payout no front.
// ADR: suse7-backend/docs/adr/ADR-0001-pricing-contract-v1.md · Protocolo: …/SUSE7_PRICING_PROTOCOL_V1.md
// ======================================================================
// PÁGINA: Anúncios — listagem operacional (Suse7), espelhando Produtos.
// Fonte: GET /api/ml/listings — pricing/payout conforme o contrato v1 (ver ADR acima).
// Um clique: POST /api/ml/sync-listings → POST /api/ml/backfill-listing-health (taxas/repasse no banco)
//   → POST /api/ml/sync-sales → GET /api/ml/listings → GET /api/ml/sales-summary
// ======================================================================

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { buildApiUrl, apiFetch, getSessionToken } from "../config/api";
import { ATTENTION_REASON_SKU_PENDING_ML } from "../constants/listingAttention";
import { useNotifications } from "../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";
import SkuInputModal from "./SkuInputModal";
import S7Button from "./ui/S7Button";
import S7EmptyState from "./ui/S7EmptyState";
import S7Icon from "./ui/S7Icon";
import S7Input from "./ui/S7Input";
import S7StatCard from "./ui/S7StatCard";
import S7Tooltip from "./ui/S7Tooltip";
import { applyAdsCatalogFilter, getAdsFilterChipsForToolbar } from "../utils/adsFilterRegistry";
import { filterAdsByCatalogSearch } from "../utils/adsCatalogSearch";
import { formatMarketplaceListingDisplayId } from "../utils/marketplaceListingId";
import { formatCatalogBRL, marketplaceChipLabel } from "../utils/productCatalogRow";
import { getMarketplaceTheme, getMarketplaceThemeCssVars } from "../theme/marketplaceTheme.js";
import MarketplaceBadge from "./MarketplaceBadge.jsx";
import AnunciosSyncModal from "./AnunciosSyncModal.jsx";
import AdsPricingIntelligenceModal from "./AdsPricingIntelligenceModal.jsx";
import precificaS7Icon from "../assets/precifica-s7-icon.png";
import "./Products.css";
import "./Anuncios.css";

const ADS_PAGE_SIZE = 25;

/** Largura fixa do modal Raio-x (referência visual: estado sem produto vinculado). */
const ADS_RAIOX_POPOVER_WIDTH_PX = 300;
/** Altura máxima do shell Raio-x (card + moldura; conteúdo longo como “Status da oferta” precisa caber antes do clamp). */
const ADS_RAIOX_POPOVER_MAX_H_PX = 800;
/** Margem extra acima do fim da viewport no clamp — mantém a base das 3 camadas visível. */
const ADS_RAIOX_POPOVER_VIEWPORT_BOTTOM_GUTTER_PX = 104;
/**
 * Sobe o shell inteiro (camada 1 backplate + camada 3 logo + camada 2 dados) em relação ao centro do ícone.
 */
const ADS_RAIOX_POPOVER_VERTICAL_BIAS_UP_PX = 152;
/**
 * Folga extra no clamp inferior: altura medida do shell pode ser menor que o desenho real (overflow / subpixel).
 */
const ADS_RAIOX_SHELL_BOTTOM_CLAMP_SLACK_PX = 64;

/** Mini card do status (largura confortável para título + subtítulo + mensagem). */
const ADS_RAIOX_STATUS_EXPLAIN_W_PX = 280;
/** Acima do painel Raio-x portal (z-index 200100). */
const ADS_RAIOX_STATUS_EXPLAIN_Z = 200150;
/** Faixa invisível entre o ícone e o mini card — evita fechar o hover ao atravessar o gap. */
const ADS_RAIOX_STATUS_EXPLAIN_Z_BRIDGE = 200149;

/**
 * Diagnóstico: comparar payload real de capa antes/depois do F5.
 * No console do browser: `sessionStorage.setItem("suse7_debug_ml_listings_cover","1"); location.reload()`
 * Desligar: `sessionStorage.removeItem("suse7_debug_ml_listings_cover")`
 */
const SESSION_DEBUG_ML_LISTINGS_COVER = "suse7_debug_ml_listings_cover";

/**
 * @param {unknown[]} rawListings — `res.data.listings` antes do `mapGridApiToCatalogRow`
 */
function debugLogMlListingsCoverFromApi(rawListings) {
  if (typeof sessionStorage === "undefined") return;
  if (sessionStorage.getItem(SESSION_DEBUG_ML_LISTINGS_COVER) !== "1") return;
  const rows = Array.isArray(rawListings) ? rawListings : [];
  const iso = new Date().toISOString();
  console.log(`[Suse7] GET /api/ml/listings — capa · galeria (${rows.length} linhas) @ ${iso}`);
  console.table(
    rows.map((g) => {
      const rec = g && typeof g === "object" ? /** @type {Record<string, unknown>} */ (g) : {};
      const cover = rec.cover_thumbnail_url ?? rec.cover_image_url ?? null;
      const coverStr = cover != null ? String(cover) : "";
      const gUrls = Array.isArray(rec.gallery_image_urls) ? rec.gallery_image_urls : [];
      return {
        external_listing_id: rec.external_listing_id != null ? String(rec.external_listing_id) : "",
        cover_len: coverStr.length,
        cover_preview: coverStr ? `${coverStr.slice(0, 72)}${coverStr.length > 72 ? "…" : ""}` : null,
        gallery_urls_len: gUrls.length,
        gallery_image_source: rec.gallery_image_source != null ? String(rec.gallery_image_source) : null,
      };
    })
  );
}

const ADS_COLUMN_TOOLTIPS = {
  cover: "Imagem principal do anúncio importada do marketplace.",
  listingNo:
    "Número do anúncio no Mercado Livre (exibido sem o prefixo MLB, como no painel). O id técnico completo continua no banco. Clique para copiar o número exibido.",
  adTitle: "Título público do anúncio no marketplace.",
  product: "Produto interno vinculado ao anúncio.",
  marketplace: "Canal de venda onde o anúncio está publicado.",
  price: "Preço de catálogo (listing_price_brl) — ver também coluna de promoção e effective_sale_price_brl na API.",
  sales: "Unidades vendidas via este anúncio (métricas importadas).",
  revenue: "Faturamento bruto associado ao anúncio.",
  netReceive:
    "Repasse líquido unitário do marketplace (campo net_proceeds). Não usar totais de vendas importadas nesta célula.",
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
  sellPor:
    "Preço de venda no anúncio (preço de tabela quando há promoção), preço promocional, atacado quando a API expõe, e valor líquido estimado (você recebe) com detalhamento de tarifa e frete.",
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

/** Valor negativo (tarifa/frete) a partir da string decimal da API; null se inválido. */
function formatNegativeBrlFromApiString(s) {
  if (s == null || s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n === 0) return null;
  return `-${formatCatalogBRL(Math.abs(n))}`;
}

/**
 * “Você recebe” unitário: somente `marketplace_payout_amount` persistido (via `netReceiveBrl` na grid).
 * @param {{ netReceiveBrl?: string | null }} row
 */
function formatListingUnitNetBrl(row) {
  if (row.netReceiveBrl != null && String(row.netReceiveBrl).trim() !== "") {
    return formatBrlFromApiString(row.netReceiveBrl);
  }
  return DASH;
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

/** Tarifa no modal “Raio-x”: mesma % consolidada da grid (`commission_percent`), sempre 2 casas decimais — só formatação. */
function formatCommissionPctForModal(pct) {
  if (pct == null || pct === "") return null;
  const n = Number(String(pct).trim().replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * Tipo do anúncio + % da comissão: somente campos consolidados da grid (health/listing persistidos no backend).
 * Sem tipo isolado sem % — se faltar % persistida, exibe "—" ao lado do tipo.
 * @param {{ listingTypeLabel?: string | null; commissionPercent?: string | null }} row
 */
function buildListingTypeAndTariffSubtitle(row) {
  const label =
    row.listingTypeLabel != null && String(row.listingTypeLabel).trim() !== ""
      ? String(row.listingTypeLabel).trim()
      : null;
  const pct = formatCommissionPctForModal(row.commissionPercent);
  if (label && pct) return `${label} ${pct}`;
  if (label) return `${label} ${DASH}`;
  if (pct) return pct;
  return null;
}

/**
 * Raio-x — tarifa: somente `commission_amount_brl` (health/sync). Sem net_proceeds.
 * @param {{ commissionAmountBrl?: string | null }} row
 */
function pickModalSaleFeeFromBackend(row) {
  if (row.commissionAmountBrl != null && String(row.commissionAmountBrl).trim() !== "") {
    return formatNegativeBrlFromApiString(row.commissionAmountBrl) ?? DASH;
  }
  return DASH;
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

/** Rótulo curto no Raio-x (apresentação; valores vêm do backend). */
const ML_MODAL_SHIPPING_TITLE = "Custo de envio";

/**
 * Raio-x — frete: colunas consolidadas da grid (health); sem net_proceeds.
 * @param {{ shippingCostBrl?: string | null; shippingCostAmountBrl?: string | null; shippingCostContext?: string | null }} row
 */
function pickModalMercadoLivreShippingLine(row) {
  const fmtNeg = (raw) => {
    if (raw == null || String(raw).trim() === "") return null;
    return formatNegativeBrlFromApiString(raw) ?? DASH;
  };
  const ctx = row.shippingCostContext ?? null;
  const sub =
    ctx === "free_for_buyer"
      ? "Grátis para o comprador"
      : ctx === "buyer_pays"
        ? "Por conta do comprador"
        : null;

  const rawAmt = row.shippingCostAmountBrl ?? row.shippingCostBrl;

  return {
    title: ML_MODAL_SHIPPING_TITLE,
    value: fmtNeg(rawAmt) ?? DASH,
    sub,
  };
}

/** Insets do popover Raio-x: viewport útil (navbar Suse7 + safe-area); evita “estourar” sob a faixa superior. */
function getRaioxPopoverViewportInsets() {
  const edge = 12;
  const gapBelowNav = 8;
  let top = edge;
  let bottom = edge;
  if (typeof document === "undefined") return { top, bottom };
  const nav = document.querySelector(".navbar-premium");
  if (nav) {
    const nb = nav.getBoundingClientRect().bottom;
    if (Number.isFinite(nb) && nb > 0) top = Math.max(top, nb + gapBelowNav);
  } else {
    top = Math.max(top, 72);
  }
  try {
    const tEnv = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-top)") || "0",
    );
    const bEnv = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-bottom)") || "0",
    );
    if (Number.isFinite(tEnv) && tEnv > 0) top = Math.max(top, tEnv + edge);
    if (Number.isFinite(bEnv) && bEnv > 0) bottom = Math.max(bottom, bEnv + edge);
  } catch {
    /* ignore */
  }
  return { top, bottom };
}

/**
 * Linha do catálogo de anúncios exige ação (vínculo/custos) — só espelha dados já expostos na grid.
 * @param {{ pricingContext?: Record<string, unknown> | null; skuPending?: boolean; productId?: string | null; productCatalogCompleteness?: string | null }} row
 */
export function isAnunciosCatalogRowPending(row) {
  const ph =
    row.pricingContext != null && typeof row.pricingContext === "object"
      ? /** @type {{ product_health?: { product_health_status?: string } }} */ (row.pricingContext).product_health
      : null;
  const st = ph?.product_health_status != null ? String(ph.product_health_status) : null;
  if (st === "MISSING_PRODUCT" || st === "INCOMPLETE_PRODUCT") return true;
  if (row.skuPending) return true;
  if (!row.productId) return true;
  const c = row.productCatalogCompleteness || "";
  if (c === "draft_imported_from_marketplace" || c === "incomplete_required_costs") return true;
  return false;
}

/**
 * Ações de vínculo na linha (espelha health + campos já expostos na grid).
 * @param {{ attentionReason?: string | null; pricingContext?: Record<string, unknown> | null; productId?: string | null }} row
 * @param {(r: typeof row) => void} [onInformSku]
 */
export function getListingProductLinkActions(row, onInformSku) {
  const isSkuPendingMl = row.attentionReason === ATTENTION_REASON_SKU_PENDING_ML;
  const phSt =
    row.pricingContext != null && typeof row.pricingContext === "object"
      ? /** @type {{ product_health?: { product_health_status?: string } }} */ (row.pricingContext).product_health
          ?.product_health_status
      : null;
  const healthSt = phSt != null ? String(phSt) : null;
  const hasInform = typeof onInformSku === "function";
  const pid = row.productId != null && String(row.productId).trim() !== "" ? String(row.productId).trim() : "";
  return {
    isSkuPendingMl,
    healthSt,
    showInformSkuMl: hasInform && isSkuPendingMl,
    showVincular:
      hasInform &&
      !isSkuPendingMl &&
      (healthSt === "MISSING_PRODUCT" || !pid) &&
      healthSt !== "INCOMPLETE_PRODUCT",
    showCompletar: Boolean(pid) && healthSt === "INCOMPLETE_PRODUCT",
  };
}

/** Payload consolidado GET /api/ml/listings (grid). */
/** @param {Record<string, unknown>} g */
export function mapGridApiToCatalogRow(g) {
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
  if (Boolean(g.needs_attention)) uiFlags.needs_attention = true;
  if (Boolean(g.sku_pending)) uiFlags.needs_attention = true;

  const attentionReason = g.attention_reason != null ? String(g.attention_reason) : null;

  const visitsAbsent = Boolean(g.visits_absent);
  const visitCountForFilter = visitsAbsent || g.visits == null ? 0 : Number(g.visits) || 0;

  const m = String(g.marketplace || "");
  const marketplaceSlug = m === "mercado_livre" ? "mercadolivre" : m || "mercadolivre";

  const galleryImageUrls = Array.isArray(g.gallery_image_urls)
    ? /** @type {string[]} */ (g.gallery_image_urls).filter((u) => typeof u === "string" && u.trim() !== "")
    : [];

  const coverDirect = g.cover_image_url ?? g.cover_thumbnail_url;
  const coverTrimmed =
    coverDirect != null && String(coverDirect).trim() !== "" ? String(coverDirect).trim() : null;
  const coverThumbnailUrl = coverTrimmed ?? (galleryImageUrls[0] != null ? String(galleryImageUrls[0]).trim() : null);

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
    /**
     * Preço efetivo (margem/filtros internos): `effective_sale_price_brl`; se ausente na API,
     * usa `listing_price_brl` (anúncio sem promo — mesmo valor). Sem `price_brl` legado.
     */
    price: (() => {
      const effRaw = g.effective_sale_price_brl;
      if (effRaw != null && String(effRaw).trim() !== "") {
        const n = Number(effRaw);
        return Number.isFinite(n) ? n : null;
      }
      const listRaw = g.listing_price_brl;
      if (listRaw != null && String(listRaw).trim() !== "") {
        const n = Number(listRaw);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    })(),
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
    listingNumberDisplay:
      g.external_listing_id != null && String(g.external_listing_id).trim() !== ""
        ? formatMarketplaceListingDisplayId(m, String(g.external_listing_id))
        : DASH,
    listingPermalink:
      g.permalink != null && String(g.permalink).trim() !== ""
        ? String(g.permalink).trim()
        : null,
    coverThumbnailUrl,
    visitCount: visitCountForFilter,
    visitsAbsent,
    visitsText: g.visits != null ? String(g.visits) : null,
    netReceiveBrl:
      g.marketplace_payout_amount != null && String(g.marketplace_payout_amount).trim() !== ""
        ? String(g.marketplace_payout_amount)
        : null,
    marketplacePayoutSource:
      g.marketplace_payout_source != null && String(g.marketplace_payout_source).trim() !== ""
        ? String(g.marketplace_payout_source).trim()
        : "unresolved",
    /** Protocolo v1: payout e preço vêm dos campos explícitos; net_proceeds não é usado na UI. */
    netProceeds: null,
    commissionPercent: g.commission_percent != null ? String(g.commission_percent) : null,
    commissionAmountBrl: g.commission_amount_brl != null ? String(g.commission_amount_brl) : null,
    shippingCostBrl: g.shipping_cost_brl != null ? String(g.shipping_cost_brl) : null,
    shippingCostAmountBrl:
      g.shipping_cost_amount_brl != null && String(g.shipping_cost_amount_brl).trim() !== ""
        ? String(g.shipping_cost_amount_brl).trim()
        : null,
    shippingCostAmount:
      g.shipping_cost_amount != null && String(g.shipping_cost_amount).trim() !== ""
        ? String(g.shipping_cost_amount).trim()
        : null,
    shippingCostContext:
      g.shipping_cost_context === "free_for_buyer" || g.shipping_cost_context === "buyer_pays"
        ? g.shipping_cost_context
        : null,
    shippingCostLabel:
      g.shipping_cost_label != null && String(g.shipping_cost_label).trim() !== ""
        ? String(g.shipping_cost_label).trim()
        : null,
    promotionActive: g.promotion_active === true,
    promotionPriceBrl:
      g.promotion_active === true
        ? g.promotion_sale_price_brl != null && String(g.promotion_sale_price_brl).trim() !== ""
          ? String(g.promotion_sale_price_brl).trim()
          : g.promotional_price_brl != null
            ? String(g.promotional_price_brl)
            : null
        : null,
    effectiveSalePriceBrl:
      g.effective_sale_price_brl != null && String(g.effective_sale_price_brl).trim() !== ""
        ? String(g.effective_sale_price_brl).trim()
        : null,
    /**
     * Padrão oficial v13: `listing_sale_price_brl` (valor de venda base); fallback legado `listing_price_brl`.
     */
    listingSalePriceBrl:
      g.listing_sale_price_brl != null && String(g.listing_sale_price_brl).trim() !== ""
        ? String(g.listing_sale_price_brl).trim()
        : g.listing_price_brl != null && String(g.listing_price_brl).trim() !== ""
          ? String(g.listing_price_brl).trim()
          : g.list_or_original_price_brl != null && String(g.list_or_original_price_brl).trim() !== ""
            ? String(g.list_or_original_price_brl).trim()
            : null,
    promotionSalePriceBrl:
      g.promotion_sale_price_brl != null && String(g.promotion_sale_price_brl).trim() !== ""
        ? String(g.promotion_sale_price_brl).trim()
        : g.promotional_price_brl != null && String(g.promotional_price_brl).trim() !== ""
          ? String(g.promotional_price_brl).trim()
          : null,
    listingGridPriceEvidence:
      g.listing_grid_price_evidence != null && String(g.listing_grid_price_evidence).trim() !== ""
        ? String(g.listing_grid_price_evidence).trim()
        : null,
    /** Preço de catálogo — espelho de listingSalePriceBrl para compat. */
    listingPriceBrl:
      g.listing_sale_price_brl != null && String(g.listing_sale_price_brl).trim() !== ""
        ? String(g.listing_sale_price_brl).trim()
        : g.listing_price_brl != null && String(g.listing_price_brl).trim() !== ""
          ? String(g.listing_price_brl).trim()
          : g.list_or_original_price_brl != null && String(g.list_or_original_price_brl).trim() !== ""
            ? String(g.list_or_original_price_brl).trim()
            : null,
    listOrOriginalPriceBrl:
      g.listing_sale_price_brl != null && String(g.listing_sale_price_brl).trim() !== ""
        ? String(g.listing_sale_price_brl).trim()
        : g.listing_price_brl != null && String(g.listing_price_brl).trim() !== ""
          ? String(g.listing_price_brl).trim()
          : g.list_or_original_price_brl != null && String(g.list_or_original_price_brl).trim() !== ""
            ? String(g.list_or_original_price_brl).trim()
            : null,
    listingTypeLabel: g.listing_type_label != null ? String(g.listing_type_label) : null,
    wholesaleMinQuantity:
      g.wholesale_min_quantity != null && Number.isFinite(Number(g.wholesale_min_quantity))
        ? Math.trunc(Number(g.wholesale_min_quantity))
        : null,
    wholesalePriceBrl:
      g.wholesale_price_brl != null && String(g.wholesale_price_brl).trim() !== ""
        ? String(g.wholesale_price_brl).trim()
        : null,
    shippingLogisticType: g.health_shipping_logistic_type != null ? String(g.health_shipping_logistic_type) : null,
    listingTypeTooltip: g.listing_type_tooltip != null ? String(g.listing_type_tooltip) : null,
    listingQualityScore: qScoreNum,
    listingQualityStatus: qStatus,
    experienceStatus: expStatus,
    uiFlags,
    financialAnalysisBlocked: Boolean(g.financial_analysis_blocked),
    productCatalogCompleteness:
      g.product_catalog_completeness != null ? String(g.product_catalog_completeness) : null,
    financialAnalysisHint:
      g.financial_analysis_hint != null && String(g.financial_analysis_hint).trim() !== ""
        ? String(g.financial_analysis_hint).trim()
        : null,
    attentionReason,
    skuPending:
      attentionReason === ATTENTION_REASON_SKU_PENDING_ML || Boolean(g.sku_pending),
    /** URLs HTTP da tabela `marketplace_listing_pictures` (diagnóstico; ex.: /anuncios-2). */
    galleryImageUrls,
    /** @type {"marketplace_listing_pictures" | "raw_json.pictures" | "none" | null} */
    galleryImageSource:
      g.gallery_image_source === "marketplace_listing_pictures" ||
      g.gallery_image_source === "raw_json.pictures" ||
      g.gallery_image_source === "none"
        ? g.gallery_image_source
        : null,
    pricingContext:
      g.pricing_context != null && typeof g.pricing_context === "object"
        ? /** @type {Record<string, unknown>} */ (g.pricing_context)
        : null,
    productId:
      g.product_id != null && String(g.product_id).trim() !== "" ? String(g.product_id).trim() : null,
  };
}

/** Capa 48×48 — fallback com ícone quando não há URL ou a imagem falha. */
export function ListingCoverThumb({ url }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [url]);
  const trimmed = url != null && String(url).trim() !== "" ? String(url).trim() : "";
  const showImg = trimmed !== "" && !broken;

  return (
    <div className="anuncios-ad-thumb">
      {showImg ? (
        <img
          src={trimmed}
          alt=""
          className="anuncios-ad-thumb__img"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="anuncios-ad-thumb__fallback" aria-hidden>
          <S7Icon name="image" size={22} strokeWidth={1.65} className="anuncios-ad-thumb__fallback-icon" />
        </span>
      )}
    </div>
  );
}

/**
 * Coluna “Você vende por” (vista minimal): preço de tabela, promoção, atacado, “você recebe” + Raio-x ao lado do preço principal.
 * @param {{
 *   row: ReturnType<typeof mapGridApiToCatalogRow>;
 *   onInformSku?: (r: ReturnType<typeof mapGridApiToCatalogRow>) => void;
 * }} props
 */
function AdsMinimalSellColumn({ row, onInformSku }) {
  const raioxTriggerRef = useRef(null);
  const raioxPanelRef = useRef(null);
  /** Gatilho do mini popover “Sobre este status” (linha Resultado). */
  const statusExplainTriggerRef = useRef(null);
  const statusExplainPopoverRef = useRef(null);
  const statusExplainPopoverId = useId();
  /** Evita stale closure em listeners de scroll/resize enquanto o painel está aberto. */
  const raioxOpenRef = useRef(false);
  const raioxCloseTimerRef = useRef(null);

  const [raioxOpen, setRaioxOpen] = useState(false);
  /** true = painel à esquerda do ícone; seta no bordo direito do card (aponta para o gatilho). */
  const [raioxCaretTrailing, setRaioxCaretTrailing] = useState(false);

  /** Posição do painel Raio-x (fixed + clamp na viewport); caret alinhado ao centro do ícone. */
  const [raioxPanelGeom, setRaioxPanelGeom] = useState({
    left: -9999,
    top: 0,
    maxW: ADS_RAIOX_POPOVER_WIDTH_PX,
    /** Mantém consistência com ADS_RAIOX_POPOVER_MAX_H_PX + insets da viewport. */
    maxH: ADS_RAIOX_POPOVER_MAX_H_PX,
    arrowTopPx: 24,
  });
  const [raioxHoverBridge, setRaioxHoverBridge] = useState(
    /** @type {{ left: number; top: number; width: number; height: number } | null} */ (null),
  );

  /** Explicação do status: mini card por hover/foco (payload: título / subtítulo / mensagem do backend). */
  const [statusExplainOpen, setStatusExplainOpen] = useState(false);
  const [statusExplainGeom, setStatusExplainGeom] = useState({
    left: 0,
    top: 0,
    width: ADS_RAIOX_STATUS_EXPLAIN_W_PX,
  });
  const [statusExplainBridge, setStatusExplainBridge] = useState(
    /** @type {{ left: number; top: number; width: number; height: number } | null} */ (null),
  );
  const statusExplainCloseTimerRef = useRef(null);

  const clearStatusExplainCloseTimer = useCallback(() => {
    if (statusExplainCloseTimerRef.current != null) {
      window.clearTimeout(statusExplainCloseTimerRef.current);
      statusExplainCloseTimerRef.current = null;
    }
  }, []);

  const openStatusExplain = useCallback(() => {
    clearStatusExplainCloseTimer();
    setStatusExplainOpen(true);
  }, [clearStatusExplainCloseTimer]);

  const scheduleCloseStatusExplain = useCallback(() => {
    clearStatusExplainCloseTimer();
    statusExplainCloseTimerRef.current = window.setTimeout(() => {
      statusExplainCloseTimerRef.current = null;
      setStatusExplainOpen(false);
      setStatusExplainBridge(null);
    }, 150);
  }, [clearStatusExplainCloseTimer]);

  useEffect(() => {
    raioxOpenRef.current = raioxOpen;
  }, [raioxOpen]);

  useEffect(() => {
    if (!raioxOpen) {
      clearStatusExplainCloseTimer();
      setStatusExplainOpen(false);
      setStatusExplainBridge(null);
    }
  }, [raioxOpen, clearStatusExplainCloseTimer]);

  useEffect(() => {
    clearStatusExplainCloseTimer();
    setStatusExplainOpen(false);
    setStatusExplainBridge(null);
  }, [row.externalId, row.listingNumber, clearStatusExplainCloseTimer]);

  useEffect(() => {
    return () => {
      if (raioxCloseTimerRef.current != null) {
        window.clearTimeout(raioxCloseTimerRef.current);
        raioxCloseTimerRef.current = null;
      }
      if (statusExplainCloseTimerRef.current != null) {
        window.clearTimeout(statusExplainCloseTimerRef.current);
        statusExplainCloseTimerRef.current = null;
      }
    };
  }, []);

  const commitRaioxPanelPosition = useCallback(() => {
    if (!raioxOpenRef.current) return;
    const trig = raioxTriggerRef.current;
    if (!trig) return;
    const r = trig.getBoundingClientRect();
    const margin = 12;
    const gap = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { top: topInset, bottom: bottomInset } = getRaioxPopoverViewportInsets();
    const bottomPad = bottomInset + ADS_RAIOX_POPOVER_VIEWPORT_BOTTOM_GUTTER_PX;
    const maxW = Math.min(ADS_RAIOX_POPOVER_WIDTH_PX, vw - 2 * margin);
    const panelEl = raioxPanelRef.current;
    const estW = panelEl && panelEl.getBoundingClientRect().width > 40 ? panelEl.getBoundingClientRect().width : maxW;

    let left;
    let caretTrailing = false;
    const leftPreferred = r.left - gap - estW;
    if (leftPreferred >= margin) {
      left = leftPreferred;
      caretTrailing = true;
    } else {
      left = r.right + gap;
      if (left + estW > vw - margin) {
        left = Math.max(margin, vw - margin - estW);
      }
      caretTrailing = false;
    }

    const maxH = Math.min(ADS_RAIOX_POPOVER_MAX_H_PX, vh - topInset - bottomPad);
    let panelH = maxH;
    if (panelEl) {
      const rect = panelEl.getBoundingClientRect();
      const hLayout = rect.height;
      const hScroll = panelEl.scrollHeight;
      const h = Number.isFinite(hScroll) && hScroll > 0 ? Math.max(hLayout, hScroll) : hLayout;
      if (Number.isFinite(h) && h > 32) {
        panelH = Math.min(h, maxH);
      }
    }
    const iconCy = r.top + r.height / 2;
    let top = iconCy - panelH / 2 - ADS_RAIOX_POPOVER_VERTICAL_BIAS_UP_PX;
    const bottomReserve = panelH + ADS_RAIOX_SHELL_BOTTOM_CLAMP_SLACK_PX;
    top = Math.min(Math.max(top, topInset), vh - bottomPad - bottomReserve);
    const arrowTopPx = Math.max(14, Math.min(panelH - 14, iconCy - top));
    setRaioxPanelGeom({ left, top, maxW, maxH, arrowTopPx });
    setRaioxCaretTrailing(caretTrailing);

    const panelW = panelEl && panelEl.getBoundingClientRect().width > 40 ? panelEl.getBoundingClientRect().width : estW;
    const bridgeTop = Math.min(r.top, top);
    const bridgeBottom = Math.max(r.bottom, top + panelH);
    const bridgeHeight = Math.max(8, bridgeBottom - bridgeTop);
    let bridge = null;
    if (caretTrailing) {
      const panelRight = left + panelW;
      const w = r.left - panelRight;
      if (w >= 2) bridge = { left: panelRight, top: bridgeTop, width: w, height: bridgeHeight };
    } else {
      const w = left - r.right;
      if (w >= 2) bridge = { left: r.right, top: bridgeTop, width: w, height: bridgeHeight };
    }
    setRaioxHoverBridge(bridge);
  }, []);

  const scheduleRaioxPanelPosition = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(commitRaioxPanelPosition);
    });
  }, [commitRaioxPanelPosition]);

  const openRaioxPanel = useCallback(() => {
    if (raioxCloseTimerRef.current != null) {
      window.clearTimeout(raioxCloseTimerRef.current);
      raioxCloseTimerRef.current = null;
    }
    setRaioxOpen(true);
    scheduleRaioxPanelPosition();
  }, [scheduleRaioxPanelPosition]);

  const scheduleCloseRaioxPanel = useCallback(() => {
    if (raioxCloseTimerRef.current != null) window.clearTimeout(raioxCloseTimerRef.current);
    raioxCloseTimerRef.current = window.setTimeout(() => {
      raioxCloseTimerRef.current = null;
      setRaioxOpen(false);
    }, 140);
  }, []);

  useEffect(() => {
    if (!raioxOpen) return;
    scheduleRaioxPanelPosition();
  }, [raioxOpen, row.externalId, row.listingNumber, scheduleRaioxPanelPosition]);

  useEffect(() => {
    const onWinChange = () => commitRaioxPanelPosition();
    window.addEventListener("resize", onWinChange);
    window.addEventListener("scroll", onWinChange, true);
    return () => {
      window.removeEventListener("resize", onWinChange);
      window.removeEventListener("scroll", onWinChange, true);
    };
  }, [commitRaioxPanelPosition]);

  useEffect(() => {
    if (!raioxOpen) return;
    const el = raioxPanelRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => scheduleRaioxPanelPosition());
    ro.observe(el);
    return () => ro.disconnect();
  }, [raioxOpen, scheduleRaioxPanelPosition]);

  const commitStatusExplainPosition = useCallback(() => {
    const trig = statusExplainTriggerRef.current;
    const pop = statusExplainPopoverRef.current;
    if (!trig) return;
    const r = trig.getBoundingClientRect();
    const margin = 12;
    /** Respiro entre o card Raio-x (região do ícone) e o mini popover — evita sensação de “grudado”. */
    const gap = 18;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { top: topInset, bottom: bottomInset } = getRaioxPopoverViewportInsets();
    const popW = Math.min(ADS_RAIOX_STATUS_EXPLAIN_W_PX, vw - 2 * margin);
    /** Altura inicial maior que o toast antigo: card com 3 blocos de texto. */
    const popH = pop && pop.getBoundingClientRect().height > 8 ? pop.getBoundingClientRect().height : 180;

    let placementRight = true;
    let left = r.right + gap;
    if (left + popW > vw - margin) {
      left = r.left - gap - popW;
      placementRight = false;
    }
    left = Math.max(margin, Math.min(left, vw - margin - popW));

    let top = r.top + r.height / 2 - popH / 2;
    top = Math.max(topInset, Math.min(top, vh - bottomInset - popH));

    const bridgeTop = Math.min(r.top, top);
    const bridgeBottom = Math.max(r.bottom, top + popH);
    const bridgeHeight = Math.max(8, bridgeBottom - bridgeTop);
    /** Ponte hover: ícone ↔ popover, sem flicker no espaçamento. */
    let bridge = null;
    if (placementRight) {
      const w = left - r.right;
      if (w >= 2) bridge = { left: r.right, top: bridgeTop, width: w, height: bridgeHeight };
    } else {
      const w = r.left - (left + popW);
      if (w >= 2) bridge = { left: left + popW, top: bridgeTop, width: w, height: bridgeHeight };
    }
    setStatusExplainGeom({ left, top, width: popW });
    setStatusExplainBridge(bridge);
  }, []);

  useEffect(() => {
    if (!statusExplainOpen) return;
    const run = () => commitStatusExplainPosition();
    run();
    const raf1 = requestAnimationFrame(run);
    let ro = null;
    const raf2 = requestAnimationFrame(() => {
      run();
      const pop = statusExplainPopoverRef.current;
      if (pop && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(run);
        ro.observe(pop);
      }
    });
    window.addEventListener("resize", run);
    window.addEventListener("scroll", run, true);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro?.disconnect();
      window.removeEventListener("resize", run);
      window.removeEventListener("scroll", run, true);
    };
  }, [statusExplainOpen, commitStatusExplainPosition]);

  useEffect(() => {
    if (!statusExplainOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        clearStatusExplainCloseTimer();
        setStatusExplainOpen(false);
        setStatusExplainBridge(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [statusExplainOpen, clearStatusExplainCloseTimer]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const digits = String(row.listingNumberDisplay ?? row.listingNumber ?? "").replace(/\D/g, "");
    if (digits !== "4473596489") return;
    console.info("[Suse7][repasse-debug] MLB4473596489", {
      listingNumber: row.listingNumber,
      listingNumberDisplay: row.listingNumberDisplay,
      listingPriceBrl: row.listingPriceBrl,
      effectiveSalePriceBrl: row.effectiveSalePriceBrl,
      promotionActive: row.promotionActive,
      netReceiveBrl_alias: row.netReceiveBrl,
      marketplacePayoutSource: row.marketplacePayoutSource,
      unitNet_displayed: formatListingUnitNetBrl(row),
    });
  }, [row.listingNumber, row.listingNumberDisplay, row.netReceiveBrl]);

  /** Theme do canal — Raio-x aplica variáveis CSS + moldura sem if (marketplace) no JSX. */
  const raioxMarketplaceTheme = useMemo(
    () => getMarketplaceTheme(row.marketplaceRaw || row.marketplaceSlug),
    [row.marketplaceRaw, row.marketplaceSlug],
  );

  const promoN =
    row.promotionPriceBrl != null && String(row.promotionPriceBrl).trim() !== ""
      ? Number(row.promotionPriceBrl)
      : null;
  const listOrigN =
    row.listingPriceBrl != null && String(row.listingPriceBrl).trim() !== ""
      ? Number(row.listingPriceBrl)
      : row.listOrOriginalPriceBrl != null && String(row.listOrOriginalPriceBrl).trim() !== ""
        ? Number(row.listOrOriginalPriceBrl)
        : null;
  const hasValidPromo =
    row.promotionActive === true && promoN != null && Number.isFinite(promoN) && promoN > 0;
  const mainPriceNum =
    hasValidPromo && listOrigN != null && Number.isFinite(listOrigN) && listOrigN > 0
      ? listOrigN
      : row.price != null && Number.isFinite(row.price)
        ? row.price
        : null;

  const promoDifferent =
    row.promotionActive === true &&
    promoN != null &&
    Number.isFinite(promoN) &&
    mainPriceNum != null &&
    Number.isFinite(mainPriceNum) &&
    Math.abs(mainPriceNum - promoN) > 0.004;

  const showWholesale =
    row.wholesaleMinQuantity != null &&
    row.wholesaleMinQuantity > 1 &&
    row.wholesalePriceBrl != null &&
    String(row.wholesalePriceBrl).trim() !== "";

  /** Subtítulo da tarifa: tipo de anúncio + % (campos consolidados da grid / health — só formatação). */
  const feeSubTitle = buildListingTypeAndTariffSubtitle(row);
  const receiveDisplay = formatListingUnitNetBrl(row);

  const modalSaleFeeDisplay = pickModalSaleFeeFromBackend(row);
  const modalMlShippingLine = pickModalMercadoLivreShippingLine(row);
  const modalNetReceiveDisplay = formatListingUnitNetBrl(row);

  const pc = row.pricingContext;
  const ui =
    pc != null && typeof pc === "object" && pc.ui != null && typeof pc.ui === "object"
      ? /** @type {Record<string, unknown>} */ (pc.ui)
      : null;
  const ic =
    pc != null &&
    typeof pc === "object" &&
    pc.internal_costs != null &&
    typeof pc.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (pc.internal_costs)
      : null;
  const res =
    pc != null && typeof pc === "object" && pc.result != null && typeof pc.result === "object"
      ? /** @type {Record<string, unknown>} */ (pc.result)
      : null;
  const block2Mode = ui?.block2_mode != null ? String(ui.block2_mode) : "no_product";
  const block3Mode = ui?.block3_mode != null ? String(ui.block3_mode) : "blocked";

  const offerSemRaw =
    res != null && res.offer_status_semantic != null ? String(res.offer_status_semantic).trim() : "";
  const OFFER_SEM_ALLOWED = new Set(["critical", "danger", "acceptable", "great", "excellent"]);
  const offerSemClass =
    block3Mode === "ok" && res != null && OFFER_SEM_ALLOWED.has(offerSemRaw)
      ? `anuncios-sell-popover__offer-sem--${offerSemRaw}`
      : "";
  /** Tom visual do mini popover (borda/fundo) alinhado ao mesmo semantic do status. */
  const statusExplainToneClass =
    block3Mode === "ok" && res != null && OFFER_SEM_ALLOWED.has(offerSemRaw)
      ? `anuncios-raiox-status-explain--${offerSemRaw}`
      : "";
  /** Textos do status: backend é fonte de verdade (título / subtítulo / mensagem). */
  const offerStatusTitle =
    res != null && res.offer_status_title != null && String(res.offer_status_title).trim() !== ""
      ? String(res.offer_status_title).trim()
      : "";
  const offerStatusSubtitle =
    res != null && res.offer_status_subtitle != null && String(res.offer_status_subtitle).trim() !== ""
      ? String(res.offer_status_subtitle).trim()
      : "";
  const offerStatusMessage =
    res != null && res.offer_status_message != null && String(res.offer_status_message).trim() !== ""
      ? String(res.offer_status_message).trim()
      : "";
  const offerStatusTooltipLegacy =
    res != null && res.offer_status_tooltip != null && String(res.offer_status_tooltip).trim() !== ""
      ? String(res.offer_status_tooltip).trim()
      : "";
  const offerStatusBody = offerStatusMessage !== "" ? offerStatusMessage : offerStatusTooltipLegacy;
  const hasStatusExplain =
    block3Mode === "ok" &&
    res != null &&
    (offerStatusTitle !== "" || offerStatusSubtitle !== "" || offerStatusBody !== "");
  const statusExplainTitleId = `${statusExplainPopoverId}-title`;
  const taxPercentLabel =
    ic != null && ic.tax_percent_label != null && String(ic.tax_percent_label).trim() !== ""
      ? String(ic.tax_percent_label)
      : null;

  const showModalProductValue =
    (row.listOrOriginalPriceBrl != null && String(row.listOrOriginalPriceBrl).trim() !== "") ||
    (!row.promotionActive && row.price != null && Number.isFinite(row.price));
  const showModalPromoPrice =
    row.promotionActive === true &&
    row.promotionPriceBrl != null &&
    String(row.promotionPriceBrl).trim() !== "";

  /** Destaque visual: base da comissão = preço efetivo (promo quando ativa). Ordem no card segue ML (promo primeiro). */
  const modalBaseCommissionHighlightKey = showModalPromoPrice
    ? "promo"
    : showModalProductValue
      ? "product"
      : null;

  const raioxPriceLinesPromoFirst =
    row.promotionActive === true && showModalPromoPrice && showModalProductValue;

  /* FASE 2 — subsídio de tarifa ML (aguardar backend estável; não renderizar ainda)
  const costReductionRaw =
    row.netProceeds?.marketplaceCostReductionAmount ?? row.netProceeds?.marketplaceCostReductionAmountBrl;
  const hasSubsidy =
    costReductionRaw != null &&
    costReductionRaw !== "" &&
    Number(String(costReductionRaw).replace(",", ".")) > 0;
  {hasSubsidy && (
    <>
      <span>**</span>
      <div className="anuncios-sell-popover__muted anuncios-sell-popover__muted--tariff-footnote">
        ** R$ … Reduzidos das suas tarifas por cada venda
      </div>
    </>
  )}
  */

  return (
    <div className="anuncios-sell-minimal">
      <div className="anuncios-sell-minimal__main-row">
        {promoDifferent && promoN != null ? (
          <div className="anuncios-sell-minimal__primary-stack">
            <span className="anuncios-sell-minimal__primary-caption">Você vende na promoção</span>
            <span className="anuncios-sell-minimal__main">{formatMoneyOrDash(promoN)}</span>
          </div>
        ) : (
          <span className="anuncios-sell-minimal__main">{formatMoneyOrDash(mainPriceNum)}</span>
        )}
        <span
          className="anuncios-sell-popover anuncios-sell-popover--inline"
          onMouseEnter={openRaioxPanel}
          onMouseLeave={scheduleCloseRaioxPanel}
          onFocusCapture={openRaioxPanel}
        >
          <button
            ref={raioxTriggerRef}
            type="button"
            className="anuncios-sell-popover__trigger"
            aria-label="Ver raio-x da venda no marketplace"
            onBlur={scheduleCloseRaioxPanel}
          >
            <S7Icon name="info" size={15} strokeWidth={1.65} />
          </button>
        </span>
        {raioxOpen && typeof document !== "undefined"
          ? createPortal(
              <>
                {raioxHoverBridge ? (
                  <div
                    className="anuncios-sell-popover__hover-bridge anuncios-sell-popover__hover-bridge--open"
                    aria-hidden
                    style={{
                      left: raioxHoverBridge.left,
                      top: raioxHoverBridge.top,
                      width: raioxHoverBridge.width,
                      height: raioxHoverBridge.height,
                    }}
                    onMouseEnter={openRaioxPanel}
                    onMouseLeave={scheduleCloseRaioxPanel}
                  />
                ) : null}
                <div
                  ref={raioxPanelRef}
                  className={[
                    "anuncios-raiox-shell",
                    "anuncios-raiox-shell--portal",
                    "anuncios-raiox-shell--open",
                    raioxMarketplaceTheme.shellModifierClass,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    left: raioxPanelGeom.left,
                    top: raioxPanelGeom.top,
                    width: raioxPanelGeom.maxW,
                    maxWidth: raioxPanelGeom.maxW,
                    maxHeight: raioxPanelGeom.maxH,
                    ...getMarketplaceThemeCssVars(raioxMarketplaceTheme),
                  }}
                  onMouseEnter={openRaioxPanel}
                  onMouseLeave={scheduleCloseRaioxPanel}
                >
                  <div className="anuncios-raiox-shell__frame" aria-hidden />
                  {/** Logo vem do theme; fallback sem imagem só moldura neutra. */}
                  {raioxMarketplaceTheme.logoSrc ? (
                    <div className="anuncios-raiox-shell__badge">
                      <img
                        src={raioxMarketplaceTheme.logoSrc}
                        alt={raioxMarketplaceTheme.logoAlt ?? ""}
                        loading="lazy"
                        decoding="async"
                        className="anuncios-raiox-shell__badge-img"
                      />
                    </div>
                  ) : (
                    <div className="anuncios-raiox-shell__badge anuncios-raiox-shell__badge--text">
                      <span className="anuncios-raiox-shell__badge-fallback">{raioxMarketplaceTheme.displayName}</span>
                    </div>
                  )}
                  <div
                    className={[
                      "anuncios-sell-popover__panel",
                      "anuncios-sell-popover__panel--in-shell",
                      raioxCaretTrailing ? "anuncios-sell-popover__panel--caret-trailing" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    role="tooltip"
                    style={{
                      ["--raiox-caret-top"]: `${raioxPanelGeom.arrowTopPx}px`,
                    }}
                  >
            <h3 className="anuncios-sell-popover__title">Raio-x da venda</h3>
            <p className="anuncios-sell-popover__subtitle">Valores unitários por venda neste anúncio</p>

            <div className="anuncios-sell-popover__section">
              <h4 className="anuncios-sell-popover__section-title">Receita do marketplace</h4>
              {showModalProductValue || showModalPromoPrice ? (
                <div className="anuncios-sell-popover__block">
                  {raioxPriceLinesPromoFirst ? (
                    <>
                      {showModalPromoPrice ? (
                        <div
                          className={
                            modalBaseCommissionHighlightKey === "promo"
                              ? "anuncios-sell-popover__line anuncios-sell-popover__line--key"
                              : "anuncios-sell-popover__line"
                          }
                        >
                          <span>Você vende na promoção</span>
                          <strong>{formatBrlFromApiString(row.promotionPriceBrl)}</strong>
                        </div>
                      ) : null}
                      {showModalProductValue ? (
                        <div
                          className={
                            modalBaseCommissionHighlightKey === "product"
                              ? "anuncios-sell-popover__line anuncios-sell-popover__line--key"
                              : "anuncios-sell-popover__line"
                          }
                        >
                          <span>Valor de venda</span>
                          <strong>
                            {formatBrlFromApiString(
                              row.promotionActive && row.listingPriceBrl != null
                                ? row.listingPriceBrl
                                : row.effectiveSalePriceBrl ??
                                    row.listingPriceBrl ??
                                    row.listOrOriginalPriceBrl ??
                                    (row.price != null ? String(row.price) : null),
                            )}
                          </strong>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {showModalProductValue ? (
                        <div
                          className={
                            modalBaseCommissionHighlightKey === "product"
                              ? "anuncios-sell-popover__line anuncios-sell-popover__line--key"
                              : "anuncios-sell-popover__line"
                          }
                        >
                          <span>Valor de venda</span>
                          <strong>
                            {formatBrlFromApiString(
                              row.promotionActive && row.listingPriceBrl != null
                                ? row.listingPriceBrl
                                : row.effectiveSalePriceBrl ??
                                    row.listingPriceBrl ??
                                    row.listOrOriginalPriceBrl ??
                                    (row.price != null ? String(row.price) : null),
                            )}
                          </strong>
                        </div>
                      ) : null}
                      {showModalPromoPrice ? (
                        <div
                          className={
                            modalBaseCommissionHighlightKey === "promo"
                              ? "anuncios-sell-popover__line anuncios-sell-popover__line--key"
                              : "anuncios-sell-popover__line"
                          }
                        >
                          <span>Você vende na promoção</span>
                          <strong>{formatBrlFromApiString(row.promotionPriceBrl)}</strong>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
              <div className="anuncios-sell-popover__block">
                <div className="anuncios-sell-popover__line">
                  <span>Tarifa de venda</span>
                  <strong>{modalSaleFeeDisplay}</strong>
                </div>
                {feeSubTitle != null ? (
                  <div className="anuncios-sell-popover__muted">{feeSubTitle}</div>
                ) : null}
              </div>
              <div className="anuncios-sell-popover__block">
                <div className="anuncios-sell-popover__line">
                  <span>{modalMlShippingLine.title}</span>
                  <strong>{modalMlShippingLine.value}</strong>
                </div>
                {modalMlShippingLine.sub != null && String(modalMlShippingLine.sub).trim() !== "" ? (
                  <div className="anuncios-sell-popover__muted">{modalMlShippingLine.sub}</div>
                ) : null}
              </div>
              <div className="anuncios-sell-popover__block">
                <div className="anuncios-sell-popover__line anuncios-sell-popover__line--total anuncios-sell-popover__line--key">
                  <span>Você recebe do Mercado Livre</span>
                  <strong>{modalNetReceiveDisplay}</strong>
                </div>
              </div>
            </div>

            <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future">
              <h4 className="anuncios-sell-popover__section-title">Custos internos</h4>
              {block2Mode === "no_product" ? (
                <>
                  <p className="anuncios-sell-popover__raiox-alert">
                    Este anúncio não está vinculado a um produto.
                  </p>
                  {typeof onInformSku === "function" ? (
                    <S7Button
                      type="button"
                      variant="warning"
                      size="sm"
                      className="anuncios-sell-popover__link-product-btn anuncios-ad-line-action-btn"
                      onClick={() => onInformSku(row)}
                    >
                      Vincular produto
                    </S7Button>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Custo do produto</span>
                      <strong
                        className={
                          ic?.product_cost_brl != null && String(ic.product_cost_brl).trim() !== ""
                            ? undefined
                            : "anuncios-sell-popover__value--empty"
                        }
                      >
                        {ic?.product_cost_brl != null && String(ic.product_cost_brl).trim() !== ""
                          ? formatBrlFromApiString(ic.product_cost_brl)
                          : DASH}
                      </strong>
                    </div>
                  </div>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Impostos</span>
                      <strong
                        className={
                          ic?.tax_amount_brl != null && String(ic.tax_amount_brl).trim() !== ""
                            ? undefined
                            : "anuncios-sell-popover__value--empty"
                        }
                      >
                        {ic?.tax_amount_brl != null && String(ic.tax_amount_brl).trim() !== ""
                          ? formatBrlFromApiString(ic.tax_amount_brl)
                          : DASH}
                      </strong>
                    </div>
                    {taxPercentLabel != null ? (
                      <div className="anuncios-sell-popover__muted">{taxPercentLabel}</div>
                    ) : null}
                  </div>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Operação + Embalagem</span>
                      <strong
                        className={
                          ic?.operational_packaging_total_brl != null &&
                          String(ic.operational_packaging_total_brl).trim() !== ""
                            ? undefined
                            : "anuncios-sell-popover__value--empty"
                        }
                      >
                        {ic?.operational_packaging_total_brl != null &&
                        String(ic.operational_packaging_total_brl).trim() !== ""
                          ? formatBrlFromApiString(ic.operational_packaging_total_brl)
                          : DASH}
                      </strong>
                    </div>
                  </div>
                  {block2Mode === "incomplete" && ui?.block2_message != null ? (
                    <p className="anuncios-sell-popover__raiox-warn">⚠ {String(ui.block2_message)}</p>
                  ) : null}
                </>
              )}
            </div>

            <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future">
              <h4 className="anuncios-sell-popover__section-title">Resultado</h4>
              {block3Mode === "ok" && res != null ? (
                <>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Lucro líquido</span>
                      <strong className={offerSemClass || undefined}>{formatBrlFromApiString(res.profit_brl)}</strong>
                    </div>
                  </div>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Margem</span>
                      <strong className={offerSemClass || undefined}>
                        {res.margin_pct != null && String(res.margin_pct).trim() !== ""
                          ? `${String(res.margin_pct).replace(".", ",")} %`
                          : DASH}
                      </strong>
                    </div>
                  </div>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line">
                      <span>Preço mínimo saudável</span>
                      <strong>
                        {res.break_even_price_brl != null && String(res.break_even_price_brl).trim() !== ""
                          ? formatBrlFromApiString(res.break_even_price_brl)
                          : DASH}
                      </strong>
                    </div>
                  </div>
                  <div className="anuncios-sell-popover__block">
                    <div className="anuncios-sell-popover__line anuncios-sell-popover__line--status-offer">
                      <span className="anuncios-sell-popover__status-line-head">
                        <span className="anuncios-sell-popover__status-line-label">Status da oferta</span>
                        {hasStatusExplain ? (
                          <button
                            ref={statusExplainTriggerRef}
                            type="button"
                            className="anuncios-sell-popover__status-tip"
                            aria-label="Detalhes do status da oferta. Passe o mouse ou foque para ler a explicação."
                            aria-expanded={statusExplainOpen}
                            aria-controls={statusExplainPopoverId}
                            aria-haspopup="dialog"
                            onMouseEnter={openStatusExplain}
                            onMouseLeave={scheduleCloseStatusExplain}
                            onFocus={openStatusExplain}
                            onBlur={scheduleCloseStatusExplain}
                          >
                            <S7Icon name="info" size={13} strokeWidth={1.65} />
                          </button>
                        ) : null}
                      </span>
                      <strong className={offerSemClass || undefined}>
                        {res.offer_status_label != null
                          ? String(res.offer_status_label)
                          : res.offer_status != null
                            ? String(res.offer_status)
                            : DASH}
                      </strong>
                    </div>
                    {hasStatusExplain && statusExplainOpen && typeof document !== "undefined"
                      ? createPortal(
                          <>
                            {statusExplainBridge ? (
                              <div
                                className="anuncios-raiox-status-explain-bridge"
                                aria-hidden
                                style={{
                                  position: "fixed",
                                  left: statusExplainBridge.left,
                                  top: statusExplainBridge.top,
                                  width: statusExplainBridge.width,
                                  height: statusExplainBridge.height,
                                  zIndex: ADS_RAIOX_STATUS_EXPLAIN_Z_BRIDGE,
                                }}
                                onMouseEnter={openStatusExplain}
                                onMouseLeave={scheduleCloseStatusExplain}
                              />
                            ) : null}
                            <div
                              ref={statusExplainPopoverRef}
                              id={statusExplainPopoverId}
                              className={["anuncios-raiox-status-explain", statusExplainToneClass]
                                .filter(Boolean)
                                .join(" ")}
                              role="dialog"
                              aria-labelledby={offerStatusTitle ? statusExplainTitleId : undefined}
                              aria-label={offerStatusTitle ? undefined : "Explicação do status da oferta"}
                              style={{
                                position: "fixed",
                                left: statusExplainGeom.left,
                                top: statusExplainGeom.top,
                                width: statusExplainGeom.width,
                                zIndex: ADS_RAIOX_STATUS_EXPLAIN_Z,
                              }}
                              onMouseEnter={openStatusExplain}
                              onMouseLeave={scheduleCloseStatusExplain}
                            >
                              {offerStatusTitle ? (
                                <h3 id={statusExplainTitleId} className="anuncios-raiox-status-explain__title">
                                  {offerStatusTitle}
                                </h3>
                              ) : null}
                              {offerStatusSubtitle ? (
                                <p className="anuncios-raiox-status-explain__subtitle">{offerStatusSubtitle}</p>
                              ) : null}
                              {offerStatusBody ? (
                                <p className="anuncios-raiox-status-explain__message">{offerStatusBody}</p>
                              ) : null}
                            </div>
                          </>,
                          document.body,
                        )
                      : null}
                  </div>
                </>
              ) : (
                <p className="anuncios-sell-popover__result-placeholder">
                  {ui?.block3_message != null
                    ? `⚠ ${String(ui.block3_message)}`
                    : "Complete os dados do produto para visualizar o resultado."}
                </p>
              )}
            </div>
                  </div>
                </div>
              </>,
              document.body,
            )
          : null}
      </div>
      {promoDifferent && promoN != null && mainPriceNum != null ? (
        <p className="anuncios-sell-minimal__promo">
          Valor de venda <em>{formatCatalogBRL(mainPriceNum)}</em>
        </p>
      ) : null}
      {showWholesale ? (
        <div className="anuncios-sell-minimal__wholesale">
          <S7Icon name="info" size={14} strokeWidth={1.75} className="anuncios-sell-minimal__wholesale-icon" />
          <span>
            Você oferece preço de atacado: a partir de {row.wholesaleMinQuantity} un. por{" "}
            {formatBrlFromApiString(row.wholesalePriceBrl)}
          </span>
        </div>
      ) : null}
      <div className="anuncios-sell-minimal__net">
        <span className="anuncios-sell-minimal__net-label">Você recebe (marketplace)</span>
        <span className="anuncios-sell-minimal__net-value">{receiveDisplay}</span>
      </div>
    </div>
  );
}

const ADS_COPY_FLASH_MS = 6000;
const ADS_COPY_KEY_ID = "ad-id";
const ADS_COPY_KEY_SKU = "ad-sku";
const PRECIFICA_S7_ICON_SRC = precificaS7Icon;

/**
 * @param {{
 *   row: ReturnType<typeof mapGridApiToCatalogRow>;
 *   onInformSku?: (r: ReturnType<typeof mapGridApiToCatalogRow>) => void;
 *   onListingsRefresh?: () => void | Promise<void>;
 *   minimal?: boolean;
 * }} props
 */
function AdsCatalogRow({ row, onInformSku, onListingsRefresh, minimal = false }) {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [copyFlashKey, setCopyFlashKey] = useState(null);
  const precificaRef = useRef(null);
  const [pricingOpen, setPricingOpen] = useState(false);

  /** ID técnico completo (ex.: MLB…) — útil para suporte e integrações. */
  const handleCopyListingId = useCallback(async () => {
    if (row.listingNumber === DASH) return;
    const text = String(row.listingNumber).trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyFlashKey(ADS_COPY_KEY_ID);
      window.setTimeout(() => {
        setCopyFlashKey((k) => (k === ADS_COPY_KEY_ID ? null : k));
      }, ADS_COPY_FLASH_MS);
      addNotification({
        event_type: "LISTING_ID_COPIED",
        entity_type: "marketplace_listing",
        title: "ID do anúncio copiado",
        message: `${text} foi copiado para a área de transferência.`,
        severity: NOTIFICATION_SEVERITY.INFO,
      });
    } catch {
      addNotification({
        event_type: "LISTING_ID_COPY_FAILED",
        entity_type: "marketplace_listing",
        title: "Não foi possível copiar",
        message: "Verifique permissões do navegador ou use HTTPS.",
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
    }
  }, [row.listingNumber, addNotification]);

  const handleCopySku = useCallback(async () => {
    const sku = row.sku != null ? String(row.sku).trim() : "";
    if (!sku) return;
    try {
      await navigator.clipboard.writeText(sku);
      setCopyFlashKey(ADS_COPY_KEY_SKU);
      window.setTimeout(() => {
        setCopyFlashKey((k) => (k === ADS_COPY_KEY_SKU ? null : k));
      }, ADS_COPY_FLASH_MS);
      addNotification({
        event_type: "LISTING_SKU_COPIED",
        entity_type: "marketplace_listing",
        title: "SKU copiado",
        message: `${sku} foi copiado para a área de transferência.`,
        severity: NOTIFICATION_SEVERITY.INFO,
      });
    } catch {
      addNotification({
        event_type: "LISTING_SKU_COPY_FAILED",
        entity_type: "marketplace_listing",
        title: "Não foi possível copiar",
        message: "Verifique permissões do navegador ou use HTTPS.",
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
    }
  }, [row.sku, addNotification]);

  const showIdCopyOk = copyFlashKey === ADS_COPY_KEY_ID;
  const showSkuCopyOk = copyFlashKey === ADS_COPY_KEY_SKU;

  const rowPending = isAnunciosCatalogRowPending(row);
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

  /** Unidades vendidas consolidadas no Suse7 (coluna Vendas na grade completa). */
  const soldUnits = Math.trunc(Number(row.salesCount)) || 0;

  const revenueCell = row.grossRevenueMissing ? DASH : formatBrlFromApiString(row.grossRevenueBrl);

  const linkAct = getListingProductLinkActions(row, onInformSku);

  if (minimal) {
    return (
      <>
        <div
          className={`anuncios-catalog__row anuncios-catalog__row--minimal anuncios-catalog--dense${
            rowPending ? " anuncios-catalog__row--pending-product" : ""
          }`}
          role="row"
        >
          <div className="products-catalog__cell anuncios-catalog__cell--precifica-s7">
            <button
              ref={precificaRef}
              type="button"
              className="anuncios-precifica-s7-btn s7-tip s7-tip-bottom"
              data-tip="Precificação Inteligente S7"
              aria-label="Abrir Precificação Inteligente S7"
              onClick={(e) => {
                e.stopPropagation();
                setPricingOpen(true);
              }}
            >
              <img
                src={PRECIFICA_S7_ICON_SRC}
                alt=""
                className="anuncios-precifica-s7-btn__icon"
                loading="lazy"
                decoding="async"
              />
            </button>
          </div>
          <div className="products-catalog__cell anuncios-catalog__cell--thumb" title={row.adTitle}>
            <ListingCoverThumb url={row.coverThumbnailUrl} />
          </div>
        <div className="products-catalog__cell anuncios-catalog__cell--minimal-listing">
          <div className="anuncios-ad-main">
            <div className="anuncios-ad-id-row">
              <span className="anuncios-ad-id-text">
                {row.listingNumber === DASH ? row.listingNumber : row.listingNumberDisplay}
              </span>
              {row.listingNumber !== DASH ? (
                <button
                  type="button"
                  className={`products-catalog__copy-btn s7-tip s7-tip-bottom s7-tip-left${
                    showIdCopyOk ? " products-catalog__copy-btn--ok" : ""
                  }`}
                  data-tip={showIdCopyOk ? "Copiado!" : "Copiar"}
                  onClick={handleCopyListingId}
                  aria-label="Copiar ID completo do anúncio"
                >
                  {showIdCopyOk ? "✓" : "⧉"}
                </button>
              ) : null}
            </div>
            <div className="anuncios-catalog__minimal-title-toolbar">
              <div className="anuncios-catalog__minimal-title-grow">
                {row.adTitle && row.adTitle !== DASH ? (
                  row.listingPermalink ? (
                    <a
                      href={row.listingPermalink}
                      className="anuncios-ad-title-link anuncios-ad-title-link--toolbar"
                      target="_blank"
                      rel="noreferrer noopener"
                      title={`Abrir no Mercado Livre — ${row.adTitle}`}
                    >
                      {row.adTitle}
                    </a>
                  ) : (
                    <span className="anuncios-ad-title-link anuncios-ad-title-link--static anuncios-ad-title-link--toolbar" title={row.adTitle}>
                      {row.adTitle}
                    </span>
                  )
                ) : (
                  <span className="anuncios-catalog__minimal-title-placeholder">Sem título</span>
                )}
              </div>
              <div
                className="anuncios-catalog__minimal-title-actions"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
                {linkAct.showInformSkuMl ? (
                  <S7Button
                    type="button"
                    variant="warning"
                    size="sm"
                    className="anuncios-ad-line-action-btn"
                    onClick={() => onInformSku?.(row)}
                  >
                    Informar SKU
                  </S7Button>
                ) : null}
                {linkAct.showVincular ? (
                  <S7Button
                    type="button"
                    variant="warning"
                    size="sm"
                    className="anuncios-ad-line-action-btn"
                    onClick={() => onInformSku?.(row)}
                  >
                    Vincular produto
                  </S7Button>
                ) : null}
                {linkAct.showCompletar && row.productId ? (
                  <S7Button
                    type="button"
                    variant="warning"
                    size="sm"
                    className="anuncios-ad-line-action-btn"
                    onClick={() => navigate(`/produtos/${row.productId}/editar`)}
                  >
                    Completar cadastro do produto
                  </S7Button>
                ) : null}
              </div>
              <div className="anuncios-catalog__minimal-title-mkt">
                <MarketplaceBadge marketplace={row.marketplaceRaw || row.marketplaceSlug} />
              </div>
            </div>
            <div className="anuncios-ad-sku-row">
              <span className="anuncios-ad-sku-label">SKU</span>
              {row.sku ? (
                <>
                  <span className="anuncios-ad-sku-value">{row.sku}</span>
                  <button
                    type="button"
                    className={`products-catalog__copy-btn s7-tip s7-tip-bottom s7-tip-left${
                      showSkuCopyOk ? " products-catalog__copy-btn--ok" : ""
                    }`}
                    data-tip={showSkuCopyOk ? "Copiado!" : "Copiar"}
                    onClick={handleCopySku}
                    aria-label="Copiar SKU"
                  >
                    {showSkuCopyOk ? "✓" : "⧉"}
                  </button>
                </>
              ) : (
                <span className="anuncios-ad-sku-value anuncios-ad-sku-value--empty">não informado</span>
              )}
              {row.picturesCount != null ? (
                <>
                  <span className="anuncios-ad-sku-sep" aria-hidden>
                    ·
                  </span>
                  <span className="anuncios-ad-meta-inline">
                    {row.picturesCount} {row.picturesCount === 1 ? "foto" : "fotos"}
                  </span>
                </>
              ) : null}
              <span className="anuncios-ad-sku-sep" aria-hidden>
                ·
              </span>
              <span
                className="anuncios-ad-meta-inline"
                title="Visitas ao anúncio no Mercado Livre, quando a API expõe o dado."
              >
                {visitsCell} visitas
              </span>
              <span className="anuncios-ad-sku-sep" aria-hidden>
                ·
              </span>
              <span
                className="anuncios-ad-meta-inline"
                title="Unidades vendidas consolidadas nos pedidos importados no Suse7 (mesma base da coluna Vendas na vista completa)."
              >
                {soldUnits} {soldUnits === 1 ? "vendida" : "vendidas"}
              </span>
            </div>
          </div>
        </div>
        <div className="products-catalog__cell anuncios-catalog__cell--minimal-sell">
          <AdsMinimalSellColumn row={row} onInformSku={onInformSku} />
        </div>
      </div>
        <AdsPricingIntelligenceModal
          row={row}
          open={pricingOpen}
          anchorRef={precificaRef}
          onClose={() => setPricingOpen(false)}
          onApplied={onListingsRefresh}
        />
      </>
    );
  }

  return (
    <>
    <div
      className={`anuncios-catalog__row anuncios-catalog--dense${
        rowPending ? " anuncios-catalog__row--pending-product" : ""
      }`}
      role="row"
    >
      <div className="products-catalog__cell anuncios-catalog__cell--precifica-s7">
        <button
          ref={precificaRef}
          type="button"
          className="anuncios-precifica-s7-btn s7-tip s7-tip-bottom"
          data-tip="Precificação Inteligente S7"
          aria-label="Abrir Precificação Inteligente S7"
          onClick={(e) => {
            e.stopPropagation();
            setPricingOpen(true);
          }}
        >
          <img
            src={PRECIFICA_S7_ICON_SRC}
            alt=""
            className="anuncios-precifica-s7-btn__icon"
            loading="lazy"
            decoding="async"
          />
        </button>
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--thumb" title={row.adTitle}>
        <ListingCoverThumb url={row.coverThumbnailUrl} />
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--listing-no">
        {row.listingNumber === DASH ? (
          row.listingNumber
        ) : (
          <S7Tooltip
            content="Clique para copiar o ID completo do anúncio (Mercado Livre)."
            wrap
          >
            <button
              type="button"
              className="anuncios-catalog__listing-no-btn"
              onClick={handleCopyListingId}
              aria-label={`Copiar ID do anúncio ${row.listingNumberDisplay}`}
            >
              {row.listingNumberDisplay}
            </button>
          </S7Tooltip>
        )}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--title">
        <div className="anuncios-catalog__title-heading-row">
          <span className="anuncios-catalog__ad-title anuncios-catalog__ad-title--inline" title={row.adTitle}>
            {row.adTitle}
          </span>
          <div
            className="anuncios-catalog__title-heading-actions"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {linkAct.showInformSkuMl ? (
              <S7Button
                type="button"
                variant="warning"
                size="sm"
                className="anuncios-ad-line-action-btn"
                onClick={() => onInformSku?.(row)}
              >
                Informar SKU
              </S7Button>
            ) : null}
            {linkAct.showVincular ? (
              <S7Button
                type="button"
                variant="warning"
                size="sm"
                className="anuncios-ad-line-action-btn"
                onClick={() => onInformSku?.(row)}
              >
                Vincular produto
              </S7Button>
            ) : null}
            {linkAct.showCompletar && row.productId ? (
              <S7Button
                type="button"
                variant="warning"
                size="sm"
                className="anuncios-ad-line-action-btn"
                onClick={() => navigate(`/produtos/${row.productId}/editar`)}
              >
                Completar cadastro do produto
              </S7Button>
            ) : null}
          </div>
        </div>
        {metaParts.length > 0 ? <span className="anuncios-catalog__ad-meta">{metaParts.join(" · ")}</span> : null}
        {row.financialAnalysisHint ? (
          <span className="anuncios-catalog__financial-hint" role="note">
            {row.financialAnalysisHint}
          </span>
        ) : null}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--product">
        {linkAct.showInformSkuMl || linkAct.showVincular || linkAct.showCompletar ? (
          <span className="anuncios-catalog__product-cell-muted" title="Use a ação na coluna do título.">
            —
          </span>
        ) : (
          <span className="anuncios-catalog__product-link" title={row.productName}>
            {row.productName}
          </span>
        )}
      </div>
      <div className="products-catalog__cell anuncios-catalog__cell--mkt">
        <MarketplaceBadge marketplace={row.marketplaceRaw || row.marketplaceSlug} />
      </div>
      <div
        className="products-catalog__cell products-catalog__cell--money"
        title="Preço de catálogo (listing_price_brl). Preço efetivo de venda: effective_sale_price_brl na API."
      >
        {row.listingPriceBrl != null && String(row.listingPriceBrl).trim() !== ""
          ? formatBrlFromApiString(row.listingPriceBrl)
          : row.price != null && Number.isFinite(row.price)
            ? formatCatalogBRL(row.price)
            : DASH}
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
      <div className="products-catalog__cell products-catalog__cell--money">{formatListingUnitNetBrl(row)}</div>
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
    <AdsPricingIntelligenceModal
      row={row}
      open={pricingOpen}
      anchorRef={precificaRef}
      onClose={() => setPricingOpen(false)}
      onApplied={onListingsRefresh}
    />
    </>
  );
}

export default function Anuncios() {
  const { addNotification } = useNotifications();
  const [adsFilterId, setAdsFilterId] = useState("all");
  const [adsSearchQuery, setAdsSearchQuery] = useState("");
  const [adsPage, setAdsPage] = useState(1);
  /** Vista simples (default): só capa + nº; vista completa: todas as colunas operacionais. */
  const [adsViewMode, setAdsViewMode] = useState(/** @type {"minimal" | "full"} */ ("minimal"));

  /** Modal: informar SKU (anúncio sem SKU no ML). */
  const [skuModalListing, setSkuModalListing] = useState(null);

  const [catalogRows, setCatalogRows] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [healthBackfillLoading, setHealthBackfillLoading] = useState(false);
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

  const openSkuModal = useCallback((row) => {
    const knownSku = row.sku != null && String(row.sku).trim() !== "" ? String(row.sku).trim() : null;
    setSkuModalListing({
      id: String(row.id),
      title: row.adTitle && row.adTitle !== DASH ? String(row.adTitle) : "",
      knownSku,
    });
  }, []);

  const closeSkuModal = useCallback(() => {
    setSkuModalListing(null);
  }, []);

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

    let token = await getSessionToken();
    if (!token) {
      await new Promise((r) => setTimeout(r, 150));
      token = await getSessionToken();
    }
    if (!token) {
      setListLoading(false);
      setListError("Sessão ainda não disponível para o token. Atualize a página ou entre novamente.");
      setCatalogRows([]);
      return false;
    }

    if (import.meta.env.DEV) {
      console.info("[Suse7][API listings URL]", url);
    }
    const res = await apiFetch(url);
    setListLoading(false);
    if (!res.ok) {
      const msg = res.error || res.data?.error || "Não foi possível carregar os anúncios.";
      setListError(msg);
      setCatalogRows([]);
      return false;
    }
    const listings = Array.isArray(res.data?.listings) ? res.data.listings : [];
    debugLogMlListingsCoverFromApi(listings);
    setCatalogRows(listings.map(mapGridApiToCatalogRow));
    return true;
  }, []);

  const handleSkuSaved = useCallback(async () => {
    addNotification({
      event_type: "LISTING_SKU_SAVED",
      entity_type: "marketplace_listing",
      title: "SKU vinculado com sucesso",
      message: "O anúncio foi associado ao produto e a lista foi atualizada.",
      severity: NOTIFICATION_SEVERITY.INFO,
    });
    await fetchListings();
  }, [addNotification, fetchListings]);

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
  // Orquestração: importar anúncios novos → vendas → listagem → resumo (só HTTP + UI)
  // Modal abre no clique e fecha no finally; mensagem principal vem de `data.message` do backend.
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
    let ordersProcessed = null;
    /** @type {number | null} */
    let salesMaxOrdersLimit = null;
    let salesHttpOk = false;

    try {
      const resListings = await apiFetch(buildApiUrl("/api/ml/sync-listings"), postOpts);
      if (!resListings.ok) {
        finalError =
          resListings.data?.error ||
          resListings.error ||
          "Não foi possível importar anúncios.";
        return;
      }

      const ls = resListings.data?.summary;
      let listingsUserMessage =
        typeof resListings.data?.message === "string" && resListings.data.message.trim() !== ""
          ? resListings.data.message.trim()
          : null;
      if (!listingsUserMessage && ls && typeof ls.new_count === "number" && ls.new_count === 0) {
        listingsUserMessage =
          "Não há anúncios novos na fila de importação; as taxas/repasse serão atualizadas na etapa seguinte.";
      }
      /** Número de anúncios efetivamente persistidos nesta execução (sync-listings). */
      const listingsImportedThisRun =
        ls && typeof ls.imported === "number" && Number.isFinite(ls.imported) ? ls.imported : null;

      /** Sempre regrava marketplace_listing_health (GET /items + listing_prices) — sem isso o modal “Raio-x da venda” continua vazio para anúncios já existentes. */
      setSyncPhase("health");
      let healthBackfillSummary = null;
      const resHealth = await apiFetch(buildApiUrl("/api/ml/backfill-listing-health"), postOpts);
      if (!resHealth.ok) {
        const he =
          resHealth.data?.error ||
          resHealth.error ||
          "Não foi possível gravar taxas/repasse (health) no banco.";
        finalWarning = finalWarning ? `${finalWarning} ${he}` : he;
      } else if (resHealth.data?.summary && typeof resHealth.data.summary === "object") {
        healthBackfillSummary = resHealth.data.summary;
        const uf = Number(healthBackfillSummary.upsert_failures ?? 0);
        const ff = Number(healthBackfillSummary.fetch_failures ?? 0);
        if (uf > 0 || ff > 0) {
          const h = `Health ML: ${uf} gravação(ões) com falha, ${ff} busca(s) de item com falha (ver logs do backend).`;
          finalWarning = finalWarning ? `${finalWarning} ${h}` : h;
        }
      }

      setSyncPhase("sales");
      const resSales = await apiFetch(buildApiUrl("/api/ml/sync-sales"), postOpts);
      salesHttpOk = !!resSales.ok;
      if (!resSales.ok) {
        const w =
          "A sincronização de vendas não pôde ser atualizada agora (catálogo e taxas/repasse podem já estar ok).";
        finalWarning = finalWarning ? `${finalWarning} ${w}` : w;
      } else {
        const ss = resSales.data?.summary;
        if (ss && typeof ss.processed === "number") ordersProcessed = ss.processed;
        else if (ss && typeof ss.scanned === "number") ordersProcessed = ss.scanned;
        if (ss && typeof ss.max_orders_limit === "number" && Number.isFinite(ss.max_orders_limit)) {
          salesMaxOrdersLimit = ss.max_orders_limit;
        }
      }

      setSyncPhase("reload");
      const listingsReloadOk = await fetchListings();
      if (!listingsReloadOk) {
        if (finalWarning) {
          finalError = `${finalWarning} Além disso, não foi possível recarregar a listagem agora.`;
          finalWarning = null;
        } else {
          finalError = "Operação gravada no servidor, mas houve erro ao recarregar a listagem.";
        }
        return;
      }

      const summaryResult = await fetchSalesSummary();
      if (!summaryResult.ok && !summaryResult.skipped && summaryResult.message) {
        finalWarning = finalWarning
          ? `${finalWarning} (${summaryResult.message})`
          : `Operação concluída, mas o resumo de vendas não pôde ser atualizado: ${summaryResult.message}`;
      }

      if (!finalError && !finalWarning) {
        /** Catálogo (import ML) — separado de vendas para não confundir com “pedidos”. */
        let catalogSuccessLine = null;
        if (listingsImportedThisRun !== null) {
          catalogSuccessLine =
            listingsImportedThisRun === 0
              ? "Catálogo ML: 0 anúncios novos importados nesta execução (nada novo na fila ou vitrine já coberta)."
              : `Catálogo ML: ${listingsImportedThisRun} anúncio(s) novo(s) importado(s) nesta execução.`;
        } else if (listingsUserMessage) {
          catalogSuccessLine = `Catálogo ML: ${listingsUserMessage}`;
        }
        if (healthBackfillSummary && typeof healthBackfillSummary.items_processed === "number") {
          const hp = healthBackfillSummary.items_processed;
          const line = `Repasse/taxas ML: ${hp} anúncio(s) com marketplace_listing_health atualizado.`;
          catalogSuccessLine = catalogSuccessLine ? `${catalogSuccessLine}\n\n${line}` : line;
        }
        /** Vendas (sync-sales) — rotina distinta do catálogo. */
        let salesSuccessLine = null;
        if (salesHttpOk && typeof ordersProcessed === "number" && Number.isFinite(ordersProcessed)) {
          salesSuccessLine = `Vendas ML: ${ordersProcessed} pedido(s) processado(s) na sincronização de vendas`;
          if (typeof salesMaxOrdersLimit === "number" && salesMaxOrdersLimit > 0) {
            salesSuccessLine += ` (teto ${salesMaxOrdersLimit} por execução)`;
          }
          salesSuccessLine += ".";
        }
        const blocks = [catalogSuccessLine, salesSuccessLine].filter(Boolean);
        finalSuccess =
          blocks.length > 0 ? blocks.join("\n\n") : "Operação concluída com sucesso.";
      }
    } catch (e) {
      finalError = e?.message || "Não foi possível concluir a operação.";
    } finally {
      setSyncModalOpen(false);
      setSyncLoading(false);
      setSyncPhase("idle");
      setSyncError(finalError);
      setSyncWarningMessage(finalWarning);
      setSyncSuccessMessage(finalSuccess);
    }
  }, [fetchListings, fetchSalesSummary]);

  const handleHealthFeesBackfill = useCallback(async () => {
    const url = buildApiUrl("/api/ml/backfill-listing-health");
    if (!url) {
      setListError("Defina VITE_API_BASE_URL apontando para o backend.");
      return;
    }
    setHealthBackfillLoading(true);
    setListError(null);
    try {
      const res = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {},
      });
      if (!res.ok) {
        const msg = res.data?.error || res.error || "Não foi possível atualizar taxas do Mercado Livre.";
        setListError(msg);
        addNotification({
          event_type: "LISTING_HEALTH_BACKFILL_FAILED",
          entity_type: "marketplace_listing",
          title: "Atualização de taxas",
          message: msg,
          severity: NOTIFICATION_SEVERITY.WARNING,
        });
        return;
      }
      const msg =
        typeof res.data?.message === "string" && res.data.message.trim() !== ""
          ? res.data.message.trim()
          : "Colunas de comissão, frete e promoção foram atualizadas.";
      await fetchListings();
      addNotification({
        event_type: "LISTING_HEALTH_BACKFILL_OK",
        entity_type: "marketplace_listing",
        title: "Taxas do ML atualizadas",
        message: msg,
        severity: NOTIFICATION_SEVERITY.INFO,
      });
    } catch (e) {
      const msg = e?.message || "Erro ao atualizar taxas.";
      setListError(msg);
      addNotification({
        event_type: "LISTING_HEALTH_BACKFILL_FAILED",
        entity_type: "marketplace_listing",
        title: "Atualização de taxas",
        message: msg,
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
    } finally {
      setHealthBackfillLoading(false);
    }
  }, [addNotification, fetchListings]);

  const syncButtonLabel = useMemo(() => {
    if (!syncLoading) return "Importar anúncios";
    return "Importando anúncios…";
  }, [syncLoading]);

  const activeCount = useMemo(
    () => catalogRows.filter((r) => r.statusKey === "active").length,
    [catalogRows]
  );

  const skuPendingCount = useMemo(
    () => catalogRows.filter((r) => r.attentionReason === ATTENTION_REASON_SKU_PENDING_ML).length,
    [catalogRows]
  );

  const totalAdsCount = catalogRows.length;

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

      <SkuInputModal
        open={!!skuModalListing}
        listingId={skuModalListing?.id ?? null}
        listingTitle={skuModalListing?.title ?? ""}
        knownSku={skuModalListing?.knownSku ?? null}
        onClose={closeSkuModal}
        onSaved={handleSkuSaved}
      />

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
              Faturamento bruto importado das vendas (resumo do servidor após importar e atualizar pedidos). Lucro e
              margem dependem de custo interno.
            </p>
          </div>
        </article>

        <div className="anuncios-catalog__kpi-minis" aria-label="Indicadores rápidos">
          <div className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--stat">
            <S7StatCard
              title="SKU pendente"
              value={listLoading ? "…" : String(skuPendingCount)}
              subtitle={
                listLoading ? "Carregando catálogo…" : "Anúncios sem SKU (bloqueando análise)"
              }
              variant="warning"
              iconName="AlertTriangle"
              className="anuncios-catalog__sku-stat-card"
            />
          </div>
          {[
            { key: "sales", label: "Vendas", variant: "sales" },
            { key: "profit", label: "Lucro", variant: "profit" },
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
          <div className="products-catalog__controls-actions anuncios-catalog__sync-actions">
            <S7Button
              variant="secondary"
              iconName="pricing"
              className="products-catalog__new-product-btn"
              disabled={syncLoading || listLoading || healthBackfillLoading}
              loading={healthBackfillLoading}
              loadingLabel="Atualizando taxas…"
              title="Busca no Mercado Livre as taxas de venda (listing_prices), frete do snapshot do anúncio e preço promocional quando existir. Não cria anúncios novos."
              onClick={handleHealthFeesBackfill}
            >
              Atualizar taxas ML
            </S7Button>
            <S7Button
              variant="primary"
              iconName="download"
              className="products-catalog__new-product-btn"
              disabled={syncLoading || listLoading || healthBackfillLoading}
              title="Importa no Suse7 apenas anúncios que ainda não existem; em seguida atualiza vendas no servidor e recarrega a tela."
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
            <button
              type="button"
              className={`products-catalog__filter-chip${adsViewMode === "full" ? " products-catalog__filter-chip--active" : ""}`}
              title={
                adsViewMode === "minimal"
                  ? "Mostra preço, vendas, métricas e demais colunas (mesmo endpoint)."
                  : "Mostra só capa e número do anúncio (diagnóstico)."
              }
              aria-pressed={adsViewMode === "full"}
              onClick={() => setAdsViewMode((m) => (m === "minimal" ? "full" : "minimal"))}
            >
              <span className="products-catalog__filter-chip-label">
                {adsViewMode === "minimal" ? "Vista completa" : "Vista simples"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {syncSuccessMessage ? (
        <div
          className="products-catalog__filter-empty-card anuncios-catalog__sync-feedback--success"
          role="status"
        >
          <p style={{ whiteSpace: "pre-line" }}>{syncSuccessMessage}</p>
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
                "Conecte o Mercado Livre em Perfil → Integrações e use Importar anúncios para trazer a vitrine e, em seguida, atualizar vendas.";
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
              <div
                className={`anuncios-catalog__grid anuncios-catalog__grid--head anuncios-catalog--dense${
                  adsViewMode === "minimal" ? " anuncios-catalog__grid--minimal" : ""
                }`}
              >
                <AdsCatalogHeadCell
                  columnClass="anuncios-catalog__cell--precifica-s7"
                  tip="Simular cenário e publicar preço no marketplace (Precificação inteligente S7)."
                  lines={["Precifica", "S7"]}
                />
                <AdsCatalogHeadCell columnClass="anuncios-catalog__cell--thumb" tip={ADS_COLUMN_TOOLTIPS.cover}>
                  Capa
                </AdsCatalogHeadCell>
                {adsViewMode === "minimal" ? (
                  <>
                    <AdsCatalogHeadCell
                      columnClass="anuncios-catalog__cell--minimal-listing"
                      tip="Número do anúncio, título (link ao ML), marketplace, vínculo com produto quando pendente, SKU e vendas/visitas importadas."
                      tipWrap
                    >
                      Anúncio
                    </AdsCatalogHeadCell>
                    <AdsCatalogHeadCell
                      columnClass="anuncios-catalog__cell--minimal-sell"
                      tip={ADS_COLUMN_TOOLTIPS.sellPor}
                      tipWrap
                      lines={["Você", "vende por"]}
                    />
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              <div className="products-catalog__body">
                {paginatedRows.map((row) => (
                  <AdsCatalogRow
                    key={row.id}
                    row={row}
                    minimal={adsViewMode === "minimal"}
                    onInformSku={(r) => openSkuModal(r)}
                    onListingsRefresh={fetchListings}
                  />
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
