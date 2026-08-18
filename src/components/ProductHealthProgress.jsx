// ======================================================================
// SUSE7 — Product Health Progress (círculo de progresso do cadastro)
// Exibe percentual calculado a partir do health report do backend
// ======================================================================

import "./ProductHealthProgress.css";

export default function ProductHealthProgress({
  percent = 0,
  status = "",
  blockingCount = 0,
  warningsCount = 0,
  onClick,
  hint = null, // ex: "Salve para calcular"
  showLabel = true, // quando false, esconde o texto abaixo do percentual
  variant = "full", // "full" | "semi"
  accent = "primary", // "primary" | "orange"
  percentText = null, // sobrescreve o texto central (ex.: "—")
  suppressTooltip = false,
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const tooltipText =
    hint ||
    (blockingCount > 0 || warningsCount > 0
      ? `${blockingCount} pendência${blockingCount !== 1 ? "s" : ""}, ${warningsCount} sugestão${warningsCount !== 1 ? "ões" : ""}`
      : "Cadastro completo");

  const isClickable = typeof onClick === "function";
  const isSemi = variant === "semi";
  const accentClass = accent === "orange" ? " php-wrap--accent-orange" : "";

  return (
    <div
      className={`php-wrap ${!isClickable ? "php-wrap--disabled" : ""} ${isSemi ? "php-wrap--semi" : ""}${accentClass}`}
      title={suppressTooltip ? undefined : tooltipText}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {isSemi ? (
        <svg className="php-svg php-svg--semi" viewBox="0 0 100 60" aria-hidden="true">
          <path
            className="php-bg"
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            className="php-progress"
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - clamped}
          />
        </svg>
      ) : (
        <svg className="php-svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            className="php-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
          />
          <circle
            className="php-progress"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
          />
        </svg>
      )}
      <div className={`php-content ${!showLabel ? "php-content--no-label" : ""}`}>
        <span className="php-percent">{percentText ?? `${Math.round(clamped)}%`}</span>
        {showLabel && <span className="php-label">{hint || "Cadastro"}</span>}
      </div>
    </div>
  );
}
