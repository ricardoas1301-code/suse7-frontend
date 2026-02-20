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
  if (!files?.length) {
    console.warn("[imageStorageService] uploadAssets: nenhum arquivo");
    return [];
  }
  if (!userId || userId === "anon") {
    throw new Error("Usuário não autenticado - faça login para enviar imagens");
  }
  if (!storageKey || (typeof storageKey === "string" && !storageKey.trim())) {
    throw new Error("productId ou draftKey é obrigatório para upload");
  }

  const results = [];
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `${userId}/${storageKey}/${safeName}`;

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
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
 * Obtém URL assinada para download.
 * @param {string} storagePath - caminho no storage
 * @param {number} expiresIn - segundos até expirar (3600 para preview, 60 para download direto)
 * @returns {Promise<string|null>} URL assinada ou null se objeto não existir (ex: após rename)
 */
export async function getSignedUrl(storagePath, expiresIn = 3600) {
  if (!storagePath || typeof storagePath !== "string") return null;
  let path = String(storagePath).trim();
  if (path.includes(",")) path = path.split(",")[0].trim();
  if (!path || path === "undefined" || path === "null") return null;
  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(path, expiresIn);
  if (error) {
    const msg = error?.message ?? "";
    const isNotFound = msg.toLowerCase().includes("object not found") || msg.toLowerCase().includes("not found") || msg === "404" || msg === "400";
    if (isNotFound) {
      if (typeof console?.debug === "function") console.debug("[imageStorageService] signedUrl: objeto não encontrado", path);
      return null;
    }
    console.error("[imageStorageService] signedUrl error:", error);
    return null;
  }
  return data?.signedUrl || null;
}

/**
 * Baixa arquivo do storage como Blob e força download no browser.
 * @param {string} storagePath - caminho no storage
 * @param {string} fileName - nome do arquivo para download
 * @returns {Promise<void>}
 */
export async function downloadAsBlob(storagePath, fileName = "imagem") {
  if (!storagePath) throw new Error("storage_path não pode ser vazio");
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(storagePath);
  if (error) throw new Error(error.message || "Falha ao baixar");
  if (!data) throw new Error("Download retornou vazio");
  const blobUrl = URL.createObjectURL(data);
  try {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName || "imagem";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/**
 * Remove arquivo do storage.
 * @param {string} storagePath - caminho no storage
 */
export async function deleteAsset(storagePath) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
  if (error) throw new Error(error.message || "Falha ao remover do storage");
}
