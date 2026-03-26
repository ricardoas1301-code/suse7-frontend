/**
 * variantRepository.js — product_variants (sort_order, listagem)
 * - updateVariantsSortOrder: batch via RPC (1 request, atômico)
 * - listVariants: carrega variações ordenadas por sort_order asc
 */

import { supabase } from "../../supabaseClient";

const TABLE = "product_variants";

/**
 * Atualiza sort_order de variações em batch (1 RPC, atômico).
 * @param {string} productId - UUID do produto
 * @param {Array<{ id: string, sort_order: number }>} updates
 */
export async function updateVariantsSortOrder(productId, updates) {
  if (!productId || !Array.isArray(updates) || updates.length === 0) return;
  const payload = updates.map(({ id, sort_order }) => ({ id, sort_order }));
  const { error } = await supabase.rpc("update_product_variants_sort_order", {
    p_product_id: productId,
    p_payload: payload,
  });
  if (error) throw new Error(error.message || "Falha ao atualizar sort_order da variação");
}

/**
 * Lista variações do produto ordenadas por sort_order asc.
 * @param {string} productId - UUID do produto
 * @returns {Promise<{ data: Array; error: import("@supabase/supabase-js").PostgrestError | null }>}
 */
export async function listVariants(productId) {
  if (!productId) return { data: [], error: null };
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[variantRepository] listVariants error:", error);
    return { data: [], error };
  }
  return { data: data || [], error: null };
}
