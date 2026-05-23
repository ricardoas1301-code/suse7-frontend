import S7Tooltip from "../../ui/S7Tooltip";
import { ingestionHealthLabel } from "./opsPresentation";
import "./ops.css";

/**
 * @param {{ status?: string | null; coveragePct?: number | null; pending?: number | null; computedAt?: string | null; compact?: boolean }} props
 */
export default function OpsHealthBadge({ status, coveragePct, pending, computedAt, compact = false }) {
  if (!status) {
    return <span className="ops-badge ops-badge--muted">{compact ? "—" : "Indisponível"}</span>;
  }

  const s = String(status).toLowerCase();
  const label = ingestionHealthLabel(s);
  const tooltip = [
    `Status: ${label}`,
    coveragePct != null ? `Cobertura: ${coveragePct}%` : null,
    pending != null ? `Pendentes: ${pending}` : null,
    computedAt ? `Atualizado: ${new Date(computedAt).toLocaleString("pt-BR")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <S7Tooltip content={tooltip} wrap>
      <span className={`ops-badge ops-badge--health ops-badge--health-${s}${compact ? " ops-badge--compact" : ""}`}>
        {label}
      </span>
    </S7Tooltip>
  );
}
