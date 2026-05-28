// ======================================================================
// Popover premium reutilizável — lista + pódium (Top 10 Vendas).
// ======================================================================

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton";
import { getTopRankingListingPopoverMeta, pickListingTitle } from "./salesTopRankingUtils";

const CLOSE_DELAY_MS = 150;
const PANEL_OFFSET = 6;

/**
 * @param {{
 *   displayValue: string;
 *   copyValue: string;
 *   canCopy: boolean;
 *   flashKey: string;
 *   ariaLabel: string;
 *   toastLabel: string;
 *   toastEventType: string;
 *   toastFailEventType: string;
 * }} props
 */
function TopRankingPopoverCopyControl({
  displayValue,
  copyValue,
  canCopy,
  flashKey,
  ariaLabel,
  toastLabel,
  toastEventType,
  toastFailEventType,
}) {
  return (
    <span
      className={[
        "s7-copy-group",
        "sales-top-ranking__listing-popover__inline-copy",
        canCopy ? "" : "sales-top-ranking__listing-popover__inline-copy--disabled",
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="sales-top-ranking__listing-popover__inline-value">{displayValue}</span>
      {canCopy ? (
        <S7CopyButton
          value={copyValue}
          ariaLabel={ariaLabel}
          tooltipText={ariaLabel}
          toastLabel={toastLabel}
          showToast={true}
          iconMode="unicode"
          flashMs={S7_COPY_OFFICIAL_FLASH_MS}
          flashKey={flashKey}
          toastEventType={toastEventType}
          toastFailEventType={toastFailEventType}
          toastEntityType="marketplace_listing"
        />
      ) : (
        <button
          type="button"
          className="products-catalog__copy-btn s7-copy-btn s7-copy-btn--unicode"
          disabled
          aria-disabled="true"
          aria-label={`${ariaLabel} (indisponível)`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="s7-copy-btn__glyph" aria-hidden="true">
            ⧉
          </span>
        </button>
      )}
    </span>
  );
}

/**
 * @param {{ meta: ReturnType<typeof getTopRankingListingPopoverMeta> }} props
 */
export function TopRankingListingPopoverPanel({ meta }) {
  return (
    <>
      <p className="sales-top-ranking__listing-popover__title">{meta.fullTitle}</p>
      <p className="sales-top-ranking__listing-popover__meta-line">
        <span className="sales-top-ranking__listing-popover__meta-group">
          <span className="sales-top-ranking__listing-popover__meta-label">Anúncio:</span>
          <TopRankingPopoverCopyControl
            displayValue={meta.listingIdDisplay}
            copyValue={meta.listingId}
            canCopy={meta.canCopyListingId}
            flashKey={`top-rank-listing-${meta.listingId || meta.fullTitle}`}
            ariaLabel="Copiar número do anúncio"
            toastLabel="Nº do anúncio"
            toastEventType="LISTING_ID_COPIED"
            toastFailEventType="LISTING_ID_COPY_FAILED"
          />
        </span>
        <span className="sales-top-ranking__listing-popover__meta-sep" aria-hidden>
          |
        </span>
        <span className="sales-top-ranking__listing-popover__meta-group">
          <span className="sales-top-ranking__listing-popover__meta-label">SKU:</span>
          <TopRankingPopoverCopyControl
            displayValue={meta.skuDisplay}
            copyValue={meta.sku}
            canCopy={meta.canCopySku}
            flashKey={`top-rank-sku-${meta.sku || meta.listingId || meta.fullTitle}`}
            ariaLabel="Copiar SKU"
            toastLabel="SKU"
            toastEventType="LISTING_SKU_COPIED"
            toastFailEventType="LISTING_SKU_COPY_FAILED"
          />
        </span>
      </p>
    </>
  );
}

/**
 * @param {{
 *   item?: Record<string, unknown>;
 *   fullTitle?: string;
 *   listingId?: string;
 *   sku?: string;
 *   children?: import("react").ReactNode;
 *   className?: string;
 *   placement?: "bottom-start" | "top-start";
 * }} props
 */
export default function TopRankingListingPopover({
  item,
  fullTitle: fullTitleProp,
  listingId: listingIdProp,
  sku: skuProp,
  children,
  className = "",
  placement = "bottom-start",
}) {
  const meta = useMemo(() => {
    if (item && typeof item === "object") {
      return getTopRankingListingPopoverMeta(item);
    }
    const title =
      fullTitleProp != null && String(fullTitleProp).trim() !== ""
        ? String(fullTitleProp).trim()
        : pickListingTitle({});
    const listingId = listingIdProp != null ? String(listingIdProp).trim() : "";
    const sku = skuProp != null ? String(skuProp).trim() : "";
    return {
      fullTitle: title,
      listingId,
      sku,
      listingIdDisplay: listingId || "não informado",
      skuDisplay: sku || "não informado",
      canCopyListingId: listingId !== "",
      canCopySku: sku !== "",
    };
  }, [item, fullTitleProp, listingIdProp, skuProp]);

  const rootRef = useRef(null);
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const closeTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(/** @type {import("react").CSSProperties} */ ({}));

  const isBottomStart = placement === "bottom-start";

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const openNow = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    const anchor = root.firstElementChild instanceof HTMLElement ? root.firstElementChild : root;
    const rect = anchor.getBoundingClientRect();
    const bubbleRect = panel.getBoundingClientRect();
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const panelW = Math.min(bubbleRect.width, vw - pad * 2);
    const panelH = Math.min(bubbleRect.height, vh - pad * 2);

    let left = rect.left;
    if (left + panelW > vw - pad) {
      left = vw - pad - panelW;
    }
    if (left < pad) left = pad;

    let top;
    if (isBottomStart) {
      top = rect.bottom + PANEL_OFFSET;
      const fitsBelow = top + panelH <= vh - pad;
      const topAbove = rect.top - PANEL_OFFSET - panelH;
      if (!fitsBelow && topAbove >= pad) {
        top = topAbove;
      }
    } else {
      top = rect.top - PANEL_OFFSET - panelH;
      if (top < pad) {
        top = rect.bottom + PANEL_OFFSET;
      }
    }

    if (top + panelH > vh - pad) {
      top = Math.max(pad, vh - pad - panelH);
    }
    if (top < pad) top = pad;

    setPanelStyle({
      position: "fixed",
      left,
      top,
      maxHeight: `${vh - pad * 2}px`,
      zIndex: "var(--s7-z-tooltip, 290000)",
    });
  }, [isBottomStart]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const id = window.requestAnimationFrame(() => measure());
    return () => window.cancelAnimationFrame(id);
  }, [open, meta.fullTitle, measure]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => measure();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, measure]);

  const defaultTrigger = (
    <p
      className={`sales-top-ranking__title-text sales-top-ranking__title-text--list ${className}`.trim()}
      aria-label={meta.fullTitle}
    >
      {meta.fullTitle}
    </p>
  );

  const trigger = children
    ? isValidElement(children)
      ? cloneElement(children, {
          className: [children.props.className, className].filter(Boolean).join(" "),
          "aria-label": children.props["aria-label"] ?? meta.fullTitle,
        })
      : children
    : defaultTrigger;

  const panelEl =
    open && typeof document !== "undefined" ? (
      <div
        ref={panelRef}
        className="sales-top-ranking__listing-popover"
        role="tooltip"
        style={panelStyle}
        onMouseEnter={openNow}
        onMouseLeave={(e) => {
          const rel = /** @type {Node | null} */ (e.relatedTarget);
          if (rel && rootRef.current?.contains(rel)) return;
          scheduleClose();
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <TopRankingListingPopoverPanel meta={meta} />
      </div>
    ) : null;

  return (
    <>
      <span
        ref={rootRef}
        className={[
          "sales-top-ranking__listing-popover-root",
          children ? "sales-top-ranking__listing-popover-root--custom" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onMouseEnter={openNow}
        onMouseLeave={(e) => {
          const rel = /** @type {Node | null} */ (e.relatedTarget);
          if (rel && panelRef.current?.contains(rel)) return;
          scheduleClose();
        }}
        onFocusCapture={openNow}
      >
        {trigger}
      </span>
      {panelEl && createPortal(panelEl, document.body)}
    </>
  );
}
