// ======================================================================
// GET /api/products/listings?product_id=
// ======================================================================

import { buildApiUrl, apiFetch, getSessionToken } from "../config/api";

/**
 * @param {string} productId
 * @returns {Promise<{ ok: boolean; listings?: unknown[]; error?: string }>}
 */
export async function fetchProductMarketplaceListings(productId) {
  const pid = productId != null ? String(productId).trim() : "";
  if (!pid) {
    return { ok: false, error: "product_id inválido" };
  }
  const url = buildApiUrl(`/api/products/listings?product_id=${encodeURIComponent(pid)}`);
  if (!url) {
    return { ok: false, error: "API base não configurada" };
  }
  const token = await getSessionToken();
  if (!token) {
    return { ok: false, error: "Sessão não disponível" };
  }
  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    return {
      ok: false,
      error: res.data?.message || res.data?.error || res.error || "Erro ao carregar anúncios",
    };
  }
  const listings = Array.isArray(res.data?.listings) ? res.data.listings : [];
  return { ok: true, listings };
}
