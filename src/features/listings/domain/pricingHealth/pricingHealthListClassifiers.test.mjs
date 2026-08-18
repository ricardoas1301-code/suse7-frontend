import assert from "node:assert/strict";
import {
  anuncioAtendeFiltroRapidoPrecificacoesLista,
} from "./pricingHealthListClassifiers.js";

function rowComBuckets(buckets, extra = {}) {
  return {
    id: extra.id ?? "listing-1",
    salesCount: extra.salesCount ?? 0,
    statusKey: extra.statusKey ?? "active",
    listingStatusRaw: extra.listingStatusRaw ?? "active",
    catalog_pricing_health_buckets: buckets,
    ...extra,
  };
}

const baseBuckets = {
  offer_status_bucket: "healthy",
  projected_margin_bucket: "margin_20_29",
  promotion_bucket: "no_promotion",
  listing_type_key: "premium",
  free_shipping: true,
  financial_evaluable: true,
  profit_brl: "25.00",
  margin_pct: "22.00",
};

assert.equal(anuncioAtendeFiltroRapidoPrecificacoesLista(rowComBuckets(baseBuckets), "offer_status_healthy"), true);
assert.equal(anuncioAtendeFiltroRapidoPrecificacoesLista(rowComBuckets(baseBuckets), "projected_margin_20_29"), true);
assert.equal(anuncioAtendeFiltroRapidoPrecificacoesLista(rowComBuckets(baseBuckets), "listing_type_premium"), true);
assert.equal(anuncioAtendeFiltroRapidoPrecificacoesLista(rowComBuckets(baseBuckets), "logistics_free_shipping"), true);

// UI não reinterpreta margem bruta — só a chave canônica.
const driftRow = rowComBuckets({
  ...baseBuckets,
  projected_margin_bucket: "margin_10_19",
  margin_pct: "99.00",
});
assert.equal(anuncioAtendeFiltroRapidoPrecificacoesLista(driftRow, "projected_margin_30_plus"), false);
assert.equal(anuncioAtendeFiltroRapidoPrecificacoesLista(driftRow, "projected_margin_10_19"), true);

// Promoções — fixture com quatro buckets distintos.
assert.equal(
  anuncioAtendeFiltroRapidoPrecificacoesLista(
    rowComBuckets({ ...baseBuckets, promotion_bucket: "active_promotion" }, { id: "p-active" }),
    "promotion_active",
  ),
  true,
);
assert.equal(
  anuncioAtendeFiltroRapidoPrecificacoesLista(
    rowComBuckets({ ...baseBuckets, promotion_bucket: "scheduled_promotion" }, { id: "p-sched" }),
    "promotion_scheduled",
  ),
  true,
);
assert.equal(
  anuncioAtendeFiltroRapidoPrecificacoesLista(
    rowComBuckets({ ...baseBuckets, promotion_bucket: "available_promotion" }, { id: "p-avail" }),
    "promotion_available",
  ),
  true,
);
assert.equal(
  anuncioAtendeFiltroRapidoPrecificacoesLista(
    rowComBuckets({ ...baseBuckets, promotion_bucket: "no_promotion" }, { id: "p-none" }),
    "promotion_none",
  ),
  true,
);

assert.equal(anuncioAtendeFiltroRapidoPrecificacoesLista({ id: "sem-bucket" }, "offer_status_healthy"), false);

console.log("[pricingHealthListClassifiers.test] OK");
