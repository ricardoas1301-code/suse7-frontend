// ======================================================================
// GET /api/sales/executive-summary — métricas executivas P_2.1.2 / P_2.1.3
// ======================================================================

import { buildApiUrl, apiFetch } from "../config/api";

/**
 * @typedef {{
 *   marketplace?: string;
 *   marketplace_account_id?: string;
 *   seller_company_id?: string;
 *   q?: string;
 *   filter?: string;
 *   period_preset?: string;
 *   start_date?: string;
 *   end_date?: string;
 *   start_datetime?: string;
 *   end_datetime?: string;
 *   period_start?: string;
 *   period_end?: string;
 *   ranking_limit?: number;
 * }} SalesExecutiveSummaryParams
 */

/**
 * @param {SalesExecutiveSummaryParams | null | undefined} params
 * @returns {URLSearchParams}
 */
export function buildSalesExecutiveSummaryQuery(params) {
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
  if (p.q != null && String(p.q).trim() !== "") {
    qs.set("q", String(p.q).trim());
  }
  if (p.filter != null && String(p.filter).trim() !== "" && String(p.filter).trim() !== "all") {
    qs.set("filter", String(p.filter).trim());
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
  const startDatetime =
    p.start_datetime != null && String(p.start_datetime).trim() !== ""
      ? String(p.start_datetime).trim()
      : null;
  const endDatetime =
    p.end_datetime != null && String(p.end_datetime).trim() !== ""
      ? String(p.end_datetime).trim()
      : null;
  if (startDatetime) qs.set("start_datetime", startDatetime);
  if (endDatetime) qs.set("end_datetime", endDatetime);
  if (p.ranking_limit != null && Number.isFinite(Number(p.ranking_limit))) {
    qs.set("ranking_limit", String(Math.min(10, Math.max(1, Math.floor(Number(p.ranking_limit))))));
  }

  return qs;
}

/**
 * @param {SalesExecutiveSummaryParams | null | undefined} params
 * @returns {string | null}
 */
export function buildSalesExecutiveSummaryUrl(params) {
  const base = buildApiUrl("/api/sales/executive-summary");
  if (!base) return null;
  const qs = buildSalesExecutiveSummaryQuery(params);
  const query = qs.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * @param {SalesExecutiveSummaryParams | null | undefined} [params]
 * @returns {Promise<{ ok: boolean; data?: Record<string, unknown> | null; error?: string; status: number }>}
 */
export async function fetchSalesExecutiveSummary(params) {
  const url = buildSalesExecutiveSummaryUrl(params);
  if (!url) {
    return { ok: false, error: "Configure VITE_API_BASE_URL.", status: 0, data: null };
  }

  if (import.meta.env.DEV) {
    console.info("[Suse7][API sales executive-summary]", {
      url,
      period_preset: params?.period_preset ?? null,
      ranking_limit: params?.ranking_limit ?? null,
      marketplace: params?.marketplace ?? null,
      marketplace_account_id: params?.marketplace_account_id ?? null,
      q: params?.q ?? null,
      filter: params?.filter ?? null,
    });
  }

  const res = await apiFetch(url, { method: "GET", timeoutMs: 45000 });
  if (!res.ok) {
    if (import.meta.env.DEV) {
      console.warn("[Suse7][API sales executive-summary] failed", {
        status: res.status,
        timedOut: Boolean(res.timedOut),
        error: res.error ?? null,
      });
    }
    return {
      ok: false,
      error: res.error ?? "Não foi possível carregar o resumo executivo.",
      status: res.status,
      data: res.data ?? null,
      timedOut: Boolean(res.timedOut),
    };
  }

  const data = res.data != null && typeof res.data === "object" ? res.data : null;
  if (data?.ok !== true) {
    if (import.meta.env.DEV) {
      console.warn("[Suse7][API sales executive-summary] invalid payload", {
        status: res.status,
        data,
      });
    }
    return {
      ok: false,
      error:
        data?.error != null && String(data.error).trim() !== ""
          ? String(data.error)
          : "Resposta inválida do resumo executivo.",
      status: res.status,
      data,
      timedOut: Boolean(res.timedOut),
    };
  }

  if (import.meta.env.DEV) {
    console.info("[Suse7][API sales executive-summary] ok", {
      status: res.status,
      ordersCount: data.summary?.orders_count ?? null,
      listingsCount: Array.isArray(data.rankings?.listings_by_quantity)
        ? data.rankings.listings_by_quantity.length
        : Array.isArray(data.rankings?.listings)
          ? data.rankings.listings.length
          : 0,
      truncatedScan: Boolean(data.truncated_scan),
    });
  }

  return { ok: true, data, status: res.status, timedOut: false };
}
