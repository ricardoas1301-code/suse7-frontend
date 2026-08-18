import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildOperationalTasksCacheFromRemainingCount,
} from "../src/features/dashboard/operationalTasks/operationalTasksCachePatch.js";
import { buildMissingProductCostsDescription } from "../src/features/dashboard/operationalTasks/operationalTaskDescriptions.js";

const root = dirname(fileURLToPath(import.meta.url));
const refreshSource = readFileSync(
  join(root, "../src/features/dashboard/operationalTasks/refreshOperationalTasksAfterProductCostsSaved.js"),
  "utf8",
);
const quickModalSource = readFileSync(
  join(root, "../src/features/listings/components/QuickProductCostsModal.jsx"),
  "utf8",
);
const bulkModalSource = readFileSync(
  join(root, "../src/features/products/costs/BulkProductCostsModal.jsx"),
  "utf8",
);

// Save individual dispara refresh canônico (não decremento manual).
assert.match(quickModalSource, /refreshOperationalTasksAfterProductCostsSaved/);
assert.match(quickModalSource, /await refreshOperationalTasksAfterProductCostsSaved\(\)/);
assert.doesNotMatch(refreshSource, /remainingCount\s*-\s*1/);
assert.doesNotMatch(refreshSource, /previous\s*=>\s*previous\s*-/);
assert.match(refreshSource, /fetchPendingProductCosts/);
assert.match(refreshSource, /notifyProductCostsSaved/);

// Paridade com fluxo em lote.
assert.match(bulkModalSource, /notifyProductCostsSaved/);
assert.match(bulkModalSource, /fetchPendingProductCosts/);

// Contador vem da fonte oficial (total pendente), não de anúncios.
const patched = buildOperationalTasksCacheFromRemainingCount(111);
assert.equal(patched.tasks[0]?.count, 111);
assert.equal(buildMissingProductCostsDescription(111), "111 produtos aguardam cadastro de custos");

// 112 → 111 após save (sem decremento local).
const before = buildOperationalTasksCacheFromRemainingCount(112);
const after = buildOperationalTasksCacheFromRemainingCount(111);
assert.equal(before.tasks[0]?.count, 112);
assert.equal(after.tasks[0]?.count, 111);

console.log("[test_operational_tasks_after_single_cost_save_unit] OK");
