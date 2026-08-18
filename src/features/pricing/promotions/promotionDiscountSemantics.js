// ======================================================
// S4.3.6.18 — Semântica do desconto promocional (Decimal).
// Separa percentual matemático exato do percentual visual do ML.
// Preço oficial confirmado permanece SSOT — nunca reconstruir via % inteiro do ML.
// ======================================================

import Decimal from "decimal.js";

const ROUND = Decimal.ROUND_HALF_UP;
/** Precisão contratada de apresentação do percentual exato (pt-BR). */
export const PROMO_DESCONTO_EXATO_CASAS_DECIMAIS = 4;

export const PROMO_DESCONTO_PERCENTUAL_EXATO_TOOLTIP =
  "Percentual exato calculado sobre o preço atual do anúncio. O Mercado Livre pode exibir o percentual arredondado para cima.";

/**
 * @typedef {{
 *   basePriceBrl: string | null;
 *   salePriceBrl: string | null;
 *   discountAmountBrl: string | null;
 *   exactDiscountPercentage: string | null;
 *   exactDiscountPercentageDisplay: string | null;
 *   marketplaceDisplayDiscountPercentage: string | null;
 *   marketplaceDisplayDiscountPercentageSource: "marketplace_payload" | "ceil_from_exact" | "none";
 * }} PromotionDiscountSemanticsContract
 */

/** @param {unknown} v @returns {Decimal | null} */
function toDec(v) {
  if (v == null || v === "") return null;
  try {
    const d = new Decimal(String(v).trim().replace(",", ".").replace("%", ""));
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** @param {Decimal | null | undefined} d @param {number} [casas] */
function sMoney(d, casas = 2) {
  if (d == null || !d.isFinite()) return null;
  return d.toDecimalPlaces(casas, ROUND).toFixed(casas);
}

/**
 * Formata percentual exato para UI (até 4 casas, sem zeros à direita).
 * @param {Decimal | string | number | null | undefined} percent
 */
export function formatarPercentualDescontoExatoExibicao(percent) {
  const dec = percent instanceof Decimal ? percent : toDec(percent);
  if (dec == null) return null;
  const arredondado = dec.toDecimalPlaces(PROMO_DESCONTO_EXATO_CASAS_DECIMAIS, ROUND);
  if (arredondado.mod(1).eq(0)) return String(Math.round(Number(arredondado.toFixed(0))));
  return arredondado
    .toFixed(PROMO_DESCONTO_EXATO_CASAS_DECIMAIS)
    .replace(".", ",")
    .replace(/,?0+$/, "")
    .replace(/,$/, "");
}

/**
 * Percentual visual típico do ML: inteiro; frações sobem (ceil).
 * Somente observação — nunca usado para reconstruir preço oficial.
 * @param {Decimal | string | number | null | undefined} exactPercent
 */
export function resolverPercentualVisualMarketplaceCeil(exactPercent) {
  const dec = exactPercent instanceof Decimal ? exactPercent : toDec(exactPercent);
  if (dec == null || !dec.gt(0)) return null;
  if (dec.mod(1).eq(0)) return dec.toFixed(0);
  return dec.toDecimalPlaces(0, Decimal.ROUND_CEIL).toFixed(0);
}

/**
 * exactDiscountPercentage = (basePrice - salePrice) / basePrice × 100
 * @param {string | null | undefined} basePriceBrl
 * @param {string | null | undefined} salePriceBrl
 */
export function calcularPercentualDescontoExato(basePriceBrl, salePriceBrl) {
  const base = toDec(basePriceBrl);
  const sale = toDec(salePriceBrl);
  if (base == null || sale == null || !base.gt(0)) {
    return { ok: false, error: "base_or_sale_invalid" };
  }
  if (sale.gt(base)) {
    return { ok: false, error: "sale_above_base" };
  }
  const amount = base.minus(sale).toDecimalPlaces(2, ROUND);
  const exact = amount.div(base).times(100);
  return {
    ok: true,
    basePriceBrl: sMoney(base),
    salePriceBrl: sMoney(sale),
    discountAmountBrl: sMoney(amount),
    exactDiscountPercentage: exact.toFixed(6),
    exactDiscountPercentageDisplay: formatarPercentualDescontoExatoExibicao(exact),
    exactDec: exact,
    amountDec: amount,
  };
}

/**
 * salePrice = basePrice × (1 - exactDiscountPercentage / 100)
 * @param {string | null | undefined} basePriceBrl
 * @param {string | number | null | undefined} exactDiscountPercentage
 */
export function calcularPrecoAPartirPercentualDescontoExato(basePriceBrl, exactDiscountPercentage) {
  const base = toDec(basePriceBrl);
  const pct = toDec(exactDiscountPercentage);
  if (base == null || pct == null || !base.gt(0) || pct.lt(0)) {
    return { ok: false, error: "base_or_percent_invalid" };
  }
  const amount = base.times(pct).div(100).toDecimalPlaces(2, ROUND);
  const sale = base.minus(amount).toDecimalPlaces(2, ROUND);
  if (!sale.gt(0)) {
    return { ok: false, error: "sale_not_positive" };
  }
  return {
    ok: true,
    basePriceBrl: sMoney(base),
    salePriceBrl: sMoney(sale),
    discountAmountBrl: sMoney(amount),
    exactDiscountPercentage: pct.toFixed(6),
    exactDiscountPercentageDisplay: formatarPercentualDescontoExatoExibicao(pct),
    exactDec: pct,
    saleDec: sale,
    amountDec: amount,
  };
}

/**
 * Contrato canônico: campos separados (exato ≠ visual ML).
 * @param {{
 *   basePriceBrl?: string | null;
 *   salePriceBrl?: string | null;
 *   marketplaceDisplayDiscountPercentage?: string | number | null;
 * }} params
 * @returns {PromotionDiscountSemanticsContract}
 */
export function buildPromotionDiscountSemanticsContract(params = {}) {
  const basePriceBrl = params.basePriceBrl != null ? String(params.basePriceBrl) : null;
  const salePriceBrl = params.salePriceBrl != null ? String(params.salePriceBrl) : null;
  const exactHit = calcularPercentualDescontoExato(basePriceBrl, salePriceBrl);

  const marketplaceRaw = toDec(params.marketplaceDisplayDiscountPercentage);
  /** @type {"marketplace_payload" | "ceil_from_exact" | "none"} */
  let marketplaceSource = "none";
  /** @type {string | null} */
  let marketplaceDisplay = null;

  if (marketplaceRaw != null && marketplaceRaw.gt(0)) {
    marketplaceDisplay = marketplaceRaw.toDecimalPlaces(0, ROUND).toFixed(0);
    marketplaceSource = "marketplace_payload";
  } else if (exactHit.ok === true && exactHit.exactDec != null) {
    marketplaceDisplay = resolverPercentualVisualMarketplaceCeil(exactHit.exactDec);
    marketplaceSource = marketplaceDisplay != null ? "ceil_from_exact" : "none";
  }

  if (exactHit.ok !== true) {
    return {
      basePriceBrl,
      salePriceBrl,
      discountAmountBrl: null,
      exactDiscountPercentage: null,
      exactDiscountPercentageDisplay: null,
      marketplaceDisplayDiscountPercentage: marketplaceDisplay,
      marketplaceDisplayDiscountPercentageSource: marketplaceSource,
    };
  }

  return {
    basePriceBrl: exactHit.basePriceBrl,
    salePriceBrl: exactHit.salePriceBrl,
    discountAmountBrl: exactHit.discountAmountBrl,
    exactDiscountPercentage: exactHit.exactDiscountPercentage,
    exactDiscountPercentageDisplay: exactHit.exactDiscountPercentageDisplay,
    marketplaceDisplayDiscountPercentage: marketplaceDisplay,
    marketplaceDisplayDiscountPercentageSource: marketplaceSource,
  };
}

/**
 * Prova de não-equivalência: % visual ML não pode reconstruir o preço oficial.
 * @param {{
 *   basePriceBrl: string;
 *   officialSalePriceBrl: string;
 *   marketplaceDisplayDiscountPercentage: string | number;
 * }} params
 */
export function marketplaceDisplayPercentNaoReconstroiPrecoOficial(params) {
  const rebuilt = calcularPrecoAPartirPercentualDescontoExato(
    params.basePriceBrl,
    params.marketplaceDisplayDiscountPercentage,
  );
  if (rebuilt.ok !== true || rebuilt.salePriceBrl == null) {
    return { diverges: true, rebuiltSalePriceBrl: null };
  }
  const official = toDec(params.officialSalePriceBrl);
  const rebuiltSale = toDec(rebuilt.salePriceBrl);
  const diverges =
    official == null ||
    rebuiltSale == null ||
    !official.toDecimalPlaces(2, ROUND).eq(rebuiltSale.toDecimalPlaces(2, ROUND));
  return { diverges, rebuiltSalePriceBrl: rebuilt.salePriceBrl };
}
