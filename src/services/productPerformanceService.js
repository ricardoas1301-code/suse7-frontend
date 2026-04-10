import { apiFetch, buildApiUrl } from "../config/api";

/**
 * @param {string} productId
 */
export async function fetchProductPerformance(productId) {
  const pid = productId != null ? String(productId).trim() : "";
  if (!pid) return { ok: false, error: "product_id inválido" };
  const url = buildApiUrl(`/api/products/${encodeURIComponent(pid)}/performance`);
  if (!url) return { ok: false, error: "API base não configurada" };
  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    return {
      ok: false,
      error: res.data?.message || res.data?.error || res.error || "Erro ao carregar desempenho",
    };
  }
  return { ok: true, data: res.data || {} };
}
