// ======================================================================
// GET /api/products/catalog-financial — métricas SSOT da listagem Produtos
// ======================================================================

import { apiFetch, buildApiUrl } from "../config/api";
import { ensureAuthSessionBootstrapped, getAuthBootstrapAccessToken } from "../auth/authBootstrapService";

function logCatalogFinancialDev(label, payload) {
  if (!import.meta.env.DEV) return;
  console.info(`[S7][productCatalogFinancialApi] ${label}`, payload);
}

/**
 * @returns {Promise<{
 *   ok: boolean;
 *   byProductId: Record<string, Record<string, unknown>>;
 *   adsLinkedCountByProductId: Record<string, number>;
 *   error?: string;
 *   status: number;
 * }>}
 */
export async function fetchProductCatalogFinancial() {
  const base = buildApiUrl("/api/products/catalog-financial");
  if (!base) {
    logCatalogFinancialDev("abort_no_api_base", {});
    return {
      ok: false,
      byProductId: {},
      adsLinkedCountByProductId: {},
      error: "Configure VITE_API_BASE_URL.",
      status: 0,
    };
  }

  await ensureAuthSessionBootstrapped();
  const tokenPreview = getAuthBootstrapAccessToken();
  const startedAt = Date.now();
  logCatalogFinancialDev("request_start", {
    url: base,
    hasToken: Boolean(tokenPreview),
    tokenLength: tokenPreview ? String(tokenPreview).length : 0,
  });

  const res = await apiFetch(base, { method: "GET", timeoutMs: 300000 });
  const elapsedMs = Date.now() - startedAt;

  logCatalogFinancialDev("request_end", {
    url: base,
    elapsedMs,
    ok: res.ok,
    status: res.status,
    timedOut: Boolean(res.timedOut),
    connectionError: Boolean(res.connectionError),
    error: res.error ?? null,
  });

  if (!res.ok) {
    return {
      ok: false,
      byProductId: {},
      adsLinkedCountByProductId: {},
      error: res.error ?? "Não foi possível carregar métricas financeiras do catálogo.",
      status: res.status,
      timedOut: Boolean(res.timedOut),
    };
  }

  const data = res.data != null && typeof res.data === "object" ? res.data : null;
  if (data?.ok !== true) {
    logCatalogFinancialDev("invalid_payload", { status: res.status, dataOk: data?.ok });
    return {
      ok: false,
      byProductId: {},
      adsLinkedCountByProductId: {},
      error: "Resposta inválida do catálogo financeiro.",
      status: res.status,
    };
  }

  const byProductId =
    data.by_product_id != null && typeof data.by_product_id === "object"
      ? /** @type {Record<string, Record<string, unknown>>} */ (data.by_product_id)
      : {};

  const adsLinkedCountByProductId =
    data.ads_linked_count_by_product_id != null &&
    typeof data.ads_linked_count_by_product_id === "object"
      ? /** @type {Record<string, number>} */ (data.ads_linked_count_by_product_id)
      : {};

  logCatalogFinancialDev("payload_parsed", {
    elapsedMs,
    source: data.source ?? null,
    financialCount: Object.keys(byProductId).length,
    adsCount: Object.keys(adsLinkedCountByProductId).length,
    sampleProductIds: Object.keys(byProductId).slice(0, 3),
  });

  return {
    ok: true,
    byProductId,
    adsLinkedCountByProductId,
    status: res.status,
    elapsedMs,
  };
}

/**
 * Enriquece rows do catálogo com métricas SSOT (sem recalcular lucro/margem/ticket).
 * @param {Record<string, unknown>} product
 * @param {Record<string, Record<string, unknown>>} byProductId
 * @param {Record<string, number>} adsLinkedCountByProductId
 */
export function mergeProductCatalogFinancialRow(product, byProductId, adsLinkedCountByProductId) {
  const base = product && typeof product === "object" ? { ...product } : {};
  const pid = base.id != null ? String(base.id).trim() : "";
  if (!pid) return base;

  const fin = byProductId[pid];
  const adsFromDb = adsLinkedCountByProductId[pid];

  if (adsFromDb != null && Number.isFinite(Number(adsFromDb))) {
    base.ads_linked_count = Math.max(0, Math.floor(Number(adsFromDb)));
  }

  if (fin && typeof fin === "object") {
    if (fin.quantity_sold != null) base.sales_count = fin.quantity_sold;
    if (fin.gross_sales_brl != null) base.sales_revenue_brl = fin.gross_sales_brl;
    if (fin.average_ticket_brl != null) base.average_ticket_brl = fin.average_ticket_brl;
    if (fin.contribution_profit_brl != null) base.gross_profit_brl = fin.contribution_profit_brl;
    if (fin.contribution_margin_percent != null) {
      base.contribution_margin_percent = fin.contribution_margin_percent;
    }
  }

  return base;
}
