import assert from "node:assert/strict";
import {
  anuncioAtendeFiltroRapidoLista,
  normalizarIdFiltroRapidoAnuncios,
} from "./listingHealthListClassifiers.js";
import { montarBucketsSaudeAnuncioDaLinha } from "./listingHealthBucketResolvers.js";

function rowBase(overrides = {}) {
  return {
    id: "listing-1",
    listingStatusRaw: "active",
    statusKey: "active",
    salesCount: 10,
    healthPercent: 95,
    listingQualityScore: 95,
    isProductReady: true,
    contributionProfitBrl: "120.00",
    contributionMarginPercent: "25.00",
    grossSalesBrl: "480.00",
    availableQuantity: 12,
    ...overrides,
  };
}

assert.equal(normalizarIdFiltroRapidoAnuncios("all"), "top_sales");

const activeWithSales = rowBase();
const bucketsActive = montarBucketsSaudeAnuncioDaLinha(activeWithSales);
assert.equal(bucketsActive.is_active_listing, true);
assert.equal(bucketsActive.active_with_sales, true);
assert.equal(bucketsActive.registration, "excellent");
assert.equal(bucketsActive.commercial, "healthy_margin");
assert.equal(anuncioAtendeFiltroRapidoLista(activeWithSales, "executive_active_with_sales"), true);

const offline = rowBase({ listingStatusRaw: "paused", statusKey: "paused", salesCount: 0 });
assert.equal(montarBucketsSaudeAnuncioDaLinha(offline).is_offline, true);
assert.equal(anuncioAtendeFiltroRapidoLista(offline, "executive_offline"), true);

const zeroStock = rowBase({ availableQuantity: 0 });
assert.equal(montarBucketsSaudeAnuncioDaLinha(zeroStock).operational, "zero_stock");
assert.equal(anuncioAtendeFiltroRapidoLista(zeroStock, "operational_zero_stock"), true);

const criticalStock = rowBase({ availableQuantity: 2 });
assert.equal(montarBucketsSaudeAnuncioDaLinha(criticalStock).operational, "critical_stock");

const complete = rowBase({ healthPercent: 100, listingQualityScore: 100 });
assert.equal(montarBucketsSaudeAnuncioDaLinha(complete).registration, "complete");

const paridadeResumo88 = rowBase({ healthPercent: 100, listingQualityScore: 88 });
assert.equal(montarBucketsSaudeAnuncioDaLinha(paridadeResumo88).registration, "attention");

const paridadeResumo87 = rowBase({ healthPercent: null, listingQualityScore: 87 });
assert.equal(montarBucketsSaudeAnuncioDaLinha(paridadeResumo87).registration, "attention");

const loss = rowBase({ contributionProfitBrl: "-5.00", contributionMarginPercent: "-2.00" });
assert.equal(montarBucketsSaudeAnuncioDaLinha(loss).commercial, "negative_margin");

const noData = rowBase({ salesCount: 0, contributionMarginPercent: null });
assert.equal(montarBucketsSaudeAnuncioDaLinha(noData).commercial, "no_commercial_data");

console.log("[listingHealthListClassifiers.test] OK");
