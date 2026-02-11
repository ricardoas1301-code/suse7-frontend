/**
 * imageRepository.js — CRUD de image_assets e product_image_links
 * - createAsset: registra asset no banco
 * - createLink: cria vínculo produto/variante ↔ asset (suporta productId ou draftKey)
 * - listLinks: lista links por productId ou draftKey e variantKey
 * - updateLink: atualiza sort_order ou is_primary
 * - deleteLink: remove vínculo
 * - relinkDraftToProduct: migra links de draft para produto salvo
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
 * Aceita productId OU draftKey (exatamente um).
 * @param {Object} opts - { productId?, draftKey?, userId, variantKey, assetId, sortOrder, isPrimary }
 */
export async function createLink({ productId, draftKey, userId, variantKey, assetId, sortOrder, isPrimary }) {
  const hasProduct = productId != null && productId !== "";
  const hasDraft = draftKey != null && draftKey !== "";
  if ((hasProduct && hasDraft) || (!hasProduct && !hasDraft)) {
    throw new Error("createLink: informe productId OU draftKey (exatamente um)");
  }

  const payload = {
    product_id: hasProduct ? productId : null,
    draft_key: hasDraft ? draftKey : null,
    user_id: userId,
    variant_key: variantKey ?? null,
    asset_id: assetId,
    sort_order: sortOrder ?? 0,
    is_primary: !!isPrimary,
  };

  const { data, error } = await supabase
    .from("product_image_links")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message || "Falha ao criar link");
  return data;
}

/**
 * Lista links com join em image_assets.
 * Consulta por productId OU draftKey.
 * @param {Object} opts - { productId?, draftKey?, variantKey? }
 * @returns {Promise<Array>} links com asset
 */
export async function listLinks({ productId, draftKey, variantKey = null }) {
  const hasProduct = productId != null && productId !== "";
  const hasDraft = draftKey != null && draftKey !== "";
  if (!hasProduct && !hasDraft) return [];

  let query = supabase
    .from("product_image_links")
    .select("id, product_id, draft_key, variant_key, asset_id, sort_order, is_primary");

  if (hasProduct) {
    query = query.eq("product_id", productId);
  } else {
    query = query.eq("draft_key", draftKey);
  }

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
 * Migra links de draft para produto salvo.
 * Atualiza product_id e zera draft_key para linhas do draft do usuário atual.
 * @param {string} draftKey
 * @param {string|number} productId
 */
export async function relinkDraftToProduct(draftKey, productId) {
  if (!draftKey || productId == null) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Usuário não autenticado");

  const { error } = await supabase
    .from("product_image_links")
    .update({ product_id: productId, draft_key: null })
    .eq("draft_key", draftKey)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message || "Falha ao vincular imagens ao produto");
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
