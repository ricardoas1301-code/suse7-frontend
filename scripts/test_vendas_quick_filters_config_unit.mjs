import assert from "node:assert/strict";
import {
  VENDAS_QUICK_FILTER_OPTIONS,
  filtroRapidoVendasAfetaResumoExecutivo,
} from "../src/features/vendas/filters/vendasQuickFiltersConfig.js";

const caminho = VENDAS_QUICK_FILTER_OPTIONS.find((o) => o.id === "status_in_transit");
const enviar = VENDAS_QUICK_FILTER_OPTIONS.find((o) => o.id === "status_to_ship");

assert.ok(caminho, "A caminho configurado");
assert.ok(enviar, "A enviar configurado");
assert.equal(caminho.label, "A caminho");
assert.equal(enviar.label, "A enviar");
assert.equal(caminho.id, "status_in_transit");
assert.equal(enviar.id, "status_to_ship");
assert.equal(filtroRapidoVendasAfetaResumoExecutivo("profit_high"), false);
assert.equal(filtroRapidoVendasAfetaResumoExecutivo("status_in_transit"), true);

console.log("test_vendas_quick_filters_config_unit.mjs — OK");
