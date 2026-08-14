import { apiFetch, buildApiUrl } from "../../../config/api.js";

const MARKETPLACE_MERCADO_LIVRE = "mercado_livre";

function mensagemErro(data, fallback) {
  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
    if (typeof data.error === "string" && data.error.trim()) return data.error.trim();
  }
  return fallback;
}

/** @param {Record<string, unknown>} item */
export function normalizePendingListingSkuItem(item) {
  const listingId = item.listing_id ?? item.id;
  return {
    ...item,
    listing_id: listingId != null ? String(listingId).trim() : "",
    external_listing_id:
      item.external_listing_id != null ? String(item.external_listing_id).trim() : "",
    title: item.title != null ? String(item.title) : "Anúncio sem título",
    image:
      item.thumbnail != null && String(item.thumbnail).trim()
        ? String(item.thumbnail).trim()
        : item.image != null && String(item.image).trim()
          ? String(item.image).trim()
          : item.image_url != null && String(item.image_url).trim()
            ? String(item.image_url).trim()
            : null,
    seller_sku:
      item.seller_sku != null && String(item.seller_sku).trim()
        ? String(item.seller_sku).trim()
        : "",
    sku_dependency_reason:
      item.sku_dependency_reason === "product_link_missing"
        ? "product_link_missing"
        : "ml_missing_sku",
    marketplace_account_id: item.marketplace_account_id ?? null,
    account_alias: item.account_alias ?? item.conta ?? null,
    account_logo_url:
      item.account_logo_url ??
      item.account_avatar_url ??
      item.accountLogoUrl ??
      null,
    marketplace: item.marketplace ?? item.canal ?? MARKETPLACE_MERCADO_LIVRE,
    conta: item.conta ?? item.account_alias ?? null,
    canal: item.canal ?? item.marketplace ?? MARKETPLACE_MERCADO_LIVRE,
  };
}

export async function fetchPendingListingSkus({ page = 1, pageSize = 25, q = "" } = {}) {
  const params = new URLSearchParams({
    page: String(Math.max(1, Number(page) || 1)),
    page_size: String(Math.max(1, Number(pageSize) || 25)),
  });
  if (String(q).trim()) params.set("q", String(q).trim());
  const url = buildApiUrl(`/api/ml/listings/sku-pending?${params.toString()}`);
  if (!url) return { ok: false, error: "Configure VITE_API_BASE_URL.", items: [], total: 0 };

  const res = await apiFetch(url, { method: "GET" });
  const data = res.data && typeof res.data === "object" ? res.data : {};
  if (!res.ok) {
    return {
      ok: false,
      error: mensagemErro(data, res.error || "Não foi possível carregar os anúncios pendentes."),
      items: [],
      total: 0,
    };
  }

  const items = Array.isArray(data.items)
    ? data.items.map((item) =>
        normalizePendingListingSkuItem(
          item && typeof item === "object" ? /** @type {Record<string, unknown>} */ (item) : {},
        ),
      )
    : [];
  return {
    ok: true,
    items: items.filter((item) => item.listing_id),
    total: Number(data.total) || 0,
    page: Number(data.page) || page,
    page_size: Number(data.page_size) || pageSize,
    total_pages: Math.max(1, Number(data.total_pages) || 1),
  };
}

/**
 * @param {{ items: { listing_id: string; sku: string; selected_product_id?: string }[] }} params
 */
export async function saveListingSkusBatch({ items }) {
  const url = buildApiUrl("/api/listings/bulk-set-sku");
  if (!url) return { ok: false, error: "Configure VITE_API_BASE_URL.", results: [], errors: [] };

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      marketplace: MARKETPLACE_MERCADO_LIVRE,
      items: items.map((item) => ({
        listing_id: String(item.listing_id),
        sku: String(item.sku).trim(),
        ...(item.selected_product_id
          ? { selected_product_id: String(item.selected_product_id) }
          : {}),
      })),
    },
  });
  const data = res.data && typeof res.data === "object" ? res.data : {};
  if (!res.ok) {
    return {
      ok: false,
      error: mensagemErro(data, res.error || "Não foi possível salvar os SKUs."),
      results: Array.isArray(data.results) ? data.results : [],
      errors: Array.isArray(data.errors) ? data.errors : [],
    };
  }
  return {
    ok: data.ok !== false,
    total_received: Number(data.total_received) || items.length,
    total_updated: Number(data.total_updated) || 0,
    total_skipped: Number(data.total_skipped) || 0,
    results: Array.isArray(data.results) ? data.results : [],
    errors: Array.isArray(data.errors) ? data.errors : [],
  };
}
