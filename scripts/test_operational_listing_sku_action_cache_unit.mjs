import assert from "node:assert/strict";
import {
  requestOpenBulkListingSkus,
  requestOperationalTaskAction,
  subscribeOperationalTaskActions,
} from "../src/features/dashboard/operationalTasks/operationalTaskActionRequests.js";
import {
  buildMissingListingSkusTaskPayload,
  buildMissingProductCostsTaskPayload,
  patchOperationalTaskByDedupeKey,
} from "../src/features/dashboard/operationalTasks/operationalTasksCachePatch.js";

const received = [];
const unsubscribe = subscribeOperationalTaskActions((action) => received.push(action));
assert.equal(requestOpenBulkListingSkus(), true);
assert.deepEqual(received, ["open_bulk_listing_skus"]);
assert.equal(requestOperationalTaskAction("unsafe_action"), false);
assert.equal(received.length, 1);
unsubscribe();

const costs = buildMissingProductCostsTaskPayload(4);
const sku = buildMissingListingSkusTaskPayload(2);
const withBoth = patchOperationalTaskByDedupeKey(
  { ok: true, tasks: [costs], total_tasks: 1 },
  "sku_dependency_pending",
  sku,
);
assert.deepEqual(
  withBoth.tasks.map((task) => task.dedupe_key),
  ["sku_dependency_pending", "missing_product_costs"],
);

const withoutSku = patchOperationalTaskByDedupeKey(
  withBoth.data,
  "sku_dependency_pending",
  null,
);
assert.deepEqual(withoutSku.tasks.map((task) => task.dedupe_key), ["missing_product_costs"]);
assert.equal(withoutSku.tasks[0].count, 4);

console.log("[test_operational_listing_sku_action_cache_unit] OK");
