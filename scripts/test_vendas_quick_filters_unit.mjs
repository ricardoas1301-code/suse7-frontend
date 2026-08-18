#!/usr/bin/env node
/**
 * Testes unitários — filtros rápidos Página Vendas (S1.SALES-QUICK-FILTERS).
 * Uso: node ./scripts/test_vendas_quick_filters_unit.mjs
 */

import assert from "node:assert/strict";
import Decimal from "decimal.js";
import {
  VENDAS_QUICK_FILTER_OPTIONS,
  VENDAS_QUICK_FILTER_SECTION_LABELS,
  VENDAS_QUICK_FILTER_NEUTRAL_ID,
  SALES_FILTER_CHIPS,
  filtroRapidoVendasAfetaResumoExecutivo,
} from "../src/features/vendas/filters/vendasQuickFiltersConfig.js";
import {
  aplicarFiltroRapidoLinhasVendas,
  compararLinhasVendasLucroDesc,
  linhaVendaAtendeFiltroRapido,
  normalizarIdFiltroRapidoVendas,
  vendaTemMargemCriticaCanônica,
} from "../../suse7-backend/src/domain/sales/vendasListQuickFilter.js";
import { resolveSalesOperationalBucket } from "../../suse7-backend/src/domain/sales/salesOperationalStatusBucket.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`OK ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`, error instanceof Error ? error.message : error);
  }
}

const EXPECTED_SECTION_ORDER = ["ordering", "financial_health", "sale_status"];
const REMOVED_IDS = ["ticket_high", "ticket_low", "needs_attention", "no_profit"];

function makeRow({ id, profit, margin = "10.00", health = "healthy", bucket = "unknown", date }) {
  return {
    item_id: id,
    date_created_marketplace: date,
    operational_status_bucket: bucket,
    financials: {
      profit_brl: profit,
      margin_percent: margin,
      health,
    },
  };
}

test("menu possui exatamente 8 opções", () => {
  assert.equal(VENDAS_QUICK_FILTER_OPTIONS.length, 8);
});

test("seções na ordem oficial", () => {
  const seen = [];
  for (const option of VENDAS_QUICK_FILTER_OPTIONS) {
    if (!seen.includes(option.section)) seen.push(option.section);
  }
  assert.deepEqual(seen, EXPECTED_SECTION_ORDER);
});

test("labels de seção declarativos", () => {
  assert.equal(VENDAS_QUICK_FILTER_SECTION_LABELS.ordering, "ORDENAÇÃO");
  assert.equal(VENDAS_QUICK_FILTER_SECTION_LABELS.financial_health, "SAÚDE FINANCEIRA");
  assert.equal(VENDAS_QUICK_FILTER_SECTION_LABELS.sale_status, "STATUS DA VENDA");
});

test("Mais lucrativas — label feminino", () => {
  const option = VENDAS_QUICK_FILTER_OPTIONS.find((o) => o.id === "profit_high");
  assert.equal(option?.label, "Mais lucrativas");
  assert.equal(option?.kind, "sort");
});

test("filtros removidos não aparecem no menu", () => {
  const ids = new Set(VENDAS_QUICK_FILTER_OPTIONS.map((o) => o.id));
  for (const removed of REMOVED_IDS) {
    assert.equal(ids.has(removed), false);
  }
});

test("Sem dados de lucro substitui Sem lucro", () => {
  const option = VENDAS_QUICK_FILTER_OPTIONS.find((o) => o.id === "no_profit_data");
  assert.equal(option?.label, "Sem dados de lucro");
});

test("default neutro não afeta resumo executivo", () => {
  assert.equal(filtroRapidoVendasAfetaResumoExecutivo(VENDAS_QUICK_FILTER_NEUTRAL_ID), false);
  assert.equal(filtroRapidoVendasAfetaResumoExecutivo("profit_high"), false);
  assert.equal(filtroRapidoVendasAfetaResumoExecutivo("margin_low"), true);
});

test("Mais lucrativas — ordenação Decimal com ausentes no final", () => {
  const rows = [
    makeRow({ id: "A", profit: "100.00", date: "2026-07-10T10:00:00.000Z" }),
    makeRow({ id: "B", profit: "300.00", date: "2026-07-10T09:00:00.000Z" }),
    makeRow({ id: "C", profit: "0.00", date: "2026-07-10T08:00:00.000Z" }),
    makeRow({ id: "D", profit: "-20.00", date: "2026-07-10T07:00:00.000Z" }),
    makeRow({ id: "E", profit: null, date: "2026-07-10T11:00:00.000Z" }),
    makeRow({ id: "F", profit: "invalid", date: "2026-07-10T12:00:00.000Z" }),
  ];
  const sorted = [...rows].sort(compararLinhasVendasLucroDesc);
  assert.deepEqual(sorted.map((r) => r.item_id), ["B", "A", "C", "D", "F", "E"]);
});

test("zero não é ausência em Sem dados de lucro", () => {
  const zero = makeRow({ id: "Z", profit: "0.00" });
  const ausente = makeRow({ id: "N", profit: null });
  assert.equal(linhaVendaAtendeFiltroRapido("no_profit_data", zero), false);
  assert.equal(linhaVendaAtendeFiltroRapido("no_profit_data", ausente), true);
});

test("Em prejuízo usa lucro negativo canônico", () => {
  assert.equal(linhaVendaAtendeFiltroRapido("loss", makeRow({ id: "1", profit: "-1.00" })), true);
  assert.equal(linhaVendaAtendeFiltroRapido("loss", makeRow({ id: "2", profit: "0.00" })), false);
});

test("Margem crítica preserva regra canônica (<5% ou attention)", () => {
  assert.equal(vendaTemMargemCriticaCanônica(new Decimal("1"), new Decimal("4.5"), "healthy"), true);
  assert.equal(vendaTemMargemCriticaCanônica(new Decimal("1"), new Decimal("12"), "attention"), true);
  assert.equal(vendaTemMargemCriticaCanônica(new Decimal("1"), new Decimal("12"), "healthy"), false);
});

test("status operacional não usa texto visual", () => {
  const bucket = resolveSalesOperationalBucket({
    marketplace: "mercado_livre",
    orderRaw: {
      status: "paid",
      shipping: { status: "shipped" },
    },
    orderStatus: "paid",
  });
  assert.equal(bucket, "in_transit");
  const row = makeRow({ id: "S", profit: "10", bucket });
  assert.equal(linhaVendaAtendeFiltroRapido("status_in_transit", row), true);
  assert.equal(linhaVendaAtendeFiltroRapido("status_to_ship", row), false);
});

test("filtro financeiro preserva ordem cronológica", () => {
  const rows = [
    makeRow({ id: "new", profit: "-1.00", date: "2026-07-11T10:00:00.000Z" }),
    makeRow({ id: "old", profit: "-5.00", date: "2026-07-09T10:00:00.000Z" }),
  ];
  const filtered = aplicarFiltroRapidoLinhasVendas("loss", rows);
  assert.deepEqual(filtered.map((r) => r.item_id), ["new", "old"]);
});

test("SALES_FILTER_CHIPS inclui opções novas para relatório", () => {
  assert.equal(SALES_FILTER_CHIPS.some((c) => c.id === "status_to_ship"), true);
  assert.equal(SALES_FILTER_CHIPS.some((c) => c.label === "Em prejuízo"), true);
});

test("estado padrão all preserva cronologia", () => {
  const rows = [
    makeRow({ id: "new", profit: "10.00", date: "2026-07-16T12:00:00.000Z" }),
    makeRow({ id: "old", profit: "20.00", date: "2026-07-15T12:00:00.000Z" }),
  ];
  const result = aplicarFiltroRapidoLinhasVendas("all", rows);
  assert.equal(result.length, 2);
  assert.equal(result[0].item_id, "new");
});

test("parâmetro omitido normaliza para all", () => {
  assert.equal(normalizarIdFiltroRapidoVendas(undefined), "all");
  assert.equal(normalizarIdFiltroRapidoVendas(null), "all");
  assert.equal(normalizarIdFiltroRapidoVendas(""), "all");
});

console.log(`\nResultado: ${passed} ok, ${failed} falhou`);
if (failed > 0) process.exit(1);
