import assert from "node:assert/strict";
import { resolveCanonicalListingQualityScore } from "./resolveCanonicalListingQualityScore.js";

assert.equal(
  resolveCanonicalListingQualityScore({ listingQualityScore: 88, healthPercent: 100, health_percent: 100 }),
  88,
  "listing_quality_score vence health_percent (falso 100)",
);

assert.equal(
  resolveCanonicalListingQualityScore({ health_listing_quality_score: 87, health_percent: 100 }),
  87,
);

assert.equal(
  resolveCanonicalListingQualityScore({ healthPercent: 100, health_percent: 100 }),
  null,
  "health_percent isolado não é qualidade",
);

assert.equal(
  resolveCanonicalListingQualityScore({ quality: { score_percent: 88 } }),
  88,
  "detail Resumo",
);

assert.equal(resolveCanonicalListingQualityScore({ listingQualityScore: 93 }), 93);
assert.equal(resolveCanonicalListingQualityScore({}), null);

assert.equal(
  resolveCanonicalListingQualityScore({ listing_quality_score_percent: 88, health_percent: 100 }),
  88,
  "campo canônico bulk vence health_percent",
);

console.log("[resolveCanonicalListingQualityScore.test] OK");
