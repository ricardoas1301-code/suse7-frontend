// ======================================================================
// Resolvers de bucket — paridade listingHealthBucketEngine (backend).
// ======================================================================

import Decimal from "decimal.js";
import { LISTING_HEALTH_CRITICAL_STOCK_THRESHOLD } from "./listingHealthConstants.js";
import { normalizarSnapshotSaudeAnuncioDaLinha } from "./normalizeListingHealthSnapshotFromCatalogRow.js";

/** @param {unknown} raw */
function toDecimalOrNull(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  try {
    const dec = new Decimal(String(raw).trim().replace(",", "."));
    return dec.isFinite() ? dec : null;
  } catch {
    return null;
  }
}

/** @param {unknown} rawScore */
export function normalizarScoreQualidadeCadastro(rawScore) {
  if (rawScore == null || String(rawScore).trim() === "") {
    return { score: 0, has_score: false };
  }
  const n = Number(rawScore);
  if (!Number.isFinite(n)) return { score: 0, has_score: false };
  if (n > 0 && n <= 1) {
    return { score: Math.max(0, Math.min(100, Math.round(n * 100))), has_score: true };
  }
  return { score: Math.max(0, Math.min(100, Math.round(n))), has_score: true };
}

/** @param {number} score */
export function resolverChaveFaixaScoreCadastro(score) {
  if (score === 100) return "complete";
  if (score >= 90) return "excellent";
  if (score >= 70) return "attention";
  if (score >= 50) return "critical";
  return "urgent";
}

/**
 * @param {{
 *   status_normalized?: string;
 *   status?: string | null;
 *   available_quantity?: number | null;
 * }} snapshot
 */
export function classificarEstoqueOperacional(snapshot) {
  const qty = snapshot.available_quantity;
  if (qty == null) {
    return { is_zero_stock: false, is_critical_stock: false, stock_health: "unknown" };
  }
  if (qty <= 0) {
    return { is_zero_stock: true, is_critical_stock: false, stock_health: "zero" };
  }
  if (qty <= LISTING_HEALTH_CRITICAL_STOCK_THRESHOLD) {
    return { is_zero_stock: false, is_critical_stock: true, stock_health: "critical" };
  }
  return { is_zero_stock: false, is_critical_stock: false, stock_health: "healthy" };
}

/**
 * @param {{
 *   status_normalized?: string;
 *   status?: string | null;
 *   available_quantity?: number | null;
 * }} snapshot
 */
export function resolverChaveBucketOperacionalExclusivo(snapshot) {
  const status =
    snapshot.status_normalized != null ? String(snapshot.status_normalized) : "unknown";
  const rawStatus = String(snapshot.status ?? "")
    .trim()
    .toLowerCase();
  const stock = classificarEstoqueOperacional(snapshot);

  if (
    status === "inactive" ||
    rawStatus === "closed" ||
    rawStatus === "not_yet_active" ||
    rawStatus === "deleted"
  ) {
    return "inactive";
  }

  if (
    status === "paused" ||
    rawStatus === "under_review" ||
    rawStatus === "pending" ||
    rawStatus === "waiting_for_patch" ||
    rawStatus === "payment_required"
  ) {
    return "paused";
  }

  if (stock.is_zero_stock) return "zero_stock";
  if (stock.is_critical_stock) return "critical_stock";
  if (status === "active") return "active";

  return "inactive";
}

/**
 * @param {{
 *   profit_margin_percent?: string | number | null;
 *   profit_brl?: string | number | null;
 *   gross_revenue_brl?: string | number | null;
 * }} snapshot
 */
export function resolverMargemHistoricaAnuncio(snapshot) {
  const marginFromField = toDecimalOrNull(snapshot.profit_margin_percent);
  if (marginFromField != null) return marginFromField;

  const profit = toDecimalOrNull(snapshot.profit_brl);
  const gross = toDecimalOrNull(snapshot.gross_revenue_brl);
  if (profit != null && gross != null && !gross.isZero()) {
    return profit.div(gross).mul(100);
  }
  return null;
}

/** @param {import("decimal.js").Decimal} marginDec */
export function resolverChaveFaixaMargemComercial(marginDec) {
  if (marginDec.isNegative()) return "negative_margin";
  if (marginDec.gte(30)) return "excellent_margin";
  if (marginDec.gte(20)) return "healthy_margin";
  if (marginDec.gte(10)) return "attention_margin";
  return "critical_margin";
}

/**
 * @param {{
 *   status_normalized?: string;
 *   sales_count?: number;
 *   profit_margin_percent?: string | number | null;
 *   profit_brl?: string | number | null;
 *   gross_revenue_brl?: string | number | null;
 * }} snapshot
 */
export function resolverChaveBucketComercialExclusivo(snapshot) {
  const sales = Number(snapshot.sales_count ?? 0);
  const hasSales = Number.isFinite(sales) && sales > 0;
  if (!hasSales) return "no_commercial_data";

  const marginDec = resolverMargemHistoricaAnuncio(snapshot);
  if (marginDec == null) return "no_commercial_data";

  return resolverChaveFaixaMargemComercial(marginDec);
}

/**
 * @param {{
 *   health_score?: number | null;
 *   listing_quality_score?: number | null;
 * }} snapshot
 */
export function resolverChaveBucketCadastroExclusivo(snapshot) {
  const rawScore = snapshot.listing_quality_score ?? snapshot.health_score;
  const { score } = normalizarScoreQualidadeCadastro(rawScore);
  return resolverChaveFaixaScoreCadastro(score);
}

/**
 * @param {{
 *   status_normalized?: string;
 *   sales_count?: number;
 * }} snapshot
 */
export function anuncioAtivoSemVendaHistorica(snapshot) {
  if (snapshot.status_normalized !== "active") return false;
  const sales = Number(snapshot.sales_count ?? 0);
  return !Number.isFinite(sales) || sales <= 0;
}

/**
 * @param {{
 *   status_normalized?: string;
 *   sales_count?: number;
 * }} snapshot
 */
export function anuncioAtivoComVendaHistorica(snapshot) {
  if (snapshot.status_normalized !== "active") return false;
  const sales = Number(snapshot.sales_count ?? 0);
  return Number.isFinite(sales) && sales > 0;
}

/**
 * @param {ReturnType<typeof normalizarSnapshotSaudeAnuncioDaLinha>} snapshot
 */
export function classificarSaudeCadastro(snapshot) {
  const score = snapshot.health_score;
  if (score == null) {
    return {
      band: "unknown",
      needs_improvement: !snapshot.is_product_ready || snapshot.pending_goals_count > 0,
    };
  }
  if (score >= 90 && snapshot.is_product_ready) {
    return { band: "healthy", needs_improvement: score < 100 || snapshot.pending_goals_count > 0 };
  }
  if (score >= 70) {
    return { band: "attention", needs_improvement: true };
  }
  return { band: "critical", needs_improvement: true };
}

/**
 * @param {ReturnType<typeof normalizarSnapshotSaudeAnuncioDaLinha>} snapshot
 */
export function classificarSaudeComercial(snapshot) {
  const profitDec = toDecimalOrNull(snapshot.profit_brl);
  const marginDec = toDecimalOrNull(snapshot.profit_margin_percent);
  const sales = snapshot.sales_count ?? 0;
  const isActive = snapshot.status_normalized === "active";

  const hasNegativeProfit = profitDec != null && profitDec.isNegative();
  const hasCriticalMargin =
    marginDec != null && marginDec.gte(0) && marginDec.lt(10) && sales > 0;
  const activeWithoutSales = isActive && sales === 0;

  return {
    has_negative_profit: hasNegativeProfit,
    has_critical_margin: hasCriticalMargin,
    active_without_sales: activeWithoutSales,
  };
}

/**
 * @param {ReturnType<typeof normalizarSnapshotSaudeAnuncioDaLinha>} snapshot
 */
export function classificarSaudeOperacional(snapshot) {
  const stock = classificarEstoqueOperacional(snapshot);
  const status = snapshot.status_normalized;

  let severity = "healthy";
  if (stock.is_zero_stock) severity = "critical";
  else if (status === "inactive" || status === "paused") severity = "critical";
  else if (stock.is_critical_stock) severity = "attention";
  else if (status === "unknown") severity = "attention";

  return { severity, ...stock };
}

/**
 * Motor único — paridade Dashboard (Precisam atenção).
 * @param {ReturnType<typeof normalizarSnapshotSaudeAnuncioDaLinha>} snapshot
 */
export function anuncioPrecisaAtencao(snapshot) {
  const cadastro = classificarSaudeCadastro(snapshot);
  const operacional = classificarSaudeOperacional(snapshot);
  const comercial = classificarSaudeComercial(snapshot);

  return (
    cadastro.needs_improvement ||
    snapshot.pending_goals_count > 0 ||
    snapshot.needs_attention_flag === true ||
    snapshot.sku_pending === true ||
    operacional.severity !== "healthy" ||
    comercial.has_negative_profit ||
    comercial.has_critical_margin ||
    comercial.active_without_sales
  );
}

/**
 * @param {Record<string, unknown>} row
 */
export function montarBucketsSaudeAnuncioDaLinha(row) {
  const snapshot = normalizarSnapshotSaudeAnuncioDaLinha(row);
  const operational = resolverChaveBucketOperacionalExclusivo(snapshot);

  return {
    registration: resolverChaveBucketCadastroExclusivo(snapshot),
    operational,
    commercial: resolverChaveBucketComercialExclusivo(snapshot),
    needs_attention: anuncioPrecisaAtencao(snapshot),
    active_with_sales: anuncioAtivoComVendaHistorica(snapshot),
    active_without_sales: anuncioAtivoSemVendaHistorica(snapshot),
    is_active_listing: snapshot.status_normalized === "active",
    is_offline: operational === "paused" || operational === "inactive",
  };
}
