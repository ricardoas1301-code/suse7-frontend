// ======================================================
// Teste local — S1.PROMO-BASE-FINANCIAL-PARITY-NO-SUBSIDY
// Cálculo base (sem subsídio): recebe = preço − tarifa cheia − envio.
// Casos golden MLB6415546858 / SKU 2047 (Premium).
// Rodar: node scripts/test_promo_base_no_subsidy_parity.mjs
// ======================================================

import { resolvePromotionCardBaseFinancials } from "../src/features/pricing/promotions/resolvePromotionCardBaseFinancials.js";

let passes = 0;
let fails = 0;
const falhas = [];

function ok(cond, nome, detalhe = "") {
  if (cond) {
    passes += 1;
    console.log(`  ok ${nome}`);
  } else {
    fails += 1;
    falhas.push(`${nome} ${detalhe}`);
    console.log(`  FAIL ${nome} ${detalhe}`);
  }
}

/** Cenário simulado por listing_type (marketplace oficial da simulação). */
function scenario({ sale, gross, net, ship, payout, feePct }) {
  const marketplace = {
    sale_price_brl: sale,
    fee_amount_before_promo_subsidy_brl: gross,
    sale_fee_net_display_brl: net,
    shipping_cost_amount_brl: ship,
    marketplace_payout_amount_brl: payout,
    sale_fee_percent: feePct,
  };
  return { marketplace };
}

// ---- Casos golden MLB6415546858 (Premium) ----
const casos = [
  { nome: "Aumente suas vendas", sale: "61.00", gross: "10.06", ship: "9.95", esperado: "40.99" },
  { nome: "Top Oferta Papelaria", sale: "61.00", gross: "10.06", ship: "9.95", esperado: "40.99" },
  { nome: "07.07 e Descontaco", sale: "62.32", gross: "10.28", ship: "9.95", esperado: "42.09" },
  { nome: "Oferta relampago", sale: "60.39", gross: "9.96", ship: "9.95", esperado: "40.48" },
  { nome: "Julho de Ferias", sale: "61.00", gross: "10.06", ship: "9.95", esperado: "40.99" },
  { nome: "Inverno", sale: "61.00", gross: "10.06", ship: "9.95", esperado: "40.99" },
];

console.log("\n[GOLDEN] MLB6415546858 / SKU 2047 — Premium, base sem subsidio");
for (const c of casos) {
  const r = resolvePromotionCardBaseFinancials({
    scenario: scenario({ sale: c.sale, gross: c.gross, ship: c.ship }),
    salePriceOverrideBrl: c.sale,
    listingTypeId: "gold_pro",
  });
  ok(r.final_price_brl === c.sale, `${c.nome}: preco final = ${c.sale}`, `(got ${r.final_price_brl})`);
  ok(r.marketplace_fee_brl === c.gross, `${c.nome}: tarifa = ${c.gross}`, `(got ${r.marketplace_fee_brl})`);
  ok(r.shipping_brl === c.ship, `${c.nome}: envio = ${c.ship}`, `(got ${r.shipping_brl})`);
  ok(r.rendered_receive_brl === c.esperado, `${c.nome}: voce recebe = ${c.esperado}`, `(got ${r.rendered_receive_brl})`);
  ok(r.rendered_receive_brl === r.calculated_receive_brl, `${c.nome}: render == calculado`, "");
}

console.log("\n[RECONCILIA] linhas visiveis fecham com 'Voce recebe'");
{
  const r = resolvePromotionCardBaseFinancials({
    scenario: scenario({ sale: "61.00", gross: "10.06", ship: "9.95" }),
    salePriceOverrideBrl: "61.00",
    listingTypeId: "gold_pro",
  });
  const recalc = (Number(r.final_price_brl) - Number(r.marketplace_fee_brl) - Number(r.shipping_brl)).toFixed(2);
  const fecha = recalc === r.rendered_receive_brl;
  ok(fecha, "61.00 - 10.06 - 9.95 == 40.99", `(got ${r.rendered_receive_brl})`);
}

console.log("\n[NAO-18.95] nunca renderiza 18.95 quando base esperada e 40.99");
{
  const r = resolvePromotionCardBaseFinancials({
    scenario: scenario({ sale: "61.00", gross: "10.06", net: "6.81", ship: "9.95", payout: "44.24" }),
    salePriceOverrideBrl: "61.00",
    // official ML (com subsidio) NAO pode virar SSOT de render:
    officialAmountToReceiveBrl: "44.24",
    listingTypeId: "gold_pro",
  });
  ok(r.rendered_receive_brl === "40.99", "recebe base = 40.99 (ignora official 44.24)", `(got ${r.rendered_receive_brl})`);
  ok(r.rendered_receive_brl !== "18.95", "nao renderiza 18.95", `(got ${r.rendered_receive_brl})`);
  ok(r.official_ml_receive_brl === "44.24", "official ML preservado so em auditoria", `(got ${r.official_ml_receive_brl})`);
  ok(
    r.official_ml_receive_ignored_reason === "ml_receive_may_include_subsidy_handled_in_lab",
    "motivo de ignorar official registrado",
    `(got ${r.official_ml_receive_ignored_reason})`,
  );
  ok(r.has_ml_subsidy_hint === true, "detecta hint de subsidio para o lab", `(got ${r.has_ml_subsidy_hint})`);
}

console.log("\n[SUBSIDIO-OFF] tarifa exibida e a CHEIA (gross), nunca a net com subsidio");
{
  const r = resolvePromotionCardBaseFinancials({
    scenario: scenario({ sale: "61.00", gross: "10.06", net: "6.81", ship: "9.95" }),
    salePriceOverrideBrl: "61.00",
    listingTypeId: "gold_pro",
  });
  ok(r.marketplace_fee_brl === "10.06", "tarifa cheia = 10.06 (nao 6.81)", `(got ${r.marketplace_fee_brl})`);
  ok(r.rendered_receive_brl === "40.99", "recebe base = 40.99", `(got ${r.rendered_receive_brl})`);
}

console.log("\n[ISOLAMENTO] Classico e Premium usam seus proprios cenarios");
{
  const classic = resolvePromotionCardBaseFinancials({
    scenario: scenario({ sale: "61.00", gross: "7.32", ship: "9.95" }),
    salePriceOverrideBrl: "61.00",
    listingTypeId: "gold_special",
  });
  const premium = resolvePromotionCardBaseFinancials({
    scenario: scenario({ sale: "61.00", gross: "10.06", ship: "9.95" }),
    salePriceOverrideBrl: "61.00",
    listingTypeId: "gold_pro",
  });
  ok(classic.listing_type_label === "Clássico", "classico rotulado Clássico", `(got ${classic.listing_type_label})`);
  ok(premium.listing_type_label === "Premium", "premium rotulado Premium", `(got ${premium.listing_type_label})`);
  ok(classic.marketplace_fee_brl !== premium.marketplace_fee_brl, "tarifas isoladas por card", "");
  ok(classic.rendered_receive_brl === "43.73", "classico recebe = 43.73", `(got ${classic.rendered_receive_brl})`);
  ok(premium.rendered_receive_brl === "40.99", "premium recebe = 40.99", `(got ${premium.rendered_receive_brl})`);
}

console.log(`\n==== ${passes} passaram, ${fails} falharam ====`);
if (fails > 0) {
  console.log("Falhas:\n" + falhas.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
