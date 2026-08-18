// ======================================================================
// Bloco presentacional — desempenho acumulado (anúncio + produto).
// Apenas formata strings da API; sem cálculo financeiro.
// ======================================================================

import {
  formatAccumulatedPerformanceScope,
} from "../../features/shared/formatAccumulatedPerformanceScope.js";

/**
 * @param {{ label: string; value: string; valueClassName?: string }} props
 */
function MetricLine({ label, value, valueClassName = "" }) {
  const empty = value === "—";
  return (
    <div className="vendas-sale-rayx__accumulated-line vendas-sale-rayx__accumulated-line--stacked">
      <span className="vendas-sale-rayx__accumulated-metric-kind">{label}</span>
      <span
        className={[
          "vendas-sale-rayx__accumulated-value",
          empty ? "anuncios-sell-popover__value--empty" : "",
          valueClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * @param {{
 *   title: string;
 *   scope?: Record<string, unknown> | null;
 *   withLeadingDivider?: boolean;
 * }} props
 */
function ScopeColumn({ title, scope, withLeadingDivider = false }) {
  const formatted = formatAccumulatedPerformanceScope(scope);
  return (
    <div
      className={[
        "vendas-sale-rayx__accumulated-scope-column",
        withLeadingDivider ? "vendas-sale-rayx__accumulated-scope-column--product" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h4 className="vendas-sale-rayx__accumulated-scope-title">{title}</h4>
      <div className="vendas-sale-rayx__accumulated-scope-metrics">
        <MetricLine label="Vendas Qtd." value={formatted.salesQuantity} />
        <MetricLine label="Vendas R$" value={formatted.salesAmount} />
        <MetricLine label="Lucro R$" value={formatted.profitAmount} />
        <MetricLine label="Lucro %" value={formatted.profitPercent} />
      </div>
    </div>
  );
}

/**
 * @param {{
 *   listingScope?: Record<string, unknown> | null;
 *   productScope?: Record<string, unknown> | null;
 *   className?: string;
 * }} props
 */
export default function AccumulatedPerformanceBlock({
  listingScope = null,
  productScope = null,
  className = "",
}) {
  return (
    <section
      className={["vendas-sale-rayx__accumulated-performance", "vendas-sale-rayx__accumulated-performance--columns", className]
        .filter(Boolean)
        .join(" ")}
      aria-label="Desempenho acumulado do anúncio e do produto"
    >
      <div className="vendas-sale-rayx__accumulated-performance-columns">
        <ScopeColumn title="Desempenho acumulado do Anúncio" scope={listingScope} />
        <ScopeColumn
          title="Desempenho acumulado do Produto"
          scope={productScope}
          withLeadingDivider
        />
      </div>
    </section>
  );
}
