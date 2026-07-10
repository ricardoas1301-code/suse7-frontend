// ======================================================
// PI — snapshot financeiro imutável da promoção selecionada (clique mini card).
// Não pode ser sobrescrito pela simulação async.
// Decimal.js — sem float.
// ======================================================

import Decimal from "decimal.js";

import { obterContratoPrecoMiniCardPromocao } from "../../../components/pricing/pricingPromotionCardContract.js";
import { extrairReducaoTarifaDaPromocaoSelecionada } from "./calcularReceitaPiPromocaoRenderFinal.js";
import { resolverAjustesFinanceirosPromocaoComOrigem } from "./aplicarReducaoTarifaPromocaoNoCenario.js";
import {
  decStr2PromoV6,
  logPromotionFeeDiscountFinalStabilityV6,
  toDecPromoV6,
} from "./promotionFeeDiscountFinalStabilityV6.js";
import {
  isTrustedSnapshotFeeSource,
  logPromotionRevenueFinancialSanityV7,
} from "./promotionRevenueFinancialSanityV7.js";

const ROUND = Decimal.ROUND_HALF_UP;

/** @param {unknown} v @returns {Decimal | null} */
function toDec(v) {
  if (v == null || v === "") return null;
  try {
    const d = new Decimal(String(v).replace(",", "."));
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** @param {Decimal | null | undefined} d @returns {string | null} */
function decStr2(d) {
  if (d == null || !d.isFinite()) return null;
  return d.toDecimalPlaces(2, ROUND).toFixed(2);
}

/** @param {unknown} value @returns {unknown} */
function clonarProfundo(value) {
  if (value == null || typeof value !== "object") return value;
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

/**
 * @param {{
 *   listing_id?: string | null;
 *   promotion_id?: string | null;
 *   selection_id?: string | null;
 *   listing_type?: string | null;
 * }} params
 */
export function montarChaveSnapshotFinanceiroPromocao({
  listing_id = null,
  promotion_id = null,
  selection_id = null,
  listing_type = null,
}) {
  const lid = listing_id != null ? String(listing_id).trim() : "";
  const pid = promotion_id != null ? String(promotion_id).trim() : "";
  const sid = selection_id != null ? String(selection_id).trim() : "";
  const lt = listing_type != null ? String(listing_type).trim() : "";
  if (lid === "") return null;
  if (sid !== "" && lt !== "") return `${lid}:sel:${sid}:${lt}`;
  if (pid !== "" && lt !== "") return `${lid}:${pid}:${lt}`;
  if (pid !== "") return `${lid}:${pid}`;
  if (sid !== "") return `${lid}:sel:${sid}`;
  return null;
}

/**
 * Reconcilia redução de tarifa a partir do payout oficial ML.
 *
 * fee_discount = official_receive - sale_price + gross_fee + shipping
 *
 * @param {{
 *   official_amount_to_receive_brl?: string | null;
 *   sale_price_brl?: string | null;
 *   gross_sale_fee_brl?: string | null;
 *   shipping_cost_brl?: string | null;
 * }} params
 * @returns {string | null}
 */
export function inferirReducaoTarifaPorReconciliacaoPayout({
  official_amount_to_receive_brl = null,
  sale_price_brl = null,
  gross_sale_fee_brl = null,
  shipping_cost_brl = null,
}) {
  const officialDec = toDec(official_amount_to_receive_brl);
  const saleDec = toDec(sale_price_brl);
  const grossDec = toDec(gross_sale_fee_brl) ?? new Decimal(0);
  const shipDec = toDec(shipping_cost_brl) ?? new Decimal(0);

  if (officialDec == null || saleDec == null) return null;

  const inferred = officialDec.minus(saleDec).plus(grossDec).plus(shipDec);
  if (!inferred.gt(0)) return null;
  return decStr2(inferred);
}

/**
 * @param {Record<string, unknown>} payload
 */
export function logPromotionSelectedFinancialSnapshotCaptured(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMOTION_SELECTED_FINANCIAL_SNAPSHOT_CAPTURED]", payload);
}

/**
 * @param {{
 *   row: { scenario: unknown; group?: string } | null | undefined;
 *   listingExternalId?: string | null;
 *   currentListingType?: string | null;
 *   listingType?: string | null;
 *   selectionId?: string | null;
 *   requestId?: string | null;
 * }} params
 */
export function capturarSnapshotFinanceiroPromocaoSelecionada({
  row,
  listingExternalId = null,
  currentListingType = null,
  listingType = null,
  selectionId = null,
  requestId = null,
}) {
  const listingTypeEffective = listingType ?? currentListingType ?? null;
  const scenario = row?.scenario;
  if (scenario == null || typeof scenario !== "object") {
    return {
      listing_id: listingExternalId,
      promotion_id: null,
      promotion_name: null,
      selected_at: new Date().toISOString(),
      current_listing_type: listingTypeEffective,
      buyer_final_price_brl: null,
      official_amount_to_receive_brl: null,
      marketplace_fee_discount_brl: null,
      fee_discount_source: null,
      raw_promotion_card_contract: null,
      raw_promotion_offer_contract: null,
      snapshot_key: null,
      has_snapshot: false,
    };
  }

  const promo = /** @type {Record<string, unknown>} */ (scenario);
  const marketplace =
    promo.marketplace != null && typeof promo.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (promo.marketplace)
      : /** @type {Record<string, unknown>} */ ({});
  const cardPreco = obterContratoPrecoMiniCardPromocao(promo);

  const rawCard =
    promo.promotion_card_contract != null && typeof promo.promotion_card_contract === "object"
      ? /** @type {Record<string, unknown>} */ (clonarProfundo(promo.promotion_card_contract))
      : null;
  const rawOffer =
    promo.promotion_offer_contract != null && typeof promo.promotion_offer_contract === "object"
      ? /** @type {Record<string, unknown>} */ (clonarProfundo(promo.promotion_offer_contract))
      : null;

  const { feeDiscountDec, sourcePath, officialReceiveDec } =
    extrairReducaoTarifaDaPromocaoSelecionada(promo);
  const { sourcePath: ajustesPath } = resolverAjustesFinanceirosPromocaoComOrigem(promo);

  const promotionId =
    promo.promotion_id != null
      ? String(promo.promotion_id)
      : cardPreco?.promotion_id != null
        ? String(cardPreco.promotion_id)
        : rawCard?.promotion_id != null
          ? String(rawCard.promotion_id)
          : rawOffer?.promotion_id != null
            ? String(rawOffer.promotion_id)
            : null;

  const promotionName =
    promo.promotion_name != null
      ? String(promo.promotion_name)
      : promo.label != null
        ? String(promo.label)
        : cardPreco?.promotion_name != null
          ? String(cardPreco.promotion_name)
          : null;

  const buyerFinalPrice =
    cardPreco?.real_promotion_final_price_brl != null
      ? String(cardPreco.real_promotion_final_price_brl)
      : promo.sale_price_brl != null
        ? String(promo.sale_price_brl)
        : null;

  const officialReceive =
    officialReceiveDec != null
      ? decStr2(officialReceiveDec)
      : null;

  const feeDiscount =
    feeDiscountDec != null && feeDiscountDec.gt(0) ? decStr2(feeDiscountDec) : null;

  const listingId =
    listingExternalId != null && String(listingExternalId).trim() !== ""
      ? String(listingExternalId).trim()
      : cardPreco?.listing_id != null
        ? String(cardPreco.listing_id)
        : null;

  const promotionRegularPrice =
    cardPreco?.original_price_brl != null
      ? String(cardPreco.original_price_brl)
      : rawCard?.original_price_brl != null
        ? String(rawCard.original_price_brl)
        : null;

  const promotionDiscountBrl =
    cardPreco?.discount_amount_brl != null
      ? String(cardPreco.discount_amount_brl)
      : rawCard?.discount_amount_brl != null
        ? String(rawCard.discount_amount_brl)
        : null;

  const promotionDiscountPercent =
    cardPreco?.discount_percent_display != null
      ? String(cardPreco.discount_percent_display)
      : rawCard?.discount_percent_display != null
        ? String(rawCard.discount_percent_display)
        : null;

  const snapshotKey = montarChaveSnapshotFinanceiroPromocao({
    listing_id: listingId,
    promotion_id: promotionId,
    selection_id: selectionId,
    listing_type: listingTypeEffective,
  });

  const promotionSelectedKey = snapshotKey;

  const snapshotKeyByPromotionId =
    promotionId != null && listingId != null
      ? montarChaveSnapshotFinanceiroPromocao({
          listing_id: listingId,
          promotion_id: promotionId,
          listing_type: listingTypeEffective,
        })
      : null;

  const sourceTrace =
    feeDiscount != null
      ? sourcePath ?? ajustesPath ?? "promotion_contract_fields"
      : officialReceive != null
        ? "pending_reconciliation_at_render"
        : "click_snapshot";

  const snapshot = {
    promotion_selected_key: promotionSelectedKey,
    promotion_id: promotionId,
    promotion_name: promotionName,
    listing_id: listingId,
    listing_type_id: listingTypeEffective,
    promotion_final_price_brl: buyerFinalPrice,
    promotion_regular_price_brl: promotionRegularPrice,
    promotion_discount_brl: promotionDiscountBrl,
    promotion_discount_percent: promotionDiscountPercent,
    marketplace_fee_discount_brl: feeDiscount,
    gross_marketplace_fee_brl:
      marketplace.fee_amount_before_promo_subsidy_brl ??
      marketplace.promotion_fee_gross_brl ??
      marketplace.sale_fee_amount_brl ??
      marketplace.fee_amount_brl ??
      null,
    net_marketplace_fee_brl:
      marketplace.sale_fee_net_display_brl ??
      marketplace.promotion_fee_net_brl ??
      marketplace.fee_amount_after_promo_subsidy_brl ??
      null,
    shipping_cost_brl:
      marketplace.shipping_cost_amount_brl ??
      marketplace.shipping_cost_brl ??
      null,
    commission_percent:
      marketplace.sale_fee_percent ??
      marketplace.commission_percent ??
      null,
    listing_type_label:
      marketplace.listing_type_label ??
      (listingTypeEffective === "premium" ? "Premium" : listingTypeEffective === "classic" ? "Clássico" : null),
    official_amount_to_receive_brl: officialReceive,
    source_trace: sourceTrace,
    captured_at: new Date().toISOString(),
    request_id: requestId,
    buyer_final_price_brl: buyerFinalPrice,
    fee_discount_source: sourceTrace,
    raw_promotion_card_contract: rawCard,
    raw_promotion_offer_contract: rawOffer,
    snapshot_key: snapshotKey,
    snapshot_key_promotion_id: snapshotKeyByPromotionId,
    selection_id: selectionId,
    selected_at: new Date().toISOString(),
    current_listing_type: listingTypeEffective,
    has_snapshot: snapshotKey != null,
  };

  logPromotionFeeDiscountFinalStabilityV6({
    listing_id: listingId,
    listing_type_id: listingTypeEffective,
    promotion_selected_key: promotionSelectedKey,
    promotion_id: promotionId,
    promotion_name: promotionName,
    request_id: requestId,
    phase: "click_snapshot",
    snapshot_fee_discount_brl: feeDiscount,
    incoming_fee_discount_brl: feeDiscount,
    final_fee_discount_brl: feeDiscount ?? "0.00",
    snapshot_official_receive_brl: officialReceive,
    incoming_official_receive_brl: officialReceive,
    final_receive_brl: officialReceive,
    source: sourceTrace,
    preserved_from_snapshot: false,
    rows_labels: [],
  });

  logPromotionRevenueFinancialSanityV7({
    phase: "click_snapshot",
    listing_id: listingId,
    listing_type_id: listingTypeEffective,
    promotion_selected_key: promotionSelectedKey,
    promotion_id: promotionId,
    promotion_name: promotionName,
    request_id: requestId,
    promotion_final_price_brl: buyerFinalPrice,
    gross_marketplace_fee_brl: snapshot.gross_marketplace_fee_brl,
    net_marketplace_fee_brl: snapshot.net_marketplace_fee_brl,
    marketplace_fee_discount_brl: feeDiscount ?? "0.00",
    shipping_cost_brl: snapshot.shipping_cost_brl,
    receive_brl: officialReceive,
    commission_percent: snapshot.commission_percent,
    listing_type_label: snapshot.listing_type_label,
    sources: {
      promotion_final_price: "immutable_click_snapshot",
      gross_marketplace_fee: snapshot.gross_marketplace_fee_brl != null ? "immutable_click_snapshot" : null,
      net_marketplace_fee: snapshot.net_marketplace_fee_brl != null ? "immutable_click_snapshot" : null,
      marketplace_fee_discount:
        feeDiscount != null && isTrustedSnapshotFeeSource(sourceTrace)
          ? "immutable_click_snapshot"
          : "official_listing_prices",
      shipping_cost: snapshot.shipping_cost_brl != null ? "immutable_click_snapshot" : null,
      receive: officialReceive != null ? "immutable_click_snapshot" : null,
    },
    warnings:
      feeDiscount != null && !isTrustedSnapshotFeeSource(sourceTrace)
        ? ["ignored_untrusted_snapshot_fee_discount"]
        : [],
    is_valid: false,
    pending_before: true,
    pending_after: true,
    rows_labels: [],
    rows_values: [],
    rows_subtitles: [],
  });

  return snapshot;
}

/**
 * @param {Record<string, Record<string, unknown>>} store
 * @param {ReturnType<typeof capturarSnapshotFinanceiroPromocaoSelecionada>} snapshot
 */
export function salvarSnapshotFinanceiroPromocao(store, snapshot) {
  const keys = [snapshot.snapshot_key, snapshot.snapshot_key_promotion_id].filter(
    (k, i, arr) => k != null && arr.indexOf(k) === i,
  );

  for (const key of keys) {
    if (key == null) continue;
    const existing = store[key];
    const existingFee = existing != null ? toDecPromoV6(existing.marketplace_fee_discount_brl) : null;
    const incomingFee = toDecPromoV6(snapshot.marketplace_fee_discount_brl);

    let merged = { ...snapshot, snapshot_key: key, promotion_selected_key: key };

    const existingSource =
      existing?.fee_discount_source != null
        ? String(existing.fee_discount_source)
        : existing?.source_trace != null
          ? String(existing.source_trace)
          : null;

    if (
      existingFee != null &&
      existingFee.gt(0) &&
      isTrustedSnapshotFeeSource(existingSource) &&
      (incomingFee == null || !incomingFee.gt(0))
    ) {
      merged = {
        ...merged,
        marketplace_fee_discount_brl: decStr2PromoV6(existingFee),
        source_trace: "preserved_fee_discount_from_snapshot",
        fee_discount_source: "preserved_fee_discount_from_snapshot",
      };
      logPromotionFeeDiscountFinalStabilityV6({
        listing_id: merged.listing_id,
        listing_type_id: merged.listing_type_id,
        promotion_selected_key: key,
        promotion_id: merged.promotion_id,
        promotion_name: merged.promotion_name,
        request_id: merged.request_id,
        phase: "async_finish",
        snapshot_fee_discount_brl: decStr2PromoV6(existingFee),
        incoming_fee_discount_brl: snapshot.marketplace_fee_discount_brl ?? "0.00",
        final_fee_discount_brl: decStr2PromoV6(existingFee),
        source: "immutable_click_snapshot_preserved_after_async",
        preserved_from_snapshot: true,
        rows_labels: [],
      });
    }

    store[key] = merged;
  }
}

/**
 * @param {Record<string, Record<string, unknown>>} store
 * @param {{
 *   listing_id?: string | null;
 *   promotion_id?: string | null;
 *   listing_type?: string | null;
 * }} params
 */
export function obterSnapshotFinanceiroPromocao(store, params) {
  const keyWithSelection = montarChaveSnapshotFinanceiroPromocao({
    listing_id: params.listing_id,
    selection_id: params.selection_id,
    listing_type: params.listing_type,
  });
  if (keyWithSelection != null && store[keyWithSelection] != null) {
    return store[keyWithSelection];
  }

  const keyWithType = montarChaveSnapshotFinanceiroPromocao({
    listing_id: params.listing_id,
    promotion_id: params.promotion_id,
    listing_type: params.listing_type,
  });
  if (keyWithType != null && store[keyWithType] != null) {
    return store[keyWithType];
  }

  const keyBase = montarChaveSnapshotFinanceiroPromocao({
    listing_id: params.listing_id,
    promotion_id: params.promotion_id,
    listing_type: null,
  });
  if (keyBase != null && store[keyBase] != null) {
    return store[keyBase];
  }
  return null;
}

/**
 * Captura snapshots para classic e premium no clique.
 *
 * @param {Record<string, Record<string, unknown>>} store
 * @param {{
 *   row: { scenario: unknown; group?: string } | null | undefined;
 *   listingExternalId?: string | null;
 *   currentListingType?: string | null;
 *   selectionId?: string | null;
 *   requestId?: string | null;
 * }} params
 */
export function capturarESalvarSnapshotsFinanceirosPromocao(store, params) {
  /** @type {ReturnType<typeof capturarSnapshotFinanceiroPromocaoSelecionada>[]} */
  const captured = [];
  for (const listingType of ["classic", "premium"]) {
    const snapshot = capturarSnapshotFinanceiroPromocaoSelecionada({
      ...params,
      listingType,
    });
    salvarSnapshotFinanceiroPromocao(store, snapshot);
    logPromotionSelectedFinancialSnapshotCaptured({
      listing_id: snapshot.listing_id,
      promotion_id: snapshot.promotion_id,
      promotion_name: snapshot.promotion_name,
      listing_type: listingType,
      buyer_final_price_brl: snapshot.buyer_final_price_brl,
      official_amount_to_receive_brl: snapshot.official_amount_to_receive_brl,
      marketplace_fee_discount_brl: snapshot.marketplace_fee_discount_brl,
      fee_discount_source: snapshot.fee_discount_source,
      snapshot_key: snapshot.snapshot_key,
      has_snapshot: snapshot.has_snapshot,
    });
    captured.push(snapshot);
  }
  return captured;
}
