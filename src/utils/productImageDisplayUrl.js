// ======================================================================
// SUSE7 — URL renderizável para <img> (cadastro, edição, listagem)
// Fonte no banco: [{ "storage_path": "userId/.../file.ext" }] (+ legado url)
// Bucket: product-images — exibição via createSignedUrl (bucket privado).
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { getSignedUrl } from "../services/images/imageStorageService";

export const PRODUCT_IMAGES_BUCKET = "product-images";

/** TTL longo só para exibição (não é persistência). */
const DISPLAY_SIGNED_TTL_SEC = 60 * 60 * 24 * 365;

/**
 * Resolução síncrona: blob/data/http e URLs https cacheadas.
 * Não resolve storage_path (use {@link resolveProductImageSrc}).
 * @param {unknown} entry
 * @returns {string}
 */
export function resolveProductImageSrcSync(entry) {
  if (entry == null) return "";

  if (typeof entry === "object" && entry !== null) {
    const o = /** @type {Record<string, unknown>} */ (entry);
    for (const k of ["previewLocalUrl", "localPreviewUrl", "localUrl", "blobUrl"]) {
      if (typeof o[k] === "string" && o[k].trim()) {
        const v = o[k].trim();
        if (v.startsWith("blob:") || v.startsWith("data:") || v.startsWith("http")) return v;
      }
    }
    if (typeof o.previewUrl === "string") {
      const v = o.previewUrl.trim();
      if (v.startsWith("blob:") || v.startsWith("data:") || v.startsWith("http")) return v;
    }
    if ("url" in o) {
      const u = String(o.url ?? "").trim();
      if (u.startsWith("http")) return u;
    }
  }

  if (typeof entry === "string") {
    const s = entry.trim();
    if (!s) return "";
    if (s.startsWith("blob:") || s.startsWith("data:") || s.startsWith("http")) return s;
  }

  return "";
}

/**
 * Extrai storage_path de um item ou string-path.
 * @param {unknown} entry
 * @returns {string}
 */
export function extractStoragePathFromImageEntry(entry) {
  if (entry == null) return "";
  if (typeof entry === "string") {
    const s = entry.trim();
    if (
      s.includes("/") &&
      !s.includes(" ") &&
      !s.startsWith("http") &&
      !s.startsWith("blob:") &&
      !s.startsWith("data:") &&
      !s.startsWith("{") &&
      !s.startsWith("[")
    ) {
      return s;
    }
    return "";
  }
  if (typeof entry === "object" && entry !== null) {
    const raw = /** @type {{ storage_path?: unknown; storagePath?: unknown }} */ (entry);
    const sp = String(raw.storage_path ?? raw.storagePath ?? "").trim();
    if (sp && !sp.includes(" ")) return sp;
  }
  return "";
}

/**
 * Desembrulha item que veio como JSON string (legado / double encode).
 * @param {unknown} entry
 * @returns {unknown}
 */
export function unwrapImageEntry(entry) {
  let e = entry;
  for (let depth = 0; depth < 4 && typeof e === "string"; depth += 1) {
    const s = e.trim();
    if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
      try {
        const p = JSON.parse(s);
        e = Array.isArray(p) ? p[0] : p;
      } catch {
        break;
      }
    } else {
      break;
    }
  }
  return e;
}

/**
 * storage_path da imagem no lugar 0 da galeria (mesmo critério da aba Imagens: Principal = sort_order 0).
 * Não usa só `is_primary`: após drag-and-drop o reorder atualiza sort_order mas nem sempre is_primary no banco.
 * @param {unknown} links
 * @returns {string}
 */
export function pickFirstGeneralLinkStoragePath(links) {
  if (!Array.isArray(links) || links.length === 0) return "";
  const general = links.filter((l) => l && (l.variant_key == null || l.variant_key === ""));
  if (general.length === 0) return "";
  const sorted = [...general].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return extractStoragePathFromImageEntry(sorted[0] ?? {});
}

/**
 * URL usável em <img>: preview local → https → storage_path (assinada + fallback público).
 * @param {unknown} entry
 * @returns {Promise<string>}
 */
export async function resolveProductImageSrc(entry) {
  const sync = resolveProductImageSrcSync(entry);
  if (sync) return sync;

  const path = extractStoragePathFromImageEntry(entry);
  if (!path) return "";

  const signed = await getSignedUrl(path, DISPLAY_SIGNED_TTL_SEC);
  if (signed && String(signed).startsWith("http")) return String(signed);

  // Bucket privado: getPublicUrl gera URL que quebra em <img> (403). Não usar como fallback.
  return "";
}

/**
 * Miniatura = primeira imagem geral por `sort_order` (badge Principal na UI).
 * Prioriza `product_image_links`; `product_images` só como fallback.
 * @param {{ product_images?: unknown; product_image_links?: unknown } | null | undefined} product
 * @returns {Promise<string>}
 */
export async function resolveProductImageSrcFromProduct(product) {
  const fromLinksPath = pickFirstGeneralLinkStoragePath(product?.product_image_links);
  if (fromLinksPath) {
    const u = await resolveProductImageSrc({ storage_path: fromLinksPath });
    if (u) return u;
  }

  const v = product?.product_images;

  let first = null;
  if (v != null) {
    if (typeof v === "string") {
      const s = v.trim();
      if (!s) {
        first = null;
      } else if (s.startsWith("http")) {
        return s;
      } else {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed) && parsed.length > 0) first = parsed[0];
          else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) first = parsed;
        } catch {
          first = null;
        }
      }
    } else if (Array.isArray(v) && v.length > 0) {
      first = v[0];
    }
  }

  first = unwrapImageEntry(first);
  if (first != null) {
    const fromColumn = await resolveProductImageSrc(first);
    if (fromColumn) return fromColumn;
  }

  return "";
}

/**
 * Hook: miniatura = sort_order 0 nos links gerais; fallback `product_images`.
 * @param {{ product_images?: unknown; product_image_links?: unknown; id?: string } | null | undefined} product
 * @returns {string}
 */
export function useProductMainImageSrc(product) {
  const imagesKey = useMemo(
    () =>
      JSON.stringify({
        pi: product?.product_images ?? null,
        pil: product?.product_image_links ?? null,
      }),
    [product?.product_images, product?.product_image_links]
  );
  const snapshot = useMemo(
    () => ({
      product_images: product?.product_images,
      product_image_links: product?.product_image_links,
      id: product?.id,
    }),
    [product?.id, imagesKey]
  );
  const [url, setUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await resolveProductImageSrcFromProduct(snapshot);
      if (!cancelled) setUrl(u);
    })();
    return () => {
      cancelled = true;
    };
  }, [snapshot]);

  return url;
}

/**
 * Síncrono: só http/blob no primeiro item (útil quando não há storage_path).
 * Para storage_path, retorna "" — prefira {@link useProductMainImageSrc} ou {@link resolveProductImageSrcFromProduct}.
 * @param {{ product_images?: unknown }} product
 * @returns {string}
 */
export function getProductMainImageUrl(product) {
  const v = product?.product_images;
  if (v == null) return "";

  let first = null;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return "";
    if (s.startsWith("http")) return s;
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) first = parsed[0];
      else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) first = parsed;
    } catch {
      return "";
    }
  } else if (Array.isArray(v) && v.length > 0) {
    first = v[0];
  }

  if (first == null) return "";
  return resolveProductImageSrcSync(first);
}
