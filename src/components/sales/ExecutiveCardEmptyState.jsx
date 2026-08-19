// ======================================================================
// Empty state canônico dos cards executivos — referência visual Top 10.
// ======================================================================

import S7Icon from "../ui/S7Icon";
import "./ExecutiveCardEmptyState.css";

/**
 * @param {{ message: string; className?: string }} props
 */
export default function ExecutiveCardEmptyState({ message, className = "" }) {
  return (
    <div className={["s7-executive-card-empty", className].filter(Boolean).join(" ")} role="status">
      <div className="s7-executive-card-empty__center">
        <span className="s7-executive-card-empty__icon" aria-hidden>
          <S7Icon name="catalog_filter_no_sales" size={28} strokeWidth={1.75} />
        </span>
        <p className="s7-executive-card-empty__message">{message}</p>
      </div>
    </div>
  );
}
