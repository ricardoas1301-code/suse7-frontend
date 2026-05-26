// =============================================================================
// SaleRayXShareRenderer — engine única (cache + geração de imagem)
// =============================================================================

import { buildSaleRayxSummaryRenderModel } from "../../../components/sales/saleRayxSummary.js";
import {
  SALE_RAYX_SHARE_TEMPLATE_VERSION,
  WHATSAPP_SHARE_CAPTION,
} from "./SaleRayXShareStyles.js";
import { exportSaleRayxShareImage } from "./SaleRayXImageExporter.js";
import type { SaleRayXShareOutputMode, SaleRayXSharePayload } from "./SaleRayXShareLayout.js";

export type SaleRayXShareInput = {
  saleId: string;
  snapshotVersion?: string | null;
  general?: Record<string, unknown> | null;
  product?: Record<string, unknown> | null;
  financial?: Record<string, unknown> | null;
  profitMargin?: Record<string, unknown> | null;
  listingTitle?: string | null;
  saleContextMetrics?: Record<string, unknown> | null;
  marketplace?: string | null;
  variant?: string;
};

const imageCache = new Map<string, { blob: Blob; createdAt: number }>();

function resolveWhatsappCaption(payloadTemplateVersion: string): string {
  // Hoje: somente um template v2. No futuro, a UI pode adicionar variações por templateVersion.
  if (payloadTemplateVersion === SALE_RAYX_SHARE_TEMPLATE_VERSION) {
    return `💰 Suse7 — Raio-X da venda`;
  }
  return WHATSAPP_SHARE_CAPTION;
}

function resolveProductImage(product?: Record<string, unknown> | null): string | null {
  if (!product) return null;
  const candidates = [
    product.product_thumbnail_url,
    product.listing_thumbnail_url,
    product.marketplace_thumbnail_url,
    product.product_image_url,
    product.thumbnail_url,
    product.image_url,
    product.picture_url,
  ];
  for (const raw of candidates) {
    if (raw != null && String(raw).trim() !== "") return String(raw).trim();
  }
  return null;
}

function resolveMarketplaceSlug(raw?: string | null): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  return s.toLowerCase().replace(/\s+/g, "_");
}

function resolveMarketplaceDisplay(marketplaceSlug: string | null): {
  label: string | null;
  accentColor: string | null;
} {
  const slug = marketplaceSlug;
  if (!slug) return { label: null, accentColor: null };

  if (slug === "mercado_livre" || slug === "mercadolivre") {
    return { label: "Mercado Livre", accentColor: "#F4B400" };
  }

  if (slug.startsWith("shopee")) {
    return { label: "Shopee", accentColor: "#00B551" };
  }

  if (slug.startsWith("amazon")) {
    return { label: "Amazon", accentColor: "#FF9900" };
  }

  if (slug.startsWith("shein")) {
    return { label: "Shein", accentColor: "#DB2C2C" };
  }

  // Fallback: tenta humanizar o código recebido
  const label = slug
    .split(/[_-]/g)
    .filter(Boolean)
    .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1))
    .join(" ");

  return { label: label || slug, accentColor: "#ff8533" };
}

function resolveSnapshotVersion(input: SaleRayXShareInput): string {
  const fromMetrics = input.saleContextMetrics?.snapshot_version;
  if (fromMetrics != null && String(fromMetrics).trim() !== "") return String(fromMetrics);
  const fromFinancial = input.financial?.snapshot_version;
  if (fromFinancial != null && String(fromFinancial).trim() !== "") return String(fromFinancial);
  return "0";
}

/**
 * Monta payload pronto para render (sem recalcular finanças — usa blocos da API).
 */
export function buildSaleRayxSharePayload(input: SaleRayXShareInput): SaleRayXSharePayload {
  const ctx = {
    general: input.general,
    product: input.product,
    financial: input.financial,
    profitMargin: input.profitMargin,
    listingTitle: input.listingTitle,
    saleContextMetrics: input.saleContextMetrics,
  };
  const renderModel = buildSaleRayxSummaryRenderModel(ctx);
  const g = input.general ?? {};

  const marketplaceSlug =
    resolveMarketplaceSlug(input.marketplace) ??
    resolveMarketplaceSlug(g.marketplace) ??
    resolveMarketplaceSlug(input.product && typeof input.product === "object" ? (input.product as any).marketplace : null);

  const { label: marketplaceLabel, accentColor: marketplaceAccentColor } =
    resolveMarketplaceDisplay(marketplaceSlug);

  return {
    saleId: String(input.saleId),
    snapshotVersion: resolveSnapshotVersion(input),
    templateVersion: SALE_RAYX_SHARE_TEMPLATE_VERSION,
    variant: input.variant ?? "sale",
    productImage: resolveProductImage(input.product),
    marketplace: marketplaceLabel,
    marketplaceLabel,
    marketplaceAccentColor,
    listing: input.listingTitle ?? null,
    health: null,
    renderModel,
  };
}

export function buildShareCacheKey(payload: SaleRayXSharePayload): string {
  return `${payload.saleId}:${payload.snapshotVersion}:${payload.templateVersion}`;
}

export type GenerateShareImageResult = {
  blob: Blob;
  cacheKey: string;
  cacheHit: boolean;
  caption: string;
  mimeType: string;
};

/**
 * Gera imagem uma vez e reutiliza cache in-memory por sessão.
 */
export async function generateSaleRayxShareImage(
  input: SaleRayXShareInput,
  _outputMode: SaleRayXShareOutputMode = "copy",
): Promise<GenerateShareImageResult> {
  const payload = buildSaleRayxSharePayload(input);
  const cacheKey = buildShareCacheKey(payload);
  const cached = imageCache.get(cacheKey);
  const caption = resolveWhatsappCaption(payload.templateVersion);
  if (cached?.blob) {
    return {
      blob: cached.blob,
      cacheKey,
      cacheHit: true,
      caption,
      mimeType: "image/png",
    };
  }

  const blob = await exportSaleRayxShareImage({ payload, format: "png" });
  imageCache.set(cacheKey, { blob, createdAt: Date.now() });

  if (import.meta.env.DEV) {
    console.info("[S7 Raio-X ShareRenderer] image_generated", {
      cache_key: cacheKey,
      output_mode: _outputMode,
      template_version: payload.templateVersion,
    });
  }

  return {
    blob,
    cacheKey,
    cacheHit: false,
    caption,
    mimeType: "image/png",
  };
}

export async function blobToBase64DataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Falha ao converter imagem."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler blob."));
    reader.readAsDataURL(blob);
  });
}

export function clearSaleRayxShareCache(saleId?: string) {
  if (!saleId) {
    imageCache.clear();
    return;
  }
  for (const key of imageCache.keys()) {
    if (key.startsWith(`${saleId}:`)) imageCache.delete(key);
  }
}

export { WHATSAPP_SHARE_CAPTION, SALE_RAYX_SHARE_TEMPLATE_VERSION };
