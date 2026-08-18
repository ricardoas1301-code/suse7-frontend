// ======================================================
// PI — Valor financeiro derivado com loading discreto (spinner no lugar do valor).
// ======================================================

/**
 * @param {{
 *   pending?: boolean;
 *   className?: string;
 *   children?: import("react").ReactNode;
 * }} props
 */
export function PricingScenarioMetricValue({ pending = false, className, children }) {
  if (pending) {
    return (
      <strong
        className={[
          "pricing-scenario-metric-value",
          "pricing-scenario-metric-value--pending",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span
          className="pricing-scenario-metric-value__loading pricing-scenario-sale-control__loading"
          role="status"
          aria-label="Carregando"
        />
      </strong>
    );
  }

  return <strong className={className}>{children}</strong>;
}
