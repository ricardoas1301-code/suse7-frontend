// ======================================================
// PI — Financeiro BASE da promoção (Modal Precificação Inteligente principal).
// S1.PROMO-BASE-FINANCIAL-PARITY-NO-SUBSIDY.
//
// Regra obrigatória (Decimal, sem float):
//   você_recebe_base = preço_final_da_promoção − tarifa_de_venda_do_card − custo_de_envio
//
// - Sem subsídio ("Reduzimos sua tarifa" NÃO é aplicado aqui).
// - official_amount_to_receive_brl do ML NÃO é SSOT de render (só auditoria/log),
//   pois pode já incluir a redução de tarifa (tratada depois no laboratório).
// - O "Você recebe" renderizado sempre fecha com as linhas visíveis do card.
// ======================================================

import Decimal from "decimal.js";

const ROUND = Decimal.ROUND_HALF_UP;
const TOLERANCIA_BRL = new Decimal("0.02");

/** @param {unknown} v @returns {Decimal | null} */
export function toDecBase(v) {
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
export function decStr2Base(d) {
  if (d == null || !d.isFinite()) return null;
  return d.toDecimalPlaces(2, ROUND).toFixed(2);
}

/** @param {Record<string, unknown> | null | undefined} obj */
function rec(obj) {
  return obj != null && typeof obj === "object" ? /** @type {Record<string, unknown>} */ (obj) : {};
}

/** @param {Record<string, unknown>} m @param {string[]} keys @returns {Decimal | null} */
function pickDec(m, keys) {
  for (const key of keys) {
    const d = toDecBase(m[key]);
    if (d != null && d.gte(0)) return d;
  }
  return null;
}

/**
 * @param {{
 *   scenario?: unknown;
 *   salePriceOverrideBrl?: string | null;
 *   officialAmountToReceiveBrl?: string | null;
 *   listingTypeId?: string | null;
 * }} params
 */
export function resolvePromotionCardBaseFinancials({
  scenario = null,
  salePriceOverrideBrl = null,
  officialAmountToReceiveBrl = null,
  listingTypeId = null,
}) {
  const m = rec(rec(scenario).marketplace);

  const saleOverrideDec =
    salePriceOverrideBrl != null && String(salePriceOverrideBrl).trim() !== ""
      ? toDecBase(String(salePriceOverrideBrl))
      : null;
  // Preço final OFICIAL da promoção (contrato do anúncio), nunca desconto genérico de campanha.
  const saleDec = saleOverrideDec ?? pickDec(m, ["sale_price_brl"]);

  // Tarifa de venda do card = tarifa CHEIA (antes de qualquer subsídio). Base sem redução.
  const grossFeeDec = pickDec(m, [
    "fee_amount_before_promo_subsidy_brl",
    "promotion_fee_gross_brl",
    "sale_fee_amount_brl",
    "fee_amount_brl",
  ]);
  const netFeeDec = pickDec(m, [
    "sale_fee_net_display_brl",
    "promotion_fee_net_brl",
    "fee_amount_after_promo_subsidy_brl",
  ]);
  const cardFeeDec = grossFeeDec ?? netFeeDec;

  const shipDec = pickDec(m, ["shipping_cost_amount_brl", "shipping_cost_brl"]);
  const commissionPercent = m.sale_fee_percent ?? m.commission_percent ?? null;

  // ---- REGRA OBRIGATÓRIA: você recebe = preço − tarifa − envio ----
  const receiveDec =
    saleDec != null && cardFeeDec != null && shipDec != null
      ? saleDec.minus(cardFeeDec).minus(shipDec).toDecimalPlaces(2, ROUND)
      : null;

  // ---- Auditoria (NÃO entra no render) ----
  const officialMlReceiveDec =
    toDecBase(officialAmountToReceiveBrl) ?? pickDec(m, ["marketplace_payout_amount_brl", "net_receivable_brl"]);
  const hasSubsidyHint =
    (grossFeeDec != null && netFeeDec != null && grossFeeDec.minus(netFeeDec).gt(TOLERANCIA_BRL)) ||
    (officialMlReceiveDec != null && receiveDec != null && officialMlReceiveDec.minus(receiveDec).gt(TOLERANCIA_BRL));
  const officialIgnoredReason =
    officialMlReceiveDec != null
      ? hasSubsidyHint
        ? "ml_receive_may_include_subsidy_handled_in_lab"
        : "base_render_by_direction_no_subsidy"
      : null;

  /** @type {string[]} */
  const warnings = [];
  if (saleDec == null) warnings.push("missing_final_price");
  if (cardFeeDec == null) warnings.push("missing_marketplace_fee");
  if (shipDec == null) warnings.push("missing_shipping");

  const parityStatus =
    receiveDec == null
      ? "incomplete"
      : "base_render_reconciles_card_lines";

  const listingTypeLabel =
    listingTypeId === "gold_pro" ? "Premium" : listingTypeId === "gold_special" ? "Clássico" : null;

  return {
    listing_type_id: listingTypeId,
    listing_type_label: listingTypeLabel,
    final_price_brl: decStr2Base(saleDec),
    marketplace_fee_brl: decStr2Base(cardFeeDec),
    shipping_brl: decStr2Base(shipDec),
    commission_percent: commissionPercent != null ? String(commissionPercent) : null,
    rendered_receive_brl: decStr2Base(receiveDec),
    calculated_receive_brl: decStr2Base(receiveDec),
    official_ml_receive_brl: decStr2Base(officialMlReceiveDec),
    official_ml_receive_ignored_reason: officialIgnoredReason,
    has_ml_subsidy_hint: hasSubsidyHint,
    parity_status: parityStatus,
    warnings,
    has_core: saleDec != null && cardFeeDec != null && receiveDec != null,
    _dec: { saleDec, cardFeeDec, shipDec, receiveDec },
  };
}

/** @param {Record<string, unknown>} payload */
export function logPromoBaseNoSubsidyParity(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMO_BASE_NO_SUBSIDY_PARITY]", payload);
}
