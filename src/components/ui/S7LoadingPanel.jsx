// ======================================================================
// S7LoadingPanel — painel centralizado com spinner + texto (mesmo visual do overlay de save)
// Uso: telas de carregamento inicial (ex.: edição de produto) sem tela “só texto”.
// ======================================================================

import "./S7FormSavingOverlay.css";
import "./S7LoadingPanel.css";

/**
 * @param {{ message?: string; className?: string }} props
 */
export default function S7LoadingPanel({ message = "Carregando…", className = "" }) {
  return (
    <div
      className={`s7-loading-panel ${className}`.trim()}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="s7-form-saving-overlay__panel">
        <span className="s7-form-saving-overlay__spinner" aria-hidden />
        <span className="s7-form-saving-overlay__text">{message}</span>
      </div>
    </div>
  );
}
