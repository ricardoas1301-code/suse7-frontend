// ======================================================
// KPI compacto acima do rail — só quando existe lucro > 0 em algum cenário.
// ======================================================

/**
 * @param {{
 *   title: string;
 *   profitLabel: string;
 *   marginLabel: string | null;
 * }} props
 */
export function PricingScenarioBestSummary({ title, profitLabel, marginLabel }) {
  if (!title || !profitLabel) return null;
  return (
    <div className="pricing-scenario-best-summary" role="status" aria-live="polite">
      <span className="pricing-scenario-best-summary__lead" aria-hidden>
        🔥
      </span>
      <span className="pricing-scenario-best-summary__text">
        <span className="pricing-scenario-best-summary__label">Melhor cenário:</span>{" "}
        <strong className="pricing-scenario-best-summary__name" title={title}>
          {title}
        </strong>
        <span className="pricing-scenario-best-summary__sep" aria-hidden>
          ·
        </span>
        <span className="pricing-scenario-best-summary__metrics">
          Lucro: <strong>{profitLabel}</strong>
          {marginLabel != null && String(marginLabel).trim() !== "" ? (
            <>
              <span className="pricing-scenario-best-summary__sep" aria-hidden>
                ·
              </span>
              Margem: <strong>{marginLabel}</strong>
            </>
          ) : null}
        </span>
      </span>
    </div>
  );
}
