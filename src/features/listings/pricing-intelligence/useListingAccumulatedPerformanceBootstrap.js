import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildAccumulatedPerformanceBootstrapContext,
  buildAccumulatedPerformanceBootstrapCacheKey,
  describeAccumulatedScopeRejection,
  fetchListingAccumulatedPerformanceBootstrap,
  isAtomicCompleteAccumulatedScope,
  logPiProductAccumulatedBootstrapDev,
  mergeAccumulatedPerformanceSnapshot,
  rowNeedsProductAccumulatedBootstrap,
  ACCUMULATED_BOOTSTRAP_CACHE_VERSION,
} from "../../../services/listingAccumulatedPerformanceApi.js";
import { tracePiProductRenderStage } from "./piProductRenderTrace.js";

/**
 * @param {Record<string, unknown> | null | undefined} baseRow
 * @param {string | null | undefined} [routeListingId]
 */
export function useListingAccumulatedPerformanceBootstrap(baseRow, routeListingId = null) {
  const [bootstrapAp, setBootstrapAp] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [loading, setLoading] = useState(false);
  const activeKeyRef = useRef("");

  const bootstrapCtx = useMemo(() => {
    const ctx = buildAccumulatedPerformanceBootstrapContext(baseRow);
    if (!ctx.internalListingId && routeListingId != null && String(routeListingId).trim() !== "") {
      ctx.internalListingId = String(routeListingId).trim();
    }
    return ctx;
  }, [
    baseRow,
    routeListingId,
    baseRow?.id,
    baseRow?.externalId,
    baseRow?.productId,
    baseRow?.product_id,
    baseRow?.marketplaceAccountId,
    baseRow?.marketplaceRaw,
  ]);

  const bootstrapKey = useMemo(
    () => buildAccumulatedPerformanceBootstrapCacheKey(bootstrapCtx),
    [bootstrapCtx],
  );

  const needsProductBootstrap = useMemo(() => {
    if (baseRow == null || typeof baseRow !== "object") return false;
    if (!bootstrapCtx.externalListingId) return false;
    return rowNeedsProductAccumulatedBootstrap(baseRow);
  }, [baseRow, bootstrapCtx.externalListingId]);

  useEffect(() => {
    activeKeyRef.current = bootstrapKey;

    if (!needsProductBootstrap) {
      setBootstrapAp(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setBootstrapAp(null);

    void (async () => {
      const startedMs = Date.now();
      const result = await fetchListingAccumulatedPerformanceBootstrap(bootstrapCtx);
      if (cancelled || activeKeyRef.current !== bootstrapKey) return;

      setLoading(false);

      const responseAp = result?.accumulated_performance ?? null;
      const productScope =
        responseAp?.product != null && typeof responseAp.product === "object"
          ? /** @type {Record<string, unknown>} */ (responseAp.product)
          : null;
      const listingScope =
        responseAp?.listing != null && typeof responseAp.listing === "object"
          ? /** @type {Record<string, unknown>} */ (responseAp.listing)
          : null;
      const frontendScopeComplete = isAtomicCompleteAccumulatedScope(productScope);
      const frontendRejectionReason = frontendScopeComplete
        ? null
        : describeAccumulatedScopeRejection(productScope);

      logPiProductAccumulatedBootstrapDev({
        external_listing_id: bootstrapCtx.externalListingId,
        internal_listing_id: bootstrapCtx.internalListingId,
        marketplace: bootstrapCtx.marketplace,
        marketplace_account_id: bootstrapCtx.marketplaceAccountId,
        row_product_id: baseRow?.product_id ?? null,
        row_productId: baseRow?.productId ?? null,
        normalized_product_id: bootstrapCtx.productId,
        sku: bootstrapCtx.sku,
        request_url: "/api/ml/listings/accumulated-performance",
        request_product_id: bootstrapCtx.productId,
        request_account_id: bootstrapCtx.marketplaceAccountId,
        request_marketplace: bootstrapCtx.marketplace,
        cache_key: result?.cache_key ?? bootstrapKey,
        cache_version: ACCUMULATED_BOOTSTRAP_CACHE_VERSION,
        cache_hit: result?.cache_hit ?? false,
        cache_miss: result?.cache_miss ?? false,
        inflight_hit: result?.inflight_hit ?? false,
        http_status: result?.http_status ?? null,
        response_meta_source:
          responseAp?.meta != null && typeof responseAp.meta === "object"
            ? /** @type {Record<string, unknown>} */ (responseAp.meta).source ?? null
            : null,
        response_meta_availability:
          responseAp?.meta != null && typeof responseAp.meta === "object"
            ? /** @type {Record<string, unknown>} */ (responseAp.meta).availability ?? null
            : null,
        response_listing_scope: listingScope,
        response_product_scope: productScope,
        product_sales_quantity: productScope?.sales_quantity ?? null,
        product_sales_amount_brl: productScope?.sales_amount_brl ?? null,
        product_sales_profit_brl: productScope?.sales_profit_brl ?? null,
        product_sales_profit_percent: productScope?.sales_profit_percent ?? null,
        frontend_scope_complete: frontendScopeComplete,
        frontend_rejection_reason: frontendRejectionReason,
        elapsed_ms: Date.now() - startedMs,
      });

      if (responseAp) {
        setBootstrapAp(responseAp);
        const merged = mergeAccumulatedPerformanceSnapshot(
          baseRow?.accumulated_performance,
          responseAp,
        );
        tracePiProductRenderStage("bootstrap_resolved", {
          external_listing_id: bootstrapCtx.externalListingId,
          internal_listing_id: bootstrapCtx.internalListingId,
          product_id: bootstrapCtx.productId,
          original_row: baseRow,
          merged_row: baseRow != null ? { ...baseRow, accumulated_performance: merged } : null,
          bootstrap_enabled: true,
          bootstrap_loading: false,
          bootstrap_resolved: true,
          http_status: result?.http_status ?? null,
          response_product: productScope,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrapKey, needsProductBootstrap]);

  const row = useMemo(() => {
    if (baseRow == null || typeof baseRow !== "object") return baseRow;
    if (bootstrapAp == null) return baseRow;
    const merged = mergeAccumulatedPerformanceSnapshot(
      baseRow.accumulated_performance,
      bootstrapAp,
    );
    return {
      ...baseRow,
      accumulated_performance: merged,
    };
  }, [baseRow, bootstrapAp]);

  return {
    row,
    loadingBootstrap: loading,
    cacheKey: bootstrapKey,
    needsProductBootstrap,
  };
}
