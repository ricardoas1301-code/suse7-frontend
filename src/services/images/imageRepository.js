/**
 * imageRepository.js — CRUD de image_assets e product_image_links
 * - createAsset: registra asset no banco
 * - createLink: cria vínculo produto/variante ↔ asset
 * - listLinks: lista links por productId e variantKey
 * - updateLink: atualiza sort_order ou is_primary
 * - deleteLink: remove vínculo
 */

import { supabase } from "../../supabaseClient";

/**
 * Cria registro em image_assets.
 * @param {Object} metadata - { storage_path, mime_type, size_bytes }
 * @returns {Promise<{ id: number }>}
 */
export async function createAsset(metadata) {
  const { data, error } = await supabase
    .from("image_assets")
    .insert({
      storage_path: metadata.storage_path,
      mime_type: metadata.mime_type || "image/jpeg",
      size_bytes: metadata.size_bytes ?? 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message || "Falha ao criar asset");
  return data;
}

/**
 * Cria link produto/variante ↔ asset.
 * @param {Object} opts - { productId, variantKey, assetId, sortOrder, isPrimary }
 */
export async function createLink({ productId, variantKey, assetId, sortOrder, isPrimary }) {
  const { data, error } = await supabase
    .from("product_image_links")
    .insert({
      product_id: productId,
      variant_key: variantKey ?? null,
      asset_id: assetId,
      sort_order: sortOrder ?? 0,
      is_primary: !!isPrimary,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message || "Falha ao criar link");
  return data;
}

/**
 * Lista links com join em image_assets.
 * @param {string|number} productId
 * @param {string|null} variantKey - null para imagens gerais
 * @returns {Promise<Array>} links com asset
 */
export async function listLinks(productId, variantKey = null) {
  if (!productId) return [];

  let query = supabase
    .from("product_image_links")
    .select("id, product_id, variant_key, asset_id, sort_order, is_primary")
    .eq("product_id", productId);

  if (variantKey === null || variantKey === undefined) {
    query = query.is("variant_key", null);
  } else {
    query = query.eq("variant_key", variantKey);
  }

  const { data: links, error: linksError } = await query.order("sort_order", { ascending: true });

  if (linksError) {
    console.error("[imageRepository] listLinks error:", linksError);
    return [];
  }

  if (!links?.length) return [];

  const assetIds = [...new Set(links.map((l) => l.asset_id))];
  const { data: assets, error: assetsError } = await supabase
    .from("image_assets")
    .select("id, storage_path, mime_type, size_bytes")
    .in("id", assetIds);

  if (assetsError || !assets?.length) return links.map((l) => ({ ...l, asset: null }));

  const assetMap = new Map(assets.map((a) => [a.id, a]));
  return links.map((l) => ({
    ...l,
    asset: assetMap.get(l.asset_id) || null,
  }));
}

/**
 * Atualiza link (sort_order, is_primary).
 * @param {number} id - link id
 * @param {Object} patch - { sort_order?, is_primary? }
 */
export async function updateLink(id, patch) {
  const { error } = await supabase.from("product_image_links").update(patch).eq("id", id);
  if (error) throw new Error(error.message || "Falha ao atualizar link");
}

/**
 * Remove link.
 * @param {number} id - link id
 */
export async function deleteLink(id) {
  const { error } = await supabase.from("product_image_links").delete().eq("id", id);
  if (error) throw new Error(error.message || "Falha ao remover link");
}
