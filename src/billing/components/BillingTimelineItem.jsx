import { memo, useState } from "react";
import S7Icon from "../../components/ui/S7Icon";
import "./BillingTimelineItem.css";

/**
 * @param {{
 *   event: NonNullable<ReturnType<import("../billingFinancialExperienceUi").normalizeTimelineEvent>>;
 *   isLast?: boolean;
 *   animationIndex?: number;
 * }} props
 */
function BillingTimelineItem({ event, isLast = false, animationIndex = 0 }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li
      className={`s7-billing-timeline-item s7-billing-timeline-item--${event.importance} ${isLast ? "s7-billing-timeline-item--last" : ""}`}
      style={{ "--s7-timeline-stagger": `${Math.min(animationIndex, 12) * 40}ms` }}
    >
      <div className="s7-billing-timeline-item__rail" aria-hidden="true">
        <span className={`s7-billing-timeline-item__icon s7-billing-timeline-item__icon--${event.icon}`}>
          <S7Icon name={event.s7IconName} size={18} strokeWidth={2} />
        </span>
      </div>

      <article className="s7-billing-timeline-item__card">
        <div className="s7-billing-timeline-item__head">
          <div className="s7-billing-timeline-item__titles">
            <h3 className="s7-billing-timeline-item__title">{event.title}</h3>
            <time className="s7-billing-timeline-item__time">{event.occurredAtLabel}</time>
          </div>
          <span
            className={`s7-billing-timeline-item__badge s7-billing-timeline-item__badge--${event.severityClass}`}
          >
            {event.severityLabel}
          </span>
        </div>

        <p className="s7-billing-timeline-item__summary">{event.summary}</p>

        {event.metaLines.length > 0 ? (
          <div className="s7-billing-timeline-item__chips">
            {event.metaLines.map((line) => (
              <span key={`${event.id}-${line.label}`} className="s7-billing-timeline-item__chip">
                <span className="s7-billing-timeline-item__chip-label">{line.label}</span>
                <span className="s7-billing-timeline-item__chip-value">{line.value}</span>
              </span>
            ))}
          </div>
        ) : null}

        {event.hasDetails ? (
          <div className="s7-billing-timeline-item__details-wrap">
            <button
              type="button"
              className="s7-billing-timeline-item__details-toggle"
              aria-expanded={expanded}
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Ocultar detalhes" : "Ver detalhes"}
              <S7Icon name={expanded ? "close" : "info"} size={14} />
            </button>
            {expanded ? (
              <dl className="s7-billing-timeline-item__details">
                {event.detailLines.map((line) => (
                  <div key={`${event.id}-detail-${line.label}`} className="s7-billing-timeline-item__details-row">
                    <dt>{line.label}</dt>
                    <dd>{line.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        ) : null}
      </article>
    </li>
  );
}

export default memo(BillingTimelineItem);
