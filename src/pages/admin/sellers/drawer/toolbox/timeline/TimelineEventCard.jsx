import { memo } from "react";
import {
  formatBeforeAfterSnapshot,
  formatRelativeTime,
  formatTimelineDate,
  resolveTimelineEntityLabel,
  resolveTimelineSeverityLabel,
  timelineSeverityClassName,
} from "./timelineModel";
import "./TimelineEventCard.css";

/**
 * @param {{ event: import("./timelineModel").TimelineEventViewModel }} props
 */
function TimelineEventCard({ event }) {
  const ticketLabel = event.relatedTicket?.label ?? event.relatedTicket?.ticketId ?? null;
  const hasBeforeAfter = Boolean(event.beforeAfter?.before && event.beforeAfter?.after);

  return (
    <article className="timeline-event-card" data-event-type={event.eventType} data-severity={event.severity}>
      <header className="timeline-event-card__head">
        <div className="timeline-event-card__head-copy">
          <h5 className="timeline-event-card__title">{event.eventLabel}</h5>
          <p className="timeline-event-card__entity">
            {resolveTimelineEntityLabel(event.entityType)} · {event.entityId}
          </p>
          {ticketLabel ? (
            <span className="timeline-event-card__ticket" title="Ticket operacional relacionado">
              {ticketLabel}
            </span>
          ) : null}
        </div>
        <span className={timelineSeverityClassName(event.severity)}>
          {resolveTimelineSeverityLabel(event.severity)}
        </span>
      </header>

      <div className="timeline-event-card__body">
        {hasBeforeAfter ? (
          <div className="timeline-event-card__before-after" aria-label="Alteração operacional">
            <div className="timeline-event-card__before-after-row">
              <span className="timeline-event-card__before-after-label">Antes</span>
              <span className="timeline-event-card__before-after-value">
                {formatBeforeAfterSnapshot(event.beforeAfter?.before)}
              </span>
            </div>
            <div className="timeline-event-card__before-after-row">
              <span className="timeline-event-card__before-after-label">Depois</span>
              <span className="timeline-event-card__before-after-value timeline-event-card__before-after-value--after">
                {formatBeforeAfterSnapshot(event.beforeAfter?.after)}
              </span>
            </div>
          </div>
        ) : null}

        <dl className="timeline-event-card__meta">
          <div className="timeline-event-card__row">
            <dt>Admin responsável</dt>
            <dd>
              {event.adminName}
              <span className="timeline-event-card__email">{event.adminEmail}</span>
            </dd>
          </div>
          <div className="timeline-event-card__row">
            <dt>Data/hora</dt>
            <dd>
              <time dateTime={event.createdAt} title={formatTimelineDate(event.createdAt)}>
                {formatRelativeTime(event.createdAt)}
              </time>
            </dd>
          </div>
          <div className="timeline-event-card__row timeline-event-card__row--reason">
            <dt>Motivo</dt>
            <dd>{event.reason}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default memo(TimelineEventCard);
