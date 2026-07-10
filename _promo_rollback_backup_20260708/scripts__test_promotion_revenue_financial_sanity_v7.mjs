import assert from "node:assert/strict";

import {
  resolvePromotionRevenueContract,
} from "../src/features/pricing/promotions/promotionRevenueFinancialSanityV7.js";
import {
  buildPromotionRevenueRowsFinal,
  PI_PROMO_REVENUE_RENDER_VERSION,
} from "../src/features/pricing/promotions/buildPromotionRevenueRowsFinal.js";

function testPremiumDescontacoPreservaEnvio() {
  const previousValidContract = {
    shipping_cost_brl: "49.35",
  };

  const contract = resolvePromotionRevenueContract({
    promotionSnapshot: {
      listing_id: "MLB6086602390",
      listing_type_id: "premium",
      promotion_selected_key: "MLB6086602390:07-07:premium",
      promotion_id: "07-07",
      promotion_name: "07.07 e Descontaço",
      has_snapshot: true,
    },
    asyncScenario: {
      marketplace: {
        sale_price_brl: "270.54",
        sale_fee_amount_brl: "36.52",
        listing_type_label: "Premium",
        sale_fee_percent: "13.50",
      },
    },
    listingTypeId: "premium",
    previousValidContract,
  });

  assert.equal(contract.shipping_cost_brl, "49.35");
  assert.equal(contract.sources.shipping_cost, "preserved_shipping_from_previous_valid_contract");
  assert.equal(contract.receive_brl, "184.67");
  assert.notEqual(contract.receive_brl, "234.02");
}

function testFeeDiscountNaoAceitaFonteFraca() {
  const contract = resolvePromotionRevenueContract({
    promotionSnapshot: {
      listing_id: "MLB6086602390",
      listing_type_id: "premium",
      promotion_selected_key: "MLB6086602390:super-casa:premium",
      promotion_id: "super-casa",
      promotion_name: "7/7 SUPER Oferta CASA",
      marketplace_fee_discount_brl: "6.29",
      fee_discount_source: "promotion_fee_discount_brl_prop",
      has_snapshot: true,
    },
    asyncScenario: {
      marketplace: {
        sale_price_brl: "200.00",
        sale_fee_amount_brl: "20.00",
        shipping_cost_amount_brl: "30.00",
      },
    },
    listingTypeId: "premium",
  });

  assert.equal(contract.marketplace_fee_discount_brl, "0.00");
  assert.equal(contract.receive_brl, "150.00");
  assert.ok(contract.warnings.includes("ignored_untrusted_snapshot_fee_discount"));
}

function testFeeDiscountSnapshotConfiavelUsaTarifaLiquida() {
  const contract = resolvePromotionRevenueContract({
    promotionSnapshot: {
      listing_id: "MLB6086602390",
      listing_type_id: "premium",
      promotion_selected_key: "MLB6086602390:super-casa:premium",
      promotion_id: "super-casa",
      promotion_name: "7/7 SUPER Oferta CASA",
      marketplace_fee_discount_brl: "6.29",
      fee_discount_source: "promotion_card_contract.promotion_financial_adjustments",
      has_snapshot: true,
    },
    asyncScenario: {
      marketplace: {
        sale_price_brl: "180.00",
        promotion_fee_gross_brl: "35.00",
        shipping_cost_amount_brl: "20.00",
        listing_type_label: "Premium",
        sale_fee_percent: "19.44",
      },
    },
    listingTypeId: "premium",
  });

  assert.equal(contract.marketplace_fee_discount_brl, "6.29");
  assert.equal(contract.net_marketplace_fee_brl, "28.71");
  assert.equal(contract.receive_brl, "131.29");
  assert.equal(contract.sources.marketplace_fee_discount, "immutable_click_snapshot");
}

function testDiffDeterministicoTarifaOficial() {
  const bundle = buildPromotionRevenueRowsFinal({
    asyncScenario: {
      marketplace: {
        sale_price_brl: "100.00",
        promotion_fee_gross_brl: "20.00",
        promotion_fee_net_brl: "15.00",
        shipping_cost_amount_brl: "10.00",
        listing_type_label: "Clássico",
        sale_fee_percent: "15.00",
      },
    },
    listingTypeId: "classic",
  });

  assert.equal(PI_PROMO_REVENUE_RENDER_VERSION, "promo-revenue-financial-sanity-v7");
  assert.equal(bundle.finalFeeDiscountBrl, "5.00");
  assert.equal(bundle.finalAmountToReceiveBrl, "75.00");
  assert.equal(bundle.contract.sources.marketplace_fee_discount, "deterministic_official_fee_diff");
  const feeRow = bundle.rows.find((row) => row.key === "fee");
  assert.equal(feeRow?.subtitle_label, "Clássico");
  assert.equal(feeRow?.subtitle_value, "15,00%");
}

testPremiumDescontacoPreservaEnvio();
testFeeDiscountNaoAceitaFonteFraca();
testFeeDiscountSnapshotConfiavelUsaTarifaLiquida();
testDiffDeterministicoTarifaOficial();

console.log("S1.PROMO-REVENUE-FINANCIAL-SANITY-V7: 4/4 OK");
