// ======================================================================

// API — sincronização de descrição do produto para anúncios vinculados

// GET/POST /api/products/:productId/descriptions/sync-listings

// ======================================================================



import { apiFetch, buildApiUrl, getSessionToken } from "../config/api";



/**

 * @param {string} productId

 */

export async function fetchProductDescriptionSyncListings(productId) {

  const pid = productId != null ? String(productId).trim() : "";

  if (!pid) return { ok: false, error: "product_id inválido", listings: [] };



  const url = buildApiUrl(`/api/products/${encodeURIComponent(pid)}/descriptions/sync-listings`);

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

 *   description: string;

 *   listingIds: string[];

 *   syncMarketplace?: boolean;

 * }} input

 */

export async function syncProductDescriptionToListings(input) {

  const pid = input.productId != null ? String(input.productId).trim() : "";

  if (!pid) return { ok: false, error: "product_id inválido" };



  const url = buildApiUrl(`/api/products/${encodeURIComponent(pid)}/descriptions/sync-listings`);

  if (!url) return { ok: false, error: "API base não configurada" };



  const token = await getSessionToken();

  if (!token) return { ok: false, error: "Sessão não disponível" };



  const res = await apiFetch(url, {

    method: "POST",

    body: {

      product_id: pid,

      description: String(input.description ?? ""),

      listing_ids: Array.isArray(input.listingIds) ? input.listingIds : [],

      sync_marketplace: input.syncMarketplace !== false,

    },

  });



  if (!res.ok) {

    return {

      ok: false,

      error: res.data?.error || res.data?.message || res.error || "Erro ao sincronizar descrição",

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



/** Limite de preview curto da descrição no modal. */

export const DESCRIPTION_SYNC_PREVIEW_CHARS = 250;

