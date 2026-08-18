import { useCallback, useRef } from "react";

/** @param {Pick<PointerEvent, "target" | "currentTarget">} event */
export function isDirectBackdropPointerTarget(event) {
  return event.target === event.currentTarget;
}

/**
 * Fecha o modal somente quando pointer down e pointer up ocorrem diretamente no backdrop.
 * @param {boolean} pointerDownStartedOnBackdrop
 * @param {Pick<PointerEvent, "target" | "currentTarget">} event
 */
export function shouldDismissModalOnBackdropPointerUp(pointerDownStartedOnBackdrop, event) {
  return pointerDownStartedOnBackdrop && isDirectBackdropPointerTarget(event);
}

/** @param {Pick<PointerEvent, "target" | "currentTarget">} event */
export function resolveBackdropPointerDownStarted(event) {
  return isDirectBackdropPointerTarget(event);
}

/**
 * Handlers de fechamento por backdrop: só dismiss quando a interação começa e termina no backdrop.
 * @param {() => void} onClose
 */
export function useModalBackdropDismiss(onClose) {
  const pointerDownOnBackdropRef = useRef(false);

  const handleBackdropPointerDown = useCallback((event) => {
    pointerDownOnBackdropRef.current = resolveBackdropPointerDownStarted(event);
  }, []);

  const handleBackdropPointerUp = useCallback(
    (event) => {
      if (shouldDismissModalOnBackdropPointerUp(pointerDownOnBackdropRef.current, event)) {
        onClose();
      }
      pointerDownOnBackdropRef.current = false;
    },
    [onClose],
  );

  const handleBackdropPointerCancel = useCallback(() => {
    pointerDownOnBackdropRef.current = false;
  }, []);

  return {
    handleBackdropPointerDown,
    handleBackdropPointerUp,
    handleBackdropPointerCancel,
  };
}
