// ======================================================
// buildSaleRayxSummary — única fonte de verdade (texto plano).
// Alimenta copiar, WhatsApp, e-mail, share nativo e impressão.
// ======================================================

import {
  buildSaleRayxSummaryRenderModel,
  renderModelToBodyLines,
} from "./saleRayxSummaryRender";

export { buildSaleRayxSummaryRenderModel } from "./saleRayxSummaryRender";

export const SALE_RAYX_SUMMARY_NOT_AVAILABLE = "Não disponível";

/** Título padrão S7 — copiar, WhatsApp, e-mail, share e impressão. */
export const SALE_RAYX_BRAND_TITLE = "Raio-X da Venda S7";

/**
 * Corpo do resumo (sem cabeçalho de marca).
 * @param {{
 *   general?: Record<string, unknown> | null;
 *   product?: Record<string, unknown> | null;
 *   financial?: Record<string, unknown> | null;
 *   profitMargin?: Record<string, unknown> | null;
 *   listingTitle?: string | null;
 *   saleContextMetrics?: Record<string, unknown> | null;
 * }} ctx
 * @returns {string[]}
 */
export function buildSaleRayxSummaryBody(ctx) {
  return renderModelToBodyLines(buildSaleRayxSummaryRenderModel(ctx));
}

/**
 * @param {{
 *   general?: Record<string, unknown> | null;
 *   product?: Record<string, unknown> | null;
 *   financial?: Record<string, unknown> | null;
 *   profitMargin?: Record<string, unknown> | null;
 *   listingTitle?: string | null;
 *   saleContextMetrics?: Record<string, unknown> | null;
 * }} ctx
 * @returns {string}
 */
export function buildSaleRayxSummary(ctx) {
  const body = buildSaleRayxSummaryBody(ctx);
  return [SALE_RAYX_BRAND_TITLE, "", ...body].join("\n");
}
