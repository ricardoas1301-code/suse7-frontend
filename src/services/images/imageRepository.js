/**
 * imageRepository.js — CRUD de product_image_links
 * Tabela única: public.product_image_links (metadata inline, sem image_assets)
 *
 * - createImageRecord: insere registro com metadata do upload
 * - listLinks: lista por productId ou draftKey e variantKey
 * - updateLink: atualiza sort_order ou is_primary
 * - deleteLink: remove registro
 * - relinkDraftToProduct: migra draft para produto salvo
 *
 * Contrato: productId é sempre UUID string (public.products.id)
 */

import { supabase } from "../../supabaseClient";

const TABLE = "product_image_links";

/** @param {string} v - garante UUID string */
function toProductId(v) {
  if (v == null || v === "") return null;
  return String(v).trim();
}

/**
 * Cria registro em product_image_links (metadata do upload).
 * user_id NÃO é enviado: usa DEFAULT auth.uid() no banco (obrigatório para RLS).
 * @param {Object} opts - { productId?, draftKey?, variantKey?, storage_path, file_name?, mime_type?, size_bytes?, sortOrder?, isPrimary? }
 */
export async function createImageRecord({
  productId,
  draftKey,
  variantKey,
  storage_path,
  file_name,
  mime_type,
  size_bytes,
  sortOrder,
  isPrimary,
}) {
  const productIdStr = toProductId(productId);
  const hasProduct = !!productIdStr;
  const hasDraft = draftKey != null && String(draftKey).trim() !== "";
  if ((hasProduct && hasDraft) || (!hasProduct && !hasDraft)) {
    throw new Error("createImageRecord: informe productId OU draftKey (exatamente um)");
  }

  let pathStr = typeof storage_path === "string" ? storage_path.trim() : "";
  if (pathStr.includes(",")) pathStr = pathStr.split(",")[0].trim();
  if (!pathStr || pathStr === "undefined" || pathStr === "null") {
    throw new Error("createImageRecord: storage_path não pode ser vazio");
  }

  const payload = {
    product_id: hasProduct ? productIdStr : null,
    draft_key: hasDraft ? String(draftKey).trim() : null,
    variant_key: variantKey ?? null,
    storage_path: pathStr,
    file_name: file_name ?? null,
    mime_type: mime_type ?? "image/jpeg",
    size_bytes: size_bytes ?? null,
    is_primary: !!isPrimary,
    sort_order: sortOrder ?? 0,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message || "Falha ao criar registro de imagem");
  return data;
}

/**
 * Lista registros por productId (UUID string) OU draftKey.
 * Sempre ordenado por sort_order asc.
 * @param {Object} opts - { productId?: string, draftKey?: string, variantKey?: string|null }
 * @returns {Promise<Array>} registros com storage_path, mime_type, etc.
 */
export async function listLinks({ productId, draftKey, variantKey = null }) {
  const productIdStr = toProductId(productId);
  const hasProduct = !!productIdStr;
  const hasDraft = draftKey != null && String(draftKey).trim() !== "";
  if (!hasProduct && !hasDraft) return [];

  let query = supabase
    .from(TABLE)
    .select("id, product_id, draft_key, variant_key, storage_path, file_name, mime_type, size_bytes, sort_order, is_primary");

  if (hasProduct) {
    query = query.eq("product_id", productIdStr);
  } else {
    query = query.eq("draft_key", draftKey);
  }

  if (variantKey === null || variantKey === undefined) {
    query = query.is("variant_key", null);
  } else {
    query = query.eq("variant_key", variantKey);
  }

  const { data: links, error } = await query.order("sort_order", { ascending: true });

  if (error) {
    console.error("[imageRepository] listLinks error:", error);
    return [];
  }

  return links || [];
}

/**
 * Migra links de draft para produto salvo.
 * Valida ownership do produto e resolve conflito de primary.
 * @param {string} draftKey
 * @param {string} productId - UUID do produto
 */
export async function relinkDraftToProduct(draftKey, productId) {
  const draftKeyStr = draftKey?.trim();
  const productIdStr = toProductId(productId);
  if (!draftKeyStr || !productIdStr) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Usuário não autenticado");

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, user_id")
    .eq("id", productIdStr)
    .single();

  if (productError || !product || product.user_id !== user.id) {
    throw new Error("Produto não encontrado ou sem permissão");
  }

  const { data: draftLinks } = await supabase
    .from(TABLE)
    .select("id, variant_key, is_primary")
    .eq("draft_key", draftKeyStr)
    .eq("user_id", user.id);

  if (!draftLinks?.length) return;

  const variantKeysWithPrimary = draftLinks.filter((l) => l.is_primary).map((l) => l.variant_key);

  for (const vk of variantKeysWithPrimary) {
    let q = supabase.from(TABLE).select("id").eq("product_id", productIdStr).eq("is_primary", true);
    q = vk == null ? q.is("variant_key", null) : q.eq("variant_key", vk);
    const { data: existing } = await q.limit(1).maybeSingle();
    if (existing?.id) {
      await supabase.from(TABLE).update({ is_primary: false }).eq("id", existing.id).eq("user_id", user.id);
    }
  }

  const { error: updateError } = await supabase
    .from(TABLE)
    .update({ product_id: productIdStr, draft_key: null })
    .eq("draft_key", draftKeyStr)
    .eq("user_id", user.id);

  if (updateError) throw new Error(updateError.message || "Falha ao vincular imagens ao produto");
}

/**
 * Atualiza registro (sort_order, is_primary).
 * @param {string} id - UUID do registro
 */
export async function updateLink(id, patch) {
  const { error } = await supabase.from(TABLE).update(patch).eq("id", id);
  if (error) throw new Error(error.message || "Falha ao atualizar");
}

/**
 * Atualiza sort_order de múltiplos registros em batch (1 RPC, atômico).
 * @param {Array<{ id: string, sort_order: number }>} updates
 */
export async function updateLinksSortOrder(updates) {
  if (!Array.isArray(updates) || updates.length === 0) return;
  const payload = updates.map(({ id, sort_order }) => ({ id, sort_order }));
  const { error } = await supabase.rpc("update_product_image_links_sort_order", { p_payload: payload });
  if (error) throw new Error(error.message || "Falha ao atualizar sort_order");
}

/**
 * Remove registro.
 * @param {string} id - UUID do registro
 */
export async function deleteLink(id) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message || "Falha ao remover");
}
