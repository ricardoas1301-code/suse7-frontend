// ======================================================================
// SUSE7 — Helpers da listagem operacional de produtos (catálogo)
// Sem regra de negócio pesada: apenas leitura/normalização para exibição.
// Agregados financeiros: ler campos opcionais do row; fallback 0 até API evoluir.
// Margem: preferir contribution_margin_percent do backend; senão lucro/receita quando receita > 0.
// ======================================================================

/** Acima disso = saudável (verde). Igual ou abaixo até 0 = atenção (amarelo). */
export const CATALOG_MARGIN_HEALTHY_MIN_PCT = 15;

const marginPctFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** @param {unknown} v */
function toFiniteNumber(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Primeiro valor numérico definido na lista (0 é válido). */
function firstDefinedNumber(...vals) {
  for (const v of vals) {
    const n = toFiniteNumber(v);
    if (n != null) return n;
  }
  return null;
}

/** Re-export: miniatura do produto (preferir {@link useProductMainImageSrc} para storage_path). */
export { getProductMainImageUrl, useProductMainImageSrc } from "./productImageDisplayUrl";

/**
 * Estoque exibido: simples = products.stock_quantity; variações = soma stock_quantity das linhas.
 * @param {{ format?: string; stock_quantity?: unknown; product_variants?: { stock_quantity?: unknown }[] }} product
 */
export function getProductStockDisplay(product) {
  const fmt = String(product?.format || "simple").toLowerCase();
  if (fmt === "variants" && Array.isArray(product?.product_variants)) {
    return product.product_variants.reduce((sum, row) => {
      const q = toFiniteNumber(row?.stock_quantity);
      return sum + (q ?? 0);
    }, 0);
  }
  const q = toFiniteNumber(product?.stock_quantity);
  return q ?? 0;
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * @param {unknown} amount — valor em unidade monetária (ex.: reais)
 * @param {{ emptyDash?: boolean }} [opts] — se true e inválido, retorna "—"
 */
export function formatCatalogBRL(amount, opts = {}) {
  const n = toFiniteNumber(amount);
  if (n == null) return opts.emptyDash ? "—" : BRL.format(0);
  return BRL.format(n);
}

/**
 * Métricas operacionais: campos opcionais no row (futuro: view/RPC no Supabase).
 * Nomes candidatos documentados para o backend alinhar depois.
 *
 * @param {Record<string, unknown>} product
 */
export function getProductCatalogMetrics(product) {
  const p = product || {};

  const adsCount = firstDefinedNumber(
    p.ads_linked_count,
    p.listings_count,
    p.linked_ads_count
  );

  const salesCount = firstDefinedNumber(
    p.sales_count,
    p.sales_total_count,
    p.orders_count
  );

  const revenue = firstDefinedNumber(
    p.sales_revenue_brl,
    p.revenue_brl,
    p.total_sold_brl
  );

  const costTotal = firstDefinedNumber(
    p.sales_cost_total_brl,
    p.cost_total_brl,
    p.total_cost_brl
  );

  const explicitProfit = firstDefinedNumber(
    p.gross_profit_brl,
    p.contribution_margin_brl
  );
  let grossProfit = explicitProfit;
  if (grossProfit == null && revenue != null && costTotal != null) {
    grossProfit = revenue - costTotal;
  }
  if (grossProfit == null) grossProfit = 0;

  const marketplaces = normalizeMarketplaceSlugs(p);

  return {
    adsCount: Math.max(0, Math.floor(adsCount ?? 0)),
    salesCount: Math.max(0, Math.floor(salesCount ?? 0)),
    revenue: revenue ?? 0,
    costTotal: costTotal ?? 0,
    grossProfit,
    marketplaces,
  };
}

/**
 * Margem de contribuição (%). Fonte preferencial: colunas do backend;
 * fallback: (lucro / receita) * 100 quando receita > 0.
 * @param {Record<string, unknown>} product
 * @param {ReturnType<typeof getProductCatalogMetrics>} metrics
 * @returns {number | null}
 */
export function getContributionMarginPercent(product, metrics) {
  const p = product || {};
  const explicit = firstDefinedNumber(
    p.contribution_margin_percent,
    p.margin_percent,
    p.contribution_margin_pct
  );
  if (explicit != null) return explicit;

  const rev = metrics?.revenue ?? 0;
  if (rev > 0) {
    const profit = metrics?.grossProfit ?? 0;
    return (profit / rev) * 100;
  }
  return null;
}

/**
 * @param {number | null} marginPct
 * @returns {{ band: 'healthy' | 'warn' | 'loss' | 'unknown'; badgeClass: string; displayPercent: string | null }}
 */
export function getMarginHealthPresentation(marginPct) {
  if (marginPct == null || !Number.isFinite(marginPct)) {
    return {
      band: "unknown",
      badgeClass: "products-catalog__health-badge--unknown",
      displayPercent: null,
    };
  }
  const displayPercent = `${marginPctFormatter.format(marginPct)}%`;
  if (marginPct < 0) {
    return {
      band: "loss",
      badgeClass: "products-catalog__health-badge--loss",
      displayPercent,
    };
  }
  if (marginPct > CATALOG_MARGIN_HEALTHY_MIN_PCT) {
    return {
      band: "healthy",
      badgeClass: "products-catalog__health-badge--healthy",
      displayPercent,
    };
  }
  return {
    band: "warn",
    badgeClass: "products-catalog__health-badge--warn",
    displayPercent,
  };
}

/**
 * @param {Record<string, unknown>} product
 * @returns {string[]}
 */
export function normalizeMarketplaceSlugs(product) {
  const p = product || {};
  const raw = p.linked_marketplaces ?? p.marketplace_slugs ?? p.marketplaces;
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const j = JSON.parse(raw);
      if (Array.isArray(j)) {
        return j.map((x) => String(x).trim().toLowerCase()).filter(Boolean);
      }
    } catch {
      return [raw.trim().toLowerCase()];
    }
    return [raw.trim().toLowerCase()];
  }
  const ch = p.imported_from_channel;
  if (typeof ch === "string" && ch && ch !== "manual") {
    return [ch.trim().toLowerCase()];
  }
  return [];
}

/** @param {string} slug */
export function marketplaceChipLabel(slug) {
  const s = String(slug || "").toLowerCase();
  const map = {
    ml: "ML",
    mercadolivre: "ML",
    meli: "ML",
    mercado_livre: "ML",
    shopee: "Shopee",
    amazon: "Amazon",
    shein: "Shein",
    magalu: "Magalu",
    americanas: "Ame",
    b2w: "B2W",
  };
  if (map[s]) return map[s];
  if (!s) return "?";
  return s.slice(0, 3).toUpperCase();
}
