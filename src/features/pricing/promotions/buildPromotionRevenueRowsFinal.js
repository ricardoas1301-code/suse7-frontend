// ======================================================
// PI — extrator puro dos valores de marketplace do cenário simulado da promoção.
// (rollback S1.PROMO-ROLLBACK-LAST-GOOD — sem contrato financeiro reconstruído.)
// ======================================================

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
