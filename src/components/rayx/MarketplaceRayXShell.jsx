// ======================================================
// Shell visual Raio-x multi-marketplace (laterais + selo do canal).
// ======================================================

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getMarketplaceTheme, getMarketplaceThemeCssVars } from "../../theme/marketplaceTheme.js";
import {
  RAIOX_PORTAL_SHELL_CLASS,
  buildRayxPortalShellPlacementStyle,
  measureRayxPortalShellMetrics,
} from "./rayxPortalLayout.js";
import "../Anuncios.css";

const RAYX_Z = 200110;

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   marketplace?: string | null;
 *   children: import("react").ReactNode;
 *   ariaLabelledBy?: string;
 *   maxWidth?: number;
 *   shellClassName?: string;
 * }} props
 */
export default function MarketplaceRayXShell({
  open,
  onClose,
  marketplace,
  children,
  ariaLabelledBy,
  maxWidth = 960,
  shellClassName = "",
}) {
  const theme = getMarketplaceTheme(marketplace);

  const [shellMetrics, setShellMetrics] = useState(() => {
    if (typeof window === "undefined") return { height: 800, centerYOffset: 0 };
    const metrics = measureRayxPortalShellMetrics(window.innerHeight);
    return { height: metrics.height, centerYOffset: metrics.centerYOffset };
  });

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const commitShellMetrics = () => {
      const metrics = measureRayxPortalShellMetrics(window.innerHeight);
      setShellMetrics({ height: metrics.height, centerYOffset: metrics.centerYOffset });
    };
    commitShellMetrics();
    window.addEventListener("resize", commitShellMetrics);
    return () => window.removeEventListener("resize", commitShellMetrics);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const shellWidth = Math.min(maxWidth, typeof window !== "undefined" ? window.innerWidth - 24 : maxWidth);

  return createPortal(
    <>
      <div
        className="anuncios-pricing-modal__backdrop"
        style={{ zIndex: RAYX_Z - 1 }}
        aria-hidden
        onClick={onClose}
      />
      <div
        className={[
          RAIOX_PORTAL_SHELL_CLASS,
          "anuncios-raiox-shell",
          "anuncios-raiox-shell--portal",
          "anuncios-raiox-shell--open",
          "anuncios-pricing-modal__shell",
          "anuncios-pricing-modal__shell--compare-fill",
          shellClassName,
          theme.shellModifierClass,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          ...buildRayxPortalShellPlacementStyle({
            width: shellWidth,
            height: shellMetrics.height,
            centerYOffset: shellMetrics.centerYOffset,
            fixedHeight: true,
          }),
          zIndex: RAYX_Z,
          ...getMarketplaceThemeCssVars(theme),
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
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
        {children}
      </div>
    </>,
    document.body,
  );
}
