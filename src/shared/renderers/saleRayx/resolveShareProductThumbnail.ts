// =============================================================================
// Resolução de thumbnail para export Raio-X (sem alterar finanças)
// =============================================================================

import {
  pickFirstExternalImageUrlFromLinks,
  resolveProductImageSrcSync,
  unwrapImageEntry,
} from "../../../utils/productImageDisplayUrl.js";
import { resolveSalesRowProductThumbUrl } from "../../../utils/resolveSalesRowProductThumbUrl.js";

export type ShareThumbnailResolution = {
  url: string | null;
  source: string | null;
};

const SYNC_CANDIDATES: { key: string; field: string }[] = [
  { key: "product_thumbnail_url", field: "product_thumbnail_url" },
  { key: "listing_thumbnail_url", field: "listing_thumbnail_url" },
  { key: "marketplace_thumbnail_url", field: "marketplace_thumbnail_url" },
  { key: "product_image_url", field: "product_image_url" },
  { key: "thumbnail_url", field: "thumbnail_url" },
  { key: "image_url", field: "image_url" },
  { key: "picture_url", field: "picture_url" },
];

function pickString(raw: unknown): string {
  if (raw == null) return "";
  const s = String(raw).trim();
  return s || "";
}

function resolveFromProductImages(product: Record<string, unknown>): string {
  const pi = product.product_images;
  let first: unknown = null;
  if (Array.isArray(pi) && pi.length > 0) first = pi[0];
  else if (typeof pi === "string" && pi.trim()) {
    const s = pi.trim();
    if (s.startsWith("http")) return s;
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) first = parsed[0];
      else if (parsed && typeof parsed === "object") first = parsed;
    } catch {
      /* ignore */
    }
  }
  if (first == null) return "";
  const sync = resolveProductImageSrcSync(unwrapImageEntry(first));
  return sync ? String(sync).trim() : "";
}

function resolveSyncFromRecord(record: Record<string, unknown>): ShareThumbnailResolution {
  for (const { key, field } of SYNC_CANDIDATES) {
    const url = pickString(record[field]);
    if (url) return { url, source: key };
  }

  const fromLinks = pickFirstExternalImageUrlFromLinks(record.product_image_links ?? [], null);
  if (fromLinks) {
    return { url: String(fromLinks).trim(), source: "product_image_links" };
  }

  const fromImages = resolveFromProductImages(record);
  if (fromImages) return { url: fromImages, source: "product_images" };

  return { url: null, source: null };
}

function logThumbnailDev(event: string, payload: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.info(`[S7 Raio-X Share] ${event}`, payload);
  }
}

/**
 * Resolve thumbnail para export (sync primeiro; async util vendas se necessário).
 */
export async function resolveShareProductThumbnail(
  product?: Record<string, unknown> | null,
  general?: Record<string, unknown> | null,
): Promise<ShareThumbnailResolution> {
  const sources: Record<string, unknown>[] = [];
  if (product && typeof product === "object") sources.push(product);
  if (general && typeof general === "object") sources.push(general);

  for (const record of sources) {
    const sync = resolveSyncFromRecord(record);
    if (sync.url) {
      logThumbnailDev("thumbnail_source", {
        thumbnail_source: sync.source,
        thumbnail_url: sync.url,
      });
      return sync;
    }
  }

  if (product && typeof product === "object") {
    try {
      const asyncUrl = await resolveSalesRowProductThumbUrl(product);
      if (asyncUrl) {
        logThumbnailDev("thumbnail_source", {
          thumbnail_source: "resolveSalesRowProductThumbUrl",
          thumbnail_url: asyncUrl,
        });
        return { url: asyncUrl, source: "resolveSalesRowProductThumbUrl" };
      }
    } catch (err) {
      logThumbnailDev("thumbnail_failed", {
        thumbnail_source: "resolveSalesRowProductThumbUrl",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logThumbnailDev("thumbnail_source", { thumbnail_source: "fallback", thumbnail_url: null });
  return { url: null, source: "fallback" };
}
