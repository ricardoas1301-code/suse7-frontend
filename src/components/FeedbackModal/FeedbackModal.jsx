// ======================================================================
// COMPONENTE: FeedbackModal
// Objetivo: Exibir mensagens de sucesso/erro no padrão Suse7
// ======================================================================

import "./FeedbackModal.css";

export default function FeedbackModal({ title, message, onClose }) {
  return (
    <div className="feedback-overlay">
      <div className="feedback-modal">
        <div className="feedback-icon success">✓</div>

        <h3>{title}</h3>
        <p>{message}</p>

        <button className="btn-primary" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
