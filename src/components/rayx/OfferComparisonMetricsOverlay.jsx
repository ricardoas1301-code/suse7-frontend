// ======================================================
// S4.3.6.27 / S4.3.6.29 — Bloco de métricas sobreposto à barra (eixo fixo).
// Apresentação apenas: não recalcula finanças.
// contrastMode = layout/medição; cor textual fixa no CSS (sempre escura).
// ======================================================

/**
 * @param {{
 *   saleLabel: string;
 *   profitLabel: string;
 *   marginLabel: string;
 *   side: "positive" | "negative" | "zero" | "pending";
 *   contrastMode: "inside" | "outside";
 *   toneClass?: string;
 *   financialAvailability?: "RESOLVED_NUMERIC" | "NO_FINANCIAL_DATA" | "PENDING" | "ERROR_FAIL_CLOSED";
 * }} props
 */
export default function OfferComparisonMetricsOverlay({
  saleLabel,
  profitLabel,
  marginLabel,
  side,
  contrastMode,
  toneClass = "",
  financialAvailability = "RESOLVED_NUMERIC",
}) {
  const sale = saleLabel != null && String(saleLabel).trim() !== "" ? String(saleLabel).trim() : "—";
  const profit =
    profitLabel != null && String(profitLabel).trim() !== "" ? String(profitLabel).trim() : "—";
  const margin =
    marginLabel != null && String(marginLabel).trim() !== "" ? String(marginLabel).trim() : "—";

  const isNoData =
    financialAvailability === "NO_FINANCIAL_DATA" || financialAvailability === "ERROR_FAIL_CLOSED";
  const isPending = side === "pending" || financialAvailability === "PENDING";
  const isNegative = side === "negative";

  const profitAria = isNoData
    ? `Lucro: sem valor financeiro confirmado`
    : isPending
      ? `Lucro: pendente`
      : isNegative
        ? `Prejuízo: ${profit.replace(/^-/, "").replace(/^−/, "").trim()}`
        : `Lucro: ${profit}`;

  const marginAria = isNoData
    ? `Margem: sem valor financeiro confirmado`
    : isPending
      ? `Margem: pendente`
      : isNegative
        ? `Margem negativa: ${margin.replace(/^-/, "").replace(/^−/, "").replace(/%$/, "").trim()} por cento`
        : `Margem: ${margin.replace(/%$/, "")} por cento`;

  const rootClass = [
    "s7-offer-metrics-overlay",
    `s7-offer-metrics-overlay--${side}`,
    `s7-offer-metrics-overlay--${contrastMode}`,
    toneClass || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} data-contrast={contrastMode} data-side={side}>
      <div className="s7-offer-metrics-overlay__cell" aria-label={`Valor de venda: ${sale}`}>
        <span className="s7-offer-metrics-overlay__value">{sale}</span>
        <span className="s7-offer-metrics-overlay__label">Valor de venda</span>
      </div>
      <div className="s7-offer-metrics-overlay__cell" aria-label={profitAria}>
        <span className="s7-offer-metrics-overlay__value">{profit}</span>
        <span className="s7-offer-metrics-overlay__label">Lucro</span>
      </div>
      <div className="s7-offer-metrics-overlay__cell" aria-label={marginAria}>
        <span className="s7-offer-metrics-overlay__value">{margin}</span>
        <span className="s7-offer-metrics-overlay__label">Margem</span>
      </div>
    </div>
  );
}
