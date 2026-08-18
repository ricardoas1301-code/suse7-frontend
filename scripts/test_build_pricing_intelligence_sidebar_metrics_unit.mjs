/**
 * FE — PI sidebar consome accumulated_performance (não product_card_metrics legado).
 * Executar: node scripts/test_build_pricing_intelligence_sidebar_metrics_unit.mjs
 */

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pickNonEmptyString(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw).trim();
}

function formatIntegerBR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR");
}

function buildSidebarMetricsFromAccumulated(row) {
  const ap =
    row.accumulated_performance != null && typeof row.accumulated_performance === "object"
      ? row.accumulated_performance
      : null;
  const listing = ap?.listing ?? null;
  const product = ap?.product ?? null;
  const listingQty =
    listing?.sales_quantity != null ? formatIntegerBR(listing.sales_quantity) : "—";
  const productQty =
    product?.sales_quantity != null ? formatIntegerBR(product.sales_quantity) : "—";
  const legacy = row.product_card_metrics ?? {};
  const legacyQty =
    legacy.listingSalesCount != null ? formatIntegerBR(legacy.listingSalesCount) : "—";
  return { listingQty, productQty, legacyQty, listingGross: pickNonEmptyString(listing?.sales_amount_brl) };
}

{
  const row = {
    accumulated_performance: {
      listing: {
        sales_quantity: "161",
        sales_amount_brl: "42291.65",
        sales_profit_brl: "2271.52",
        sales_profit_percent: "5.37",
      },
      product: {
        sales_quantity: "327",
        sales_amount_brl: "87443.40",
        sales_profit_brl: "6888.42",
        sales_profit_percent: "7.88",
      },
    },
    product_card_metrics: {
      listingSalesCount: 95,
      listingSalesAmountBrl: "25072.32",
      listingProfitBrl: "6044.80",
      listingProfitPercent: "24.11",
    },
  };
  const m = buildSidebarMetricsFromAccumulated(row);
  assert(m.listingQty === "161", "PI listing qty SSOT");
  assert(m.productQty === "327", "PI product qty SSOT");
  assert(m.legacyQty === "95", "legacy still present but not selected");
  assert(m.listingGross === "42291.65", "PI gross SSOT");
  assert(m.listingQty !== m.legacyQty, "PI não usa números antigos");
}

console.log(JSON.stringify({ ok: true, suite: "build_pricing_intelligence_sidebar_metrics_unit" }));
