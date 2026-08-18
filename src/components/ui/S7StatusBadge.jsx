import "./S7StatusBadge.css";

/**
 * Badge compacto de status — padrão visual canônico (Minha assinatura / billing).
 * @param {{ label: string, tone?: "success" | "info" | "warning" | "danger" | "muted" }} props
 */
export default function S7StatusBadge({ label, tone = "muted" }) {
  return (
    <span className={`s7-status-badge s7-status-badge--${tone}`}>{label}</span>
  );
}
