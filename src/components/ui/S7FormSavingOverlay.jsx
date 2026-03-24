// ======================================================================
// SUSE7 — Overlay de “salvando” na área do formulário (não full-page)
// Uso: formulários longos onde a API demora; feedback imediato sem travar a UI.
// ======================================================================

import "./S7FormSavingOverlay.css";

/**
 * @param {{ show: boolean; message?: string; className?: string }} props
 */
export default function S7FormSavingOverlay({
  show,
  message = "Salvando produto...",
  className = "",
}) {
  if (!show) return null;

  return (
    <div
      className={`s7-form-saving-overlay ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="s7-form-saving-overlay__panel">
        <span className="s7-form-saving-overlay__spinner" aria-hidden />
        <span className="s7-form-saving-overlay__text">{message}</span>
      </div>
    </div>
  );
}
