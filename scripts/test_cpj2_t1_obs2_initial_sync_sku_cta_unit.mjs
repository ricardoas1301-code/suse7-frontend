#!/usr/bin/env node
/**
 * CPJ-2 T1 OBS2 — CTA SKU/vínculo fail-closed durante initial sync + universe gate.
 */
import assert from "node:assert/strict";
import {
  getListingProductLinkActions,
  isListingProductLinkUniverseStable,
} from "../src/features/listings/utils/listingProductLinkActions.js";

const onInform = () => {};

function assertCtasHidden(actions, label) {
  assert.equal(actions.showInformSkuMl, false, `${label}: showInformSkuMl`);
  assert.equal(actions.showVincular, false, `${label}: showVincular`);
  assert.equal(actions.showCompletar, false, `${label}: showCompletar`);
  assert.equal(actions.primaryCtaLabel, null, `${label}: primaryCtaLabel`);
  assert.equal(actions.blockedByInitialSyncUniverse, true, `${label}: blocked`);
}

// CASE 1 — OT/state ainda carregando (UNKNOWN: prop ausente / null / false)
{
  assert.equal(isListingProductLinkUniverseStable({}), false);
  assert.equal(isListingProductLinkUniverseStable({ initialSyncUniverseStable: null }), false);
  assert.equal(isListingProductLinkUniverseStable({ initialSyncUniverseStable: false }), false);
  const actions = getListingProductLinkActions(
    {
      skuDependencyPending: true,
      skuDependencyReason: "ml_missing_sku",
      sku: null,
      productId: null,
    },
    onInform,
  );
  assertCtasHidden(actions, "CASE1_LOADING");
  console.log("CASE1_OT_LOADING_CTA_HIDDEN=PASS");
}

// CASE 2 — initial sync real em andamento (unstable explícito)
{
  const actions = getListingProductLinkActions(
    {
      initialSyncUniverseStable: false,
      skuDependencyPending: true,
      skuDependencyReason: "product_link_missing",
      sku: "SKU-GO-1",
      productId: null,
    },
    onInform,
  );
  assertCtasHidden(actions, "CASE2_SYNC_IN_PROGRESS");
  console.log("CASE2_INITIAL_SYNC_IN_PROGRESS_CTA_HIDDEN=PASS");
}

// CASE 3 / 4 — Products pending/running → FE recebe universeStable=false do BE
{
  for (const label of ["CASE3_PRODUCTS_PENDING", "CASE4_PRODUCTS_RUNNING"]) {
    const actions = getListingProductLinkActions(
      {
        initialSyncUniverseStable: false,
        skuDependencyPending: true,
        skuDependencyReason: "product_link_missing",
        sku: "SKU-X",
        productId: null,
      },
      onInform,
    );
    assertCtasHidden(actions, label);
  }
  console.log("CASE3_4_PRODUCTS_NOT_TERMINAL_CTA_HIDDEN=PASS");
}

// CASE 5 — Products real done + listing sem SKU → Cadastrar SKU
{
  const actions = getListingProductLinkActions(
    {
      initialSyncUniverseStable: true,
      skuDependencyPending: true,
      skuDependencyReason: "ml_missing_sku",
      sku: null,
      productId: null,
      skuPending: true,
      attentionReason: "sku_pending_ml",
    },
    onInform,
  );
  assert.equal(actions.showInformSkuMl, true);
  assert.equal(actions.showVincular, false);
  assert.equal(actions.primaryCtaLabel, "Cadastrar SKU");
  assert.equal(actions.blockedByInitialSyncUniverse, false);
  console.log("CASE5_PRODUCTS_DONE_MISSING_SKU_CTA=PASS");
}

// CASE 6 — Products real done + SKU + product_id null → Vincular produto
{
  const actions = getListingProductLinkActions(
    {
      initialSyncUniverseStable: true,
      skuDependencyPending: true,
      skuDependencyReason: "product_link_missing",
      sku: "SKU-GO-1",
      productId: null,
    },
    onInform,
  );
  assert.equal(actions.showInformSkuMl, false);
  assert.equal(actions.showVincular, true);
  assert.equal(actions.primaryCtaLabel, "Vincular produto");
  console.log("CASE6_PRODUCTS_DONE_SKU_NO_PRODUCT_CTA=PASS");
}

// CASE 7 — Products real done + product_id presente → sem CTA vínculo
{
  const actions = getListingProductLinkActions(
    {
      initialSyncUniverseStable: true,
      skuDependencyPending: false,
      skuDependencyReason: null,
      sku: "SKU-1",
      productId: "product-1",
      isProductReady: true,
    },
    onInform,
  );
  assert.equal(actions.showInformSkuMl, false);
  assert.equal(actions.showVincular, false);
  assert.equal(actions.primaryCtaLabel, null);
  console.log("CASE7_PRODUCT_LINKED_NO_VINCULO_CTA=PASS");
}

// CASE 10 — SMR-RP comportamento estável preservado (universo true + custo incompleto)
{
  const actions = getListingProductLinkActions(
    {
      initialSyncUniverseStable: true,
      productId: "rp-product-1",
      sku: "RP-SKU",
      skuDependencyPending: false,
      isProductReady: false,
      pricingContext: { product_health: { product_health_status: "INCOMPLETE_PRODUCT" } },
    },
    onInform,
  );
  assert.equal(actions.showVincular, false);
  assert.equal(actions.showInformSkuMl, false);
  assert.equal(actions.showCompletar, true);
  console.log("CASE10_ACCOUNT_A_STABLE_COST_CTA_PRESERVED=PASS");
}

console.log("[test_cpj2_t1_obs2_initial_sync_sku_cta_unit] OK");
