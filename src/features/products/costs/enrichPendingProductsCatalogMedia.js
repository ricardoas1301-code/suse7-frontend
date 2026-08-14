// ======================================================================
// Enriquece itens do modal em lote com mídia canônica do catálogo (Supabase).
// Paridade com Página Produtos — sem novo endpoint.
// ======================================================================

import { supabase } from "../../../supabaseClient";

/**
 * @param {Record<string, unknown>[]} items
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function enrichPendingProductsCatalogMedia(items) {
  if (!Array.isArray(items) || items.length === 0) return items;

  const ids = items
    .map((item) => (item?.product_id != null ? String(item.product_id).trim() : ""))
    .filter(Boolean);

  if (ids.length === 0) return items;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return items;

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      product_images,
      format,
      product_variants ( id, sort_order, attributes ),
      product_image_links ( storage_path, variant_key, sort_order, is_primary )
    `
    )
    .eq("user_id", user.id)
    .in("id", ids);

  if (error || !Array.isArray(data)) return items;

  /** @type {Map<string, Record<string, unknown>>} */
  const byId = new Map(data.map((row) => [String(row.id), row]));

  return items.map((item) => {
    const pid = item?.product_id != null ? String(item.product_id).trim() : "";
    const full = byId.get(pid);
    if (!full) return item;

    const apiLinks = Array.isArray(item.product_image_links) ? item.product_image_links : [];
    const catalogLinks = Array.isArray(full.product_image_links) ? full.product_image_links : [];

    return {
      ...item,
      product_images: full.product_images ?? item.product_images ?? null,
      format: full.format ?? item.format ?? null,
      product_variants: full.product_variants ?? item.product_variants ?? null,
      product_image_links: catalogLinks.length > 0 ? catalogLinks : apiLinks,
    };
  });
}
