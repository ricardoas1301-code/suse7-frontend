// ======================================================================
// API — sincronização de imagens do produto para anúncios vinculados
// GET/POST /api/products/:productId/images/sync-listings
// ======================================================================

import { apiFetch, buildApiUrl, getSessionToken } from "../config/api";

/**
 * @param {string} productId
 */
export async function fetchProductImageSyncListings(productId) {
  const pid = productId != null ? String(productId).trim() : "";
  if (!pid) return { ok: false, error: "product_id inválido", listings: [] };

  const url = buildApiUrl(`/api/products/${encodeURIComponent(pid)}/images/sync-listings`);
  if (!url) return { ok: false, error: "API base não configurada", listings: [] };

  const token = await getSessionToken();
  if (!token) return { ok: false, error: "Sessão não disponível", listings: [] };

  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    return {
      ok: false,
      error: res.data?.error || res.data?.message || res.error || "Erro ao carregar anúncios",
      listings: [],
    };
  }
  const listings = Array.isArray(res.data?.listings) ? res.data.listings : [];
  return { ok: true, listings };
}

/**
 * @param {{
 *   productId: string;
 *   imageLinkIds: string[];
 *   listingIds: string[];
 *   syncMarketplace?: boolean;
 * }} input
 */
export async function syncProductImagesToListings(input) {
  const pid = input.productId != null ? String(input.productId).trim() : "";
  if (!pid) return { ok: false, error: "product_id inválido" };

  const url = buildApiUrl(`/api/products/${encodeURIComponent(pid)}/images/sync-listings`);
  if (!url) return { ok: false, error: "API base não configurada" };

  const token = await getSessionToken();
  if (!token) return { ok: false, error: "Sessão não disponível" };

  const res = await apiFetch(url, {
    method: "POST",
    body: {
      product_id: pid,
      image_asset_ids: Array.isArray(input.imageLinkIds) ? input.imageLinkIds : [],
      listing_ids: Array.isArray(input.listingIds) ? input.listingIds : [],
      mode: "replace",
      sync_marketplace: input.syncMarketplace !== false,
    },
  });

  if (!res.ok) {
    return {
      ok: false,
      error: res.data?.error || res.data?.message || res.error || "Erro ao sincronizar imagens",
      summary: null,
      results: [],
    };
  }

  return {
    ok: true,
    success: res.data?.success === true,
    summary: res.data?.summary ?? null,
    results: Array.isArray(res.data?.results) ? res.data.results : [],
  };
}
