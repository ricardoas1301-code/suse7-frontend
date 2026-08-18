import assert from "node:assert/strict";
import {
  PRECIFICACOES_QUICK_FILTER_OPTIONS,
  PRECIFICACOES_QUICK_FILTER_SECTION_LABELS,
} from "../src/features/listings/filters/precificacoesQuickFiltersConfig.js";
import { normalizarIdFiltroRapidoPrecificacoes } from "../src/features/listings/domain/pricingHealth/pricingHealthListClassifiers.js";

assert.equal(PRECIFICACOES_QUICK_FILTER_OPTIONS.length, 23);
assert.equal(Object.keys(PRECIFICACOES_QUICK_FILTER_SECTION_LABELS).length, 7);

const sectionOrder = [];
for (const option of PRECIFICACOES_QUICK_FILTER_OPTIONS) {
  if (!sectionOrder.includes(option.section)) sectionOrder.push(option.section);
}
assert.deepEqual(sectionOrder, [
  "ordering",
  "projected_margin",
  "offer_status",
  "promotions",
  "listing_type",
  "logistics",
  "operation",
]);

const ids = PRECIFICACOES_QUICK_FILTER_OPTIONS.map((o) => o.id);
assert.equal(new Set(ids).size, ids.length);
assert.equal(normalizarIdFiltroRapidoPrecificacoes("needs_attention"), "offer_status_attention");

console.log("[test_precificacoes_quick_filters_unit] OK");
