// ======================================================
// Resumo de saúde financeira — coluna direita do Raio-x da venda.
// ======================================================

import { DASH, formatBrlApi, formatPercentApi } from "./saleRayxFormat";
import { getSaleRayxHealthState, getSaleRayxHealthShellClasses } from "./saleRayxHealthState";
import { getSaleRayxMarginSemantic } from "./saleRayxMarginSemantic";

/**
 * @param {{ label: string; value: string; valueClass?: string; empty?: boolean }} props
 */
function HealthMetric({ label, value, valueClass = "", empty = false }) {
  return (
    <div className="vendas-sale-rayx__health-metric">
      <span className="vendas-sale-rayx__health-metric-label">{label}</span>
      <strong
        className={[
          "vendas-sale-rayx__health-metric-value",
          valueClass,
          empty ? "anuncios-sell-popover__value--empty" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </strong>
    </div>
  );
}

/**
 * @param {{
 *   financial?: Record<string, unknown> | null;
 *   profitMargin?: Record<string, unknown> | null;
 * }} props
 */
export default function SaleRayXHealthSummary({ financial, profitMargin }) {
  const fin = financial && typeof financial === "object" ? financial : {};
  const pm = profitMargin && typeof profitMargin === "object" ? profitMargin : {};
  const profitValue = pm.profit_brl ?? pm.profit_amount ?? fin.profit_brl ?? fin.profit_amount;
  const marginValue = pm.margin_percent ?? fin.margin_percent;
  const profitDisplay = formatBrlApi(profitValue != null ? String(profitValue) : null);
  const marginDisplay = formatPercentApi(marginValue != null ? String(marginValue) : null);
  const { offerSemClass, healthLabel } = getSaleRayxMarginSemantic(marginValue);
  const healthDisplay = healthLabel != null && String(healthLabel).trim() !== "" ? String(healthLabel).trim() : DASH;
  const healthState = getSaleRayxHealthState(marginValue);
  const shellClass = getSaleRayxHealthShellClasses(healthState, { pulse: healthState === "critical" });

  return (
    <section className={`vendas-sale-rayx__health-summary ${shellClass}`} aria-label="Resumo financeiro da venda">
      <HealthMetric label="Lucro (R$)" value={profitDisplay} empty={profitDisplay === DASH} valueClass={offerSemClass} />
      <HealthMetric
        label="Margem (%)"
        value={marginDisplay}
        valueClass={offerSemClass}
        empty={marginDisplay === DASH}
      />
      <HealthMetric
        label="Saúde da venda"
        value={healthDisplay}
        valueClass={offerSemClass}
        empty={healthDisplay === DASH}
      />
    </section>
  );
}
