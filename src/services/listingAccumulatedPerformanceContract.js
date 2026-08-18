// ======================================================================
// Contrato puro — desempenho acumulado PI (sem fetch / sem Vite).
// ======================================================================

export const ACCUMULATED_BOOTSTRAP_CACHE_VERSION = "v2";

/**
 * @param {Record<string, unknown> | null | undefined} row
 */
export function resolveCanonicalProductIdFromListingRow(row) {
  if (row == null || typeof row !== "object") return "";
  const candidates = [
    row.productId,
    row.product_id,
    row.catalog_product_id,
    row.catalogProductId,
  ];
  for (const raw of candidates) {
    if (raw == null || String(raw).trim() === "") continue;
    return String(raw).trim();
  }
  return "";
}

/**
 * @param {{
 *   internalListingId?: string | null;
 *   externalListingId?: string | null;
 *   marketplace?: string | null;
 *   marketplaceAccountId?: string | null;
 *   productId?: string | null;
 * }} ctx
 */
export function buildAccumulatedPerformanceBootstrapCacheKey(ctx) {
  const externalId = String(ctx.externalListingId ?? "").trim();
  const marketplace = String(ctx.marketplace ?? "").trim();
  const accountId = String(ctx.marketplaceAccountId ?? "").trim();
  const productId = String(ctx.productId ?? "").trim();
  const internalListingId = String(ctx.internalListingId ?? "").trim();
  return `${ACCUMULATED_BOOTSTRAP_CACHE_VERSION}:${internalListingId}:${externalId}:${marketplace}:${accountId}:${productId}`;
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 */
export function buildAccumulatedPerformanceBootstrapContext(row) {
  if (row == null || typeof row !== "object") {
    return {
      internalListingId: "",
      externalListingId: "",
      marketplace: "",
      marketplaceAccountId: "",
      productId: "",
      sku: "",
    };
  }
  return {
    internalListingId: row.id != null ? String(row.id).trim() : "",
    externalListingId:
      row.externalId != null
        ? String(row.externalId).trim()
        : row.external_listing_id != null
          ? String(row.external_listing_id).trim()
          : "",
    marketplace:
      row.marketplaceRaw != null
        ? String(row.marketplaceRaw).trim()
        : row.marketplace != null
          ? String(row.marketplace).trim()
          : "",
    marketplaceAccountId:
      row.marketplaceAccountId != null
        ? String(row.marketplaceAccountId).trim()
        : row.marketplace_account_id != null
          ? String(row.marketplace_account_id).trim()
          : "",
    productId: resolveCanonicalProductIdFromListingRow(row),
    sku: row.sku != null ? String(row.sku).trim() : "",
  };
}

/**
 * @param {unknown} scope
 */
export function isAtomicCompleteAccumulatedScope(scope) {
  if (scope == null || typeof scope !== "object") return false;
  const s = /** @type {Record<string, unknown>} */ (scope);
  const qty = s.sales_quantity;
  const gross = s.sales_amount_brl;
  const profit = s.sales_profit_brl;
  const pct = s.sales_profit_percent;
  return (
    qty != null &&
    String(qty).trim() !== "" &&
    gross != null &&
    String(gross).trim() !== "" &&
    profit != null &&
    String(profit).trim() !== "" &&
    pct != null &&
    String(pct).trim() !== ""
  );
}

/**
 * @param {unknown} scope
 * @returns {string | null}
 */
export function describeAccumulatedScopeRejection(scope) {
  if (scope == null || typeof scope !== "object") return "scope_null";
  const s = /** @type {Record<string, unknown>} */ (scope);
  if (s.sales_quantity == null || String(s.sales_quantity).trim() === "") return "missing_sales_quantity";
  if (s.sales_amount_brl == null || String(s.sales_amount_brl).trim() === "") return "missing_sales_amount_brl";
  if (s.sales_profit_brl == null || String(s.sales_profit_brl).trim() === "") return "missing_sales_profit_brl";
  if (s.sales_profit_percent == null || String(s.sales_profit_percent).trim() === "") {
    return "missing_sales_profit_percent";
  }
  return null;
}

/**
 * @param {Record<string, unknown>} row
 */
export function rowHasCompleteAccumulatedPerformance(row) {
  const ap =
    row.accumulated_performance != null && typeof row.accumulated_performance === "object"
      ? /** @type {Record<string, unknown>} */ (row.accumulated_performance)
      : null;
  if (!ap) return false;
  return (
    isAtomicCompleteAccumulatedScope(ap.listing) && isAtomicCompleteAccumulatedScope(ap.product)
  );
}

/**
 * @param {Record<string, unknown>} row
 */
export function rowNeedsProductAccumulatedBootstrap(row) {
  if (row == null || typeof row !== "object") return false;
  const ctx = buildAccumulatedPerformanceBootstrapContext(row);
  if (!ctx.externalListingId) return false;
  const ap =
    row.accumulated_performance != null && typeof row.accumulated_performance === "object"
      ? /** @type {Record<string, unknown>} */ (row.accumulated_performance)
      : null;
  const productScope =
    ap?.product != null && typeof ap.product === "object"
      ? /** @type {Record<string, unknown>} */ (ap.product)
      : null;
  if (isAtomicCompleteAccumulatedScope(productScope)) return false;
  return resolveCanonicalProductIdFromListingRow(row) !== "" || ctx.internalListingId !== "";
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown> | null}
 */
export function readAccumulatedPerformanceFromRow(row) {
  return row.accumulated_performance != null && typeof row.accumulated_performance === "object"
    ? /** @type {Record<string, unknown>} */ (row.accumulated_performance)
    : null;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown> | null}
 */
export function readOfficialListingScopeFromRow(row) {
  const qty =
    row.salesCount != null && Number.isFinite(Number(row.salesCount))
      ? String(Math.trunc(Number(row.salesCount)))
      : null;
  const pick = (raw) => (raw != null && String(raw).trim() !== "" ? String(raw).trim() : null);
  const scope = {
    sales_quantity: qty,
    sales_amount_brl: pick(row.grossRevenueBrl ?? row.grossSalesBrl),
    sales_profit_brl: pick(row.contributionProfitBrl ?? row.netProfitBrl),
    sales_profit_percent: pick(row.contributionMarginPercent),
  };
  return isAtomicCompleteAccumulatedScope(scope) ? scope : null;
}

/**
 * @param {Record<string, unknown>} row
 * @param {"listing" | "product"} kind
 * @returns {Record<string, unknown> | null}
 */
export function resolveCanonicalAccumulatedScope(row, kind) {
  const ap = readAccumulatedPerformanceFromRow(row);
  const fromAp =
    ap?.[kind] != null && typeof ap[kind] === "object"
      ? /** @type {Record<string, unknown>} */ (ap[kind])
      : null;
  if (isAtomicCompleteAccumulatedScope(fromAp)) {
    return fromAp;
  }
  if (kind === "listing") {
    return readOfficialListingScopeFromRow(row);
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} existing
 * @param {Record<string, unknown> | null | undefined} incoming
 */
export function mergeAccumulatedPerformanceSnapshot(existing, incoming) {
  const prev =
    existing != null && typeof existing === "object"
      ? /** @type {Record<string, unknown>} */ (existing)
      : {};
  const next =
    incoming != null && typeof incoming === "object"
      ? /** @type {Record<string, unknown>} */ (incoming)
      : {};
  const prevListing =
    prev.listing != null && typeof prev.listing === "object"
      ? /** @type {Record<string, unknown>} */ (prev.listing)
      : null;
  const nextListing =
    next.listing != null && typeof next.listing === "object"
      ? /** @type {Record<string, unknown>} */ (next.listing)
      : null;
  const prevProduct =
    prev.product != null && typeof prev.product === "object"
      ? /** @type {Record<string, unknown>} */ (prev.product)
      : null;
  const nextProduct =
    next.product != null && typeof next.product === "object"
      ? /** @type {Record<string, unknown>} */ (next.product)
      : null;

  const listing = isAtomicCompleteAccumulatedScope(nextListing)
    ? nextListing
    : isAtomicCompleteAccumulatedScope(prevListing)
      ? prevListing
      : nextListing ?? prevListing ?? null;
  const product = isAtomicCompleteAccumulatedScope(nextProduct)
    ? nextProduct
    : isAtomicCompleteAccumulatedScope(prevProduct)
      ? prevProduct
      : nextProduct ?? prevProduct ?? null;

  const meta =
    next.meta != null && typeof next.meta === "object"
      ? next.meta
      : prev.meta != null && typeof prev.meta === "object"
        ? prev.meta
        : {};

  return {
    listing,
    product,
    meta,
  };
}
