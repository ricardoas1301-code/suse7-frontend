import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useModalBackdropDismiss } from "../../../utils/modalBackdropDismiss.js";
import { getMarketplaceTheme, getMarketplaceThemeCssVars } from "../../../theme/marketplaceTheme.js";
import { CONFIGURATION_TASK_MODAL_SIZE } from "./configurationTaskModalSizes.js";
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
 *   closeDisabled?: boolean;
 *   size?: string;
 *   secondaryAction?: import("react").ReactNode;
 *   anchorToTaskCenter?: boolean;
 *   showCloseButton?: boolean;
 *   hideTitle?: boolean;
 *   marketplaceSlug?: string | null;
 *   showMarketplaceChannelBadge?: boolean;
 *   channelBadgePrefix?: string;
 *   bodySurface?: "default" | "white";
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
  size = CONFIGURATION_TASK_MODAL_SIZE.COMPACT,
  anchorToTaskCenter = false,
  showCloseButton = false,
  hideTitle = false,
  marketplaceSlug = null,
  showMarketplaceChannelBadge = false,
  channelBadgePrefix = "",
  bodySurface = "default",
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

  const {
    handleBackdropPointerDown,
    handleBackdropPointerUp,
    handleBackdropPointerCancel,
  } = useModalBackdropDismiss(handleClose);

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
      dialog.focus();
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

  const marketplaceTheme = getMarketplaceTheme(marketplaceSlug);
  const marketplaceCssVars = getMarketplaceThemeCssVars(marketplaceTheme);

  const overlayClassName = [
    "configuration-task-modal-shell__overlay",
    anchorToTaskCenter ? "configuration-task-modal-shell__overlay--anchored" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const dialogClassName = [
    "configuration-task-modal-shell",
    "configuration-task-modal-shell--adaptive",
    size ? `configuration-task-modal-shell--${size}` : "",
    showMarketplaceChannelBadge && marketplaceTheme.resolvedKey !== "default"
      ? `configuration-task-modal-shell--marketplace configuration-task-modal-shell--${marketplaceTheme.resolvedKey}`
      : "",
    bodySurface === "white" ? "configuration-task-modal-shell--surface-white" : "",
    showMarketplaceChannelBadge ? "configuration-task-modal-shell--with-channel-badge" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const modal = (
    <div
      className={overlayClassName}
      role="presentation"
      onPointerDown={canClose ? handleBackdropPointerDown : undefined}
      onPointerUp={canClose ? handleBackdropPointerUp : undefined}
      onPointerCancel={canClose ? handleBackdropPointerCancel : undefined}
    >
      <div
        className={[
          "configuration-task-modal-shell-outer",
          showMarketplaceChannelBadge ? "configuration-task-modal-shell-outer--with-badge" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={showMarketplaceChannelBadge ? marketplaceCssVars : undefined}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {showMarketplaceChannelBadge ? (
          <div className="configuration-task-modal-shell__channel-badge" aria-hidden="true">
            {channelBadgePrefix ? (
              <span className="configuration-task-modal-shell__channel-badge-prefix">{channelBadgePrefix}</span>
            ) : null}
            {marketplaceTheme.logoSrc ? (
              <img
                src={marketplaceTheme.logoSrc}
                alt=""
                className="configuration-task-modal-shell__channel-badge-img"
                decoding="async"
              />
            ) : (
              <span className="configuration-task-modal-shell__channel-badge-fallback">
                {marketplaceTheme.displayName}
              </span>
            )}
          </div>
        ) : null}

        <section
          ref={dialogRef}
          className={dialogClassName}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={subtitle ? subtitleId : undefined}
          tabIndex={-1}
        >
        {hideTitle ? null : (
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
            {showCloseButton ? (
              <button
                type="button"
                className="configuration-task-modal-shell__close"
                onClick={handleClose}
                disabled={!canClose}
                aria-label="Fechar"
              >
                ×
              </button>
            ) : null}
          </header>
        )}

        {hideTitle ? (
          <h2 id={titleId} className="configuration-task-modal-shell__sr-only">
            {title}
          </h2>
        ) : null}

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
          {!loading ? children : null}
        </div>

        {primaryAction || secondaryAction ? (
          <footer className="configuration-task-modal-shell__footer">
            <div
              className={[
                "configuration-task-modal-shell__footer-actions",
                secondaryAction ? "configuration-task-modal-shell__footer-actions--dual" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {secondaryAction}
              {primaryAction}
            </div>
          </footer>
        ) : null}
        </section>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
