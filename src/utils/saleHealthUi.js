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

  if (h === "healthy") {
    return { badgeClass: "vendas-health-badge--healthy", label: "Saudável", showDot: true };
  }
  if (h === "critical") {
    return { badgeClass: "vendas-health-badge--critical", label: "Prejuízo", showDot: true };
  }
  if (h === "attention" && profitMissing && marginMissing) {
    return { badgeClass: "vendas-health-badge--unknown", label: "Sem dados", showDot: false };
  }
  if (h === "attention") {
    return { badgeClass: "vendas-health-badge--warn", label: "Atenção", showDot: true };
  }
  return { badgeClass: "vendas-health-badge--unknown", label: "Sem dados", showDot: false };
}
