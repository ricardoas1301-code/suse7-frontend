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
 * Fallback visual quando o payload ainda não traz `health_status` (legado).
 * Preferir sempre `financial.health_status` / `profit_margin.health_status` da API.
 *
 * @param {unknown} marginPercentRaw
 * @returns {SaleRayxHealthState}
 */
export function getSaleRayxHealthState(marginPercentRaw) {
  const m = parseMarginPercent(marginPercentRaw);
  if (m == null) return "unknown";
  if (m < 0) return "critical";
  if (m <= 7) return "attention";
  return "healthy";
}

/**
 * @param {Record<string, unknown>} fin
 * @param {Record<string, unknown>} pm
 * @returns {number | null}
 */
function parseProfitAmount(fin, pm) {
  const raw = pm.profit_brl ?? pm.profit_amount ?? fin.profit_brl ?? fin.profit_amount;
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} financial
 * @param {Record<string, unknown> | null | undefined} profitMargin
 * @param {unknown} marginPercentRaw
 * @returns {SaleRayxHealthState}
 */
export function resolveSaleRayxHealthState(financial, profitMargin, marginPercentRaw) {
  const pm = profitMargin && typeof profitMargin === "object" ? profitMargin : {};
  const fin = financial && typeof financial === "object" ? financial : {};
  const profit = parseProfitAmount(fin, pm);
  if (profit != null && profit < 0) return "critical";

  const fromApi = pm.health_status ?? pm.health ?? fin.health_status ?? fin.health;
  if (fromApi === "critical") return "critical";
  if (fromApi === "attention" || fromApi === "healthy") return fromApi;
  return getSaleRayxHealthState(marginPercentRaw);
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
    classes.push("sale-health--critical");
    if (pulse) {
      classes.push("vendas-sale-rayx__health-shell--critical-pulse");
    } else {
      classes.push("vendas-sale-rayx__health-shell--critical");
    }
  } else if (state === "attention") {
    classes.push("sale-health--warning", "vendas-sale-rayx__health-shell--attention");
  } else if (state === "healthy") {
    classes.push("sale-health--healthy", "vendas-sale-rayx__health-shell--healthy");
  }
  return classes.join(" ");
}
