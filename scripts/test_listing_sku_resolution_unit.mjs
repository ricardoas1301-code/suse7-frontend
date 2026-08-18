#!/usr/bin/env node
/**
 * Regressão — resolução segura de SKU (individual + lote).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildListingSkuLookupNotFoundMessage,
  evaluateListingSkuIndividualConfirmReady,
  evaluateListingSkuRowReady,
  LISTING_SKU_LOOKUP_SAVE_ACTION_BATCH,
  LISTING_SKU_LOOKUP_SAVE_ACTION_INDIVIDUAL,
  normalizeListingSkuInput,
  shouldRejectListingSkuExistingMatch,
} from "../src/features/listings/utils/listingSkuLookupDomain.js";

const root = dirname(fileURLToPath(import.meta.url));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("normalize preserves leading zeros", normalizeListingSkuInput(" 0170 ") === "0170");
assert("normalize does not coerce number", normalizeListingSkuInput("0170") === "0170");

assert(
  "not found copy individual",
  buildListingSkuLookupNotFoundMessage(LISTING_SKU_LOOKUP_SAVE_ACTION_INDIVIDUAL) ===
    "Nenhum produto encontrado com este SKU no seu catálogo. Caso queira cadastrar este SKU como novo, clique em Salvar.",
);
assert(
  "not found copy batch",
  buildListingSkuLookupNotFoundMessage(LISTING_SKU_LOOKUP_SAVE_ACTION_BATCH) ===
    "Nenhum produto encontrado com este SKU no seu catálogo. Caso queira cadastrar este SKU como novo, clique em Salvar SKUs.",
);

assert(
  "reject match when selected existing product",
  shouldRejectListingSkuExistingMatch({
    productId: "p1",
    selectedProductId: "p1",
    skuMatchesCount: 1,
  }) === true,
);
assert(
  "reject match ignores sku not found state",
  shouldRejectListingSkuExistingMatch({
    productId: "p1",
    selectedProductId: "p1",
    skuMatchesCount: 0,
  }) === false,
);

const productA = { id: "p1", sku: "0170", productName: "Produto A" };

assert(
  "batch empty sku not ready",
  evaluateListingSkuRowReady({
    trimmedSku: "",
    lookupLoading: false,
    lookupSettledSku: "",
    skuMatches: [],
    selectedProductId: "",
    lookupError: "",
  }) === false,
);

assert(
  "batch loading not ready",
  evaluateListingSkuRowReady({
    trimmedSku: "0170",
    lookupLoading: true,
    lookupSettledSku: "",
    skuMatches: [],
    selectedProductId: "",
    lookupError: "",
  }) === false,
);

assert(
  "batch new sku ready after settle",
  evaluateListingSkuRowReady({
    trimmedSku: "0170",
    lookupLoading: false,
    lookupSettledSku: "0170",
    skuMatches: [],
    selectedProductId: "",
    lookupError: "",
  }) === true,
);

assert(
  "batch existing sku requires selection",
  evaluateListingSkuRowReady({
    trimmedSku: "0170",
    lookupLoading: false,
    lookupSettledSku: "0170",
    skuMatches: [productA],
    selectedProductId: "",
    lookupError: "",
  }) === false,
);

assert(
  "batch existing sku ready when selected",
  evaluateListingSkuRowReady({
    trimmedSku: "0170",
    lookupLoading: false,
    lookupSettledSku: "0170",
    skuMatches: [productA],
    selectedProductId: "p1",
    lookupError: "",
  }) === true,
);

assert(
  "batch deselect blocks ready",
  evaluateListingSkuRowReady({
    trimmedSku: "0170",
    lookupLoading: false,
    lookupSettledSku: "0170",
    skuMatches: [productA],
    selectedProductId: "",
    lookupError: "",
  }) === false,
);

assert(
  "individual single match without select still ready",
  evaluateListingSkuIndividualConfirmReady({
    trimmedSku: "0170",
    lookupLoading: false,
    lookupSettledSku: "0170",
    skuMatches: [productA],
    selectedProductId: "",
    lookupError: "",
  }) === true,
);

const bulkModalJsx = readFileSync(
  join(root, "../src/features/listings/components/BulkListingSkuModal.jsx"),
  "utf8",
);
const bulkRowJsx = readFileSync(
  join(root, "../src/features/listings/components/BulkListingSkuRow.jsx"),
  "utf8",
);
const skuModalJsx = readFileSync(join(root, "../src/components/SkuInputModal.jsx"), "utf8");
const sharedJsx = readFileSync(
  join(root, "../src/features/listings/components/listingSkuLookupShared.jsx"),
  "utf8",
);
const lookupPanelCss = readFileSync(
  join(root, "../src/features/listings/components/listingSkuLookupPanel.css"),
  "utf8",
);

const sharedDomainImportMatch = sharedJsx.match(
  /import\s*\{([^}]+)\}\s*from\s*"\.\.\/utils\/listingSkuLookupDomain\.js"/,
);
const sharedDomainImports = sharedDomainImportMatch
  ? sharedDomainImportMatch[1].split(",").map((part) => part.trim()).filter(Boolean)
  : [];

assert("shared imports domain block", Boolean(sharedDomainImportMatch));
assert(
  "shared imports normalizeListingSkuInput",
  sharedDomainImports.includes("normalizeListingSkuInput"),
);
assert(
  "shared imports evaluateListingSkuRowReady",
  sharedDomainImports.includes("evaluateListingSkuRowReady"),
);
assert(
  "shared imports evaluateListingSkuIndividualConfirmReady",
  sharedDomainImports.includes("evaluateListingSkuIndividualConfirmReady"),
);
assert(
  "shared hook uses imported normalizer not free symbol",
  sharedJsx.includes("normalizeListingSkuInput(skuInput)") &&
    !sharedJsx.match(/function normalizeListingSkuInput|const normalizeListingSkuInput/),
);

assert("bulk uses readyDrafts", bulkModalJsx.includes("readyDrafts") && bulkModalJsx.includes("resolutionsRef"));
assert("bulk row uses lookup hook", bulkRowJsx.includes("useListingSkuResolution"));
assert("bulk row renders lookup panel", bulkRowJsx.includes("ListingSkuLookupPanel"));
assert(
  "bulk row clears sku when rejecting matched product",
  bulkRowJsx.includes('onSkuChange(listingId, "")') &&
    bulkRowJsx.includes("handleToggleProduct") &&
    bulkRowJsx.includes("shouldRejectListingSkuExistingMatch"),
);
assert(
  "bulk row refocuses sku input after match reject",
  bulkRowJsx.includes("focusListingSkuInput") &&
    bulkRowJsx.includes("bulk-listing-sku-${listingId}"),
);
assert(
  "bulk modal removes cleared resolution from ref",
  bulkModalJsx.includes("resolutionsRef.current.delete(listingId)"),
);
assert("individual uses shared lookup", skuModalJsx.includes("useListingSkuResolution"));
assert("individual uses shared panel", skuModalJsx.includes("ListingSkuLookupPanel"));
assert(
  "individual clears sku when rejecting matched product",
  skuModalJsx.includes('setSku("")') &&
    skuModalJsx.includes("handleToggleProduct") &&
    skuModalJsx.includes("shouldRejectListingSkuExistingMatch"),
);
assert(
  "individual refocuses sku input after match reject",
  skuModalJsx.includes('focusListingSkuInput("anuncios-sku-modal-input")'),
);
assert(
  "shared exports focus helper",
  sharedJsx.includes("export function focusListingSkuInput"),
);
assert(
  "bulk unified outer orange frame on row wrap",
  lookupPanelCss.includes(".bulk-listing-sku-modal__row-wrap--has-resolution") &&
    lookupPanelCss.includes("border: 1px solid var(--s7-orange"),
);
assert(
  "bulk row loses inner border when expanded",
  lookupPanelCss.includes(
    ".bulk-listing-sku-modal__row-wrap--has-resolution .bulk-listing-sku-modal__row.s7-operational-row-card",
  ) && lookupPanelCss.includes("border: none"),
);
assert(
  "bulk resolution panel has no dividing border",
  lookupPanelCss.includes(".bulk-listing-sku-modal__row-resolution") &&
    !lookupPanelCss.match(/\.bulk-listing-sku-modal__row-resolution[\s\S]*?border-top:\s*0/),
);
assert(
  "bulk inner product card uses gray selected contour",
  lookupPanelCss.includes(
    ".bulk-listing-sku-modal__row-resolution .anuncios-sku-modal__lookup-item--selected",
  ) && lookupPanelCss.includes("box-shadow: none"),
);
assert(
  "bulk row passes batch not found save action",
  bulkRowJsx.includes("notFoundSaveActionLabel={LISTING_SKU_LOOKUP_SAVE_ACTION_BATCH}"),
);
assert(
  "shared panel builds contextual not found message",
  sharedJsx.includes("buildListingSkuLookupNotFoundMessage(notFoundSaveActionLabel)"),
);
assert(
  "individual lookup selected keeps shared orange border",
  lookupPanelCss.includes(".anuncios-sku-modal__lookup-item--selected") &&
    lookupPanelCss.includes("border-color: var(--s7-orange"),
);

if (failures.length > 0) {
  console.error("FAIL listing sku resolution unit tests:");
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`PASS listing sku resolution (${30 - failures.length} checks)`);
