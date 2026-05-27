import { memo, useMemo } from "react";
import TimelineEventCard from "./TimelineEventCard";
import { groupTimelineEventsByDay } from "./timelineModel";
import { useTimelineView } from "./useTimelineView";
import "./TimelineList.css";

function TimelineList() {
  const { events } = useTimelineView();

  const groups = useMemo(() => groupTimelineEventsByDay(events), [events]);

  if (!events.length) return null;

  return (
    <div className="timeline-list" aria-label="Feed cronológico operacional">
      {groups.map((group) => (
        <section key={group.key} className="timeline-list__group">
          <header className="timeline-list__group-head">
            <h5 className="timeline-list__group-title">{group.label}</h5>
            <span className="timeline-list__group-count">{group.events.length}</span>
          </header>

          <ol className="timeline-list__items">
            {group.events.map((event) => (
              <li key={event.eventId} className="timeline-list__item">
                <span className="timeline-list__rail-dot" aria-hidden />
                <TimelineEventCard event={event} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

export default memo(TimelineList);
