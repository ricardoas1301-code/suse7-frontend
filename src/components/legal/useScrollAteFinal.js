import { useCallback, useEffect, useState } from "react";

const DEFAULT_THRESHOLD = 24;

/**
 * Detecta se o container de scroll atingiu o final (com tolerância).
 * @param {import('react').RefObject<HTMLElement | null>} scrollRef
 * @param {{ enabled?: boolean; threshold?: number }} [options]
 */
export function useScrollAteFinal(scrollRef, { enabled = true, threshold = DEFAULT_THRESHOLD } = {}) {
  const [scrollAteFinal, setScrollAteFinal] = useState(false);

  const verificarScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const maxScroll = element.scrollHeight - element.clientHeight;
    if (maxScroll <= threshold) {
      setScrollAteFinal(true);
      return;
    }

    const atEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - threshold;
    setScrollAteFinal(atEnd);
  }, [scrollRef, threshold]);

  useEffect(() => {
    if (!enabled) {
      setScrollAteFinal(false);
      return undefined;
    }

    const element = scrollRef.current;
    if (!element) return undefined;

    verificarScroll();

    element.addEventListener("scroll", verificarScroll, { passive: true });
    const resizeObserver = new ResizeObserver(verificarScroll);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", verificarScroll);
      resizeObserver.disconnect();
    };
  }, [enabled, scrollRef, verificarScroll]);

  return scrollAteFinal;
}
