import { memo } from "react";
import {
  formatRelativeTime,
  resolveTimelineEntityLabel,
  resolveTimelineSeverityLabel,
  timelineSeverityClassName,
  formatTimelineDate,
} from "./timelineModel";
import "./TimelineEventCard.css";

/**
 * @param {{ event: import("./timelineModel").TimelineEventViewModel }} props
 */
function TimelineEventCard({ event }) {
  return (
    <article className="timeline-event-card" data-event-type={event.eventType} data-severity={event.severity}>
      <header className="timeline-event-card__head">
        <div className="timeline-event-card__head-copy">
          <h5 className="timeline-event-card__title">{event.eventLabel}</h5>
          <p className="timeline-event-card__entity">
            {resolveTimelineEntityLabel(event.entityType)} · {event.entityId}
          </p>
        </div>
        <span className={timelineSeverityClassName(event.severity)}>
          {resolveTimelineSeverityLabel(event.severity)}
        </span>
      </header>

      <div className="timeline-event-card__body">
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
