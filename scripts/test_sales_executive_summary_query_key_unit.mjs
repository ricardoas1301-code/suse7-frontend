import assert from "node:assert/strict";
import { filtroRapidoVendasAfetaResumoExecutivo } from "../src/features/vendas/filters/vendasQuickFiltersConfig.js";

function buildSalesExecutiveSummaryQueryKey(params) {
  const p = params ?? {};
  const parts = [
    ["marketplace", p.marketplace ?? ""],
    ["marketplace_account_id", p.marketplace_account_id ?? ""],
    ["seller_company_id", p.seller_company_id ?? ""],
    ["q", p.q ?? ""],
    ["filter", p.filter ?? ""],
    ["period_preset", p.period_preset ?? ""],
    ["start_date", p.start_date ?? p.period_start ?? ""],
    ["end_date", p.end_date ?? p.period_end ?? ""],
    ["start_datetime", p.start_datetime ?? ""],
    ["end_datetime", p.end_datetime ?? ""],
    ["ranking_limit", p.ranking_limit ?? ""],
    ["product_id", p.product_id ?? ""],
  ];
  return parts.map(([k, v]) => `${k}=${String(v).trim()}`).join("&");
}

const keyA = buildSalesExecutiveSummaryQueryKey({
  start_date: "2026-06-16",
  end_date: "2026-07-16",
  period_preset: "custom",
  filter: "loss",
});
const keyB = buildSalesExecutiveSummaryQueryKey({
  period_preset: "custom",
  start_date: "2026-06-16",
  end_date: "2026-07-16",
  filter: "loss",
});
assert.equal(keyA, keyB, "query key deve ser determinística independente da ordem de campos");

const keySortOnly = buildSalesExecutiveSummaryQueryKey({
  start_date: "2026-06-16",
  end_date: "2026-07-16",
  filter: undefined,
});
const keyProfitHigh = buildSalesExecutiveSummaryQueryKey({
  start_date: "2026-06-16",
  end_date: "2026-07-16",
  filter: "profit_high",
});
assert.notEqual(keySortOnly, keyProfitHigh);

assert.equal(filtroRapidoVendasAfetaResumoExecutivo("profit_high"), false);
assert.equal(filtroRapidoVendasAfetaResumoExecutivo("loss"), true);

console.log("test_sales_executive_summary_query_key_unit.mjs — OK");
