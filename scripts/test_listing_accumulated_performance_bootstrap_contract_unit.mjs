/**
 * CP2.2 — contrato bootstrap PI produto (cache, merge, formatação).
 * Executar: node scripts/test_listing_accumulated_performance_bootstrap_contract_unit.mjs
 */
import { formatAccumulatedPerformanceScope } from "../src/features/shared/formatAccumulatedPerformanceScope.js";
import {
  ACCUMULATED_BOOTSTRAP_CACHE_VERSION,
  buildAccumulatedPerformanceBootstrapCacheKey,
  buildAccumulatedPerformanceBootstrapContext,
  describeAccumulatedScopeRejection,
  isAtomicCompleteAccumulatedScope,
  mergeAccumulatedPerformanceSnapshot,
  resolveCanonicalProductIdFromListingRow,
  rowNeedsProductAccumulatedBootstrap,
} from "../src/services/listingAccumulatedPerformanceContract.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEq(actual, expected, label) {
  if (String(actual) !== String(expected)) {
    throw new Error(`${label}: esperado ${expected}, obtido ${actual}`);
  }
}

const CASES = [
  {
    name: "CASE_A",
    externalId: "MLB6415546858",
    productId: "prod-a",
    listingRowId: "row-a",
    product: {
      sales_quantity: "831",
      sales_amount_brl: "62945.09",
      sales_profit_brl: "-9172.99",
      sales_profit_percent: "-14.57",
    },
  },
  {
    name: "CASE_B",
    externalId: "MLB4344864929",
    productId: "prod-b",
    listingRowId: "row-b",
    product: {
      sales_quantity: "127",
      sales_amount_brl: "4457.41",
      sales_profit_brl: "699.19",
      sales_profit_percent: "15.69",
    },
  },
  {
    name: "CASE_C",
    externalId: "MLB3303280951",
    productId: "prod-c",
    listingRowId: "row-c",
    product: {
      sales_quantity: "191",
      sales_amount_brl: "30034.38",
      sales_profit_brl: "-119.42",
      sales_profit_percent: "-0.40",
    },
  },
];

{
  const row = { productId: "uuid-1", product_id: null, catalog_product_id: "uuid-2" };
  assertEq(resolveCanonicalProductIdFromListingRow(row), "uuid-1", "productId precedence");
}

for (const c of CASES) {
  const gridRow = {
    id: c.listingRowId,
    externalId: c.externalId,
    productId: c.productId,
    marketplaceRaw: "mercado_livre",
    marketplaceAccountId: "acc-1",
    accumulated_performance: {
      listing: {
        sales_quantity: "1",
        sales_amount_brl: "1.00",
        sales_profit_brl: "1.00",
        sales_profit_percent: "1.00",
      },
      product: {
        sales_quantity: null,
        sales_amount_brl: null,
        sales_profit_brl: null,
        sales_profit_percent: null,
      },
      meta: { availability: "listing_only" },
    },
  };
  assert(rowNeedsProductAccumulatedBootstrap(gridRow), `${c.name} needs bootstrap`);
  const ctx = buildAccumulatedPerformanceBootstrapContext(gridRow);
  const key = buildAccumulatedPerformanceBootstrapCacheKey(ctx);
  assert(key.includes(ACCUMULATED_BOOTSTRAP_CACHE_VERSION), `${c.name} cache v2`);
  assert(key.includes(c.productId), `${c.name} key product`);
  assert(key.includes(c.listingRowId), `${c.name} key listing row`);

  const merged = mergeAccumulatedPerformanceSnapshot(gridRow.accumulated_performance, {
    listing: gridRow.accumulated_performance.listing,
    product: c.product,
    meta: { availability: "complete", source: "bootstrap" },
  });
  assert(isAtomicCompleteAccumulatedScope(merged.product), `${c.name} merged product complete`);
  assertEq(merged.product.sales_quantity, c.product.sales_quantity, `${c.name} qty`);
  assertEq(merged.product.sales_profit_brl, c.product.sales_profit_brl, `${c.name} profit`);

  const formatted = formatAccumulatedPerformanceScope(merged.product);
  assertEq(formatted.salesQuantity, c.product.sales_quantity, `${c.name} formatted qty`);
  assert(formatted.profitAmount.includes(","), `${c.name} formatted profit pt-BR`);
}

{
  const incomplete = { sales_quantity: "1", sales_amount_brl: "1", sales_profit_brl: null, sales_profit_percent: "1" };
  assertEq(describeAccumulatedScopeRejection(incomplete), "missing_sales_profit_brl", "rejection profit");
}

{
  const prev = {
    listing: { sales_quantity: "68", sales_amount_brl: "5040.14", sales_profit_brl: "1164.92", sales_profit_percent: "23.11" },
    product: { sales_quantity: null, sales_amount_brl: null, sales_profit_brl: null, sales_profit_percent: null },
  };
  const next = {
    listing: { sales_quantity: "69", sales_amount_brl: "5115.13", sales_profit_brl: "1205.04", sales_profit_percent: "23.56" },
    product: { sales_quantity: "130", sales_amount_brl: "9386.28", sales_profit_brl: "2292.35", sales_profit_percent: "24.42" },
  };
  const merged = mergeAccumulatedPerformanceSnapshot(prev, next);
  assertEq(merged.listing.sales_quantity, "69", "cuba merge listing from next");
  assertEq(merged.product.sales_quantity, "130", "cuba merge product from next");
}

{
  const keyA = buildAccumulatedPerformanceBootstrapCacheKey({
    internalListingId: "r1",
    externalListingId: "MLB1",
    marketplace: "mercado_livre",
    marketplaceAccountId: "a1",
    productId: "p1",
  });
  const keyB = buildAccumulatedPerformanceBootstrapCacheKey({
    internalListingId: "r2",
    externalListingId: "MLB2",
    marketplace: "mercado_livre",
    marketplaceAccountId: "a1",
    productId: "p1",
  });
  assert(keyA !== keyB, "cache key changes on listing");
}

console.log(JSON.stringify({ ok: true, suite: "listing_accumulated_performance_bootstrap_contract_unit", cases: CASES.length }));
