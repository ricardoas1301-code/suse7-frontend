import { memo } from "react";
import "./SubscriptionManagementPreview.css";

/**
 * @param {{
 *   rows: import("./subscriptionManagementModel").SubscriptionManagementPreviewRow[] | null | undefined;
 *   visible?: boolean;
 *   variant?: "default" | "impact";
 * }} props
 */
function SubscriptionManagementPreview({ rows, visible = false, variant = "default" }) {
  if (!visible || !rows?.length) return null;

  const isImpact = variant === "impact";

  return (
    <section
      className={`subscription-management-preview ${isImpact ? "subscription-management-preview--impact" : ""}`.trim()}
      aria-label={isImpact ? "Impacto da alteração" : "Preview operacional"}
    >
      <header className="subscription-management-preview__head">
        <h5 className="subscription-management-preview__title">
          {isImpact ? "Impacto da alteração" : "Preview operacional"}
        </h5>
        <p className="subscription-management-preview__hint">
          {isImpact
            ? "Revise cuidadosamente antes de aplicar."
            : "Antes de aplicar — simulação local."}
        </p>
      </header>

      <div className="subscription-management-preview__rows">
        {rows.map((row) => {
          const isBenefitChange =
            row.changeType === "benefit-add" || row.changeType === "benefit-remove";
          const isCritical =
            row.critical ||
            row.label === "Status" ||
            row.label === "Valor" ||
            row.changeType === "benefit-add" ||
            row.changeType === "benefit-remove";

          return (
            <div
              key={`${row.label}-${row.after}`}
              className={`subscription-management-preview__row ${isCritical ? "subscription-management-preview__row--critical" : ""}`.trim()}
            >
              <span className="subscription-management-preview__label">{row.label}</span>
              {isBenefitChange ? (
                <span
                  className={`subscription-management-preview__benefit subscription-management-preview__benefit--${
                    row.changeType === "benefit-add" ? "add" : "remove"
                  }`}
                >
                  {row.after}
                </span>
              ) : (
                <div className="subscription-management-preview__change">
                  <span className="subscription-management-preview__before-col">
                    <span className="subscription-management-preview__diff-label">Antes</span>
                    <span className="subscription-management-preview__before">{row.before}</span>
                  </span>
                  <span className="subscription-management-preview__arrow" aria-hidden>
                    →
                  </span>
                  <span className="subscription-management-preview__after-col">
                    <span className="subscription-management-preview__diff-label">Depois</span>
                    <span className="subscription-management-preview__after">{row.after}</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default memo(SubscriptionManagementPreview);
