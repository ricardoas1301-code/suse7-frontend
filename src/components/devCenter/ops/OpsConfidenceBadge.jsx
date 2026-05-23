import S7Tooltip from "../../ui/S7Tooltip";
import { dataQualityLabel } from "./opsPresentation";
import "./ops.css";

/**
 * @param {{ status?: string | null; confidencePct?: number | null; computedAt?: string | null; compact?: boolean }} props
 */
export default function OpsConfidenceBadge({ status, confidencePct, computedAt, compact = false }) {
  if (status == null && confidencePct == null) {
    return <span className="ops-badge ops-badge--muted">{compact ? "—" : "Indisponível"}</span>;
  }

  const s = String(status ?? "unknown").toLowerCase();
  const label = dataQualityLabel(s);
  const pct = confidencePct != null ? `${confidencePct}%` : "—";
  const tooltip = [
    `Confiança: ${pct}`,
    `Status: ${label}`,
    computedAt ? `Atualizado: ${new Date(computedAt).toLocaleString("pt-BR")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <S7Tooltip content={tooltip} wrap>
      <span className={`ops-badge ops-badge--confidence ops-badge--confidence-${s}${compact ? " ops-badge--compact" : ""}`}>
        {compact ? pct : `${pct} · ${label}`}
      </span>
    </S7Tooltip>
  );
}
