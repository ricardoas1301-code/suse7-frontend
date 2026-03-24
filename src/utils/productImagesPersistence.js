// ======================================================================
// product_images — persistência (API): formato canônico [{ storage_path }]
// URL não é gerada no save; leitura: productImageDisplayUrl.js
// ======================================================================

import { supabase } from "../supabaseClient";
import { listLinks } from "../services/images/imageRepository";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Já há dado persistível no primeiro item (url legada ou storage_path). */
function firstEntryHasPersistedImage(productImages) {
  if (productImages == null) return false;
  if (Array.isArray(productImages) && productImages.length > 0) {
    const first = productImages[0];
    if (typeof first === "string") {
      const t = first.trim();
      return t.startsWith("http") || (t.includes("/") && !t.includes(" "));
    }
    if (first && typeof first === "object") {
      const u = first.url != null ? String(first.url).trim() : "";
      if (u.startsWith("http")) return true;
      const sp = first.storage_path != null ? String(first.storage_path).trim() : "";
      if (sp && !sp.includes(" ")) return true;
    }
  }
  if (typeof productImages === "string") {
    const s = productImages.trim();
    if (s.startsWith("http")) return true;
    try {
      const p = JSON.parse(s);
      return firstEntryHasPersistedImage(p);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Normaliza valor vindo do form/API para envio ao backend.
 * Preferência: storage_path; url(s) https mantidas por compatibilidade.
 * @param {unknown} v
 * @returns {{ url?: string; storage_path?: string }[]|null}
 */
export function normalizeProductImagesForPayload(v) {
  if (v == null) return null;

  if (Array.isArray(v)) {
    const out = v
      .map((item) => {
        if (item == null) return null;
        if (typeof item === "string") {
          const s = item.trim();
          if (s.startsWith("http")) return { url: s };
          if (s.includes("/") && !s.includes(" ")) return { storage_path: s };
          return null;
        }
        if (typeof item === "object" && item.storage_path != null) {
          const sp = String(item.storage_path).trim();
          if (sp && !sp.includes(" ")) {
            const o = /** @type {{ url?: string; storage_path: string }} */ ({ storage_path: sp });
            if (item.url != null) {
              const u = String(item.url).trim();
              if (u.startsWith("http")) o.url = u;
            }
            return o;
          }
        }
        if (typeof item === "object" && item.url != null) {
          const u = String(item.url).trim();
          if (u.startsWith("http")) return { url: u };
        }
        return null;
      })
      .filter(Boolean);
    return out.length ? out : null;
  }

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    if (s.startsWith("http")) return [{ url: s }];
    try {
      const parsed = JSON.parse(s);
      return normalizeProductImagesForPayload(parsed);
    } catch {
      if (s.includes("/") && !s.includes(" ")) return [{ storage_path: s }];
      return null;
    }
  }

  return null;
}

/**
 * Primeira imagem geral (variant_key null) → [{ storage_path }] para gravar em products.product_images.
 * Não usa createSignedUrl.
 *
 * @param {{ productId?: string; draftKey?: string }} opts
 * @returns {Promise<{ storage_path: string }[]|null>}
 */
export async function resolvePrimaryImageFromLinks({ productId, draftKey }) {
  const pid = productId != null ? String(productId).trim() : "";
  const dk = draftKey != null ? String(draftKey).trim() : "";
  const hasProductId = pid !== "" && !pid.startsWith("draft:");
  const hasDraft = dk !== "";

  if (!hasProductId && !hasDraft) return null;

  const opts = hasProductId ? { productId: pid } : { draftKey: dk };

  /** @type {Awaited<ReturnType<typeof listLinks>>} */
  let links = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    links = await listLinks({ ...opts, variantKey: null });
    if (Array.isArray(links) && links.length > 0) break;
    if (attempt < 2) await sleep(150);
  }
  if (!Array.isArray(links) || links.length === 0) return null;

  const sorted = [...links].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const primary = sorted.find((l) => l.is_primary) || sorted[0];
  const raw = primary?.storage_path ?? primary?.storagePath;
  const path = typeof raw === "string" ? raw.trim().split(",")[0].trim() : "";
  if (!path || path.includes(" ")) return null;

  return [{ storage_path: path }];
}

/**
 * Após create + relinkDraftToProduct: grava product_images se o insert ainda estiver vazio.
 * @param {string} productId
 * @returns {Promise<void>}
 */
export async function persistProductImagesAfterCreate(productId) {
  const pid = productId != null ? String(productId).trim() : "";
  if (!pid) return;

  const { data: row, error: fetchErr } = await supabase
    .from("products")
    .select("product_images")
    .eq("id", pid)
    .maybeSingle();

  if (fetchErr) {
    console.error("[productImagesPersistence] persistProductImagesAfterCreate fetch:", fetchErr.message);
    return;
  }

  if (firstEntryHasPersistedImage(row?.product_images)) return;

  const imgs = await resolvePrimaryImageFromLinks({ productId: pid });
  if (!imgs?.length) return;

  const { error } = await supabase
    .from("products")
    .update({ product_images: imgs })
    .eq("id", pid);

  if (error) {
    console.error("[productImagesPersistence] persistProductImagesAfterCreate:", error.message);
  }
}
