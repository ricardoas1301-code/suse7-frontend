import S7Icon from "../../ui/S7Icon";
import "./ops.css";

/**
 * @param {{ title?: string; message?: string; compact?: boolean }} props
 */
export default function OpsEmptyState({ title = "Sem dados", message, compact = false }) {
  return (
    <div
      className={`ops-empty${compact ? " ops-empty--compact" : ""}`}
      role="status"
      aria-label={message ? `${title}. ${message}` : title}
    >
      <S7Icon name="empty" size={compact ? 18 : 22} className="ops-empty__icon" aria-hidden="true" />
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
