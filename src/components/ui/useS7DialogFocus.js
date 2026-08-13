import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @param {{ open: boolean; onClose?: () => void; containerRef: import('react').RefObject<HTMLElement | null> }} params
 */
export function useS7DialogFocus({ open, onClose, containerRef }) {
  const triggerRef = useRef(/** @type {HTMLElement | null} */ (null));

  useEffect(() => {
    if (!open) return undefined;

    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusInitial = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const focusables = container.querySelectorAll(FOCUSABLE_SELECTOR);
      const first = focusables[0];
      if (first instanceof HTMLElement) {
        first.focus();
        return;
      }
      container.setAttribute("tabindex", "-1");
      container.focus();
    });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const focusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (node) => node instanceof HTMLElement
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusInitial);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus?.();
      triggerRef.current = null;
    };
  }, [open, onClose, containerRef]);

  return triggerRef;
}
