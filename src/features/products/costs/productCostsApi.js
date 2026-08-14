// ======================================================================
// API — custos de produto (lista pendente + batch save)
// ======================================================================

import { apiFetch, buildApiUrl } from "../../../config/api";
import { ensureAuthSessionBootstrapped } from "../../../auth/authBootstrapService";

/**
 * @param {{ page?: number; pageSize?: number; q?: string }} params
 */
export async function fetchPendingProductCosts(params = {}) {
  const base = buildApiUrl("/api/products/costs/pending");
  if (!base) {
    return { ok: false, error: "Configure VITE_API_BASE_URL.", items: [], total: 0, total_pages: 1 };
  }

  await ensureAuthSessionBootstrapped();

  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("page_size", String(params.pageSize));
  if (params.q) qs.set("q", String(params.q).trim());

  const url = qs.toString() ? `${base}?${qs.toString()}` : base;
  const res = await apiFetch(url, { method: "GET" });

  if (!res.ok) {
    return {
      ok: false,
      error: typeof res.error === "string" ? res.error : res.data?.error || "Erro ao carregar produtos pendentes",
      items: [],
      total: 0,
      total_pages: 1,
    };
  }

  const data = res.data && typeof res.data === "object" ? res.data : {};
  return {
    ok: true,
    items: Array.isArray(data.items) ? data.items : [],
    page: Number(data.page) || 1,
    page_size: Number(data.page_size) || 25,
    total: Number(data.total) || 0,
    total_pages: Math.max(1, Number(data.total_pages) || 1),
  };
}

/**
 * @param {Array<{ product_id: string; cost_price: string; packaging_cost: string; operational_cost: string }>} items
 */
export async function saveProductCostsBatch(items) {
  const url = buildApiUrl("/api/products/costs/batch");
  if (!url) {
    return { ok: false, error: "Configure VITE_API_BASE_URL.", saved: [], failed: items.map((i) => ({ product_id: i.product_id, message: "API indisponível" })) };
  }

  await ensureAuthSessionBootstrapped();

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { items },
  });

  const data = res.data && typeof res.data === "object" ? res.data : {};

  if (!res.ok) {
    return {
      ok: false,
      error: typeof res.error === "string" ? res.error : data.error || "Erro ao salvar custos",
      saved: Array.isArray(data.saved) ? data.saved : [],
      failed: Array.isArray(data.failed) ? data.failed : [],
    };
  }

  return {
    ok: true,
    saved: Array.isArray(data.saved) ? data.saved : [],
    failed: Array.isArray(data.failed) ? data.failed : [],
    total_saved: Number(data.total_saved) || 0,
    total_failed: Number(data.total_failed) || 0,
  };
}

/**
 * @param {{ product_id: string; cost_price: string; packaging_cost: string; operational_cost: string }} item
 */
export async function saveSingleProductCosts(item) {
  return saveProductCostsBatch([item]);
}
