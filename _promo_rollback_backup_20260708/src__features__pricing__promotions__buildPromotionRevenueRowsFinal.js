// ======================================================
// PI — linhas finais da Receita do Marketplace (aba Promoções).
// v7 — contrato financeiro saneado. Decimal.js — sem float.
// ======================================================

import Decimal from "decimal.js";

import {
  decStr2PromoV7,
  resolvePromotionRevenueContract,
  toDecPromoV7,
} from "./promotionRevenueFinancialSanityV7.js";

const ROUND = Decimal.ROUND_HALF_UP;

export const PI_PROMO_REVENUE_RENDER_VERSION = "promo-revenue-financial-sanity-v7";

/** @param {Decimal | null | undefined} d @returns {string} */
function formatBrlDisplay(d) {
  if (d == null || !d.isFinite()) return "—";
  const n = Number(d.toFixed(2));
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** @param {Decimal | null | undefined} d @returns {string} */
function formatNegativeBrlDisplay(d) {
  if (d == null || !d.isFinite() || d.isZero()) return "—";
  const n = Number(d.abs().toFixed(2));
  return `-R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** @param {string | null | undefined} pct @returns {string | null} */
function formatPercentDisplay(pct) {
  const d = toDecPromoV7(pct);
  if (d == null) return null;
  const n = Number(d.toDecimalPlaces(2, ROUND).toFixed(2));
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * @param {{
 *   salePriceBrl?: string | null;
 *   grossSaleFeeBrl?: string | null;
 *   shippingCostBrl?: string | null;
 *   promotionSnapshot?: unknown;
 *   asyncScenario?: unknown;
 *   previousValidContract?: Record<string, unknown> | null;
 *   listingTypeId?: string | null;
 * }} params
 */
export function buildPromotionRevenueRowsFinal({
  salePriceBrl = null,
  grossSaleFeeBrl = null,
  shippingCostBrl = null,
  promotionSnapshot = null,
  asyncScenario = null,
  previousValidContract = null,
  listingTypeId = null,
}) {
  const scenarioForContract =
    asyncScenario != null
      ? asyncScenario
      : {
          marketplace: {
            sale_price_brl: salePriceBrl,
            sale_fee_amount_brl: grossSaleFeeBrl,
            shipping_cost_amount_brl: shippingCostBrl,
          },
        };

  const contract = resolvePromotionRevenueContract({
    promotionSnapshot,
    asyncScenario: scenarioForContract,
    listingTypeId,
    previousValidContract,
    salePriceOverrideBrl: salePriceBrl,
  });

  const saleDec = toDecPromoV7(contract.promotion_final_price_brl);
  const netFeeDec = toDecPromoV7(contract.net_marketplace_fee_brl);
  const shipDec = toDecPromoV7(contract.shipping_cost_brl);
  const feeDiscountDec = toDecPromoV7(contract.marketplace_fee_discount_brl);
  const receiveDec = toDecPromoV7(contract.receive_brl);

  const shouldRenderFeeDiscountLine = feeDiscountDec != null && feeDiscountDec.gt(0);
  const commissionPercentDisplay = formatPercentDisplay(contract.commission_percent);

  /** @type {{ label: string; value: string; subtitle_label?: string | null; subtitle_value?: string | null; detail_label?: string | null; detail_value?: string | null; positive?: boolean; total?: boolean; key: string; kind: string; isLoading: boolean }[]} */
  const rows = [];

  if (saleDec != null) {
    rows.push({
      key: "sale",
      label: "Valor de venda na promoção",
      value: formatBrlDisplay(saleDec),
      kind: "money",
      isLoading: false,
    });
  }

  rows.push({
    key: "fee",
    label: "Tarifa de venda",
    value: formatNegativeBrlDisplay(netFeeDec),
    subtitle_label: contract.listing_type_label,
    subtitle_value: commissionPercentDisplay,
    detail_label: contract.listing_type_label,
    detail_value: commissionPercentDisplay,
    kind: "money",
    isLoading: false,
  });

  rows.push({
    key: "shipping",
    label: "Custo de envio",
    value: formatNegativeBrlDisplay(shipDec),
    kind: "money",
    isLoading: false,
  });

  if (shouldRenderFeeDiscountLine && feeDiscountDec != null) {
    rows.push({
      key: "fee-discount",
      label: "Reduzimos sua tarifa",
      value: `+${formatBrlDisplay(feeDiscountDec)}`,
      positive: true,
      kind: "money",
      isLoading: false,
    });
  }

  rows.push({
    key: "receive",
    label: "Você recebe",
    value: formatBrlDisplay(receiveDec),
    total: true,
    kind: "money",
    isLoading: false,
  });

  return {
    rows,
    contract,
    amountToReceiveBrl: contract.receive_brl,
    feeDiscountBrl: shouldRenderFeeDiscountLine ? decStr2PromoV7(feeDiscountDec) : "0.00",
    shouldRenderFeeDiscountLine,
    inferredFeeDiscountBrl: null,
    rawScenarioAmountToReceiveBrl: contract.receive_brl,
    finalFeeDiscountBrl: shouldRenderFeeDiscountLine ? decStr2PromoV7(feeDiscountDec) : "0.00",
    finalAmountToReceiveBrl: contract.receive_brl,
    feeDiscountSource: contract.sources.marketplace_fee_discount,
    preservedFromSnapshot: contract.sources.marketplace_fee_discount === "immutable_click_snapshot",
  };
}

/**
 * @param {Record<string, unknown>} payload
 */
export function logPromotionRevenueRenderRealComponent(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMOTION_REVENUE_RENDER_REAL_COMPONENT]", payload);
}

/**
 * Props primitivas a partir do snapshot imutável — SSOT.
 * Nunca retorna fee zero se snapshot congelado tiver valor positivo.
 *
 * @param {unknown} snapshot
 */
export function resolverPropsPrimitivasReceitaPromocao(snapshot) {
  if (snapshot == null || typeof snapshot !== "object") {
    return {
      promotionFeeDiscountBrl: null,
      snapshotFeeDiscountBrl: null,
      promotionOfficialAmountToReceiveBrl: null,
      promotionRevenueSource: "none",
      promotionSelectedKey: null,
      requestId: null,
    };
  }

  const snap = /** @type {Record<string, unknown>} */ (snapshot);
  const selectedKey =
    snap.promotion_selected_key != null
      ? String(snap.promotion_selected_key)
      : snap.snapshot_key != null
        ? String(snap.snapshot_key)
        : null;

  if (snap.has_snapshot !== true && selectedKey == null) {
    return {
      promotionFeeDiscountBrl: null,
      snapshotFeeDiscountBrl: null,
      promotionOfficialAmountToReceiveBrl: null,
      promotionRevenueSource: "none",
      promotionSelectedKey: null,
      requestId: snap.request_id != null ? String(snap.request_id) : null,
    };
  }

  const feeRaw =
    snap.marketplace_fee_discount_brl != null && String(snap.marketplace_fee_discount_brl).trim() !== ""
      ? String(snap.marketplace_fee_discount_brl).trim()
      : null;

  const officialRaw =
    snap.official_amount_to_receive_brl != null &&
    String(snap.official_amount_to_receive_brl).trim() !== ""
      ? String(snap.official_amount_to_receive_brl).trim()
      : null;

  const sourceTrace =
    snap.source_trace != null && String(snap.source_trace).trim() !== ""
      ? String(snap.source_trace).trim()
      : snap.fee_discount_source != null && String(snap.fee_discount_source).trim() !== ""
        ? String(snap.fee_discount_source).trim()
        : "selectedPromotionSnapshot";

  return {
    promotionFeeDiscountBrl: feeRaw,
    snapshotFeeDiscountBrl: feeRaw,
    promotionOfficialAmountToReceiveBrl: officialRaw,
    promotionRevenueSource: sourceTrace,
    promotionSelectedKey: selectedKey,
    requestId: snap.request_id != null ? String(snap.request_id) : null,
  };
}

/** @param {Record<string, unknown>} scenario @returns {{ sale: string | null; fee: string | null; ship: string | null }} */
export function extrairValoresMarketplaceCenarioPromocao(scenario) {
  if (scenario == null || typeof scenario !== "object") {
    return { sale: null, fee: null, ship: null };
  }
  const sim = /** @type {Record<string, unknown>} */ (scenario);
  const m =
    sim.marketplace != null && typeof sim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (sim.marketplace)
      : /** @type {Record<string, unknown>} */ ({});

  const pick = (keys) => {
    for (const key of keys) {
      const v = m[key];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return null;
  };

  return {
    sale: pick(["sale_price_brl"]) ?? (sim.sale_price_brl != null ? String(sim.sale_price_brl) : null),
    fee: pick([
      "fee_amount_before_promo_subsidy_brl",
      "promotion_fee_gross_brl",
      "sale_fee_amount_brl",
      "fee_amount_brl",
    ]),
    ship: pick(["shipping_cost_amount_brl", "shipping_cost_brl"]),
  };
}
