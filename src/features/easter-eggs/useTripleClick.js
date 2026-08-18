import { useCallback, useEffect, useRef } from "react";

const TRIPLE_CLICK_JANELA_MS = 600;

/**
 * Detecta triplo clique sem bloquear cliques normais.
 * @param {() => void} onTripleClick
 */
export function useTripleClick(onTripleClick) {
  const contagemRef = useRef(0);
  const timerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const callbackRef = useRef(onTripleClick);

  useEffect(() => {
    callbackRef.current = onTripleClick;
  }, [onTripleClick]);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(() => {
    contagemRef.current += 1;

    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
    }

    if (contagemRef.current >= 3) {
      contagemRef.current = 0;
      callbackRef.current?.();
      return;
    }

    timerRef.current = setTimeout(() => {
      contagemRef.current = 0;
      timerRef.current = null;
    }, TRIPLE_CLICK_JANELA_MS);
  }, []);
}
