#!/usr/bin/env node
/**
 * Testes unitários — filtros rápidos Produtos (S1.7).
 * Uso: node ./scripts/test_produtos_quick_filters_unit.mjs
 */

import assert from "node:assert/strict";
import {
  PRODUCTS_QUICK_FILTER_OPTIONS,
  PRODUCTS_QUICK_FILTER_SECTION_LABELS,
} from "../src/features/products/filters/productsQuickFiltersConfig.js";
import {
  normalizarIdFiltroRapidoProdutos,
  produtoAtendeFiltroRapidoLista,
  isOrdenacaoFiltroRapidoProdutos,
} from "../src/features/products/domain/productHealthListClassifiers.js";

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

const EXPECTED_SECTION_ORDER = [
  "ordering",
  "abc",
  "stock_coverage",
  "profitability",
  "health_action",
];

const REMOVED_IDS = ["low_margin", "needs_attention", "opportunity", "declining", "new_no_history"];

function makeProduct(buckets, metrics = {}) {
  return {
    id: "p1",
    catalog_health_buckets: buckets,
    sales_count: metrics.salesCount ?? 0,
    gross_profit_brl: metrics.grossProfit ?? 0,
    contribution_margin_percent: metrics.marginPct ?? null,
  };
}

test("menu possui exatamente 18 opções", () => {
  assert.equal(PRODUCTS_QUICK_FILTER_OPTIONS.length, 18);
});

test("seções na ordem oficial", () => {
  const seen = [];
  for (const option of PRODUCTS_QUICK_FILTER_OPTIONS) {
    if (!seen.includes(option.section)) seen.push(option.section);
  }
  assert.deepEqual(seen, EXPECTED_SECTION_ORDER);
});

test("labels de seção declarativos", () => {
  assert.equal(PRODUCTS_QUICK_FILTER_SECTION_LABELS.ordering, "ORDENAÇÃO");
  assert.equal(PRODUCTS_QUICK_FILTER_SECTION_LABELS.health_action, "SAÚDE E AÇÃO");
});

test("IDs únicos", () => {
  const ids = PRODUCTS_QUICK_FILTER_OPTIONS.map((o) => o.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("filtros removidos não aparecem no menu", () => {
  const ids = new Set(PRODUCTS_QUICK_FILTER_OPTIONS.map((o) => o.id));
  for (const removed of REMOVED_IDS) {
    assert.equal(ids.has(removed), false);
  }
});

test("exatamente um Sem vendas", () => {
  const labels = PRODUCTS_QUICK_FILTER_OPTIONS.filter((o) => o.label === "Sem vendas");
  assert.equal(labels.length, 1);
});

test("Mais vendidos e Mais lucrativos são ordenações", () => {
  assert.equal(isOrdenacaoFiltroRapidoProdutos("top_sales"), true);
  assert.equal(isOrdenacaoFiltroRapidoProdutos("top_profit"), true);
  assert.equal(isOrdenacaoFiltroRapidoProdutos("abc_a"), false);
});

test("aliases legados normalizados", () => {
  assert.equal(normalizarIdFiltroRapidoProdutos("low_margin"), "profit_low");
  assert.equal(normalizarIdFiltroRapidoProdutos("margin_low"), "profit_low");
  assert.equal(normalizarIdFiltroRapidoProdutos("needs_attention"), "top_sales");
});

test("Curva A filtra bucket abc_curve", () => {
  const yes = makeProduct({ abc_curve: "curve_a", stock_coverage: "healthy", profitability: "profit" });
  const no = makeProduct({ abc_curve: "curve_b", stock_coverage: "healthy", profitability: "profit" });
  assert.equal(produtoAtendeFiltroRapidoLista(yes, "abc_a"), true);
  assert.equal(produtoAtendeFiltroRapidoLista(no, "abc_a"), false);
});

test("Prejuízo filtra profitability loss", () => {
  const yes = makeProduct({ abc_curve: "curve_c", stock_coverage: "healthy", profitability: "loss" });
  assert.equal(produtoAtendeFiltroRapidoLista(yes, "loss"), true);
});

test("Estoque parado usa is_dead_stock", () => {
  const yes = makeProduct({
    abc_curve: "curve_c",
    stock_coverage: "no_turnover",
    profitability: "no_sales",
    is_dead_stock: true,
    has_turnover_15d: false,
  });
  assert.equal(produtoAtendeFiltroRapidoLista(yes, "dead_stock"), true);
});

test("Com giro nos últimos 15 dias", () => {
  const yes = makeProduct({
    abc_curve: "curve_a",
    stock_coverage: "healthy",
    profitability: "profit",
    has_turnover_15d: true,
  });
  assert.equal(produtoAtendeFiltroRapidoLista(yes, "turnover_15d"), true);
});

test("Markup abaixo de 1,5x", () => {
  const yes = makeProduct({
    abc_curve: "curve_a",
    stock_coverage: "healthy",
    profitability: "profit",
    low_markup: true,
  });
  assert.equal(produtoAtendeFiltroRapidoLista(yes, "low_markup"), true);
});

test("Reposição prioritária", () => {
  const yes = makeProduct({
    abc_curve: "curve_a",
    stock_coverage: "critical",
    profitability: "profit",
    stockout_risk: true,
  });
  assert.equal(produtoAtendeFiltroRapidoLista(yes, "replenishment_priority"), true);
});

test("busca + filtro por interseção (classifier)", () => {
  const rows = [
    makeProduct({ abc_curve: "curve_a", stock_coverage: "healthy", profitability: "profit" }),
    makeProduct({ abc_curve: "curve_b", stock_coverage: "healthy", profitability: "profit" }),
  ];
  const filtered = rows.filter((row) => produtoAtendeFiltroRapidoLista(row, "abc_a"));
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "p1");
});

test("produto sem buckets não entra em filtro de saúde", () => {
  const row = { id: "p9", sales_count: 3 };
  assert.equal(produtoAtendeFiltroRapidoLista(row, "abc_a"), false);
});

console.log(`\nResumo: ${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
