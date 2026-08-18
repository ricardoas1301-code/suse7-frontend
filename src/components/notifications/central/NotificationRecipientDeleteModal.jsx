import { useRef } from "react";
import { useS7DialogFocus } from "../../ui/useS7DialogFocus.js";
import "./NotificationRecipientDeleteModal.css";

/**
 * @param {{
 *   open: boolean;
 *   group: { label?: string; linked_rules_count?: number; has_dispatch_history?: boolean } | null;
 *   saving?: boolean;
 *   errorMessage?: string | null;
 *   onClose: () => void;
 *   onConfirm: () => void;
 * }} props
 */
export default function NotificationRecipientDeleteModal({
  open,
  group,
  saving = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  useS7DialogFocus({
    open,
    onClose: handleClose,
    containerRef: panelRef,
  });

  if (!open || !group) return null;

  const nome = String(group.label ?? "este destinatário");
  const hasFutureLinks = Number(group.linked_rules_count ?? 0) > 0;
  const hasHistory = Boolean(group.has_dispatch_history);

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) handleClose();
  };

  return (
    <div
      className="s7-nrec-delete-modal"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        ref={panelRef}
        className="s7-nrec-delete-modal__panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="s7-nrec-delete-modal-title"
        aria-describedby="s7-nrec-delete-modal-desc"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id="s7-nrec-delete-modal-title">Remover destinatário?</h3>
        <p id="s7-nrec-delete-modal-desc">
          Tem certeza de que deseja remover {nome}? Essa pessoa deixará de receber novas notificações.
        </p>
        {hasFutureLinks || hasHistory ? (
          <p className="s7-nrec-delete-modal__extra">
            Os vínculos futuros serão removidos, mas o histórico de notificações será preservado.
          </p>
        ) : null}
        {errorMessage ? (
          <p className="s7-nrec-delete-modal__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <footer className="s7-nrec-delete-modal__footer">
          <button
            type="button"
            className="s7-nrec-delete-modal__btn-ghost"
            onClick={handleClose}
            disabled={saving}
          >
            Manter destinatário
          </button>
          <button
            type="button"
            className="s7-nrec-delete-modal__btn-danger"
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? "Removendo…" : "Remover destinatário"}
          </button>
        </footer>
      </div>
    </div>
  );
}
