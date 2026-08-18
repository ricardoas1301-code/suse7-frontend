/**
 * CP2.3 — integração real PI modal: bootstrap → merge → scope → formatação header.
 * Executar: node scripts/test_pi_product_sidebar_integration_unit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatAccumulatedPerformanceScope } from "../src/features/shared/formatAccumulatedPerformanceScope.js";
import {
  mergeAccumulatedPerformanceSnapshot,
  resolveCanonicalAccumulatedScope,
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

function buildSidebarProductView(row) {
  const productScope = resolveCanonicalAccumulatedScope(row, "product");
  return formatAccumulatedPerformanceScope(productScope);
}

function buildGridRow(caseDef) {
  return {
    id: caseDef.listingRowId,
    externalId: caseDef.externalId,
    productId: caseDef.productId,
    marketplaceRaw: "mercado_livre",
    marketplaceAccountId: "acc-1",
    salesCount: caseDef.listing.qty,
    grossRevenueBrl: caseDef.listing.gross,
    contributionProfitBrl: caseDef.listing.profit,
    contributionMarginPercent: caseDef.listing.pct,
    accumulated_performance: {
      listing: {
        sales_quantity: caseDef.listing.qty,
        sales_amount_brl: caseDef.listing.gross,
        sales_profit_brl: caseDef.listing.profit,
        sales_profit_percent: caseDef.listing.pct,
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
}

const CASES = [
  {
    name: "TABUA",
    externalId: "MLB6086959274",
    listingRowId: "tabua-row",
    productId: "tabua-product",
    listing: { qty: "35", gross: "9250.68", profit: "833.78", pct: "9.01" },
    product: { qty: "327", gross: "87443.40", profit: "6888.42", pct: "7.88" },
  },
  {
    name: "KIT_MDF",
    externalId: "MLB6415546858",
    listingRowId: "kit-row",
    productId: "kit-product",
    listing: { qty: "430", gross: "33439.18", profit: "-1717.54", pct: "-5.14" },
    product: { qty: "831", gross: "62945.09", profit: "-9172.99", pct: "-14.57" },
  },
];

for (const c of CASES) {
  const gridRow = buildGridRow(c);
  assert(rowNeedsProductAccumulatedBootstrap(gridRow), `${c.name} modal grid precisa bootstrap`);

  const before = buildSidebarProductView(gridRow);
  assertEq(before.salesQuantity, "—", `${c.name} antes merge produto dash`);

  const listingBefore = resolveCanonicalAccumulatedScope(gridRow, "listing");
  assertEq(listingBefore?.sales_quantity, c.listing.qty, `${c.name} anúncio intacto antes merge`);

  const bootstrapPayload = {
    listing: gridRow.accumulated_performance.listing,
    product: {
      sales_quantity: c.product.qty,
      sales_amount_brl: c.product.gross,
      sales_profit_brl: c.product.profit,
      sales_profit_percent: c.product.pct,
    },
    meta: { availability: "complete", source: "bootstrap" },
  };

  const mergedRow = {
    ...gridRow,
    accumulated_performance: mergeAccumulatedPerformanceSnapshot(
      gridRow.accumulated_performance,
      bootstrapPayload,
    ),
  };

  const after = buildSidebarProductView(mergedRow);
  assertEq(after.salesQuantity, c.product.qty, `${c.name} sidebar qty`);
  assert(after.salesAmount.includes("R$"), `${c.name} sidebar gross formatado`);
  assert(after.profitAmount.includes("R$"), `${c.name} sidebar profit formatado`);
  assert(after.profitPercent.includes("%"), `${c.name} sidebar pct formatado`);

  const headerProps = {
    productSalesCount: after.salesQuantity,
    productSalesAmount: after.salesAmount,
    productProfitAmount: after.profitAmount,
    productProfitPercent: after.profitPercent,
  };
  assert(headerProps.productSalesCount !== "—", `${c.name} header props produto preenchido`);
}

{
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const contentPath = path.join(scriptDir, "../src/components/PricingIntelligenceContent.jsx");
  const decisionUiPath = path.join(scriptDir, "../src/components/pricing/pricingScenarioDecisionUi.js");
  const contentSrc = fs.readFileSync(contentPath, "utf8");
  const decisionUiSrc = fs.readFileSync(decisionUiPath, "utf8");
  assert(
    contentSrc.includes('from "./pricing/pricingScenarioDecisionUi.js"') &&
      contentSrc.includes("sortPricingScenariosForUi") &&
      contentSrc.includes("getBestScenarioId") &&
      contentSrc.includes("scenarioHeadingForUi"),
    "PricingIntelligenceContent deve importar helpers de pricingScenarioDecisionUi",
  );
  assert(
    decisionUiSrc.includes("export function sortPricingScenariosForUi"),
    "helper canônico sortPricingScenariosForUi exportado",
  );
}

console.log(JSON.stringify({ ok: true, suite: "pi_product_sidebar_integration_unit", cases: CASES.length }));
