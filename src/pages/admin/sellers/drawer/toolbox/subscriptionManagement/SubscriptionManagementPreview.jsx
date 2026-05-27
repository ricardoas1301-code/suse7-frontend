import { memo } from "react";
import "./SubscriptionManagementPreview.css";

/**
 * @param {{
 *   rows: import("./subscriptionManagementModel").SubscriptionManagementPreviewRow[] | null | undefined;
 *   visible?: boolean;
 * }} props
 */
function SubscriptionManagementPreview({ rows, visible = false }) {
  if (!visible || !rows?.length) return null;

  return (
    <section className="subscription-management-preview" aria-label="Preview operacional">
      <header className="subscription-management-preview__head">
        <h5 className="subscription-management-preview__title">Preview operacional</h5>
        <p className="subscription-management-preview__hint">Antes de aplicar — simulação local.</p>
      </header>

      <div className="subscription-management-preview__rows">
        {rows.map((row) => (
          <div key={row.label} className="subscription-management-preview__row">
            <span className="subscription-management-preview__label">{row.label}</span>
            <div className="subscription-management-preview__change">
              <span className="subscription-management-preview__before">{row.before}</span>
              <span className="subscription-management-preview__arrow" aria-hidden>
                →
              </span>
              <span className="subscription-management-preview__after">{row.after}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(SubscriptionManagementPreview);
