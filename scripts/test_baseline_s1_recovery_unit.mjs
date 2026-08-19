#!/usr/bin/env node
/**
 * Guarda de recuperação baseline S1 — zero legítimo vs erro técnico.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const feRoot = join(root, "..");

const {
  normalizeSalesExecutiveSummary,
  resolveDailySummaryPresentationState,
  isSalesExecutiveSummaryZeroUniverse,
} = await import(
  pathToFileURL(join(feRoot, "src/features/sales/normalizeSalesExecutiveSummary.js")).href
);

const {
  EXECUTIVE_PANEL_EMPTY_RANKING_MESSAGE,
  EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
  EXECUTIVE_PANEL_ERROR_MESSAGE,
} = await import(
  pathToFileURL(join(feRoot, "src/components/sales/vendasExecutivePanelUx.js")).href
);

const kpiDisplaySrc = readFileSync(
  join(feRoot, "src/components/sales/useVendasExecutiveKpiDisplay.js"),
  "utf8",
);
assert.ok(kpiDisplaySrc.includes("EXECUTIVE_PANEL_EMPTY_KPI_VALUE"), "KPI zero fallback wired");

const { LISTINGS_EMPTY_CATALOG_MESSAGE } = await import(
  pathToFileURL(join(feRoot, "src/features/listings/config/listingsPageModes.js")).href
);

const emptyPayload = {
  ok: true,
  summary: {
    orders_count: 0,
    items_quantity_sold: 0,
    gross_sales_brl: "0.00",
    contribution_profit_brl: "0.00",
    contribution_margin_percent: "0.00",
  },
  rankings: {
    listings_by_quantity: [],
    listings_by_gross_revenue: [],
    listings_by_net_profit: [],
  },
};

const normalized = normalizeSalesExecutiveSummary(emptyPayload);
assert.equal(normalized?.orders_count, 0, "orders_count zero");
assert.equal(normalized?._s7_zero_universe, true, "zero universe flag");
assert.equal(
  resolveDailySummaryPresentationState({ loading: false, error: null, summary: emptyPayload.summary }),
  "zero",
  "presentation zero when API ok + zero vendas",
);
assert.equal(
  resolveDailySummaryPresentationState({ loading: false, error: "fail", summary: null }),
  "error",
  "presentation error when falha técnica",
);
assert.equal(isSalesExecutiveSummaryZeroUniverse(normalized), true);

assert.equal(EXECUTIVE_PANEL_EMPTY_KPI_VALUE, "0,00");
assert.equal(EXECUTIVE_PANEL_EMPTY_RANKING_MESSAGE, "Nenhuma venda encontrada");
assert.equal(EXECUTIVE_PANEL_ERROR_MESSAGE, "Não foi possível carregar os dados.");
assert.equal(
  LISTINGS_EMPTY_CATALOG_MESSAGE,
  "Importe ou vincule seus anúncios. Se já importou, aguarde a sincronização ou tente recarregar.",
);

const vendasPageSrc = readFileSync(join(feRoot, "src/pages/VendasPage.jsx"), "utf8");
assert.ok(vendasPageSrc.includes("trulyEmptyVendasCatalog"), "lista pré-sync gate presente");
assert.ok(vendasPageSrc.includes("LISTINGS_EMPTY_CATALOG_MESSAGE"), "copy canônica lista vendas");
assert.ok(vendasPageSrc.includes("S7EmptyState"), "empty state visual lista vendas");

const top10HookSrc = readFileSync(join(feRoot, "src/hooks/useSalesTop10.js"), "utf8");
assert.ok(top10HookSrc.includes("isRealEmpty"), "top10 empty detection presente");

console.log("test_baseline_s1_recovery_unit: PASS");
