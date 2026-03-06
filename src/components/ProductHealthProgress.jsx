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

  return (
    <div
      className={`php-wrap ${!isClickable ? "php-wrap--disabled" : ""}`}
      title={tooltipText}
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
      <div className={`php-content ${!showLabel ? "php-content--no-label" : ""}`}>
        <span className="php-percent">{Math.round(clamped)}%</span>
        {showLabel && <span className="php-label">{hint || "Cadastro"}</span>}
      </div>
    </div>
  );
}
