import assert from "node:assert/strict";
import { applyPrecificacoesCatalogFilters } from "../src/features/listings/filters/applyPrecificacoesCatalogFilters.js";

function row(id, profit, sales = 0, financial = profit != null) {
  return {
    id,
    salesCount: sales,
    catalog_pricing_health_buckets: {
      offer_status_bucket: "healthy",
      projected_margin_bucket: "margin_20_29",
      promotion_bucket: "no_promotion",
      listing_type_key: "classic",
      free_shipping: false,
      financial_evaluable: financial,
      profit_brl: profit != null ? String(profit) : null,
      margin_pct: financial ? "20.00" : null,
    },
  };
}

// Mais lucrativos — C(300), A(100), D(0), E(-20), B/F ausentes
const topProfitSorted = applyPrecificacoesCatalogFilters(
  [
    row("A", 100),
    row("B", null),
    row("C", 300),
    row("D", 0),
    row("E", -20),
    row("F", null, 0, false),
  ],
  "top_profit",
).map((r) => String(r.id));

assert.deepEqual(topProfitSorted, ["C", "A", "D", "E", "B", "F"]);

// Mais vendidos — C(300,ok), A(100,ok), D(50,ok), B(500,sem), E(200,sem)
const topSalesSorted = applyPrecificacoesCatalogFilters(
  [
    row("A", 10, 100, true),
    row("B", null, 500, false),
    row("C", 30, 300, true),
    row("D", 5, 50, true),
    row("E", null, 200, false),
  ],
  "top_sales",
).map((r) => String(r.id));

assert.deepEqual(topSalesSorted, ["C", "A", "D", "B", "E"]);

console.log("[test_precificacoes_sort_nulls_last_unit] OK");
