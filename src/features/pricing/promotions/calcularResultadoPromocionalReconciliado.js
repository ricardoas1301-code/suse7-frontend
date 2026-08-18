// ======================================================
// PI — Lucro/margem promocional reconciliado com os componentes visíveis.
// Decimal.js — sem float. SSOT por cenário (Clássico/Premium independentes).
// ======================================================

import Decimal from "decimal.js";

import { getOfferStatusFromMargin } from "../../../components/mercadoLivrePricingScenarioCompareShared.js";

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

/**
 * Lucro = marketplaceReceivable − custos internos exibidos no card.
 * Margem = lucro / preço de venda × 100.
 *
 * @param {{
 *   scenario: unknown;
 *   marketplaceReceivableBrl: string | null | undefined;
 *   salePriceBrl: string | null | undefined;
 * }} params
 * @returns {{
 *   profit_brl: string | null;
 *   margin_pct: string | null;
 *   offer_status_semantic: string | null;
 *   health_status: string | null;
 * } | null}
 */
export function calcularResultadoPromocionalReconciliado({
  scenario,
  marketplaceReceivableBrl,
  salePriceBrl,
}) {
  const sim =
    scenario != null && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)
      : null;
  if (sim == null) return null;

  const payoutDec = toDec(marketplaceReceivableBrl);
  const saleDec = toDec(salePriceBrl);
  if (payoutDec == null || saleDec == null || !saleDec.gt(0)) return null;

  const ic =
    sim.internal_costs != null && typeof sim.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (sim.internal_costs)
      : {};
  const pi =
    sim.pricing_intelligence_extras != null && typeof sim.pricing_intelligence_extras === "object"
      ? /** @type {Record<string, unknown>} */ (sim.pricing_intelligence_extras)
      : {};

  const productCost = toDec(ic.product_cost_brl) ?? new Decimal(0);
  const tax = toDec(ic.tax_amount_brl) ?? new Decimal(0);
  const packaging = toDec(ic.operational_packaging_total_brl) ?? new Decimal(0);
  const extrasTotal = toDec(pi.extras_total_brl) ?? new Decimal(0);

  const profit = payoutDec.minus(productCost).minus(tax).minus(packaging).minus(extrasTotal);
  const marginPct = profit.times(100).div(saleDec);
  const marginStr = decStr2(marginPct);
  const tone = getOfferStatusFromMargin(marginStr);

  return {
    profit_brl: decStr2(profit),
    margin_pct: marginStr,
    offer_status_semantic: tone?.level ?? tone?.color ?? null,
    health_status: tone?.label ?? null,
  };
}

/**
 * Matriz pura para testes — entradas já normalizadas (sem cenário completo).
 *
 * @param {{
 *   salePriceBrl: string;
 *   marketplaceReceivableBrl: string;
 *   productCostBrl: string;
 *   taxBrl: string;
 *   packagingBrl: string;
 *   extrasTotalBrl?: string;
 * }} params
 */
export function calcularLucroMargemPromocionalMatriz({
  salePriceBrl,
  marketplaceReceivableBrl,
  productCostBrl,
  taxBrl,
  packagingBrl,
  extrasTotalBrl = "0",
}) {
  return calcularResultadoPromocionalReconciliado({
    scenario: {
      internal_costs: {
        product_cost_brl: productCostBrl,
        tax_amount_brl: taxBrl,
        operational_packaging_total_brl: packagingBrl,
      },
      pricing_intelligence_extras: {
        extras_total_brl: extrasTotalBrl,
      },
    },
    marketplaceReceivableBrl,
    salePriceBrl,
  });
}
