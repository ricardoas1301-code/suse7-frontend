// ======================================================================
// Testes unitários — formatação visual dos cards de empresa
// Executar: node scripts/test_company_card_display_format_unit.mjs
// ======================================================================

import assert from "node:assert/strict";
import { formatCompanyTaxRateDisplay } from "../src/components/Profile/companyCardDisplayFormat.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

test("alíquota com percentual", () => {
  assert.equal(formatCompanyTaxRateDisplay(9), "9%");
  assert.equal(formatCompanyTaxRateDisplay(16), "16%");
  assert.equal(formatCompanyTaxRateDisplay("19"), "19%");
});

test("alíquota ausente", () => {
  assert.equal(formatCompanyTaxRateDisplay(null), "—");
  assert.equal(formatCompanyTaxRateDisplay(""), "—");
});

test("não exibe —%", () => {
  assert.notEqual(formatCompanyTaxRateDisplay(null), "—%");
});

console.log(`\nResultado: ${passed} ok, ${failed} falhou`);
process.exit(failed > 0 ? 1 : 0);
