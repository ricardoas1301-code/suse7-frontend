import { useEffect } from "react";
import "../../CompleteProfileModal.css";
import "./marketplaceModalShell.css";
import "./s7ModalStack.css";

/**
 * Shell compartilhado de modais marketplace (integração, sincronização, etc.).
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   children: React.ReactNode;
 *   dialogRef?: import("react").RefObject<HTMLDivElement | null>;
 *   ariaLabelledBy: string;
 *   variant?: "integration-management" | "sync-details";
 *   dialogClassName?: string;
 *   isCovered?: boolean;
 *   stackLayer?: "base" | "top" | "standalone";
 * }} props
 */
export default function MarketplaceModalShell({
  open,
  onClose,
  children,
  dialogRef,
  ariaLabelledBy,
  variant = "integration-management",
  dialogClassName = "",
  isCovered = false,
  stackLayer = "standalone",
}) {
  useEffect(() => {
    if (!open || isCovered) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape, true);
    return () => document.removeEventListener("keydown", handleEscape, true);
  }, [open, isCovered, onClose]);

  useEffect(() => {
    if (!open || isCovered) return undefined;
    dialogRef?.current?.focus();
  }, [open, isCovered, dialogRef]);

  if (!open) return null;

  const stackClass =
    stackLayer === "base" ? "s7-modal-stack-base" : stackLayer === "top" ? "s7-modal-stack-top" : "";
  const coveredClass = isCovered ? "is-covered" : "";
  const variantClass =
    variant === "sync-details"
      ? "s7-marketplace-modal-shell--sync-details"
      : "s7-marketplace-modal-shell--integration-management";

  return (
    <div
      className={`profile-modal-backdrop ${stackClass} ${coveredClass}`.trim()}
      role="presentation"
      onClick={isCovered ? undefined : onClose}
      aria-hidden={isCovered ? "true" : undefined}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`profile-modal s7-marketplace-modal-shell ${variantClass} ${dialogClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
