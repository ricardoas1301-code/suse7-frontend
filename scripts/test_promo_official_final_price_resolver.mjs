// ======================================================
// Teste local — S1.PROMO-FINAL-PRICE-FRESHNESS-AND-CANDIDATE-AUDIT
// Valida prioridade do preço final oficial vs desconto genérico de campanha.
// Rodar: node scripts/test_promo_official_final_price_resolver.mjs
// ======================================================

import {
  resolvePromotionOfficialFinalPrice,
  buildPromotionFinalPriceFreshnessAudit,
  buildPromotionFinalPriceFreshnessConfirmationLog,
  buildPromotionOfficialFinalPriceCandidateFixLog,
} from "../src/features/pricing/promotions/resolvePromotionOfficialFinalPrice.js";

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

console.log("\n[1] Preco oficial do card (final_price_source=price) tem prioridade");
{
  const r = resolvePromotionOfficialFinalPrice({
    scenario: {
      promotion_card_contract: {
        real_promotion_final_price_brl: "61.00",
        final_price_source: "price",
        original_price_brl: "78.60",
      },
      marketplace: { sale_price_brl: "61.00" },
    },
  });
  ok(r.final_price_brl === "61.00", "preco = 61.00", `(got ${r.final_price_brl})`);
  ok(r.used_generic_campaign_discount === false, "nao usa desconto generico", "");
}

console.log("\n[2] DEAL: max_discounted_price oficial por item");
{
  const r = resolvePromotionOfficialFinalPrice({
    scenario: {
      promotion_card_contract: {
        real_promotion_final_price_brl: "62.32",
        final_price_source: "max_discounted_price",
        original_price_brl: "78.60",
      },
    },
  });
  ok(r.final_price_brl === "62.32", "preco = 62.32", `(got ${r.final_price_brl})`);
  ok(r.selected_candidate_reason === "official_per_listing_price_from_card_contract", "razao oficial", "");
}

console.log("\n[3] Sem preco oficial por item -> cai em generico com warning");
{
  const r = resolvePromotionOfficialFinalPrice({
    scenario: {
      marketplace: {
        original_price_brl: "78.60",
        seller_discount_percent: "5",
        sale_price_brl: null,
      },
    },
  });
  ok(r.used_generic_campaign_discount === true, "flag desconto generico", "");
  ok(r.final_price_brl === "74.67", "78.60 - 5% = 74.67", `(got ${r.final_price_brl})`);
  ok(r.warnings.includes("used_generic_campaign_discount_no_official_price_found"), "warning presente", "");
}

console.log("\n[4] Preco oficial existe no raw -> NUNCA usar generico");
{
  const r = resolvePromotionOfficialFinalPrice({
    scenario: {
      // contrato veio sem final_price_source oficial, mas raw tem o preco por item
      promotion_offer_contract: {
        raw_source_fields: { price: 61.0, original_price: 78.6 },
      },
      marketplace: { original_price_brl: "78.60", seller_discount_percent: "5" },
    },
  });
  ok(r.final_price_brl === "61.00", "preco oficial do raw = 61.00", `(got ${r.final_price_brl})`);
  ok(r.used_generic_campaign_discount === false, "nao caiu no generico", "");
}

console.log("\n[5] Contaminado por preco anonimo -> nao confia no candidato do card");
{
  const r = resolvePromotionOfficialFinalPrice({
    scenario: {
      promotion_card_contract: {
        real_promotion_final_price_brl: "50.00",
        final_price_source: "price",
        contaminated_by_anonymous_price_discount: true,
        original_price_brl: "78.60",
      },
      marketplace: { sale_price_brl: "50.00" },
    },
  });
  ok(r.warnings.includes("contaminated_by_anonymous_price_discount"), "warning de contaminacao", "");
}

console.log("\n[6] Auditoria detecta divergencia UI vs resolver (generico 74.67 vs oficial 61.00)");
{
  const audit = buildPromotionFinalPriceFreshnessAudit({
    scenario: {
      promotion_name: "Julho de Ferias",
      // UI hoje mostraria o final do card (generico), mas raw tem 61.00 oficial
      promotion_card_contract: {
        real_promotion_final_price_brl: "74.67",
        final_price_source: "seller_percentage",
        original_price_brl: "78.60",
      },
      promotion_offer_contract: { raw_source_fields: { price: 61.0 } },
      marketplace: { sale_price_brl: "74.67" },
    },
    listingId: "MLB6415546858",
    sku: "2047",
  });
  ok(audit.final_price_brl === "74.67", "UI mostraria 74.67", `(got ${audit.final_price_brl})`);
  ok(audit.resolver_final_price_brl === "61.00", "resolver acha 61.00 oficial", `(got ${audit.resolver_final_price_brl})`);
  ok(audit.ui_vs_resolver_divergent === true, "divergencia detectada", "");
  ok(audit.source_layer === "frontend_contract", "camada frontend_contract", "");
}

console.log("\n[7] MLB6415546858 — promocoes ja aprovadas nao regrediram");
{
  const casosOk = [
    { nome: "Aumente suas vendas", card: "61.00", raw: 61.0, source: "price", esperado: "61.00" },
    { nome: "07.07 e Descontaco", card: "62.32", rawMax: 62.32, source: "max_discounted_price", esperado: "62.32" },
    { nome: "Top Oferta Papelaria", card: "61.00", raw: 61.0, source: "price", esperado: "61.00" },
  ];
  for (const c of casosOk) {
    const r = resolvePromotionOfficialFinalPrice({
      scenario: {
        promotion_name: c.nome,
        promotion_card_contract: {
          real_promotion_final_price_brl: c.card,
          final_price_source: c.source,
          original_price_brl: "78.60",
        },
        promotion_offer_contract: {
          raw_source_fields: {
            price: c.raw,
            max_discounted_price: c.rawMax,
            original_price: 78.6,
          },
        },
        marketplace: { sale_price_brl: c.card },
      },
    });
    ok(r.final_price_brl === c.esperado, `${c.nome}: mantem ${c.esperado}`, `(got ${r.final_price_brl})`);
    ok(r.used_generic_campaign_discount === false, `${c.nome}: sem generico`, "");
  }
}

console.log("\n[8] MLB6415546858 — corrige candidatos divergentes se raw oficial existir");
{
  const casosFix = [
    { nome: "Oferta relampago", anterior: "55.80", raw: 60.39, esperado: "60.39" },
    { nome: "Julho de Ferias", anterior: "74.67", raw: 61.0, esperado: "61.00" },
    { nome: "Inverno", anterior: "74.67", raw: 61.0, esperado: "61.00" },
  ];
  for (const c of casosFix) {
    const audit = buildPromotionFinalPriceFreshnessAudit({
      scenario: {
        promotion_name: c.nome,
        promotion_card_contract: {
          real_promotion_final_price_brl: c.anterior,
          final_price_source: c.nome === "Oferta relampago" ? "price" : "seller_percentage",
          original_price_brl: "78.60",
        },
        promotion_offer_contract: { raw_source_fields: { price: c.raw, original_price: 78.6 } },
        marketplace: { sale_price_brl: c.anterior, seller_discount_percent: "5" },
      },
      listingId: "MLB6415546858",
      sku: "2047",
    });
    const fixLog = buildPromotionOfficialFinalPriceCandidateFixLog(audit);
    ok(audit.final_price_brl === c.anterior, `${c.nome}: UI anterior ${c.anterior}`, `(got ${audit.final_price_brl})`);
    ok(audit.resolver_final_price_brl === c.esperado, `${c.nome}: resolver ${c.esperado}`, `(got ${audit.resolver_final_price_brl})`);
    ok(audit.ui_vs_resolver_divergent === true, `${c.nome}: divergencia detectada`, "");
    ok(fixLog.has_listing_specific_price_candidate === true, `${c.nome}: candidato especifico existe`, "");
    ok(fixLog.needs_resync === false, `${c.nome}: sem resync quando raw existe`, "");
  }
}

console.log("\n[9] Confirmation log — controle positivo MLB4473427655");
{
  const audit = buildPromotionFinalPriceFreshnessAudit({
    scenario: {
      promotion_name: "Oferta relâmpago",
      ml_expected_final_price_brl: "109.31",
      promotion_card_contract: {
        real_promotion_final_price_brl: "109.31",
        final_price_source: "price",
        original_price_brl: "189.90",
      },
      promotion_offer_contract: { raw_source_fields: { price: 109.31 } },
      marketplace: { sale_price_brl: "109.31" },
    },
    listingId: "MLB4473427655",
  });
  const confirmation = buildPromotionFinalPriceFreshnessConfirmationLog(audit);
  ok(confirmation.ml_expected_final_price_brl === "109.31", "expected MLB447 Oferta = 109.31", `(got ${confirmation.ml_expected_final_price_brl})`);
  ok(confirmation.ui_final_price_brl === "109.31", "ui final = 109.31", `(got ${confirmation.ui_final_price_brl})`);
  ok(confirmation.diagnosis === "ok", "diagnosis ok", `(got ${confirmation.diagnosis})`);
  ok(confirmation.needs_resync === false, "sem resync no controle positivo", "");
}

console.log("\n[10] Confirmation log — payload sem candidato oficial precisa resync/server");
{
  const audit = buildPromotionFinalPriceFreshnessAudit({
    scenario: {
      promotion_name: "Inverno",
      ml_expected_final_price_brl: "167.00",
      promotion_card_contract: {
        real_promotion_final_price_brl: "176.90",
        final_price_source: "seller_percentage",
        original_price_brl: "186.21",
      },
      marketplace: { original_price_brl: "186.21", seller_discount_percent: "5" },
    },
    listingId: "MLB3303280951",
  });
  const confirmation = buildPromotionFinalPriceFreshnessConfirmationLog(audit);
  ok(confirmation.ml_expected_final_price_brl === "167.00", "expected MLB330 Inverno = 167.00", `(got ${confirmation.ml_expected_final_price_brl})`);
  ok(confirmation.has_listing_specific_price_candidate === false, "sem candidato especifico", "");
  ok(confirmation.needs_resync === true, "precisa resync/servidor", "");
  ok(
    confirmation.diagnosis === "server_payload_missing_official_price",
    "diagnosis payload sem preco oficial",
    `(got ${confirmation.diagnosis})`,
  );
}

console.log("\n[11] Identidade oficial: candidato de outra promocao/listing nao pode vencer");
{
  const r = resolvePromotionOfficialFinalPrice({
    scenario: {
      promotion_card_contract: {
        listing_id: "MLB3303280951",
        marketplace_account_id: "ACC-1",
        promotion_id: "PROMO-A",
        offer_id: "OFFER-A",
        promotion_type: "SMART",
        real_promotion_final_price_brl: "176.90",
        final_price_source: "seller_percentage",
        original_price_brl: "186.21",
      },
      promotion_offer_contract: {
        raw_source_fields: {
          listing_id: "MLB9999999999",
          marketplace_account_id: "ACC-1",
          promotion_id: "PROMO-B",
          offer_id: "OFFER-B",
          price_raw: 167,
        },
      },
      marketplace: { original_price_brl: "186.21", seller_discount_percent: "5" },
    },
  });
  ok(r.final_price_brl === "176.90", "ignora candidato de outra identidade", `(got ${r.final_price_brl})`);
  ok(r.used_generic_campaign_discount === true, "cai no generico quando candidato nao pertence a identidade", "");
}

console.log("\n[12] Regressao exata — MLB4222207785 controle positivo");
{
  const casos = [
    ["Inverno", "126.93"],
    ["Julho de Férias", "126.93"],
    ["07.07 e Descontaço", "116.64"],
    ["Aumente suas vendas", "116.64"],
    ["Festival Casa Nova", "116.64"],
    ["Venda Casa e Decor", "116.64"],
  ];
  for (const [nome, esperado] of casos) {
    const audit = buildPromotionFinalPriceFreshnessAudit({
      scenario: {
        promotion_name: nome,
        ml_expected_final_price_brl: esperado,
        promotion_card_contract: {
          listing_id: "MLB4222207785",
          promotion_id: `P-${nome}`,
          offer_id: `O-${nome}`,
          promotion_type: "SMART",
          real_promotion_final_price_brl: esperado,
          final_price_source: "price",
          original_price_brl: "149.90",
        },
        promotion_offer_contract: {
          raw_source_fields: { listing_id: "MLB4222207785", promotion_id: `P-${nome}`, offer_id: `O-${nome}`, price_raw: esperado },
        },
      },
      listingId: "MLB4222207785",
    });
    const confirmation = buildPromotionFinalPriceFreshnessConfirmationLog(audit);
    ok(confirmation.resolver_final_price_brl === esperado, `${nome}: resolver ${esperado}`, `(got ${confirmation.resolver_final_price_brl})`);
    ok(confirmation.diagnosis === "ok", `${nome}: diagnosis ok`, `(got ${confirmation.diagnosis})`);
  }
}

console.log("\n[13] Regressao exata — MLB3303280951");
{
  const casos = [
    ["07.07 e Descontaço", "180.61"],
    ["Saia na frente c/ Cozinha", "180.61"],
    ["Oferta relâmpago", "175.12"],
    ["Inverno", "167.00"],
    ["8.8 e Dia dos Pais", "167.00"],
  ];
  for (const [nome, esperado] of casos) {
    const anterior = nome === "Oferta relâmpago" ? "176.89" : nome.includes("Inverno") || nome.includes("8.8") ? "176.90" : esperado;
    const audit = buildPromotionFinalPriceFreshnessAudit({
      scenario: {
        promotion_name: nome,
        ml_expected_final_price_brl: esperado,
        promotion_card_contract: {
          listing_id: "MLB3303280951",
          promotion_id: `P-${nome}`,
          offer_id: `O-${nome}`,
          promotion_type: nome === "Oferta relâmpago" ? "LIGHTNING" : "SMART",
          real_promotion_final_price_brl: anterior,
          final_price_source: anterior === esperado ? "price" : "seller_percentage",
          original_price_brl: "186.21",
        },
        promotion_offer_contract: {
          raw_source_fields: { listing_id: "MLB3303280951", promotion_id: `P-${nome}`, offer_id: `O-${nome}`, price_raw: esperado },
        },
        marketplace: { sale_price_brl: anterior },
      },
      listingId: "MLB3303280951",
    });
    const confirmation = buildPromotionFinalPriceFreshnessConfirmationLog(audit);
    ok(confirmation.resolver_final_price_brl === esperado, `${nome}: resolver ${esperado}`, `(got ${confirmation.resolver_final_price_brl})`);
    ok(confirmation.needs_resync === false, `${nome}: sem resync com candidato oficial`, "");
  }
}

console.log("\n[14] Regressao exata — MLB6415439064");
{
  const casos = [
    ["Aumente suas vendas", "62.00"],
    ["07.07 e Descontaço", "62.08"],
    ["Top Oferta Papelaria", "62.08"],
    ["Julho de Férias", "62.00"],
    ["Inverno", "62.00"],
  ];
  for (const [nome, esperado] of casos) {
    const anterior = nome === "Julho de Férias" || nome === "Inverno" ? "72.48" : esperado;
    const audit = buildPromotionFinalPriceFreshnessAudit({
      scenario: {
        promotion_name: nome,
        ml_expected_final_price_brl: esperado,
        promotion_card_contract: {
          listing_id: "MLB6415439064",
          promotion_id: `P-${nome}`,
          offer_id: `O-${nome}`,
          promotion_type: "SMART",
          real_promotion_final_price_brl: anterior,
          final_price_source: anterior === esperado ? "price" : "seller_percentage",
          original_price_brl: "76.30",
        },
        promotion_offer_contract: {
          raw_source_fields: { listing_id: "MLB6415439064", promotion_id: `P-${nome}`, offer_id: `O-${nome}`, price_raw: esperado },
        },
        marketplace: { sale_price_brl: anterior },
      },
      listingId: "MLB6415439064",
    });
    const confirmation = buildPromotionFinalPriceFreshnessConfirmationLog(audit);
    ok(confirmation.resolver_final_price_brl === esperado, `${nome}: resolver ${esperado}`, `(got ${confirmation.resolver_final_price_brl})`);
    ok(confirmation.needs_resync === false, `${nome}: sem resync com candidato oficial`, "");
  }
}

console.log(`\n==== ${passes} passaram, ${fails} falharam ====`);
if (fails > 0) {
  console.log("Falhas:\n" + falhas.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
