// ======================================================
// Teste local — S1.PROMO-ROLLBACK-LAST-GOOD-PLUS-FEE-SUBSIDY-OVERLAY
// Overlay isolado + casos de aceite MLB6086602390 e MLB6415546858.
// Rodar: node scripts/test_promo_fee_subsidy_overlay.mjs
// ======================================================

import {
  resolveMercadoLivreFeeSubsidyOverlay,
  resolvePromotionCardFinancials,
} from "../src/features/pricing/promotions/resolveMercadoLivreFeeSubsidyOverlay.js";

let passes = 0;
let fails = 0;
const falhas = [];

function ok(cond, nome, detalhe = "") {
  if (cond) {
    passes += 1;
    console.log(`  ✓ ${nome}`);
  } else {
    fails += 1;
    falhas.push(`${nome} ${detalhe}`);
    console.log(`  ✗ ${nome} ${detalhe}`);
  }
}

/** Cenário simulado por listing_type (marketplace oficial da simulação). */
function scenario({ sale, gross, net, ship, payout, feePct, subsidyExplicit = null }) {
  const marketplace = {
    sale_price_brl: sale,
    fee_amount_before_promo_subsidy_brl: gross,
    sale_fee_net_display_brl: net,
    shipping_cost_amount_brl: ship,
    marketplace_payout_amount_brl: payout,
    sale_fee_percent: feePct,
  };
  if (subsidyExplicit != null) marketplace.marketplace_fee_discount_brl = subsidyExplicit;
  return { marketplace };
}

/** Linha oficial da promoção (Central de Promoções) com subsídio explícito. */
function officialRow({ subsidy = null }) {
  const row = { promotion_id: "PROMO", marketplace: {} };
  if (subsidy != null) {
    row.promotion_financial_adjustments = { marketplace_fee_discount_brl: subsidy };
  }
  return row;
}

console.log("\n[A] 07.07 e Descontaço — Premium sem subsídio");
{
  const r = resolvePromotionCardFinancials({
    scenario: scenario({ sale: "270.54", gross: "47.34", net: "47.34", ship: "38.53", payout: "184.67", feePct: "13.50" }),
    officialAmountToReceiveBrl: "184.67",
    officialPromotionRow: officialRow({ subsidy: null }),
    listingTypeId: "gold_pro",
    currentListingTypeId: "gold_pro",
  });
  ok(r.receive_brl === "184.67", "Você recebe = 184.67", `(got ${r.receive_brl})`);
  ok(r.subsidy_applied === false, "sem linha Reduzimos sua tarifa", `(applied ${r.subsidy_applied})`);
}

console.log("\n[B] 7/7 SUPER Oferta CASA — Premium com subsídio 16.15");
{
  const r = resolvePromotionCardFinancials({
    scenario: scenario({ sale: "223.92", gross: "63.43", net: "47.28", ship: "16.15", payout: "160.49", feePct: "13.50" }),
    officialAmountToReceiveBrl: "160.49",
    officialPromotionRow: officialRow({ subsidy: "16.15" }),
    listingTypeId: "gold_pro",
    currentListingTypeId: "gold_pro",
  });
  ok(r.receive_brl === "160.49", "Você recebe = 160.49", `(got ${r.receive_brl})`);
  ok(r.subsidy_applied === true, "linha Reduzimos aplicada", `(applied ${r.subsidy_applied})`);
  ok(r.subsidy_brl === "16.15", "subsídio = 16.15", `(got ${r.subsidy_brl})`);
  ok(r.receive_brl !== "144.34", "não mostra 144.34 (regressão v7)", `(got ${r.receive_brl})`);
}

console.log("\n[C] Aumente suas vendas — Premium com subsídio 1.49");
{
  const r = resolvePromotionCardFinancials({
    scenario: scenario({ sale: "265.00", gross: "35.11", net: "33.62", ship: "50.02", payout: "181.36", feePct: "13.50" }),
    officialAmountToReceiveBrl: "181.36",
    officialPromotionRow: officialRow({ subsidy: "1.49" }),
    listingTypeId: "gold_pro",
    currentListingTypeId: "gold_pro",
  });
  ok(r.receive_brl === "181.36", "Você recebe = 181.36", `(got ${r.receive_brl})`);
  ok(r.subsidy_applied === true && r.subsidy_brl === "1.49", "subsídio = 1.49 aplicado", `(got ${r.subsidy_brl})`);
}

console.log("\n[D] Festival Casa Nova — Premium com subsídio 2.49");
{
  const r = resolvePromotionCardFinancials({
    scenario: scenario({ sale: "254.91", gross: "36.75", net: "34.26", ship: "47.01", payout: "173.64", feePct: "13.50" }),
    officialAmountToReceiveBrl: "173.64",
    officialPromotionRow: officialRow({ subsidy: "2.49" }),
    listingTypeId: "gold_pro",
    currentListingTypeId: "gold_pro",
  });
  ok(r.receive_brl === "173.64", "Você recebe = 173.64", `(got ${r.receive_brl})`);
  ok(r.subsidy_applied === true && r.subsidy_brl === "2.49", "subsídio = 2.49 aplicado", `(got ${r.subsidy_brl})`);
}

console.log("\n[E] Oferta relâmpago — sem subsídio visível");
{
  const r = resolvePromotionCardFinancials({
    scenario: scenario({ sale: "252.36", gross: "45.42", net: "45.42", ship: "38.00", payout: "168.94", feePct: "13.50" }),
    officialAmountToReceiveBrl: "168.94",
    officialPromotionRow: officialRow({ subsidy: null }),
    listingTypeId: "gold_pro",
    currentListingTypeId: "gold_pro",
  });
  ok(r.receive_brl === "168.94", "Você recebe = 168.94", `(got ${r.receive_brl})`);
  ok(r.subsidy_applied === false, "não mostra Reduzimos sua tarifa", `(applied ${r.subsidy_applied})`);
}

console.log("\n[F] Julho de Férias — sem subsídio");
{
  const r = resolvePromotionCardFinancials({
    scenario: scenario({ sale: "265.00", gross: "35.11", net: "35.11", ship: "50.02", payout: "179.87", feePct: "13.50" }),
    officialAmountToReceiveBrl: "179.87",
    officialPromotionRow: officialRow({ subsidy: null }),
    listingTypeId: "gold_pro",
    currentListingTypeId: "gold_pro",
  });
  ok(r.receive_brl === "179.87", "Você recebe = 179.87", `(got ${r.receive_brl})`);
  ok(r.subsidy_applied === false, "sem subsídio", `(applied ${r.subsidy_applied})`);
}

console.log("\n[ISOLAMENTO] Subsídio Premium NÃO vaza para o card Clássico");
{
  const overlayClassic = resolveMercadoLivreFeeSubsidyOverlay({
    officialPromotionRow: officialRow({ subsidy: "16.15" }),
    cardScenario: scenario({ sale: "223.92", gross: "39.19", net: "39.19", ship: "20.00", payout: "164.73", feePct: "17.50" }),
    listingTypeId: "gold_special", // card Clássico
    currentListingTypeId: "gold_pro", // anúncio atual é Premium
  });
  ok(overlayClassic.has_subsidy === true, "overlay detecta subsídio oficial", "");
  ok(overlayClassic.can_apply_to_card === false, "não aplica subsídio Premium no Clássico", `(can_apply ${overlayClassic.can_apply_to_card})`);

  const rClassic = resolvePromotionCardFinancials({
    scenario: scenario({ sale: "223.92", gross: "39.19", net: "39.19", ship: "20.00", payout: "164.73", feePct: "17.50" }),
    officialAmountToReceiveBrl: null, // não é o tipo atual → sem SSOT oficial
    officialPromotionRow: officialRow({ subsidy: "16.15" }),
    listingTypeId: "gold_special",
    currentListingTypeId: "gold_pro",
  });
  ok(rClassic.subsidy_applied === false, "card Clássico não aplica subsídio Premium", "");
  ok(rClassic.receive_brl === "164.73", "Clássico usa payout da própria simulação (164.73)", `(got ${rClassic.receive_brl})`);
  ok(rClassic.receive_brl !== "160.49", "Clássico não copia recebe Premium (160.49)", `(got ${rClassic.receive_brl})`);
}

console.log("\n[MLB6415546858] Premium — recebe 44.24, redução oficial 3.25, nunca 18.95");
{
  const r = resolvePromotionCardFinancials({
    scenario: scenario({ sale: "61.00", gross: "10.06", net: "6.81", ship: "9.95", payout: "44.24", feePct: "13.50" }),
    officialAmountToReceiveBrl: "44.24",
    officialPromotionRow: officialRow({ subsidy: "3.25" }),
    listingTypeId: "gold_pro",
    currentListingTypeId: "gold_pro",
  });
  ok(r.receive_brl === "44.24", "Você recebe = 44.24", `(got ${r.receive_brl})`);
  ok(r.receive_brl !== "18.95", "não mostra 18.95", `(got ${r.receive_brl})`);
  ok(r.subsidy_applied === true && r.subsidy_brl === "3.25", "redução oficial 3.25 aplicada", `(got ${r.subsidy_brl})`);
  ok(r.net_fee_brl === "6.81", "tarifa líquida Premium = 6.81", `(got ${r.net_fee_brl})`);
}

console.log("\n[FALLBACK] Sem official receive — usa payout da própria simulação, sem source=none");
{
  const r = resolvePromotionCardFinancials({
    scenario: scenario({ sale: "100.00", gross: "12.00", net: "12.00", ship: "10.00", payout: "78.00", feePct: "12.00" }),
    officialAmountToReceiveBrl: null,
    officialPromotionRow: officialRow({ subsidy: null }),
    listingTypeId: "gold_pro",
    currentListingTypeId: "gold_pro",
  });
  ok(r.receive_brl === "78.00", "recebe = payout 78.00", `(got ${r.receive_brl})`);
  ok(r.receive_source !== "none" && r.receive_source != null, "receive_source rastreável (sem none)", `(got ${r.receive_source})`);
}

console.log("\n────────────────────────────────────────");
console.log(`RESULTADO overlay: ${passes} passaram, ${fails} falharam`);
if (fails > 0) {
  console.log("FALHAS:");
  falhas.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("TODOS OS CASOS DO OVERLAY PASSARAM ✓");
