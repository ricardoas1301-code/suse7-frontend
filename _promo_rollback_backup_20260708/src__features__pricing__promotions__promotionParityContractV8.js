// ======================================================
// PI v8 — paridade e contratos financeiros isolados da aba Promoções.
//
// Três contratos separados (nunca colapsados):
//   1. official_row_contract   — o que o Mercado Livre mostra na Central de Promoções
//                                para o anúncio atual (pode ser Premium se o anúncio for Premium).
//   2. classic_compare_contract — simulação Clássico (gold_special). Nunca copia o oficial
//                                 quando o anúncio atual é Premium.
//   3. premium_compare_contract — simulação Premium (gold_pro). Deve bater com o oficial
//                                 quando o anúncio atual é Premium e a promoção é a mesma.
//
// Decimal.js — proibido float/Number/parseFloat em cálculo financeiro.
// ======================================================

import Decimal from "decimal.js";

const ROUND = Decimal.ROUND_HALF_UP;
const TOLERANCIA_BRL = new Decimal("0.02");

export const PI_PROMO_PARITY_RENDER_VERSION = "promo-parity-rollback-contract-v8";

/** Fontes confiáveis para a linha "Reduzimos sua tarifa". */
const TRUSTED_FEE_DISCOUNT_SOURCES = new Set([
  "promotion_card_contract.promotion_financial_adjustments",
  "promotion_offer_contract.promotion_financial_adjustments",
  "promotion_card_contract.fee_discount_fields",
  "promotion_offer_contract.fee_discount_fields",
  "promotion_card_contract.preco_mini_card",
  "promotion_fee_discount",
  "ml_financial_audit",
  "promotion_financial_adjustments",
  "financial_snapshot.marketplace_fee_discount_brl",
  "immutable_click_snapshot",
  "official_promotion_row",
  "official_listing_prices",
  "central_de_promocoes",
]);

/** @param {unknown} v @returns {Decimal | null} */
export function toDecV8(v) {
  if (v == null || v === "") return null;
  try {
    const normalized = String(v).trim().replace(/[^\d,.-]/g, "").replace(",", ".");
    if (normalized === "" || normalized === "-" || normalized === ".") return null;
    const d = new Decimal(normalized);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** @param {Decimal | null | undefined} d @returns {string | null} */
export function decStr2V8(d) {
  if (d == null || !d.isFinite()) return null;
  return d.toDecimalPlaces(2, ROUND).toFixed(2);
}

/** @param {unknown} value @returns {string | null} */
function cleanStr(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s !== "" ? s : null;
}

/** @param {Record<string, unknown> | null | undefined} obj @returns {Record<string, unknown>} */
function rec(obj) {
  return obj != null && typeof obj === "object" ? /** @type {Record<string, unknown>} */ (obj) : {};
}

/** @param {string | null | undefined} source */
export function isTrustedFeeDiscountSourceV8(source) {
  const s = cleanStr(source);
  if (s == null) return false;
  if (TRUSTED_FEE_DISCOUNT_SOURCES.has(s)) return true;
  return (
    s.includes("promotion_financial_adjustments") ||
    s.includes("fee_discount_fields") ||
    s.includes("official_listing_prices")
  );
}

/**
 * @param {"classic" | "premium" | null | undefined} model
 * @returns {"gold_special" | "gold_pro" | null}
 */
export function comparisonModelToListingTypeId(model) {
  if (model === "premium") return "gold_pro";
  if (model === "classic") return "gold_special";
  return null;
}

/** @param {"classic" | "premium" | null | undefined} model */
export function comparisonModelToLabel(model) {
  if (model === "premium") return "Premium";
  if (model === "classic") return "Clássico";
  return null;
}

/** @param {string | null | undefined} listingTypeId @returns {"classic" | "premium" | null} */
export function listingTypeIdToComparisonModel(listingTypeId) {
  const s = cleanStr(listingTypeId)?.toLowerCase();
  if (s == null) return null;
  if (s.includes("gold_pro") || s === "premium") return "premium";
  if (s.includes("gold_special") || s === "classic") return "classic";
  return null;
}

/** @param {Record<string, unknown>} src @param {string[]} keys @returns {{ dec: Decimal; key: string } | null} */
function pickDec(src, keys, { positiveOnly = false } = {}) {
  for (const key of keys) {
    const d = toDecV8(src[key]);
    if (d != null && (positiveOnly ? d.gt(0) : d.gte(0))) return { dec: d, key };
  }
  return null;
}

/**
 * Extrai os campos de marketplace do cenário simulado de um listing_type.
 * @param {unknown} scenario
 */
function extrairMarketplace(scenario) {
  const sim = rec(scenario);
  const m = rec(sim.marketplace);
  const sx = rec(sim.sale_xray_pricing);
  return { sim, m, sx };
}

/**
 * Contrato de comparação de UM listing_type isolado (Clássico OU Premium).
 * Deriva tudo do cenário simulado daquele tipo — nunca do contrato oficial de outro tipo.
 *
 * @param {{
 *   scenario: unknown;
 *   comparisonModel: "classic" | "premium";
 *   isCurrentListingType?: boolean;
 *   officialRowContract?: Record<string, unknown> | null;
 *   previousValidContract?: Record<string, unknown> | null;
 *   salePriceOverrideBrl?: string | null;
 *   selectedPromotionKey?: string | null;
 *   promotionId?: string | null;
 *   promotionName?: string | null;
 * }} params
 */
export function resolvePromotionCompareContract({
  scenario,
  comparisonModel,
  isCurrentListingType = false,
  officialRowContract = null,
  previousValidContract = null,
  salePriceOverrideBrl = null,
  selectedPromotionKey = null,
  promotionId = null,
  promotionName = null,
}) {
  const { sim, m, sx } = extrairMarketplace(scenario);
  const previous = rec(previousValidContract);
  const official = rec(officialRowContract);

  /** @type {string[]} */
  const warnings = [];

  const listingTypeId = comparisonModelToListingTypeId(comparisonModel);
  const listingTypeLabel = comparisonModelToLabel(comparisonModel);

  // Preço final — override de exibição, senão cenário simulado do próprio tipo.
  const salePick =
    toDecV8(salePriceOverrideBrl) != null
      ? { dec: /** @type {Decimal} */ (toDecV8(salePriceOverrideBrl)), key: "promotion_price_display_override" }
      : pickDec(m, ["sale_price_brl"]) ?? pickDec(sim, ["sale_price_brl"]);
  const finalPriceDec = salePick?.dec ?? null;

  const grossPick = pickDec(m, [
    "fee_amount_before_promo_subsidy_brl",
    "promotion_fee_gross_brl",
    "charged_fee_gross_brl",
    "sale_fee_amount_brl",
    "fee_amount_brl",
  ]) ?? pickDec(sx, ["charged_fee_gross_brl", "fee_amount_gross_brl"]);
  const grossFeeDec = grossPick?.dec ?? null;

  const explicitNetPick = pickDec(m, [
    "sale_fee_net_display_brl",
    "promotion_fee_net_brl",
    "fee_amount_after_promo_subsidy_brl",
    "charged_fee_net_brl",
  ]) ?? pickDec(sx, ["charged_fee_net_brl", "fee_amount_net_display_brl"]);

  const explicitFeeDiscountPick = pickDec(
    m,
    ["marketplace_fee_discount_brl", "marketplace_fee_discount_amount_brl", "fee_discount_brl", "charged_fee_discount_brl"],
    { positiveOnly: true },
  ) ?? pickDec(sx, ["charged_fee_reduction_brl", "subsidy_ml_brl"], { positiveOnly: true });

  const deterministicFeeDiscount =
    grossFeeDec != null && explicitNetPick?.dec != null && grossFeeDec.minus(explicitNetPick.dec).gt(TOLERANCIA_BRL)
      ? { dec: grossFeeDec.minus(explicitNetPick.dec), source: "deterministic_official_fee_diff" }
      : null;

  // Redução de tarifa do contrato oficial só entra se ESTE card é o listing_type atual publicado.
  const officialFeeDiscountDec = toDecV8(official.fee_discount_brl);
  const officialFeeMatchesThisCard =
    isCurrentListingType === true &&
    officialFeeDiscountDec != null &&
    officialFeeDiscountDec.gt(0) &&
    isTrustedFeeDiscountSourceV8(official.fee_discount_source);

  const feeDiscountResolved =
    deterministicFeeDiscount != null
      ? deterministicFeeDiscount
      : explicitFeeDiscountPick != null
        ? { dec: explicitFeeDiscountPick.dec, source: "official_listing_prices" }
        : officialFeeMatchesThisCard
          ? { dec: /** @type {Decimal} */ (officialFeeDiscountDec), source: "official_promotion_row_matched_listing_type" }
          : { dec: new Decimal(0), source: "official_listing_prices" };
  const feeDiscountDec = feeDiscountResolved.dec.toDecimalPlaces(2, ROUND);

  // Tarifa líquida = explícita > (bruta − redução) > bruta.
  let netFeeDec = explicitNetPick?.dec ?? null;
  let netFeeSource = explicitNetPick?.key ?? null;
  if (netFeeDec == null && grossFeeDec != null) {
    netFeeDec = feeDiscountDec.gt(0) ? Decimal.max(0, grossFeeDec.minus(feeDiscountDec)) : grossFeeDec;
    netFeeSource = feeDiscountDec.gt(0) ? "gross_minus_official_fee_discount" : grossPick?.key ?? null;
  }

  // Envio — cenário do próprio tipo; preserva positivo anterior; nunca vira "—" se conhecido.
  const shippingPick = pickDec(m, ["shipping_cost_amount_brl", "shipping_cost_brl"]) ?? pickDec(sx, ["shipping_cost_amount_brl", "shipping_cost_brl"]);
  let shippingDec = shippingPick?.dec ?? null;
  let shippingSource = shippingPick?.key ?? null;
  const previousShippingDec = toDecV8(previous.shipping_cost_brl);
  if ((shippingDec == null || shippingDec.lte(0)) && previousShippingDec != null && previousShippingDec.gt(0)) {
    shippingDec = previousShippingDec;
    shippingSource = "preserved_shipping_from_previous_valid_contract";
  }
  if (shippingDec == null) {
    shippingDec = new Decimal(0);
    shippingSource = "shipping_not_available";
    warnings.push("missing_shipping_cost");
  }

  // Você recebe — SSOT: payout oficial da simulação daquele tipo; senão fórmula.
  const scenarioPayoutPick = pickDec(m, ["marketplace_payout_amount_brl", "net_receivable_brl", "payout_after_promo_subsidy_brl"], { positiveOnly: true }) ?? pickDec(sim, ["marketplace_payout_amount_brl", "net_receivable_brl"], { positiveOnly: true });

  // Card do tipo atual publicado usa o "Você recebe" oficial do ML como SSOT quando existir.
  const officialReceiveDec = toDecV8(official.receive_brl);
  const useOfficialReceive =
    isCurrentListingType === true && officialReceiveDec != null && officialReceiveDec.gt(0);

  let receiveDec = null;
  let receiveSource = "financial_contract_incomplete";
  if (useOfficialReceive) {
    receiveDec = officialReceiveDec.toDecimalPlaces(2, ROUND);
    receiveSource = "official_promotion_row_ssot";
  } else if (scenarioPayoutPick != null) {
    receiveDec = scenarioPayoutPick.dec.toDecimalPlaces(2, ROUND);
    receiveSource = "listing_type_official_simulation_payout";
  } else if (finalPriceDec != null && netFeeDec != null && shippingDec != null) {
    receiveDec = finalPriceDec.minus(netFeeDec).minus(shippingDec).toDecimalPlaces(2, ROUND);
    receiveSource = "computed_final_minus_net_fee_minus_shipping";
  }

  if (finalPriceDec == null) warnings.push("missing_final_price");
  if (netFeeDec == null) warnings.push("missing_net_fee");
  if (receiveDec == null) warnings.push("missing_receive");

  const commissionPercent =
    cleanStr(m.sale_fee_percent) ?? cleanStr(m.commission_percent) ?? cleanStr(sx.sale_fee_percent);

  const isValid =
    finalPriceDec != null &&
    netFeeDec != null &&
    receiveDec != null &&
    !warnings.includes("missing_shipping_cost");

  return {
    comparison_model: comparisonModel,
    listing_type_id: listingTypeId,
    listing_type_label: listingTypeLabel,
    commission_percent: commissionPercent,
    is_current_listing_type: isCurrentListingType === true,

    promotion_selected_key: selectedPromotionKey ?? cleanStr(sim.scenario_id) ?? null,
    promotion_id: promotionId ?? cleanStr(sim.promotion_id) ?? null,
    promotion_name: promotionName ?? cleanStr(sim.promotion_name) ?? cleanStr(sim.label) ?? null,

    final_price_brl: decStr2V8(finalPriceDec),
    gross_marketplace_fee_brl: decStr2V8(grossFeeDec),
    net_fee_brl: decStr2V8(netFeeDec),
    shipping_brl: decStr2V8(shippingDec),
    fee_discount_brl: decStr2V8(feeDiscountDec) ?? "0.00",
    receive_brl: decStr2V8(receiveDec),

    sources: {
      final_price: salePick?.key ?? null,
      gross_marketplace_fee: grossPick?.key ?? null,
      net_fee: netFeeSource,
      shipping: shippingSource,
      fee_discount: feeDiscountDec.gt(0) ? feeDiscountResolved.source : "official_listing_prices",
      receive: receiveSource,
    },
    warnings,
    is_valid: isValid,
  };
}

/**
 * Contrato oficial do anúncio atual (Central de Promoções).
 * SSOT: se houver official_amount_to_receive confiável, não recalcula.
 *
 * @param {{
 *   officialPromotionRow?: unknown;
 *   promotionSnapshot?: unknown;
 *   currentListingType?: "classic" | "premium" | null;
 * }} params
 */
export function resolveOfficialRowContract({
  officialPromotionRow = null,
  promotionSnapshot = null,
  currentListingType = null,
}) {
  const snap = rec(promotionSnapshot);
  const { sim, m } = extrairMarketplace(officialPromotionRow);

  const finalPriceDec =
    toDecV8(snap.promotion_final_price_brl) ??
    toDecV8(snap.buyer_final_price_brl) ??
    pickDec(m, ["sale_price_brl"])?.dec ??
    pickDec(sim, ["sale_price_brl"])?.dec ??
    null;

  const receivePick =
    toDecV8(snap.official_amount_to_receive_brl) != null
      ? { dec: /** @type {Decimal} */ (toDecV8(snap.official_amount_to_receive_brl)), source: "immutable_click_snapshot" }
      : pickDec(m, ["marketplace_payout_amount_brl", "net_receivable_brl"], { positiveOnly: true }) != null
        ? {
            dec: /** @type {Decimal} */ (pickDec(m, ["marketplace_payout_amount_brl", "net_receivable_brl"], { positiveOnly: true })?.dec),
            source: "official_promotion_row",
          }
        : null;

  const snapFeeSource = cleanStr(snap.fee_discount_source) ?? cleanStr(snap.source_trace);
  const feeDiscountDec = toDecV8(snap.marketplace_fee_discount_brl);
  const trustedFee =
    feeDiscountDec != null && feeDiscountDec.gt(0) && isTrustedFeeDiscountSourceV8(snapFeeSource)
      ? feeDiscountDec
      : null;

  const listingTypeId =
    cleanStr(snap.listing_type_id) ??
    comparisonModelToListingTypeId(currentListingType) ??
    cleanStr(sim.scenario_id);

  return {
    listing_type_id: listingTypeId,
    listing_type_label:
      cleanStr(snap.listing_type_label) ?? comparisonModelToLabel(currentListingType),
    final_price_brl: decStr2V8(finalPriceDec),
    receive_brl: receivePick != null ? decStr2V8(receivePick.dec) : null,
    fee_discount_brl: trustedFee != null ? decStr2V8(trustedFee) : "0.00",
    fee_discount_source: trustedFee != null ? snapFeeSource ?? "official_promotion_row" : "official_listing_prices",
    receive_source: receivePick?.source ?? "financial_contract_incomplete",
    promotion_id: cleanStr(snap.promotion_id) ?? cleanStr(sim.promotion_id) ?? null,
    promotion_name: cleanStr(snap.promotion_name) ?? cleanStr(sim.promotion_name) ?? null,
    current_listing_type: currentListingType,
  };
}

/**
 * Orquestra os três contratos isolados.
 *
 * @param {{
 *   officialPromotionRow?: unknown;
 *   promotionSnapshot?: unknown;
 *   classicScenario?: unknown;
 *   premiumScenario?: unknown;
 *   currentListingType?: "classic" | "premium" | null;
 *   selectedPromotionKey?: string | null;
 *   promotionId?: string | null;
 *   promotionName?: string | null;
 *   salePriceOverrideBrl?: string | null;
 *   previousValidContracts?: { classic?: Record<string, unknown> | null; premium?: Record<string, unknown> | null };
 * }} params
 */
export function resolvePromotionParityContracts({
  officialPromotionRow = null,
  promotionSnapshot = null,
  classicScenario = null,
  premiumScenario = null,
  currentListingType = null,
  selectedPromotionKey = null,
  promotionId = null,
  promotionName = null,
  salePriceOverrideBrl = null,
  previousValidContracts = {},
}) {
  const official_row_contract = resolveOfficialRowContract({
    officialPromotionRow,
    promotionSnapshot,
    currentListingType,
  });

  const classic_compare_contract = resolvePromotionCompareContract({
    scenario: classicScenario,
    comparisonModel: "classic",
    isCurrentListingType: currentListingType === "classic",
    officialRowContract: official_row_contract,
    previousValidContract: previousValidContracts.classic ?? null,
    salePriceOverrideBrl,
    selectedPromotionKey,
    promotionId,
    promotionName,
  });

  const premium_compare_contract = resolvePromotionCompareContract({
    scenario: premiumScenario,
    comparisonModel: "premium",
    isCurrentListingType: currentListingType === "premium",
    officialRowContract: official_row_contract,
    previousValidContract: previousValidContracts.premium ?? null,
    salePriceOverrideBrl,
    selectedPromotionKey,
    promotionId,
    promotionName,
  });

  return { official_row_contract, classic_compare_contract, premium_compare_contract };
}

/**
 * Verifica isolamento entre official row e o compare do tipo oposto.
 * @param {Record<string, unknown>} officialRow
 * @param {Record<string, unknown>} compareContract
 */
export function isCompareContractIsolatedFromOfficial(officialRow, compareContract) {
  const off = rec(officialRow);
  const cmp = rec(compareContract);
  // Se o compare é do MESMO listing type do oficial, pode bater (não é violação).
  if (off.listing_type_id != null && cmp.listing_type_id === off.listing_type_id) return true;
  // Tipos diferentes: receber idêntico ao oficial é suspeito de cópia.
  const offReceive = toDecV8(off.receive_brl);
  const cmpReceive = toDecV8(cmp.receive_brl);
  if (offReceive == null || cmpReceive == null) return true;
  return offReceive.minus(cmpReceive).abs().gt(TOLERANCIA_BRL);
}

/** @param {Decimal | null | undefined} d @returns {string} */
function formatBrlDisplayV8(d) {
  if (d == null || !d.isFinite()) return "—";
  const n = Number(d.toDecimalPlaces(2, ROUND).toFixed(2));
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** @param {Decimal | null | undefined} d @returns {string} */
function formatNegativeBrlDisplayV8(d) {
  if (d == null || !d.isFinite() || d.isZero()) return "—";
  const n = Number(d.abs().toDecimalPlaces(2, ROUND).toFixed(2));
  return `-R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** @param {string | null | undefined} pct @returns {string | null} */
function formatPercentDisplayV8(pct) {
  const d = toDecV8(pct);
  if (d == null) return null;
  const n = Number(d.toDecimalPlaces(2, ROUND).toFixed(2));
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * Linhas da Receita do Marketplace a partir do contrato de comparação isolado (v8).
 * @param {Record<string, unknown>} contract
 * @param {{ pending?: boolean }} [opts]
 */
export function buildPromotionRevenueRowsFromContractV8(contract, opts = {}) {
  const c = rec(contract);
  const pending = opts.pending === true && c.is_valid !== true;

  const finalPriceDec = toDecV8(c.final_price_brl);
  const netFeeDec = toDecV8(c.net_fee_brl);
  const shipDec = toDecV8(c.shipping_brl);
  const feeDiscountDec = toDecV8(c.fee_discount_brl);
  const receiveDec = toDecV8(c.receive_brl);

  const shouldRenderFeeDiscountLine = feeDiscountDec != null && feeDiscountDec.gt(0);
  const commissionPercentDisplay = formatPercentDisplayV8(c.commission_percent);

  /** @type {{ key: string; label: string; value: string; subtitle_label?: string | null; subtitle_value?: string | null; positive?: boolean; total?: boolean; kind: string; isLoading: boolean }[]} */
  const rows = [];

  if (finalPriceDec != null) {
    rows.push({
      key: "sale",
      label: "Valor de venda na promoção",
      value: formatBrlDisplayV8(finalPriceDec),
      kind: "money",
      isLoading: pending,
    });
  }

  rows.push({
    key: "fee",
    label: "Tarifa de venda",
    value: formatNegativeBrlDisplayV8(netFeeDec),
    subtitle_label: c.listing_type_label != null ? String(c.listing_type_label) : null,
    subtitle_value: commissionPercentDisplay,
    kind: "money",
    isLoading: pending,
  });

  rows.push({
    key: "shipping",
    label: "Custo de envio",
    value: formatNegativeBrlDisplayV8(shipDec),
    kind: "money",
    isLoading: pending,
  });

  if (shouldRenderFeeDiscountLine && feeDiscountDec != null) {
    rows.push({
      key: "fee-discount",
      label: "Reduzimos sua tarifa",
      value: `+${formatBrlDisplayV8(feeDiscountDec)}`,
      positive: true,
      kind: "money",
      isLoading: pending,
    });
  }

  rows.push({
    key: "receive",
    label: "Você recebe",
    value: formatBrlDisplayV8(receiveDec),
    total: true,
    kind: "money",
    isLoading: pending,
  });

  return {
    rows,
    shouldRenderFeeDiscountLine,
    feeDiscountBrl: shouldRenderFeeDiscountLine ? decStr2V8(feeDiscountDec) : "0.00",
    receiveBrl: c.receive_brl ?? null,
    pending,
  };
}

/** @param {Record<string, unknown>} payload */
export function logPromoParityRollbackContractV8(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMO_PARITY_ROLLBACK_AND_CONTRACT_V8]", payload);
}

/** @param {Record<string, unknown>} payload */
export function logPromoV8ChangedFilesAudit(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMO_V8_CHANGED_FILES_AUDIT]", payload);
}
