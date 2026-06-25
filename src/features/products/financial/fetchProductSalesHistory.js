// ======================================================================
// Histórico de vendas do produto — GET /api/sales?product_id=
// Registros oficiais consolidados; sem recálculo no frontend.
// ======================================================================

import { apiFetch, buildApiUrl } from "../../../config/api";
import { sortVendasReportDetailRows } from "../../vendas/reports/share/fetchVendasReportDetailRows.js";

/**
 * @param {{
 *   productId: string;
 *   page?: number;
 *   pageSize?: number;
 * }} input
 */
export async function fetchProductSalesHistory({ productId, page = 1, pageSize = 20 }) {
  const pid = productId != null ? String(productId).trim() : "";
  if (!pid) {
    return { ok: false, error: "product_id inválido", rows: [], total: 0, totalPages: 1 };
  }

  const listBase = buildApiUrl("/api/sales");
  if (!listBase) {
    return { ok: false, error: "API base não configurada", rows: [], total: 0, totalPages: 1 };
  }

  const qs = new URLSearchParams();
  qs.set("product_id", pid);
  qs.set("page", String(Math.max(1, page)));
  qs.set("page_size", String(Math.min(100, Math.max(1, pageSize))));

  const res = await apiFetch(`${listBase}?${qs.toString()}`, { method: "GET" });
  if (!res.ok) {
    return {
      ok: false,
      error: res.error ?? res.data?.message ?? "Erro ao carregar histórico de vendas",
      rows: [],
      total: 0,
      totalPages: 1,
    };
  }

  const rows = sortVendasReportDetailRows(Array.isArray(res.data?.rows) ? res.data.rows : []);
  const rawTotal = res.data?.pagination?.total ?? res.data?.total ?? 0;
  const total =
    typeof rawTotal === "number" && Number.isFinite(rawTotal)
      ? Math.max(0, Math.floor(rawTotal))
      : Number.parseInt(String(rawTotal ?? ""), 10) || 0;
  const apiTp = res.data?.pagination?.total_pages ?? res.data?.total_pages;
  const derivedTp = total <= 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const totalPages =
    typeof apiTp === "number" && Number.isFinite(apiTp) && apiTp >= 1 ? Math.floor(apiTp) : derivedTp;

  return { ok: true, rows, total, totalPages, error: null };
}

/**
 * @param {Record<string, unknown> | null | undefined} rankings
 * @returns {Map<string, Record<string, unknown>>}
 */
export function buildListingFinancialMetricsLookup(rankings) {
  /** @type {Map<string, Record<string, unknown>>} */
  const map = new Map();
  if (!rankings || typeof rankings !== "object") return map;

  const lists = [
    rankings.listings,
    rankings.listings_by_quantity,
    rankings.listings_by_gross_revenue,
    rankings.listings_by_net_profit,
  ];

  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (!raw || typeof raw !== "object") continue;
      const row = /** @type {Record<string, unknown>} */ (raw);
      const marketplace = row.marketplace != null ? String(row.marketplace).trim().toLowerCase() : "";
      const ext =
        row.external_listing_id != null
          ? String(row.external_listing_id).trim()
          : row.listing_id != null
            ? String(row.listing_id).trim()
            : "";
      if (!ext) continue;
      const key = `${marketplace || "mkt"}::${ext}`;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, row);
        continue;
      }
      map.set(key, { ...prev, ...row });
    }
  }

  return map;
}

/**
 * @param {Map<string, Record<string, unknown>>} lookup
 * @param {string} marketplace
 * @param {string} externalListingId
 */
export function pickListingFinancialMetrics(lookup, marketplace, externalListingId) {
  const mkt = String(marketplace ?? "").trim().toLowerCase();
  const ext = String(externalListingId ?? "").trim();
  if (!ext) return null;
  return lookup.get(`${mkt || "mkt"}::${ext}`) ?? lookup.get(`mkt::${ext}`) ?? null;
}
