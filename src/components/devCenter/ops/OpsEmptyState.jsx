import S7Icon from "../../ui/S7Icon";
import "./ops.css";

export default function OpsEmptyState({ title = "Sem dados", message, compact = false }) {
  return (
    <div className={`ops-empty${compact ? " ops-empty--compact" : ""}`}>
      <S7Icon name="empty" size={compact ? 18 : 22} className="ops-empty__icon" />
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
