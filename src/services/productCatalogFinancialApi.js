// ======================================================================
// GET /api/products/catalog-financial — métricas SSOT da listagem Produtos
// ======================================================================

import { apiFetch, buildApiUrl } from "../config/api";
import { ensureAuthSessionBootstrapped, getAuthBootstrapAccessToken } from "../auth/authBootstrapService";

function logCatalogFinancialDev(label, payload) {
  if (!import.meta.env.DEV) return;
  console.info(`[S7][productCatalogFinancialApi] ${label}`, payload);
}

function logCatalogConnectivityDev(label, payload) {
  if (!import.meta.env.DEV) return;
  console.info(`[S7_PRODUCTS_CATALOG_CONNECTIVITY] ${label}`, payload);
}

const CATALOG_FINANCIAL_RETRY_DELAYS_MS = [0, 900, 1800];
const CATALOG_FINANCIAL_CACHE_TTL_MS = 45_000;

/** @type {{ key: string; expiresAt: number; value: any } | null} */
let catalogFinancialCacheEntry = null;
/** @type {{ key: string; promise: Promise<any> } | null} */
let catalogFinancialInflightEntry = null;

function cloneFinancialResult(result) {
  return {
    ...result,
    byProductId: { ...(result?.byProductId ?? {}) },
    adsLinkedCountByProductId: { ...(result?.adsLinkedCountByProductId ?? {}) },
  };
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
  logCatalogConnectivityDev("vite_api_base_url", {
    vite_api_base_url: import.meta.env.VITE_API_BASE_URL ?? "",
  });
  logCatalogConnectivityDev("resolved_catalog_financial_url", {
    url: base,
  });
  if (!base) {
    logCatalogFinancialDev("abort_no_api_base", {});
    logCatalogConnectivityDev("request_error", {
      is_network_error: true,
      is_http_error: false,
      error_name: "MissingApiBaseUrl",
      error_message: "VITE_API_BASE_URL não configurada.",
    });
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
  const requestKey = `${base}::${Boolean(tokenPreview)}::${tokenPreview ? String(tokenPreview).slice(0, 16) : ""}`;

  if (catalogFinancialCacheEntry && catalogFinancialCacheEntry.key === requestKey) {
    const cacheRemaining = catalogFinancialCacheEntry.expiresAt - Date.now();
    if (cacheRemaining > 0) {
      logCatalogConnectivityDev("cache_hit", {
        cache_ttl_ms_remaining: cacheRemaining,
      });
      return cloneFinancialResult(catalogFinancialCacheEntry.value);
    }
  }

  if (catalogFinancialInflightEntry && catalogFinancialInflightEntry.key === requestKey) {
    logCatalogConnectivityDev("inflight_join", {});
    const joined = await catalogFinancialInflightEntry.promise;
    return cloneFinancialResult(joined);
  }

  const runFetch = async () => {
    let lastError = null;

    for (let attempt = 1; attempt <= CATALOG_FINANCIAL_RETRY_DELAYS_MS.length; attempt += 1) {
      const retryDelayMs = CATALOG_FINANCIAL_RETRY_DELAYS_MS[attempt - 1] ?? 0;
      if (retryDelayMs > 0) {
        logCatalogConnectivityDev("retry_scheduled", { retry_attempt: attempt, retry_delay_ms: retryDelayMs });
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }

      const startedAt = Date.now();
      logCatalogFinancialDev("request_start", {
        url: base,
        hasToken: Boolean(tokenPreview),
        tokenLength: tokenPreview ? String(tokenPreview).length : 0,
        attempt,
      });
      logCatalogConnectivityDev("request_start", {
        retry_attempt: attempt,
        has_token: Boolean(tokenPreview),
        url: base,
      });

      const res = await apiFetch(base, { method: "GET", timeoutMs: 90_000 });
      const elapsedMs = Date.now() - startedAt;

      logCatalogFinancialDev("request_end", {
        url: base,
        elapsedMs,
        ok: res.ok,
        status: res.status,
        timedOut: Boolean(res.timedOut),
        connectionError: Boolean(res.connectionError),
        error: res.error ?? null,
        attempt,
      });
      logCatalogConnectivityDev("request_status", {
        retry_attempt: attempt,
        status: res.status,
        request_duration_ms: elapsedMs,
        is_network_error: Boolean(res.connectionError),
        is_http_error: Boolean(res.status && res.status >= 400),
        timed_out: Boolean(res.timedOut),
        error_name: res.errorName ?? null,
        error_message: res.errorMessage ?? res.error ?? null,
      });

      if (!res.ok) {
        lastError = res;
        const retryable = Boolean(res.connectionError) || res.status === 0 || res.status === 401;
        if (retryable && attempt < CATALOG_FINANCIAL_RETRY_DELAYS_MS.length) {
          continue;
        }
        logCatalogConnectivityDev("retry_exhausted", {
          retry_attempt: attempt,
          status: res.status,
          is_network_error: Boolean(res.connectionError),
          error_message: res.error ?? null,
        });
        return {
          ok: false,
          byProductId: {},
          adsLinkedCountByProductId: {},
          error: res.error ?? "Não foi possível carregar métricas financeiras do catálogo.",
          status: res.status,
          timedOut: Boolean(res.timedOut),
          connectionError: Boolean(res.connectionError),
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
        attempt,
      });
      logCatalogConnectivityDev("request_status", {
        retry_attempt: attempt,
        status: res.status,
        request_duration_ms: elapsedMs,
        rows_count: Object.keys(byProductId).length,
        is_network_error: false,
        is_http_error: false,
      });

      const successResult = {
        ok: true,
        byProductId,
        adsLinkedCountByProductId,
        status: res.status,
        elapsedMs,
      };

      catalogFinancialCacheEntry = {
        key: requestKey,
        expiresAt: Date.now() + CATALOG_FINANCIAL_CACHE_TTL_MS,
        value: cloneFinancialResult(successResult),
      };

      return successResult;
    }

    const fallbackError = lastError ?? {};
    return {
      ok: false,
      byProductId: {},
      adsLinkedCountByProductId: {},
      error:
        fallbackError.error ?? "Não foi possível carregar métricas financeiras do catálogo.",
      status: fallbackError.status ?? 0,
      timedOut: Boolean(fallbackError.timedOut),
      connectionError: Boolean(fallbackError.connectionError),
    };
  };

  const runPromise = runFetch();
  catalogFinancialInflightEntry = { key: requestKey, promise: runPromise };
  try {
    return await runPromise;
  } finally {
    if (catalogFinancialInflightEntry?.promise === runPromise) {
      catalogFinancialInflightEntry = null;
    }
  }
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
    if (fin.net_received_brl != null) base.net_received_brl = fin.net_received_brl;
    if (fin.you_receive_brl != null) base.you_receive_brl = fin.you_receive_brl;
  }

  return base;
}
