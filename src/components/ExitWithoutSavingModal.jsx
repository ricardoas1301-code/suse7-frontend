// ======================================================================
// SUSE7 — Exit Without Saving Modal
// Confirmação ao sair com alterações não salvas
// Integrado com userPreferences (não mostrar mais)
// ======================================================================

import { useState } from "react";
import "./ExitWithoutSavingModal.css";

export default function ExitWithoutSavingModal({
  open = false,
  onCancel,
  onConfirm,
  onDontShowAgainChange,
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!open) return null;

  const handleCancel = () => {
    setDontShowAgain(false);
    onCancel?.();
  };

  const handleConfirm = () => {
    const checked = dontShowAgain;
    setDontShowAgain(false);
    onDontShowAgainChange?.(checked);
    onConfirm?.();
  };

  return (
    <div
      className="ews-modal-bg"
      onClick={handleCancel}
      role="presentation"
    >
      <div
        className="ews-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="ews-modal-title"
        aria-modal="true"
      >
        <div className="ews-modal-header">
          <h2 id="ews-modal-title" className="ews-modal-title">
            Sair sem salvar?
          </h2>
        </div>
        <p className="ews-modal-text">
          Você tem alterações não salvas. Deseja sair e perder as alterações?
        </p>
        <label className="ews-modal-checkbox">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          <span>Não mostrar mais este aviso</span>
        </label>
        <div className="ews-modal-actions">
          <button
            type="button"
            className="s7-modal-btn-secondary"
            onClick={handleCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="s7-modal-btn-primary ews-modal-btn-exit"
            onClick={handleConfirm}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
