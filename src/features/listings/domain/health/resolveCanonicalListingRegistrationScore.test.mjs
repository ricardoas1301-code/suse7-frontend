import assert from "node:assert/strict";
import {
  resolveCanonicalListingRegistrationScore,
  toScorePercentCanonico,
} from "./resolveCanonicalListingRegistrationScore.js";

assert.equal(toScorePercentCanonico(null), null);
assert.equal(toScorePercentCanonico(""), null);
assert.equal(toScorePercentCanonico(0.93), 93);
assert.equal(toScorePercentCanonico(93), 93);
assert.equal(toScorePercentCanonico(100), 100);

assert.equal(
  resolveCanonicalListingRegistrationScore({ listingQualityScore: 93, healthPercent: 100 }),
  100,
);
assert.equal(resolveCanonicalListingRegistrationScore({ listingQualityScore: 93, healthPercent: 93 }), 93);
assert.equal(resolveCanonicalListingRegistrationScore({ healthPercent: 75 }), 75);
assert.equal(resolveCanonicalListingRegistrationScore({}), null);

console.log("[resolveCanonicalListingRegistrationScore.test] OK");
