// ======================================================================
// COMPONENTE: FeedbackModal
// Objetivo: Exibir mensagens de sucesso/erro no padrão Suse7
// ======================================================================

import "./FeedbackModal.css";

export default function FeedbackModal({ type = "success", title, message, onClose }) {
  const isError = type === "error";
  const iconClass = isError ? "error" : "success";
  const iconGlyph = isError ? "✕" : "✓";

  return (
    <div className="feedback-overlay">
      <div className="feedback-modal">
        <div className={`feedback-icon ${iconClass}`} aria-hidden="true">
          {iconGlyph}
        </div>

        <h3>{title}</h3>
        <p>{message}</p>

        <button className="btn-primary" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
