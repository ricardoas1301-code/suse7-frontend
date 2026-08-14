import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import S7Icon from "../../../components/ui/S7Icon.jsx";
import "./ConfigurationTaskModalShell.css";
export { CONFIGURATION_TASK_MODAL_SHELL_BASELINE } from "./configurationTaskModalShellBaseline.js";

/**
 * @param {{
 *   open: boolean;
 *   title: string;
 *   subtitle?: string;
 *   children?: import("react").ReactNode;
 *   onClose: () => void;
 *   loading?: boolean;
 *   error?: string | null;
 *   primaryAction?: import("react").ReactNode;
 *   secondaryAction?: import("react").ReactNode;
 *   closeDisabled?: boolean;
 * }} props
 */
export default function ConfigurationTaskModalShell({
  open,
  title,
  subtitle = "",
  children = null,
  onClose,
  loading = false,
  error = null,
  primaryAction = null,
  secondaryAction = null,
  closeDisabled = false,
}) {
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef(/** @type {HTMLElement | null} */ (null));
  const previouslyFocusedRef = useRef(/** @type {HTMLElement | null} */ (null));

  const canClose = !closeDisabled && !loading;

  const handleClose = useCallback(() => {
    if (!canClose) return;
    onClose();
  }, [canClose, onClose]);

  const handleOverlayMouseDown = useCallback(
    (/** @type {import("react").MouseEvent} */ event) => {
      if (event.target !== event.currentTarget) return;
      if (!canClose) return;
      handleClose();
    },
    [canClose, handleClose],
  );

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const dialog = dialogRef.current;
    if (dialog instanceof HTMLElement) {
      const focusable = dialog.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable instanceof HTMLElement) focusable.focus();
      else dialog.focus();
    }

    const onKeyDown = (/** @type {KeyboardEvent} */ event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      handleClose();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [open, handleClose]);

  if (!open) return null;

  const modal = (
    <div
      className="configuration-task-modal-shell__overlay"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
    >
      <section
        ref={dialogRef}
        className="configuration-task-modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="configuration-task-modal-shell__header">
          <div className="configuration-task-modal-shell__header-text">
            <h2 id={titleId} className="configuration-task-modal-shell__title">
              {title}
            </h2>
            {subtitle ? (
              <p id={subtitleId} className="configuration-task-modal-shell__subtitle">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="configuration-task-modal-shell__close"
            onClick={handleClose}
            disabled={!canClose}
            aria-label="Fechar"
          >
            <S7Icon name="close" size={18} />
          </button>
        </header>

        <div className="configuration-task-modal-shell__body">
          {loading ? (
            <div className="configuration-task-modal-shell__loading" aria-live="polite">
              Carregando…
            </div>
          ) : null}
          {error ? (
            <div className="configuration-task-modal-shell__error" role="alert">
              {error}
            </div>
          ) : null}
          {children}
        </div>

        {(primaryAction || secondaryAction) && (
          <footer className="configuration-task-modal-shell__footer">
            <div className="configuration-task-modal-shell__footer-actions">
              {secondaryAction}
              {primaryAction}
            </div>
          </footer>
        )}
      </section>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
