// ======================================================================
// SUSE7 — Modal de confirmação reutilizável (overlay + card + ações)
// Uso: exclusões e outras ações destrutivas; não usa alert/confirm nativo.
// ======================================================================

import { useEffect } from "react";
import "./S7ConfirmModal.css";

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {import('react').ReactNode} [props.children] — corpo (alternativa a message)
 * @param {string} [props.message] — texto simples (quebras com \n)
 * @param {string} [props.cancelLabel]
 * @param {string} [props.confirmLabel]
 * @param {'danger' | 'primary'} [props.confirmVariant]
 * @param {boolean} [props.loading]
 * @param {string} [props.loadingLabel] — texto do botão de confirmação enquanto loading
 * @param {() => void} props.onCancel
 * @param {() => void} props.onConfirm
 * @param {string} [props.titleId] — id para aria-labelledby
 */
export default function S7ConfirmModal({
  open,
  title,
  children,
  message,
  cancelLabel = "Cancelar",
  confirmLabel = "Confirmar",
  confirmVariant = "danger",
  loading = false,
  loadingLabel = "Aguarde…",
  onCancel,
  onConfirm,
  titleId = "s7-confirm-modal-title",
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onCancel?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget && !loading) onCancel?.();
  };

  const handleCardMouseDown = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="s7-confirm-modal-overlay"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        className="s7-confirm-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={handleCardMouseDown}
      >
        <h2 id={titleId} className="s7-confirm-modal-title">
          {title}
        </h2>
        {children != null ? (
          <div className="s7-confirm-modal-body">{children}</div>
        ) : (
          <p className="s7-confirm-modal-text">{message}</p>
        )}
        <div className="s7-confirm-modal-actions">
          <button
            type="button"
            className="s7-confirm-modal-btn s7-confirm-modal-btn--secondary"
            disabled={loading}
            onClick={() => onCancel?.()}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              confirmVariant === "primary"
                ? "s7-confirm-modal-btn s7-confirm-modal-btn--primary"
                : "s7-confirm-modal-btn s7-confirm-modal-btn--danger"
            }
            disabled={loading}
            onClick={() => onConfirm?.()}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
