// ======================================================================
// Popover premium reutilizável — lista + pódium (Top 10 Vendas / Dashboard Top 3).
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
import { useRankingTooltipCompany } from "./RankingTooltipCompanyProvider.jsx";
import { getTopRankingListingPopoverMeta, pickListingTitle } from "./salesTopRankingUtils";

const CLOSE_DELAY_MS = 150;
const PANEL_OFFSET = 8;

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
 * @param {{ meta: ReturnType<typeof getTopRankingListingPopoverMeta>; company?: { name: string; logoUrl: string; initial: string } | null }} props
 */
export function TopRankingListingPopoverPanel({ meta, company = null }) {
  return (
    <div className="sales-top-ranking__listing-popover__body">
      <div className="sales-top-ranking__listing-popover__content">
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
      </div>
      {company ? (
        <div className="sales-top-ranking__listing-popover__company-mark" aria-hidden="false">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="sales-top-ranking__listing-popover__company-logo" />
          ) : (
            <span className="sales-top-ranking__listing-popover__company-fallback" aria-label={company.name}>
              {company.initial}
            </span>
          )}
        </div>
      ) : null}
    </div>
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
 *   placement?: "bottom-start" | "top-start" | "left-center" | "right-center";
 * }} props
 */
export default function TopRankingListingPopover({
  item,
  fullTitle: fullTitleProp,
  listingId: listingIdProp,
  sku: skuProp,
  children,
  className = "",
  placement = "left-center",
}) {
  const companyLookup = useRankingTooltipCompany();

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

  const company = useMemo(() => {
    if (!item || typeof item !== "object") return null;
    return companyLookup.resolveCompanyForRankingItem(item);
  }, [companyLookup, item]);

  const rootRef = useRef(null);
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const closeTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(/** @type {import("react").CSSProperties} */ ({}));

  const isBottomStart = placement === "bottom-start";
  const isTopStart = placement === "top-start";
  const isLeftCenter = placement === "left-center";
  const isRightCenter = placement === "right-center";

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
    const gap = PANEL_OFFSET;

    const panelW = Math.min(bubbleRect.width, vw - pad * 2);
    const panelH = Math.min(bubbleRect.height, vh - pad * 2);

    let left = rect.left;
    let top = rect.top;

    if (isLeftCenter) {
      left = rect.left - gap - panelW;
      const fitsLeft = left >= pad;
      const rightCandidate = rect.right + gap;
      const fitsRight = rightCandidate + panelW <= vw - pad;
      if (!fitsLeft && fitsRight) {
        left = rightCandidate;
      } else if (!fitsLeft) {
        left = Math.max(pad, rect.left - gap - panelW);
      }
      top = rect.top + rect.height / 2 - panelH / 2;
    } else if (isRightCenter) {
      left = rect.right + gap;
      const fitsRight = left + panelW <= vw - pad;
      const leftCandidate = rect.left - gap - panelW;
      const fitsLeft = leftCandidate >= pad;
      if (!fitsRight && fitsLeft) {
        left = leftCandidate;
      } else if (!fitsRight) {
        left = Math.max(pad, vw - pad - panelW);
      }
      top = rect.top + rect.height / 2 - panelH / 2;
    } else if (isBottomStart) {
      left = rect.left;
      if (left + panelW > vw - pad) left = vw - pad - panelW;
      if (left < pad) left = pad;
      top = rect.bottom + gap;
      const fitsBelow = top + panelH <= vh - pad;
      const topAbove = rect.top - gap - panelH;
      if (!fitsBelow && topAbove >= pad) top = topAbove;
    } else if (isTopStart) {
      left = rect.right - panelW;
      if (left < pad) left = pad;
      if (left + panelW > vw - pad) left = vw - pad - panelW;
      top = rect.top - gap - panelH;
      if (top < pad) top = rect.bottom + gap;
    }

    if (top + panelH > vh - pad) top = Math.max(pad, vh - pad - panelH);
    if (top < pad) top = pad;

    setPanelStyle({
      position: "fixed",
      left,
      top,
      maxHeight: `${vh - pad * 2}px`,
      zIndex: "var(--s7-z-tooltip, 290000)",
    });
  }, [isBottomStart, isLeftCenter, isRightCenter, isTopStart]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const id = window.requestAnimationFrame(() => measure());
    return () => window.cancelAnimationFrame(id);
  }, [open, meta.fullTitle, company?.id, measure]);

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
        className={[
          "sales-top-ranking__listing-popover",
          isLeftCenter ? "sales-top-ranking__listing-popover--left-center" : "",
          isRightCenter ? "sales-top-ranking__listing-popover--right-center" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="tooltip"
        style={panelStyle}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <TopRankingListingPopoverPanel meta={meta} company={company} />
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
        onMouseLeave={scheduleClose}
        onFocusCapture={openNow}
        onBlurCapture={scheduleClose}
      >
        {trigger}
      </span>
      {panelEl && createPortal(panelEl, document.body)}
    </>
  );
}
