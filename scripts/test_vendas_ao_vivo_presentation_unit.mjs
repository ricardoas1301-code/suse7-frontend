#!/usr/bin/env node
/**
 * Prova de apresentação — API canônica = campos UI (sem recálculo financeiro local).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const feRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalUrl = pathToFileURL(
  path.join(feRoot, "src/features/sales/executiveSummaryCanonicalFields.js"),
).href;
const displayPath = path.join(feRoot, "src/features/sales/executiveSummaryDisplay.js");

const {
  resolveDailySummaryCanonicalResultFields,
  resolveExecutiveSummaryEffectiveTotalCostsBrl,
  resolveExecutiveSummarySettlementCreditsBrl,
} = await import(canonicalUrl);

const SETTLEMENT_CREDITS_TOOLTIP =
  "Descontos, bônus e outros créditos concedidos pelo Mercado Livre na liquidação da venda, reduzindo o custo efetivo.";

const apiSummary = {
  gross_sales_brl: "4710.73",
  orders_count: 46,
  net_received_brl: "3009.54",
  you_receive_brl: "3009.54",
  contribution_profit_brl: "593.37",
  contribution_margin_percent: "12.60",
  marketplace_fee_brl: "727.92",
  shipping_cost_brl: "986.86",
  product_cost_only_brl: "1462.50",
  tax_cost_brl: "821.11",
  operation_packaging_cost_brl: "39.50",
  ads_cost_brl: "47.53",
  operational_costs_brl: "45.53",
  nominal_costs_brl: "4130.95",
  marketplace_settlement_credits_brl: "13.59",
  total_costs_brl: "4117.36",
};

const canonical = resolveDailySummaryCanonicalResultFields(apiSummary);
assert.equal(canonical.payoutRaw, "3009.54");
assert.equal(canonical.netProfitRaw, "593.37");
assert.equal(canonical.marginRaw, "12.60");
assert.equal(resolveExecutiveSummarySettlementCreditsBrl(apiSummary), "13.59");
assert.equal(resolveExecutiveSummaryEffectiveTotalCostsBrl(apiSummary), "4117.36");

const displaySrc = fs.readFileSync(displayPath, "utf8");
assert.ok(displaySrc.includes("Créditos e bônus ML"));
assert.ok(displaySrc.includes(SETTLEMENT_CREDITS_TOOLTIP));
assert.ok(displaySrc.includes("MARKETPLACE_SETTLEMENT_CREDITS_LABEL_TIP"));
assert.ok(displaySrc.includes("resolveExecutiveSummaryEffectiveTotalCostsBrl"));
assert.ok(!displaySrc.includes("marketplace_costs_brl"));

console.log("[OK] test_vendas_ao_vivo_presentation_unit");
