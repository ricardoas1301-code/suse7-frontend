// ======================================================================
// Trace DEV — pipeline renderizado do Produto acumulado no PI.
// ======================================================================

import {
  describeAccumulatedScopeRejection,
  isAtomicCompleteAccumulatedScope,
} from "../../../services/listingAccumulatedPerformanceContract.js";

/**
 * @param {Record<string, unknown>} payload
 */
export function logPiProductRenderTrace(payload) {
  if (import.meta.env.PROD) return;
  console.info("[S7_PI_PRODUCT_RENDER_TRACE]", payload);
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {Record<string, unknown> | null}
 */
function readProductScope(row) {
  const ap =
    row?.accumulated_performance != null && typeof row.accumulated_performance === "object"
      ? /** @type {Record<string, unknown>} */ (row.accumulated_performance)
      : null;
  const product =
    ap?.product != null && typeof ap.product === "object"
      ? /** @type {Record<string, unknown>} */ (ap.product)
      : null;
  return product;
}

/**
 * @param {string} stage
 * @param {Record<string, unknown>} ctx
 */
export function tracePiProductRenderStage(stage, ctx) {
  const originalRow =
    ctx.original_row != null && typeof ctx.original_row === "object"
      ? /** @type {Record<string, unknown>} */ (ctx.original_row)
      : null;
  const mergedRow =
    ctx.merged_row != null && typeof ctx.merged_row === "object"
      ? /** @type {Record<string, unknown>} */ (ctx.merged_row)
      : null;
  const sidebarProduct =
    ctx.sidebar_product != null && typeof ctx.sidebar_product === "object"
      ? /** @type {Record<string, unknown>} */ (ctx.sidebar_product)
      : null;

  const normalizedProduct = readProductScope(mergedRow ?? originalRow);
  const scopeComplete = isAtomicCompleteAccumulatedScope(normalizedProduct);

  logPiProductRenderTrace({
    stage,
    external_listing_id: ctx.external_listing_id ?? originalRow?.externalId ?? null,
    internal_listing_id: ctx.internal_listing_id ?? originalRow?.id ?? null,
    product_id: ctx.product_id ?? originalRow?.productId ?? originalRow?.product_id ?? null,
    bootstrap_enabled: ctx.bootstrap_enabled ?? null,
    bootstrap_loading: ctx.bootstrap_loading ?? null,
    bootstrap_resolved: ctx.bootstrap_resolved ?? null,
    bootstrap_error: ctx.bootstrap_error ?? null,
    http_status: ctx.http_status ?? null,
    response_product: ctx.response_product ?? null,
    normalized_product: normalizedProduct,
    original_row_product: readProductScope(originalRow),
    merged_row_product: readProductScope(mergedRow),
    sidebar_product: sidebarProduct,
    header_product: ctx.header_product ?? null,
    render_product: ctx.render_product ?? null,
    scope_complete: scopeComplete,
    rejection_reason: scopeComplete ? null : describeAccumulatedScopeRejection(normalizedProduct),
  });
}
