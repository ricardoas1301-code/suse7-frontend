import { apiFetch, buildApiUrl } from "../../../config/api";
import { sortVendasReportDetailRows } from "../../vendas/reports/share/fetchVendasReportDetailRows.js";
import {
  extrairListingIdDaVenda,
  normalizarListingIdParaMatch,
} from "./listingIdentity.js";

/**
 * @param {{
 *   listingId: string;
 *   marketplace?: string | null | undefined;
 *   marketplaceAccountId?: string | null | undefined;
 *   page?: number;
 *   pageSize?: number;
 * }} input
 */
export async function fetchListingSalesHistory({
  listingId,
  marketplace = null,
  marketplaceAccountId = null,
  page = 1,
  pageSize = 20,
}) {
  const listingIdNorm = String(listingId ?? "").trim();
  if (!listingIdNorm) {
    return { ok: false, error: "listing_id inválido", rows: [], total: 0, totalPages: 1 };
  }

  const listBase = buildApiUrl("/api/sales");
  if (!listBase) {
    return { ok: false, error: "API base não configurada", rows: [], total: 0, totalPages: 1 };
  }

  const qs = new URLSearchParams();
  qs.set("page", String(Math.max(1, page)));
  qs.set("page_size", String(Math.min(100, Math.max(1, pageSize))));
  qs.set("q", listingIdNorm);

  const mktNorm = String(marketplace ?? "").trim();
  if (mktNorm) qs.set("marketplace", mktNorm);

  const accountNorm = String(marketplaceAccountId ?? "").trim();
  if (accountNorm) qs.set("marketplace_account_id", accountNorm);

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

  const alvoCan = normalizarListingIdParaMatch(mktNorm, listingIdNorm);
  const rowsApi = Array.isArray(res.data?.rows) ? res.data.rows : [];
  const rowsFiltradas = rowsApi.filter((raw) => {
    if (!raw || typeof raw !== "object") return false;
    const row = /** @type {Record<string, unknown>} */ (raw);
    const listingRow = extrairListingIdDaVenda(row);
    if (!listingRow) return false;
    return normalizarListingIdParaMatch(mktNorm, listingRow) === alvoCan;
  });

  const rows = sortVendasReportDetailRows(rowsFiltradas);
  const rawTotal = res.data?.pagination?.total ?? res.data?.total ?? rows.length;
  const total =
    typeof rawTotal === "number" && Number.isFinite(rawTotal)
      ? Math.max(0, Math.floor(rawTotal))
      : Number.parseInt(String(rawTotal ?? ""), 10) || rows.length;
  const apiTp = res.data?.pagination?.total_pages ?? res.data?.total_pages;
  const derivedTp = total <= 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const totalPages =
    typeof apiTp === "number" && Number.isFinite(apiTp) && apiTp >= 1 ? Math.floor(apiTp) : derivedTp;

  return { ok: true, rows, total, totalPages, error: null };
}
