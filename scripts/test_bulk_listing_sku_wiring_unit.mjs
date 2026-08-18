import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dashboard = await readFile(
  new URL("../src/features/dashboard/operationalTasks/DashboardOperationalTasks.jsx", import.meta.url),
  "utf8",
);
const anuncios = await readFile(new URL("../src/components/Anuncios.jsx", import.meta.url), "utf8");
const skuModal = await readFile(new URL("../src/components/SkuInputModal.jsx", import.meta.url), "utf8");
const bulkModal = await readFile(
  new URL("../src/features/listings/components/BulkListingSkuModal.jsx", import.meta.url),
  "utf8",
);

assert.equal((dashboard.match(/<BulkListingSkuModal/g) || []).length, 1);
assert.equal(anuncios.includes("AnunciosBulkSkuModal"), false);
assert.equal(skuModal.includes("requestOpenBulkListingSkus"), true);
assert.equal(skuModal.includes("window.dispatchEvent"), false);
assert.equal(bulkModal.includes("/api/ml/listings"), false);
assert.equal(bulkModal.includes("fetchPendingListingSkus"), true);
assert.equal(bulkModal.includes("saveListingSkusBatch"), true);

console.log("[test_bulk_listing_sku_wiring_unit] OK");
