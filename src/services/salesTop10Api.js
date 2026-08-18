// ======================================================================
// GET /api/sales/top10 — rankings leves (controles próprios do bloco Top 10).
// ======================================================================

import { buildApiUrl, apiFetch } from "../config/api";

/** @type {Map<string, Promise<{ ok: boolean; data?: Record<string, unknown> | null; error?: string; status: number; timedOut?: boolean; aborted?: boolean }>>} */
const inFlightTop10ByKey = new Map();

/**
 * @typedef {{
 *   marketplace?: string;
 *   marketplace_account_id?: string;
 *   seller_company_id?: string;
 *   period_preset?: string;
 *   start_date?: string;
 *   end_date?: string;
 *   start_datetime?: string;
 *   end_datetime?: string;
 *   period_start?: string;
 *   period_end?: string;
 *   ranking_limit?: number;
 * }} SalesTop10Params
 */

/**
 * @param {SalesTop10Params | null | undefined} params
 * @returns {URLSearchParams}
 */
export function buildSalesTop10Query(params) {
  const qs = new URLSearchParams();
  const p = params ?? {};

  if (p.marketplace != null && String(p.marketplace).trim() !== "") {
    qs.set("marketplace", String(p.marketplace).trim());
  }
  if (p.marketplace_account_id != null && String(p.marketplace_account_id).trim() !== "") {
    qs.set("marketplace_account_id", String(p.marketplace_account_id).trim());
  }
  if (p.seller_company_id != null && String(p.seller_company_id).trim() !== "") {
    qs.set("seller_company_id", String(p.seller_company_id).trim());
  }
  if (p.period_preset != null && String(p.period_preset).trim() !== "") {
    qs.set("period_preset", String(p.period_preset).trim());
  }
  const startDate =
    p.start_date != null && String(p.start_date).trim() !== ""
      ? String(p.start_date).trim()
      : p.period_start != null && String(p.period_start).trim() !== ""
        ? String(p.period_start).trim()
        : null;
  const endDate =
    p.end_date != null && String(p.end_date).trim() !== ""
      ? String(p.end_date).trim()
      : p.period_end != null && String(p.period_end).trim() !== ""
        ? String(p.period_end).trim()
        : null;
  if (startDate) qs.set("start_date", startDate);
  if (endDate) qs.set("end_date", endDate);
  if (p.start_datetime != null && String(p.start_datetime).trim() !== "") {
    qs.set("start_datetime", String(p.start_datetime).trim());
  }
  if (p.end_datetime != null && String(p.end_datetime).trim() !== "") {
    qs.set("end_datetime", String(p.end_datetime).trim());
  }
  if (p.ranking_limit != null && Number.isFinite(Number(p.ranking_limit))) {
    qs.set("ranking_limit", String(Math.min(10, Math.max(1, Math.floor(Number(p.ranking_limit))))));
  }

  return qs;
}

/**
 * @param {SalesTop10Params | null | undefined} params
 */
export function buildSalesTop10QueryKey(params) {
  const p = params ?? {};
  const parts = [
    ["marketplace", p.marketplace ?? ""],
    ["marketplace_account_id", p.marketplace_account_id ?? ""],
    ["seller_company_id", p.seller_company_id ?? ""],
    ["period_preset", p.period_preset ?? ""],
    ["start_date", p.start_date ?? p.period_start ?? ""],
    ["end_date", p.end_date ?? p.period_end ?? ""],
    ["start_datetime", p.start_datetime ?? ""],
    ["end_datetime", p.end_datetime ?? ""],
    ["ranking_limit", p.ranking_limit ?? ""],
  ];
  return parts.map(([k, v]) => `${k}=${String(v).trim()}`).join("&");
}

/**
 * @param {SalesTop10Params | null | undefined} params
 */
export function buildSalesTop10Url(params) {
  const base = buildApiUrl("/api/sales/top10");
  if (!base) return null;
  const qs = buildSalesTop10Query(params);
  const query = qs.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * @param {SalesTop10Params | null | undefined} [params]
 * @param {{ signal?: AbortSignal; dedupe?: boolean }} [options]
 */
export async function fetchSalesTop10(params, options = {}) {
  const queryKey = buildSalesTop10QueryKey(params);
  const useDedupe = options.dedupe !== false;

  if (useDedupe) {
    const existing = inFlightTop10ByKey.get(queryKey);
    if (existing) {
      if (import.meta.env.DEV) {
        console.info("[Suse7][API sales top10] dedupe in-flight", { query_key: queryKey });
      }
      const shared = await existing;
      if (options.signal?.aborted) {
        return {
          ok: false,
          error: "Requisição cancelada.",
          status: 499,
          data: null,
          timedOut: false,
          aborted: true,
        };
      }
      return shared;
    }
  }

  const promise = fetchSalesTop10Once(params).finally(() => {
    if (inFlightTop10ByKey.get(queryKey) === promise) {
      inFlightTop10ByKey.delete(queryKey);
    }
  });

  if (useDedupe) {
    inFlightTop10ByKey.set(queryKey, promise);
  }

  const result = await promise;
  if (options.signal?.aborted) {
    return {
      ok: false,
      error: "Requisição cancelada.",
      status: 499,
      data: null,
      timedOut: false,
      aborted: true,
    };
  }
  return result;
}

async function fetchSalesTop10Once(params) {
  const url = buildSalesTop10Url(params);
  if (!url) {
    return { ok: false, error: "Configure VITE_API_BASE_URL.", status: 0, data: null };
  }

  if (import.meta.env.DEV) {
    console.info("[Suse7][API sales top10]", {
      url,
      query_key: buildSalesTop10QueryKey(params),
    });
  }

  const res = await apiFetch(url, { method: "GET", timeoutMs: 45000 });
  if (!res.ok) {
    if (res.aborted) {
      return {
        ok: false,
        error: res.error ?? "Requisição cancelada.",
        status: res.status,
        data: null,
        timedOut: false,
        aborted: true,
      };
    }
    const errMsg = res.timedOut
      ? "Tempo esgotado ao carregar o Top 10."
      : res.error ?? "Não foi possível carregar o Top 10.";
    return {
      ok: false,
      error: errMsg,
      status: res.status,
      data: res.data ?? null,
      timedOut: Boolean(res.timedOut),
    };
  }

  const data = res.data != null && typeof res.data === "object" ? res.data : null;
  if (data?.ok !== true) {
    return {
      ok: false,
      error:
        data?.error != null && String(data.error).trim() !== ""
          ? String(data.error)
          : "Resposta inválida do Top 10.",
      status: res.status,
      data,
      timedOut: false,
    };
  }

  if (import.meta.env.DEV) {
    console.info("[Suse7][API sales top10] ok", {
      status: res.status,
      ordersCount: data.summary?.orders_count ?? null,
      listingsByQty: Array.isArray(data.rankings?.listings_by_quantity)
        ? data.rankings.listings_by_quantity.length
        : 0,
      cacheHit: Boolean(data.cache_hit),
    });
  }

  return { ok: true, data, status: res.status, timedOut: false };
}

/** Limpa dedupe in-flight (testes). */
export function resetSalesTop10InFlightDedupe() {
  inFlightTop10ByKey.clear();
}
