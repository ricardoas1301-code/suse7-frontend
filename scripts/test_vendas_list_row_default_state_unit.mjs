#!/usr/bin/env node
/**
 * Testes unitários — buildVendasListRow + estado padrão da lista (hotfix P0).
 * Uso: node ./scripts/test_vendas_list_row_default_state_unit.mjs
 */

import assert from "node:assert/strict";
import { buildVendasListRow } from "../../suse7-backend/src/handlers/sales/_vendasSalesRows.js";
import {
  aplicarFiltroRapidoLinhasVendas,
  normalizarIdFiltroRapidoVendas,
} from "../../suse7-backend/src/domain/sales/vendasListQuickFilter.js";

function makeRow({ id, profit = "10.00", date }) {
  const base = buildVendasListRow({
    item: {
      id,
      quantity: 1,
      marketplace: "mercado_livre",
      created_at: date,
      gross_amount: "100.00",
      net_amount: "80.00",
    },
    order: {
      order_status: "paid",
      date_created_marketplace: date,
      created_at: date,
      raw_json: { status: "paid", shipping: { status: "pending" } },
    },
    listing: null,
    product: { id: "p1", cost_price: "10.00", packaging_cost: "1.00", operational_cost: "1.00", sku: "SKU1" },
    account: null,
  });
  if (profit != null) {
    base.financials = {
      ...(base.financials || {}),
      profit_brl: profit,
      margin_percent: "10.00",
      health: "healthy",
    };
  }
  return base;
}

const row = makeRow({ id: "r1", date: "2026-07-16T12:00:00.000Z" });
assert.equal(row.marketplace, "mercado_livre");
assert.ok(row.operational_status_bucket);

assert.equal(normalizarIdFiltroRapidoVendas(undefined), "all");
assert.equal(normalizarIdFiltroRapidoVendas(null), "all");
assert.equal(normalizarIdFiltroRapidoVendas(""), "all");

const rows = [
  makeRow({ id: "r-new", date: "2026-07-16T12:00:00.000Z" }),
  makeRow({ id: "r-old", date: "2026-07-15T12:00:00.000Z" }),
];
const defaultSorted = aplicarFiltroRapidoLinhasVendas("all", rows);
assert.equal(defaultSorted.length, 2);
assert.equal(defaultSorted[0].item_id, "r-new");

console.log("[test_vendas_list_row_default_state_unit] OK");
