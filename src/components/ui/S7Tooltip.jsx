// ======================================================
// COMPONENTE GLOBAL: S7Tooltip
// Objetivo:
// - Tooltip único do Design System (Suse7)
// - Reutiliza o padrão global .s7-tip + data-tip (hover) — sem portal; variáveis em :root (--s7-tooltip-*)
// - API consistente: placement, offset, conteúdo
//
// Observações:
// - Padrão oficial: placement="bottom-start", offset={6}
// - placement="top-start": balão acima do gatilho (ex.: última linha de um painel com overflow)
// - `richContent`: painel com JSX; posição fixa lateral (flip end/start) + hover/toque
// - Gatilho recebe `s7-tooltip-trigger` (azul Suse7 + hover via tokens)
// - Sem lógica de negócio; apenas composição visual
// ======================================================

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

import "./S7Tooltip.css";

/** @param {import("react").ReactNode} props.children */
export default function S7Tooltip({
  /** Texto exibido no tooltip (modo legado .s7-tip + data-tip) */
  content = "",
  /** Conteúdo estruturado (fundo claro; não usa data-tip) */
  richContent,
  children,
  /** @type {"bottom-start" | "top-start"} */
  placement = "bottom-start",
  offset = 6,
  /** Permite quebra de linha em textos longos (.s7-tip-wrap) */
  wrap = false,
  className = "",
}) {
  const hasRich = richContent != null;
  if (!content && !hasRich) {
    return children ?? null;
  }

  const isBottomStart = placement === "bottom-start";
  const placementClass = isBottomStart ? "s7-tooltip--bottom-start" : "s7-tooltip--top-start";

  const mergedClass = [
    "s7-tooltip",
    "s7-tip",
    "s7-tooltip-trigger",
    isBottomStart ? "s7-tip-bottom" : "",
    /* Em top-start o gatilho costuma ficar à direita; alinhar o balão à direita evita estourar a viewport. */
    isBottomStart ? "s7-tip-left" : "s7-tip-right",
    wrap ? "s7-tip-wrap" : "",
    placementClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = { "--s7-tooltip-offset": `${offset}px` };

  if (hasRich) {
    return (
      <S7TooltipRichPanel offset={offset} className={className} style={style} panelBody={richContent}>
        {children}
      </S7TooltipRichPanel>
    );
  }

  if (isValidElement(children)) {
    return (
      <S7TooltipTextPortal
        content={content}
        placement={placement}
        offset={offset}
        wrap={wrap}
        triggerClassName={mergedClass}
        style={style}
      >
        {children}
      </S7TooltipTextPortal>
    );
  }

  return (
    <S7TooltipTextPortal
      content={content}
      placement={placement}
      offset={offset}
      wrap={wrap}
      triggerClassName={mergedClass}
      style={style}
    >
      <span>{children}</span>
    </S7TooltipTextPortal>
  );
}

/**
 * Tooltip textual via portal (position: fixed) — evita clip por overflow/stacking do Raio-x e modais.
 */
function S7TooltipTextPortal({ children, content, placement, offset, wrap, triggerClassName, style }) {
  const rootRef = useRef(null);
  const bubbleRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [active, setActive] = useState(false);
  const [bubbleStyle, setBubbleStyle] = useState(/** @type {import("react").CSSProperties} */ ({}));

  const isBottomStart = placement === "bottom-start";
  const gap = Math.max(0, Number(offset) || 6);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const bubble = bubbleRef.current;
    if (!root || !bubble) return;

    const anchor = root.firstElementChild instanceof HTMLElement ? root.firstElementChild : root;
    const rect = anchor.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (isBottomStart) {
      let left = rect.left;
      if (left + bubbleRect.width > vw - pad) {
        left = vw - pad - bubbleRect.width;
      }
      if (left < pad) left = pad;

      let top = rect.bottom + gap;
      const fitsBelow = top + bubbleRect.height <= vh - pad;
      const topAbove = rect.top - gap - bubbleRect.height;
      const fitsAbove = topAbove >= pad;

      if (!fitsBelow && fitsAbove) {
        top = topAbove;
      }

      setBubbleStyle({
        position: "fixed",
        left,
        top,
        zIndex: "var(--s7-z-tooltip, 290000)",
        ["--s7-tooltip-arrow-left"]: `${Math.min(Math.max(rect.left + 14 - left, 10), Math.max(bubbleRect.width - 18, 10))}px`,
      });
      return;
    }

    let left = rect.right - bubbleRect.width;
    if (left < pad) left = pad;
    if (left + bubbleRect.width > vw - pad) {
      left = vw - pad - bubbleRect.width;
    }

    let top = rect.top - gap - bubbleRect.height;
    if (top < pad) {
      top = rect.bottom + gap;
    }

    setBubbleStyle({
      position: "fixed",
      left,
      top,
      zIndex: "var(--s7-z-tooltip, 290000)",
      ["--s7-tooltip-arrow-left"]: `${Math.min(Math.max(rect.right - 14 - left, 10), Math.max(bubbleRect.width - 18, 10))}px`,
    });
  }, [gap, isBottomStart]);

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
        isBottomStart ? "s7-tooltip-portal__bubble--bottom-start" : "s7-tooltip-portal__bubble--top-start",
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
        className: [triggerClassName, children.props.className].filter(Boolean).join(" "),
        style: { ...(children.props.style || {}), ...style },
      })
    : children;

  return (
    <>
      <span
        ref={rootRef}
        className="s7-tooltip-portal-root"
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocusCapture={() => setActive(true)}
        onBlurCapture={(e) => {
          const next = /** @type {Node | null} */ (e.relatedTarget);
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

/** @param {HTMLElement | null} el */
function getRichTooltipClipRect(el) {
  if (typeof window === "undefined" || !el) {
    return { left: 8, right: 1000, top: 8, bottom: 800 };
  }
  const shell = el.closest(
    ".anuncios-sell-popover__panel--in-shell, .anuncios-sell-popover__panel, [role='dialog']",
  );
  if (shell instanceof HTMLElement) {
    const r = shell.getBoundingClientRect();
    const pad = 8;
    return {
      left: r.left + pad,
      right: r.right - pad,
      top: r.top + pad,
      bottom: r.bottom - pad,
    };
  }
  const pad = 12;
  return {
    left: pad,
    right: window.innerWidth - pad,
    top: pad,
    bottom: window.innerHeight - pad,
  };
}

/**
 * Painel rico: `position: fixed` no **document.body** (portal) + flip horizontal por clip.
 * Ancestors com `transform` (ex.: shell do Raio-x) quebram fixed+getBoundingClientRect no mesmo subtree;
 * portal alinha coordenadas de viewport com o containing block real do fixed.
 */
function S7TooltipRichPanel({ children, panelBody, offset, className, style }) {
  const rootRef = useRef(null);
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [touchOpen, setTouchOpen] = useState(false);
  const [hoverRich, setHoverRich] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [panelFixedStyle, setPanelFixedStyle] = useState(
    /** @type {import('react').CSSProperties} */ ({}),
  );

  const measure = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root) return;
    /** Âncora: botão/ícone (primeiro filho), não o wrapper que pode incluir o painel no layout em alguns casos */
    const anchorEl =
      root.firstElementChild instanceof HTMLElement ? root.firstElementChild : root;
    const trigger = anchorEl.getBoundingClientRect();
    const clip = getRichTooltipClipRect(root);
    const clipW = Math.max(0, clip.right - clip.left);
    /** Refino Raio-x: 68% do clip × 0,75 × 0,94 (−6% largura vs. ciclo anterior). */
    const richPanelWScale = 0.75 * 0.94;
    const targetWBase = Math.min(400, Math.max(288, Math.round(clipW * 0.68)));
    const targetW = Math.round(targetWBase * richPanelWScale);
    const measured =
      panel?.offsetWidth != null && panel.offsetWidth > 100 ? panel.offsetWidth : targetW;
    let w = Math.min(
      Math.round(400 * richPanelWScale),
      Math.max(Math.round(268 * richPanelWScale), measured),
    );
    /** Gap horizontal fixo e pequeno entre borda do ícone e borda do balão (px) */
    const hGap = Math.min(6, Math.max(2, Number(offset) || 4));

    const leftOpenEnd = trigger.right + hGap;
    const leftOpenStart = trigger.left - hGap - w;
    const fitsEnd = leftOpenEnd + w <= clip.right + 0.5;
    const fitsStart = leftOpenStart >= clip.left - 0.5;
    const spaceEnd = clip.right - trigger.right - hGap;
    const spaceStart = trigger.left - clip.left - hGap;
    const preferEnd = spaceEnd >= spaceStart;

    let left;

    if (fitsEnd && (preferEnd || !fitsStart)) {
      left = leftOpenEnd;
    } else if (fitsStart) {
      left = leftOpenStart;
    } else if (fitsEnd) {
      left = leftOpenEnd;
    } else {
      /** Não cabe em largura total: estreita o painel para caber à esquerda ou à direita sem clamp “solto” */
      const maxWFromEnd = clip.right - leftOpenEnd;
      const maxWFromStart = trigger.left - hGap - clip.left;
      const wFloor = Math.round(220 * richPanelWScale);
      const wNarrow = Math.floor(Math.max(wFloor, Math.min(w, maxWFromEnd, maxWFromStart)));
      w = wNarrow;
      const leftEndN = trigger.right + hGap;
      const leftStartN = trigger.left - hGap - w;
      if (leftEndN + w <= clip.right + 0.5 && (preferEnd || leftStartN < clip.left - 0.5)) {
        left = leftEndN;
      } else if (leftStartN >= clip.left - 0.5) {
        left = leftStartN;
      } else {
        left = leftEndN;
        w = Math.max(wFloor, Math.min(w, clip.right - leftEndN));
      }
    }

    const top = trigger.top + trigger.height / 2;
    setPanelFixedStyle({
      position: "fixed",
      left,
      top,
      width: w,
      maxWidth: w,
      zIndex: "var(--s7-z-tooltip, 290000)",
      transform: "translateY(-50%)",
    });
  }, [offset]);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const sync = () => setCoarsePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!coarsePointer || !touchOpen) return;
    const close = (e) => {
      const t = /** @type {Node | null} */ (e.target);
      if (t && rootRef.current?.contains(t)) return;
      if (t && panelRef.current?.contains(t)) return;
      setTouchOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [coarsePointer, touchOpen]);

  const active = hoverRich || touchOpen;
  useLayoutEffect(() => {
    if (!active) return;
    measure();
    const id = window.requestAnimationFrame(() => measure());
    return () => window.cancelAnimationFrame(id);
  }, [active, measure, panelBody, touchOpen]);

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

  const merged = [
    "s7-tooltip",
    "s7-tooltip--rich-panel",
    "s7-tooltip-trigger",
    coarsePointer && touchOpen ? "s7-tooltip--rich-open" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const panelEl =
    active && typeof document !== "undefined" ? (
      <div
        ref={panelRef}
        className="s7-tooltip-rich__panel s7-tooltip-rich__panel--portal s7-tooltip-rich__panel--open"
        role="tooltip"
        style={{ ...style, ...panelFixedStyle }}
        onMouseEnter={() => {
          setHoverRich(true);
          queueMicrotask(() => measure());
        }}
        onMouseLeave={(e) => {
          const rel = /** @type {Node | null} */ (e.relatedTarget);
          if (rel && rootRef.current?.contains(rel)) return;
          setHoverRich(false);
        }}
        onClick={(e) => {
          if (coarsePointer) e.stopPropagation();
        }}
      >
        {panelBody}
      </div>
    ) : null;

  return (
    <>
      <span
        ref={rootRef}
        className={merged}
        style={{ ...style, "--s7-tooltip-offset": `${offset}px` }}
        onMouseEnter={() => {
          setHoverRich(true);
          queueMicrotask(() => measure());
        }}
        onMouseLeave={(e) => {
          const rel = /** @type {Node | null} */ (e.relatedTarget);
          if (rel && panelRef.current?.contains(rel)) return;
          setHoverRich(false);
        }}
        onFocusCapture={() => {
          setHoverRich(true);
          queueMicrotask(() => measure());
        }}
        onBlurCapture={(e) => {
          const next = /** @type {Node | null} */ (e.relatedTarget);
          if (next && rootRef.current?.contains(next)) return;
          if (next && panelRef.current?.contains(next)) return;
          setHoverRich(false);
        }}
        onClick={(e) => {
          if (!coarsePointer) return;
          e.preventDefault();
          setTouchOpen((o) => !o);
        }}
      >
        {isValidElement(children) ? children : <span>{children}</span>}
      </span>
      {panelEl && createPortal(panelEl, document.body)}
    </>
  );
}
