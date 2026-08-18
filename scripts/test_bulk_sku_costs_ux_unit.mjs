#!/usr/bin/env node
/**
 * Regressão — modal SKU individual + buscas em lote (SKU/custos).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const skuModalJsx = readFileSync(join(root, "../src/components/SkuInputModal.jsx"), "utf8");
const skuModalCss = readFileSync(join(root, "../src/components/SkuInputModal.css"), "utf8");
const bulkSkuJsx = readFileSync(join(root, "../src/features/listings/components/BulkListingSkuModal.jsx"), "utf8");
const bulkCostsJsx = readFileSync(join(root, "../src/features/products/costs/BulkProductCostsModal.jsx"), "utf8");
const busyIndicatorJsx = readFileSync(
  join(root, "../src/components/searchFilters/S7SearchInputBusyIndicator.jsx"),
  "utf8",
);

assert("sku modal illustration removed", !skuModalJsx.includes("quick-product-costs-illustration"));
assert("sku modal illustration css removed", !skuModalCss.includes("sku-input-modal__illustration"));
assert("sku modal input full width", skuModalCss.includes("width: 100%") && !skuModalCss.includes("padding-top: 92px"));
assert("sku modal compact max-height", skuModalCss.includes("max-height: min(92vh, 560px)"));

assert(
  "bulk sku search placeholder",
  bulkSkuJsx.includes('placeholder="Buscar por anúncio ou ID"') &&
    !bulkSkuJsx.includes("Buscar por anúncio, ID ou SKU"),
);
function assertSearchInputNotBlockedByLoading(source, inputName) {
  const block = source.match(
    new RegExp(`name="${inputName}"[\\s\\S]*?disabled=\\{([^}]+)\\}`),
  );
  assert(
    `${inputName} not disabled while list loading`,
    Boolean(block) && !block[1].includes("isListBusy"),
  );
}

assertSearchInputNotBlockedByLoading(bulkSkuJsx, "bulk-listing-sku-search");
assertSearchInputNotBlockedByLoading(bulkCostsJsx, "bulk-product-costs-search");
assert(
  "bulk sku search spinner",
  bulkSkuJsx.includes("S7SearchInputBusyIndicator") && bulkSkuJsx.includes("rightElement={isSearchFetching"),
);
assert(
  "bulk costs search preserves sku",
  bulkCostsJsx.includes('placeholder="Nome do produto ou SKU"'),
);
assert(
  "bulk costs search spinner",
  bulkCostsJsx.includes("S7SearchInputBusyIndicator") && bulkCostsJsx.includes("rightElement={isSearchFetching"),
);

assert("busy indicator accessible", busyIndicatorJsx.includes('aria-label="Pesquisando"'));

assert(
  "bulk sku stale request guard",
  bulkSkuJsx.includes("request !== requestRef.current"),
);
assert(
  "bulk costs stale request guard",
  bulkCostsJsx.includes("seq !== loadRequestSeqRef.current"),
);

if (failures.length > 0) {
  console.error("FAIL bulk sku/costs ux unit tests:");
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`PASS bulk sku/costs ux (${12 - failures.length} checks)`);
