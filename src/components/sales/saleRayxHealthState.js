// ======================================================
// Estado visual de saúde (margem) — Raio-x da venda.
// ======================================================

/**
 * @typedef {"critical" | "attention" | "healthy" | "unknown"} SaleRayxHealthState
 */

/**
 * @param {unknown} marginPercentRaw
 * @returns {number | null}
 */
function parseMarginPercent(marginPercentRaw) {
  if (marginPercentRaw == null || String(marginPercentRaw).trim() === "") return null;
  const n = Number(String(marginPercentRaw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Faixas alinhadas ao backend (`saleDetailFinancial.js`) e ao brief de UX.
 *
 * @param {unknown} marginPercentRaw
 * @returns {SaleRayxHealthState}
 */
export function getSaleRayxHealthState(marginPercentRaw) {
  const m = parseMarginPercent(marginPercentRaw);
  if (m == null) return "unknown";
  if (m < 0) return "critical";
  if (m <= 5) return "attention";
  return "healthy";
}

/**
 * Classes de moldura para cards do Raio-x da venda.
 *
 * @param {SaleRayxHealthState} state
 * @param {{ pulse?: boolean }} [opts]
 */
export function getSaleRayxHealthShellClasses(state, opts = {}) {
  const pulse = opts.pulse === true;
  const classes = ["vendas-sale-rayx__health-shell"];
  if (state === "critical") {
    if (pulse) {
      classes.push("vendas-sale-rayx__health-shell--critical-pulse");
    } else {
      classes.push("vendas-sale-rayx__health-shell--critical");
    }
  } else if (state === "attention") {
    classes.push("vendas-sale-rayx__health-shell--attention");
  } else if (state === "healthy") {
    classes.push("vendas-sale-rayx__health-shell--healthy");
  }
  return classes.join(" ");
}
