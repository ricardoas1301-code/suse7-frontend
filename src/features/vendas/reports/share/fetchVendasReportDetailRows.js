import { apiFetch, buildApiUrl } from "../../../../config/api";

// ======================================================================
// Resolve linhas de detalhamento do Relatório de Vendas.
// Escopo filters: usa SOMENTE as linhas já presentes no payload (listagem da tela).
// ======================================================================

/**
 * @param {Record<string, unknown>} row
 * @returns {number}
 */
function pickVendasRowSortMillis(row) {
  const candidates = [
    row.sale_date,
    row.date_created_marketplace,
    row.approved_at,
    row.order_created_at,
    row.item_created_at,
    row.created_at,
  ];
  for (const value of candidates) {
    if (value == null || String(value).trim() === "") continue;
    const t = Date.parse(String(value));
    if (Number.isFinite(t)) return t;
  }
  return 0;
}

/**
 * Ordem canônica da listagem /vendas (date_created_marketplace DESC).
 *
 * @param {readonly Record<string, unknown>[]} rows
 * @returns {Record<string, unknown>[]}
 */
export function sortVendasReportDetailRows(rows) {
  const list = Array.isArray(rows) ? [...rows] : [];
  list.sort((a, b) => {
    const tb = pickVendasRowSortMillis(b);
    const ta = pickVendasRowSortMillis(a);
    if (tb !== ta) return tb - ta;

    const idB = String(b.item_id ?? b.sale_item_id ?? "");
    const idA = String(a.item_id ?? a.sale_item_id ?? "");
    return idB.localeCompare(idA, "pt-BR");
  });
  return list;
}

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function resolveVendasReportDetailRows(payload) {
  if (!payload) return [];

  const inline = Array.isArray(payload.vendasDetalhe) ? payload.vendasDetalhe : [];
  if (inline.length > 0) return sortVendasReportDetailRows(inline);

  const q = payload.vendasListaQuery;
  if (!q) return [];

  const listBase = buildApiUrl("/api/sales");
  if (!listBase) return [];

  const expectedCount = Math.max(
    0,
    Number(q.expectedCount ?? payload.quantidadeVendas?.valor ?? payload.listagemTotal ?? 0) || 0,
  );
  const pageSize = expectedCount > 0 ? Math.min(500, Math.max(100, expectedCount)) : 100;

  const qs = new URLSearchParams();
  qs.set("page", "1");
  qs.set("page_size", String(pageSize));
  if (q.periodPreset) qs.set("period_preset", q.periodPreset);
  if (q.startDate) {
    const startDateOnly = q.startDate.includes("T") ? q.startDate.slice(0, 10) : q.startDate;
    qs.set("start_date", startDateOnly);
    if (q.startDate.includes("T")) qs.set("start_datetime", q.startDate);
  }
  if (q.endDate) {
    const endDateOnly = q.endDate.includes("T") ? q.endDate.slice(0, 10) : q.endDate;
    qs.set("end_date", endDateOnly);
    if (q.endDate.includes("T")) qs.set("end_datetime", q.endDate);
  }
  if (q.marketplace) qs.set("marketplace", q.marketplace);
  if (q.marketplaceAccountId) qs.set("marketplace_account_id", q.marketplaceAccountId);
  if (q.listFilterId && q.listFilterId !== "all") qs.set("filter", q.listFilterId);
  if (q.searchQuery) qs.set("q", q.searchQuery);
  if (q.productId) qs.set("product_id", q.productId);

  const allRows = [];
  let page = 1;
  let maxPages = expectedCount > 0 ? Math.max(1, Math.ceil(expectedCount / pageSize)) : 1;

  while (page <= maxPages && page <= 10) {
    qs.set("page", String(page));
    const res = await apiFetch(`${listBase}?${qs.toString()}`, { method: "GET", timeoutMs: 45000 });
    if (!res.ok) break;

    const rows = Array.isArray(res.data?.rows) ? res.data.rows : [];
    allRows.push(...rows);

    const totalPagesRaw = res.data?.pagination?.total_pages ?? res.data?.total_pages ?? maxPages;
    const parsedTotalPages = Number(totalPagesRaw);
    if (Number.isFinite(parsedTotalPages) && parsedTotalPages > 0) {
      maxPages = Math.min(10, Math.floor(parsedTotalPages));
    }

    if (rows.length === 0) break;
    if (expectedCount > 0 && allRows.length >= expectedCount) break;
    page += 1;
  }

  return sortVendasReportDetailRows(allRows);
}
