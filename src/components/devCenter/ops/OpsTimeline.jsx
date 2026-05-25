import OpsEmptyState from "./OpsEmptyState";
import { formatPtDateShort } from "./opsPresentation";
import { OPS_DRAWER_EMPTY } from "./opsDrawerEmptyCopy";
import "./ops.css";

/**
 * @param {{
 *   items?: Array<{ id: string; label: string; at?: string | null; tone?: string }>;
 *   emptyCopy?: { title: string; message?: string };
 * }} props
 */
export default function OpsTimeline({ items = [], emptyCopy = OPS_DRAWER_EMPTY.NO_TIMELINE }) {
  const rows = Array.isArray(items) ? items.filter((i) => i && i.at) : [];

  if (!rows.length) {
    return <OpsEmptyState compact title={emptyCopy.title} message={emptyCopy.message} />;
  }

  return (
    <ol className="ops-timeline">
      {rows.map((item) => (
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
