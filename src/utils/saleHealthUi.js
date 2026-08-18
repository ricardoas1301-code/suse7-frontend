// ======================================================================
// UI de badge de saúde da venda — só mapeia campos já calculados na API.
// ======================================================================

/**
 * @param {Record<string, unknown> | null | undefined} f — tipicamente `row.financials`
 * @returns {{ badgeClass: string; label: string; showDot: boolean }}
 */
export function getSaleHealthUi(f) {
  if (!f || typeof f !== "object") {
    return { badgeClass: "vendas-health-badge--unknown", label: "Sem dados", showDot: false };
  }
  const h = f.health;
  const profitMissing = f.profit_brl == null || String(f.profit_brl).trim() === "";
  const marginMissing = f.margin_percent == null || String(f.margin_percent).trim() === "";
  const marginN =
    f.margin_percent != null && String(f.margin_percent).trim() !== ""
      ? Number(String(f.margin_percent).replace(",", "."))
      : NaN;
  const profitN = !profitMissing ? Number(String(f.profit_brl).replace(",", ".")) : NaN;
  const isZeroProfit = Number.isFinite(profitN) && profitN === 0;

  if (h === "healthy") {
    if (Number.isFinite(marginN) && marginN >= 20) {
      return { badgeClass: "vendas-health-badge--healthy", label: "Excelente", showDot: true };
    }
    return { badgeClass: "vendas-health-badge--healthy", label: "Saudável", showDot: true };
  }
  if (h === "critical") {
    return { badgeClass: "vendas-health-badge--critical", label: "Prejuízo", showDot: true };
  }
  if (h === "attention" && profitMissing && marginMissing) {
    return { badgeClass: "vendas-health-badge--unknown", label: "Sem dados", showDot: false };
  }
  if (h === "attention") {
    // Lucro exatamente zero: estado neutro "Sem lucro" (usa dado já calculado, sem inventar).
    if (isZeroProfit) {
      return { badgeClass: "vendas-health-badge--neutral", label: "Sem lucro", showDot: true };
    }
    if (Number.isFinite(marginN) && marginN < 5) {
      return { badgeClass: "vendas-health-badge--warn", label: "Margem crítica", showDot: true };
    }
    return { badgeClass: "vendas-health-badge--warn", label: "Precisa atenção", showDot: true };
  }
  return { badgeClass: "vendas-health-badge--unknown", label: "Sem dados", showDot: false };
}

/**
 * Tom visual de Lucro/Margem na lista — alinhado às faixas de saúde da venda (só leitura da margem %).
 * @param {string | number | null | undefined} marginPercent
 * @returns {string}
 */
export function getVendasTableFinancialHealthToneClass(marginPercent) {
  if (marginPercent == null || String(marginPercent).trim() === "") return "vendas-page__fin--empty";
  const n = Number(String(marginPercent).replace(",", "."));
  if (!Number.isFinite(n)) return "vendas-page__fin--empty";
  if (n < 0) return "vendas-page__fin--health-critical";
  if (n <= 5) return "vendas-page__fin--health-warn";
  return "vendas-page__fin--health-healthy";
}
