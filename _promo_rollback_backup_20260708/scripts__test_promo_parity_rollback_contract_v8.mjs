// ======================================================
// Teste local — S1.PROMO-PARITY-ROLLBACK-AND-CONTRACT-V8
// Casos A–H. Golden fixture MLB6086602390 / SKU 11011 (não é hardcode de produção).
// Rodar: node scripts/test_promo_parity_rollback_contract_v8.mjs
// ======================================================

import {
  buildPromotionRevenueRowsFromContractV8,
  isCompareContractIsolatedFromOfficial,
  resolveOfficialRowContract,
  resolvePromotionCompareContract,
  resolvePromotionParityContracts,
} from "../src/features/pricing/promotions/promotionParityContractV8.js";

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

function money(brl) {
  return brl == null ? null : String(brl);
}

// Golden fixture — valores oficiais lidos do print da Central de Promoções do ML.
const GOLDEN = {
  "07.07 e Descontaço": { final: "270.54", receive: "184.67", feeDiscount: "0.00" },
  "7/7 SUPER Oferta CASA": { final: "223.92", receive: "160.49", feeDiscount: "16.15" },
  "Venda Casa e Decor": { final: "265.00", receive: "181.36", feeDiscount: "1.49" },
  "Festival Casa Nova": { final: "254.91", receive: "173.64", feeDiscount: "2.49" },
  "Aumente suas vendas": { final: "265.00", receive: "181.36", feeDiscount: "1.49" },
  "Julho de Férias": { final: "265.00", receive: "179.87", feeDiscount: "0.00" },
};

/** Snapshot oficial (official row) do anúncio atual — anúncio Premium (gold_pro). */
function snapshotOficial(nome, promotionId) {
  const g = GOLDEN[nome];
  return {
    promotion_id: promotionId,
    promotion_name: nome,
    promotion_final_price_brl: g.final,
    official_amount_to_receive_brl: g.receive,
    marketplace_fee_discount_brl: g.feeDiscount,
    fee_discount_source: g.feeDiscount !== "0.00" ? "central_de_promocoes" : "official_listing_prices",
    listing_type_id: "gold_pro",
    listing_type_label: "Premium",
  };
}

/** Cenário simulado por listing_type. */
function cenarioSimulado({ salePrice, grossFee, netFee, shipping, payout, feePercent, label }) {
  return {
    marketplace: {
      sale_price_brl: salePrice,
      fee_amount_before_promo_subsidy_brl: grossFee,
      sale_fee_net_display_brl: netFee,
      shipping_cost_amount_brl: shipping,
      marketplace_payout_amount_brl: payout,
      sale_fee_percent: feePercent,
      listing_type_label: label,
    },
  };
}

console.log("\n[A] Card Clássico nunca renderiza label Premium");
{
  const c = resolvePromotionCompareContract({
    scenario: cenarioSimulado({
      salePrice: "223.92",
      grossFee: "40.00",
      netFee: "40.00",
      shipping: "20.00",
      payout: "163.92",
      feePercent: "17.50",
      label: "Premium",
    }),
    comparisonModel: "classic",
  });
  ok(c.listing_type_label === "Clássico", "label = Clássico", `(got ${c.listing_type_label})`);
  ok(c.listing_type_id === "gold_special", "listing_type_id = gold_special", `(got ${c.listing_type_id})`);
}

console.log("\n[B] Card Premium nunca renderiza label Clássico");
{
  const c = resolvePromotionCompareContract({
    scenario: cenarioSimulado({
      salePrice: "223.92",
      grossFee: "50.00",
      netFee: "50.00",
      shipping: "20.00",
      payout: "153.92",
      feePercent: "13.50",
      label: "Clássico",
    }),
    comparisonModel: "premium",
  });
  ok(c.listing_type_label === "Premium", "label = Premium", `(got ${c.listing_type_label})`);
  ok(c.listing_type_id === "gold_pro", "listing_type_id = gold_pro", `(got ${c.listing_type_id})`);
}

console.log("\n[C] 7/7 SUPER Oferta CASA — official_row bate com ML");
{
  const off = resolveOfficialRowContract({
    promotionSnapshot: snapshotOficial("7/7 SUPER Oferta CASA", "PROMO_777"),
    currentListingType: "premium",
  });
  ok(money(off.final_price_brl) === "223.92", "final_price = 223.92", `(got ${off.final_price_brl})`);
  ok(money(off.receive_brl) === "160.49", "receive = 160.49", `(got ${off.receive_brl})`);
  ok(money(off.fee_discount_brl) === "16.15", "fee_discount = 16.15", `(got ${off.fee_discount_brl})`);
}

console.log("\n[D] Aumente suas vendas — official_row bate com ML");
{
  const off = resolveOfficialRowContract({
    promotionSnapshot: snapshotOficial("Aumente suas vendas", "PROMO_AUM"),
    currentListingType: "premium",
  });
  ok(money(off.final_price_brl) === "265.00", "final_price = 265.00", `(got ${off.final_price_brl})`);
  ok(money(off.receive_brl) === "181.36", "receive = 181.36", `(got ${off.receive_brl})`);
  ok(money(off.fee_discount_brl) === "1.49", "fee_discount = 1.49", `(got ${off.fee_discount_brl})`);
}

console.log("\n[E] 07.07 e Descontaço — official_row bate com ML");
{
  const off = resolveOfficialRowContract({
    promotionSnapshot: snapshotOficial("07.07 e Descontaço", "PROMO_0707"),
    currentListingType: "premium",
  });
  ok(money(off.final_price_brl) === "270.54", "final_price = 270.54", `(got ${off.final_price_brl})`);
  ok(money(off.receive_brl) === "184.67", "receive = 184.67", `(got ${off.receive_brl})`);
}

console.log("\n[F] official_row Premium — classic_compare NÃO pode ser cópia");
{
  const parity = resolvePromotionParityContracts({
    promotionSnapshot: snapshotOficial("07.07 e Descontaço", "PROMO_0707"),
    currentListingType: "premium",
    classicScenario: cenarioSimulado({
      salePrice: "270.54",
      grossFee: "47.34",
      netFee: "47.34",
      shipping: "38.53",
      payout: "184.67", // provocação: mesmo número do oficial
      feePercent: "17.50",
      label: "Clássico",
    }),
    premiumScenario: cenarioSimulado({
      salePrice: "270.54",
      grossFee: "47.34",
      netFee: "47.34",
      shipping: "38.53",
      payout: "184.67",
      feePercent: "13.50",
      label: "Premium",
    }),
  });
  const classic = parity.classic_compare_contract;
  const off = parity.official_row_contract;
  ok(classic.listing_type_label === "Clássico", "classic mantém label Clássico", `(got ${classic.listing_type_label})`);
  ok(classic.is_current_listing_type === false, "classic não é o listing atual (Premium)", "");
  // Classic usa seu próprio payout (mesmo valor coincidente vem do cenário Clássico, não do oficial):
  ok(
    classic.sources.receive === "listing_type_official_simulation_payout",
    "classic receive vem da simulação Clássico, não do official row",
    `(got ${classic.sources.receive})`,
  );
  // Premium (listing atual) usa SSOT oficial:
  ok(
    parity.premium_compare_contract.sources.receive === "official_promotion_row_ssot",
    "premium (atual) usa SSOT oficial",
    `(got ${parity.premium_compare_contract.sources.receive})`,
  );
  ok(off.listing_type_id === "gold_pro", "official_row é Premium", `(got ${off.listing_type_id})`);
}

console.log("\n[G] Nenhum render final pode ter source=none / financial_contract_incomplete");
{
  const c = resolvePromotionCompareContract({
    scenario: cenarioSimulado({
      salePrice: "223.92",
      grossFee: "40.07",
      netFee: "40.07",
      shipping: "23.36",
      payout: "160.49",
      feePercent: "13.50",
      label: "Premium",
    }),
    comparisonModel: "premium",
  });
  const values = Object.values(c.sources);
  ok(!values.includes("none"), "nenhuma source = none", `(${JSON.stringify(c.sources)})`);
  ok(!values.includes(null), "nenhuma source = null", `(${JSON.stringify(c.sources)})`);
  ok(c.sources.receive !== "financial_contract_incomplete", "receive tem source rastreável", `(got ${c.sources.receive})`);
  ok(c.is_valid === true, "contrato válido", `(warnings ${JSON.stringify(c.warnings)})`);
}

console.log("\n[H] Nenhum card mostra spinner se pending do request atual terminou");
{
  const c = resolvePromotionCompareContract({
    scenario: cenarioSimulado({
      salePrice: "265.00",
      grossFee: "35.11",
      netFee: "33.62",
      shipping: "50.02",
      payout: "181.36",
      feePercent: "13.50",
      label: "Premium",
    }),
    comparisonModel: "premium",
  });
  // Mesmo com finPend=true, se contrato é válido o builder força pending=false.
  const bundle = buildPromotionRevenueRowsFromContractV8(c, { pending: true });
  ok(bundle.pending === false, "pending suprimido quando contrato válido", `(got ${bundle.pending})`);
  ok(bundle.rows.every((r) => r.isLoading === false), "nenhuma linha em loading", "");
  const bundleFinal = buildPromotionRevenueRowsFromContractV8(c, { pending: false });
  ok(bundleFinal.rows.every((r) => r.isLoading === false), "render final sem spinner", "");
}

console.log("\n[Extra] Você recebe considera envio (07.07 Premium não pode virar 234.02)");
{
  const c = resolvePromotionCompareContract({
    scenario: cenarioSimulado({
      salePrice: "270.54",
      grossFee: "36.52",
      netFee: "36.52",
      shipping: "49.35",
      payout: undefined, // força fórmula
      feePercent: "13.50",
      label: "Premium",
    }),
    comparisonModel: "premium",
  });
  ok(money(c.receive_brl) === "184.67", "receive = 184.67 (270.54 - 36.52 - 49.35)", `(got ${c.receive_brl})`);
  ok(c.receive_brl !== "234.02", "receive nunca ignora envio (≠ 234.02)", `(got ${c.receive_brl})`);
}

console.log("\n────────────────────────────────────────");
console.log(`RESULTADO v8: ${passes} passaram, ${fails} falharam`);
if (fails > 0) {
  console.log("FALHAS:");
  falhas.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("TODOS OS CASOS v8 PASSARAM ✓");
