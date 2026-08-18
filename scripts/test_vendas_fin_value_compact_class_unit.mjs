import assert from "node:assert/strict";
import { vendasFinValueCompactClass } from "../src/features/vendas/utils/vendasFinValueCompactClass.js";

assert.equal(vendasFinValueCompactClass("R$ 9,85"), "");
assert.equal(vendasFinValueCompactClass("-R$ 127,13"), "vendas-page__fin-value--compact");
assert.equal(vendasFinValueCompactClass("-R$ 1.234,56"), "vendas-page__fin-value--compact-lg");
assert.equal(vendasFinValueCompactClass("-R$ 123.456,78"), "vendas-page__fin-value--compact-xl");

console.log("test_vendas_fin_value_compact_class_unit.mjs — OK");
