import { formatPtDateShort } from "./opsPresentation";
import "./ops.css";

/**
 * @param {{ items?: Array<{ id: string; label: string; at?: string | null; tone?: string }> }} props
 */
export default function OpsTimeline({ items = [] }) {
  if (!items.length) {
    return <p className="ops-timeline__empty">Nenhum marco temporal disponível.</p>;
  }

  return (
    <ol className="ops-timeline">
      {items.map((item) => (
        <li key={item.id} className={`ops-timeline__item ops-timeline__item--${item.tone ?? "default"}`}>
          <span className="ops-timeline__dot" aria-hidden="true" />
          <div>
            <strong>{item.label}</strong>
            <time dateTime={item.at ?? undefined}>{formatPtDateShort(item.at)}</time>
          </div>
        </li>
      ))}
    </ol>
  );
}
