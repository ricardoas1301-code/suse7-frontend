import assert from "node:assert/strict";
import {
  buildListingQualityIdentityKey,
  buildListingQualityOpenSnapshot,
  buildListingQualityScoreByIdentityMap,
  hydrateCatalogRowCanonicalListingQuality,
  joinCatalogRowsWithQualityIdentityMap,
  parseListingQualityScoreFromGridPayload,
  reconcileListingQualityScore,
} from "./listingQualityHydration.js";

assert.equal(buildListingQualityIdentityKey("acc-1", "lst-1"), "acc-1::lst-1");

assert.equal(parseListingQualityScoreFromGridPayload({ health_listing_quality_score: 88 }), 88);
assert.equal(parseListingQualityScoreFromGridPayload({ health_percent: 100 }), null, "health_percent ignorado");

const hydrated = hydrateCatalogRowCanonicalListingQuality({
  id: "l1",
  marketplaceAccountId: "a1",
  healthPercent: 100,
  health_percent: 100,
  health_listing_quality_score: 88,
});
assert.equal(hydrated.listingQualityScorePercent, 88);

const map = buildListingQualityScoreByIdentityMap([
  { id: "l1", marketplaceAccountId: "a1", health_listing_quality_score: 93 },
  { id: "l2", marketplaceAccountId: "a1", listing_quality_score: 87 },
]);
assert.equal(map.get("a1::l1"), 93);
assert.equal(map.get("a1::l2"), 87);

const joined = joinCatalogRowsWithQualityIdentityMap(
  [{ id: "l3", marketplaceAccountId: "a1", healthPercent: 100 }],
  new Map([["a1::l3", 70]]),
);
assert.equal(joined[0].listingQualityScorePercent, 70);

const snapshot = buildListingQualityOpenSnapshot({
  id: "l9",
  marketplaceAccountId: "a9",
  listing_quality_score: 87,
});
assert.equal(snapshot?.score, 87);

assert.deepEqual(
  reconcileListingQualityScore({ detailLoaded: false, snapshotScore: 87, listingScore: null }),
  { score: 87, source: "catalog_listing_quality_snapshot" },
);
assert.deepEqual(
  reconcileListingQualityScore({ detailLoaded: true, detailScore: 88, snapshotScore: 87, listingScore: 87 }),
  { score: 88, source: "mercado_livre_performance" },
);
assert.deepEqual(
  reconcileListingQualityScore({ detailLoaded: true, detailScore: null, snapshotScore: 87, listingScore: 87 }),
  { score: 87, source: "catalog_listing_quality_snapshot" },
);

console.log("[listingQualityHydration.test] OK");
