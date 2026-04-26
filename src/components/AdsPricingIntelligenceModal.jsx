// ======================================================
// Modal “Precificação inteligente” — shell + posicionamento (conteúdo: PricingIntelligenceContent).
// ======================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getMarketplaceTheme, getMarketplaceThemeCssVars } from "../theme/marketplaceTheme.js";
import { PricingIntelligenceContent } from "./PricingIntelligenceContent.jsx";

const ADS_PRICING_MODAL_W = 720;
const ADS_PRICING_MODAL_W_ML_COMPARE = 960;
const ADS_PRICING_MODAL_MAX_H = 820;
const ADS_PRICING_MODAL_COMPARE_MARGIN_PX = 20;
const ADS_PRICING_Z = 200110;

function getRaioxPopoverViewportInsets() {
  const edge = 12;
  const gapBelowNav = 8;
  let top = edge;
  let bottom = edge;
  if (typeof document === "undefined") return { top, bottom };
  const nav = document.querySelector(".navbar-premium");
  if (nav) {
    const nb = nav.getBoundingClientRect().bottom;
    if (Number.isFinite(nb) && nb > 0) top = Math.max(top, nb + gapBelowNav);
  } else {
    top = Math.max(top, 72);
  }
  try {
    const tEnv = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-top)") || "0",
    );
    const bEnv = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-bottom)") || "0",
    );
    if (Number.isFinite(tEnv) && tEnv > 0) top = Math.max(top, tEnv + edge);
    if (Number.isFinite(bEnv) && bEnv > 0) bottom = Math.max(bottom, bEnv + edge);
  } catch {
    /* ignore */
  }
  return { top, bottom };
}

/**
 * @param {{
 *   row: Record<string, unknown>;
 *   open: boolean;
 *   anchorRef: React.MutableRefObject<HTMLElement | null>;
 *   onClose: () => void;
 *   onApplied?: () => void | Promise<void>;
 * }} props
 */
export default function AdsPricingIntelligenceModal({ row, open, anchorRef, onClose, onApplied }) {
  const shellRef = useRef(null);
  const panelRef = useRef(null);
  /** Largura “compare fill” vem do filho sem re-render (evita setState em effect ao fechar). */
  const wideMlCompareRef = useRef(false);

  const [geom, setGeom] = useState({
    left: 0,
    top: 0,
    maxW: ADS_PRICING_MODAL_W,
    maxH: ADS_PRICING_MODAL_MAX_H,
    arrowTopPx: 24,
    centeredFill: false,
  });
  const [caretTrailing, setCaretTrailing] = useState(false);

  const theme = getMarketplaceTheme(row.marketplaceRaw || row.marketplaceSlug);

  const commitPosition = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { top: topInset, bottom: bottomInset } = getRaioxPopoverViewportInsets();
    const bottomPad = bottomInset + 96;
    const margin = 12;

    if (wideMlCompareRef.current) {
      const m = ADS_PRICING_MODAL_COMPARE_MARGIN_PX;
      const maxW = Math.max(ADS_PRICING_MODAL_W_ML_COMPARE, vw - 2 * m);
      const maxH = vh - topInset - bottomPad;
      setCaretTrailing(false);
      setGeom({
        left: 0,
        top: 0,
        maxW,
        maxH,
        arrowTopPx: 24,
        centeredFill: true,
      });
      return;
    }

    const trig = anchorRef.current;
    if (!trig) return;
    const r = trig.getBoundingClientRect();
    const gap = 10;
    const capW = ADS_PRICING_MODAL_W;
    const maxW = Math.min(capW, vw - 2 * margin);
    const panelEl = panelRef.current;
    const estW = panelEl && panelEl.getBoundingClientRect().width > 40 ? panelEl.getBoundingClientRect().width : maxW;

    let left;
    let trailing = false;
    const leftPreferred = r.left - gap - estW;
    if (leftPreferred >= margin) {
      left = leftPreferred;
      trailing = true;
    } else {
      left = r.right + gap;
      if (left + estW > vw - margin) left = Math.max(margin, vw - margin - estW);
      trailing = false;
    }

    const maxH = Math.min(ADS_PRICING_MODAL_MAX_H, vh - topInset - bottomPad);
    let panelH = maxH;
    if (panelEl) {
      const rect = panelEl.getBoundingClientRect();
      const hScroll = panelEl.scrollHeight;
      const h = Number.isFinite(hScroll) && hScroll > 0 ? Math.max(rect.height, hScroll) : rect.height;
      if (Number.isFinite(h) && h > 32) panelH = Math.min(h, maxH);
    }
    const iconCy = r.top + r.height / 2;
    let top = iconCy - panelH / 2 - 120;
    const bottomReserve = panelH + 48;
    top = Math.min(Math.max(top, topInset), vh - bottomPad - bottomReserve);
    const arrowTopPx = Math.max(14, Math.min(panelH - 14, iconCy - top));
    setCaretTrailing(trailing);
    setGeom({ left, top, maxW, maxH, arrowTopPx, centeredFill: false });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => requestAnimationFrame(commitPosition));
  }, [open, commitPosition]);

  useEffect(() => {
    if (!open) return;
    const run = () => commitPosition();
    window.addEventListener("resize", run);
    window.addEventListener("scroll", run, true);
    let ro = null;
    const id = window.setTimeout(() => {
      const el = panelRef.current;
      if (el && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(run);
        ro.observe(el);
      }
    }, 50);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", run);
      window.removeEventListener("scroll", run, true);
      ro?.disconnect();
    };
  }, [open, commitPosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => requestAnimationFrame(commitPosition));
  }, [open, commitPosition]);

  const handleMlCompareWideChange = useCallback(
    (wide) => {
      wideMlCompareRef.current = wide;
      requestAnimationFrame(() => commitPosition());
    },
    [commitPosition],
  );

  if (!open || typeof document === "undefined") return null;

  const panelStyle = {
    ["--raiox-caret-top"]: `${geom.arrowTopPx}px`,
    maxHeight: geom.maxH,
    ...(geom.centeredFill ? { height: "100%", overflow: "hidden" } : {}),
  };

  return createPortal(
    <>
      <div
        className="anuncios-pricing-modal__backdrop"
        style={{ zIndex: ADS_PRICING_Z - 1 }}
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={shellRef}
        className={[
          "anuncios-raiox-shell",
          "anuncios-raiox-shell--portal",
          "anuncios-raiox-shell--open",
          "anuncios-pricing-modal__shell",
          geom.centeredFill ? "anuncios-pricing-modal__shell--compare-fill" : "",
          theme.shellModifierClass,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          ...(geom.centeredFill
            ? {
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: geom.maxW,
                maxWidth: geom.maxW,
                height: geom.maxH,
                maxHeight: geom.maxH,
              }
            : {
                left: geom.left,
                top: geom.top,
                width: geom.maxW,
                maxWidth: geom.maxW,
                maxHeight: geom.maxH,
              }),
          zIndex: ADS_PRICING_Z,
          ...getMarketplaceThemeCssVars(theme),
        }}
      >
        <div className="anuncios-raiox-shell__frame" aria-hidden />
        {theme.logoSrc ? (
          <div className="anuncios-raiox-shell__badge">
            <img
              src={theme.logoSrc}
              alt={theme.logoAlt ?? ""}
              loading="lazy"
              decoding="async"
              className="anuncios-raiox-shell__badge-img"
            />
          </div>
        ) : (
          <div className="anuncios-raiox-shell__badge anuncios-raiox-shell__badge--text">
            <span className="anuncios-raiox-shell__badge-fallback">{theme.displayName}</span>
          </div>
        )}
        <PricingIntelligenceContent
          ref={panelRef}
          row={row}
          active={open}
          variant="modal"
          onClose={onClose}
          onApplied={onApplied}
          caretTrailing={caretTrailing}
          panelStyle={panelStyle}
          onMlCompareWideChange={handleMlCompareWideChange}
        />
      </div>
    </>,
    document.body,
  );
}
