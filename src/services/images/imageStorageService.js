/**
 * imageStorageService.js — upload/download/delete no Supabase Storage
 * - uploadAssets: envia arquivos e retorna metadados
 * - getSignedUrl: URL assinada para download
 * - deleteAsset: remove arquivo do storage
 */

import { supabase } from "../../supabaseClient";

const BUCKET_NAME = "product-images";

/**
 * Faz upload de arquivos para o storage.
 * Usa productId ou draftKey para o path (exatamente um).
 * @param {File[]} files - arquivos para upload
 * @param {Object} opts - { userId, productId?, draftKey? }
 * @returns {Promise<Array<{ storage_path: string; mime_type: string; size_bytes: number }>>}
 */
export async function uploadAssets(files, { userId, productId, draftKey }) {
  const storageKey = productId ?? draftKey;
  if (!files?.length || !userId || !storageKey) return [];
  const results = [];
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `${userId}/${storageKey}/${safeName}`;

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

    if (error) {
      console.error("[imageStorageService] upload error:", error);
      throw new Error(error.message || "Falha no upload");
    }
    results.push({
      storage_path: storagePath,
      file_name: safeName,
      mime_type: file.type || "image/jpeg",
      size_bytes: file.size,
    });
  }
  return results;
}

/**
 * Obtém URL assinada para download (expira em 1h).
 * @param {string} storagePath - caminho no storage
 * @returns {Promise<string>} URL assinada
 */
export async function getSignedUrl(storagePath) {
  if (!storagePath) return "";
  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(storagePath, 3600);
  if (error) {
    console.error("[imageStorageService] signedUrl error:", error);
    return "";
  }
  return data?.signedUrl || "";
}

/**
 * Remove arquivo do storage.
 * @param {string} storagePath - caminho no storage
 */
export async function deleteAsset(storagePath) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
  if (error) console.error("[imageStorageService] delete error:", error);
}
