import { formatTicketWhen } from "./sellerTicketsUtils";

/**
 * @param {{ events: import('./sellerTicketsTypes').SellerTicketTimelineEvent[] }} props
 */
export default function SellerTicketTimeline({ events }) {
  const sorted = [...events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <section className="dc-ticket-panel">
      <h4 className="dc-ticket-panel__title">Timeline operacional</h4>
      <ol className="dc-ticket-timeline">
        {sorted.length === 0 ? (
          <li className="dc-ticket-timeline__empty">Sem eventos registrados.</li>
        ) : (
          sorted.map((ev) => (
            <li key={ev.id} className={`dc-ticket-timeline__item dc-ticket-timeline__item--${ev.kind}`}>
              <div className="dc-ticket-timeline__dot" aria-hidden />
              <div className="dc-ticket-timeline__body">
                <p className="dc-ticket-timeline__label">{ev.label}</p>
                <time className="dc-ticket-timeline__when">{formatTicketWhen(ev.at)}</time>
              </div>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
