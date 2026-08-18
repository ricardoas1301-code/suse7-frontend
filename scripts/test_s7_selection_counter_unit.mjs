#!/usr/bin/env node
/**
 * Testes unitários — contador de seleção S7 (S1.7.1).
 * Uso: node ./scripts/test_s7_selection_counter_unit.mjs
 */

import assert from "node:assert/strict";
import { formatSelectionCountLabel } from "../src/utils/formatSelectionCountLabel.js";
import { formatCatalogSelectionCountLabel } from "../src/utils/formatCatalogSelectionCountLabel.js";
import { formatConcorrenciaSelectionCountLabel } from "../src/features/concorrencia/selection/formatConcorrenciaSelectionCountLabel.js";

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

test("formatSelectionCountLabel — zero retorna plural (uso interno; componente não renderiza)", () => {
  assert.equal(formatSelectionCountLabel(0, "produto selecionado", "produtos selecionados"), "0 produtos selecionados");
});

test("formatSelectionCountLabel — singular", () => {
  assert.equal(formatSelectionCountLabel(1, "produto selecionado", "produtos selecionados"), "1 produto selecionado");
});

test("formatSelectionCountLabel — plural", () => {
  assert.equal(formatSelectionCountLabel(4, "produto selecionado", "produtos selecionados"), "4 produtos selecionados");
  assert.equal(formatSelectionCountLabel(13, "produto selecionado", "produtos selecionados"), "13 produtos selecionados");
});

test("formatCatalogSelectionCountLabel — produtos", () => {
  assert.equal(formatCatalogSelectionCountLabel(1), "1 produto selecionado");
  assert.equal(formatCatalogSelectionCountLabel(4), "4 produtos selecionados");
});

test("formatConcorrenciaSelectionCountLabel — anúncios", () => {
  assert.equal(formatConcorrenciaSelectionCountLabel(1), "1 anúncio selecionado");
  assert.equal(formatConcorrenciaSelectionCountLabel(3), "3 anúncios selecionados");
  assert.equal(formatConcorrenciaSelectionCountLabel(12), "12 anúncios selecionados");
});

test("formatSelectionCountLabel — valores inválidos tratados como zero", () => {
  assert.equal(formatSelectionCountLabel(NaN, "anúncio selecionado", "anúncios selecionados"), "0 anúncios selecionados");
  assert.equal(formatSelectionCountLabel(-2, "produto selecionado", "produtos selecionados"), "0 produtos selecionados");
});

console.log(`\nResumo: ${passed} OK, ${failed} FAIL`);
process.exit(failed > 0 ? 1 : 0);
