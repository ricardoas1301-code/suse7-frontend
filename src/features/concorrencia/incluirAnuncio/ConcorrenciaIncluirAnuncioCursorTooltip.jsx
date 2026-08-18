// ======================================================================
// Tooltip ancorado no cursor — linhas já monitoradas (modal Incluir).
// Reutiliza tokens/classes do S7Tooltip; posição centralizada acima do ponteiro.
// ======================================================================

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import "../../../components/ui/S7Tooltip.css";

const GAP_CURSOR = 4;

/**
 * @param {{
 *   content: string;
 *   wrap?: boolean;
 *   children: import("react").ReactElement;
 * }} props
 */
export default function ConcorrenciaIncluirAnuncioCursorTooltip({ content, wrap = false, children }) {
  const rootRef = useRef(null);
  const bubbleRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const pointerRef = useRef({ x: 0, y: 0, fromPointer: false });
  const [active, setActive] = useState(false);
  const [bubbleStyle, setBubbleStyle] = useState(/** @type {import("react").CSSProperties} */ ({}));

  const measure = useCallback(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;

    const { x, y } = pointerRef.current;
    const bubbleRect = bubble.getBoundingClientRect();
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = GAP_CURSOR;

    let left = x - bubbleRect.width / 2;
    if (left < pad) left = pad;
    if (left + bubbleRect.width > vw - pad) {
      left = vw - pad - bubbleRect.width;
    }

    let top = y - gap - bubbleRect.height;
    if (top < pad) {
      top = Math.min(vh - pad - bubbleRect.height, y + gap);
    }

    const arrowLeft = Math.min(
      Math.max(x - left, 10),
      Math.max(bubbleRect.width - 18, 10),
    );

    setBubbleStyle({
      position: "fixed",
      left,
      top,
      zIndex: "var(--s7-z-tooltip, 290000)",
      ["--s7-tooltip-arrow-left"]: `${arrowLeft}px`,
    });
  }, []);

  const syncPointerFromEvent = useCallback((event) => {
    if (event.clientX <= 0 && event.clientY <= 0) return;
    pointerRef.current = { x: event.clientX, y: event.clientY, fromPointer: true };
    if (active) measure();
  }, [active, measure]);

  const syncPointerFromFocus = useCallback(() => {
    const root = rootRef.current;
    const anchor = root?.firstElementChild instanceof HTMLElement ? root.firstElementChild : root;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    pointerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      fromPointer: false,
    };
    if (active) measure();
  }, [active, measure]);

  useLayoutEffect(() => {
    if (!active) return;
    measure();
    const id = window.requestAnimationFrame(() => measure());
    return () => window.cancelAnimationFrame(id);
  }, [active, content, measure]);

  useEffect(() => {
    if (!active) return;
    const onScrollOrResize = () => measure();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [active, measure]);

  const showPortal = active && content && typeof document !== "undefined";

  const bubbleEl = showPortal ? (
    <div
      ref={bubbleRef}
      className={[
        "s7-tooltip-portal__bubble",
        "s7-tooltip-portal__bubble--top-start",
        wrap ? "s7-tooltip-portal__bubble--wrap" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="tooltip"
      style={bubbleStyle}
    >
      {content}
    </div>
  ) : null;

  const child = isValidElement(children)
    ? cloneElement(children, {
        className: [children.props.className].filter(Boolean).join(" "),
        onMouseMove: (event) => {
          syncPointerFromEvent(event);
          children.props.onMouseMove?.(event);
        },
      })
    : children;

  return (
    <>
      <span
        ref={rootRef}
        className="s7-tooltip-portal-root concorrencia-incluir-modal__cursor-tooltip-root"
        onMouseEnter={(event) => {
          syncPointerFromEvent(event);
          setActive(true);
        }}
        onMouseLeave={() => setActive(false)}
        onMouseMove={syncPointerFromEvent}
        onFocusCapture={() => {
          syncPointerFromFocus();
          setActive(true);
        }}
        onBlurCapture={(event) => {
          const next = /** @type {Node | null} */ (event.relatedTarget);
          if (next && rootRef.current?.contains(next)) return;
          setActive(false);
        }}
      >
        {child}
      </span>
      {bubbleEl && createPortal(bubbleEl, document.body)}
    </>
  );
}
