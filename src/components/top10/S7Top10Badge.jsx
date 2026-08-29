// ======================================================================
// CPJ 4 — Badge Fogo & Troféu (arte homologada). Rank 1–10; fora → null.
// ======================================================================

import { useId, useMemo } from "react";
import S7Tooltip from "../ui/S7Tooltip";
import {
  buildTop10BadgeAriaLabel,
  buildTop10BadgeTooltip,
  parseTop10QuantitySold,
} from "../../features/top10/buildTop10QuantityRankLookup.js";
import "./S7Top10Badge.css";

/**
 * @param {{ rank: number }} props
 */
function S7Top10FireSvg() {
  return (
    <svg className="s7-top10-badge__fire" viewBox="0 0 64 76" aria-hidden="true">
      <g transform="translate(0, -42) scale(1.18)">
        <g className="s7-top10-badge__fire-body">
          <path
            d="M32 72C21 72 14 64.5 14.5 54c.3-6.4 3.3-10.1 5.8-13.9 2.5-3.7 3.5-7.4 2-12.8 4.6 2.5 7.4 6.2 8.4 10.3 2.6-3.8 3.9-8.6 2.4-14.7 8.2 6.9 11.8 15.4 9.7 23.9 3-2 4.5-4.8 4.7-8.5 5.6 6 5.5 14 2 20.7C46.6 67.8 40.3 72 32 72Z"
            fill="#ff3d00"
          />
          <path
            d="M19 55c-3.1-3.3-3.3-7.9-.8-11.7 1.1-1.8 2.8-3.4 3.7-5.8 2.6 3.1 3 6.8 1.5 10.2-1.1 2.7-2.2 5.1-4.4 7.3Z"
            fill="#ff6d00"
          />
          <path
            d="M45 55c3.1-3.3 3.3-7.9.8-11.7-1.1-1.8-2.8-3.4-3.7-5.8-2.6 3.1 3 6.8-1.5 10.2 1.1 2.7 2.2 5.1 4.4 7.3Z"
            fill="#ff6d00"
          />
        </g>

        <path
          className="s7-top10-badge__fire-inner"
          d="M32 69c-7.8 0-12.8-5.3-12.4-12.1.2-5.1 2.8-7.8 4.8-10.8 1.9-2.8 2.7-5.8 1.8-9.4 3.8 2.4 5.8 5.5 6.5 8.9 2.4-3 4-6.7 3.3-11.4 6.1 5.2 8.6 11.4 7 17.4 2-1.4 3.3-3.3 3.6-5.8 3.2 4.6 3.1 9.7.5 14.2C42.9 65.8 38.3 69 32 69Z"
          fill="#ffab00"
        />

        <path
          className="s7-top10-badge__fire-core"
          d="M32 69.5c-4.9 0-8.2-3.5-8.2-7.8 0-3.4 1.8-5.7 3.9-8 1.6-1.8 2.6-4 2.7-6.4 3.8 2.4 5.4 5.5 5.1 8.7 1.5-1.4 2.4-3 2.6-5.1 4.2 3.4 5.5 8.1 3 12.4-1.8 3.8-4.8 6.2-9.1 6.2Z"
          fill="#ffea00"
        />

        <path
          className="s7-top10-badge__spark"
          d="M18 31c-1.8-3.2.8-6.6 4.3-8.5-.6 3.2 1.7 4.6 1 6.8-.7 2.5-3.5 3.7-5.3 1.7Z"
          fill="#ffd600"
        />

        <path
          className="s7-top10-badge__spark"
          d="M45 26c1-3.1 3.6-5 6.8-5.8-1.4 2.4-.1 4.2-1.6 5.8-1.4 1.7-3.5 1.9-5.2 0Z"
          fill="#ffe500"
        />
      </g>
    </svg>
  );
}

/**
 * @param {{ rank: number; gradientId: string }} props
 */
function S7Top10TrophySvg({ rank, gradientId }) {
  return (
    <svg className="s7-top10-badge__trophy" viewBox="0 0 64 76" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--metal-light)" />
          <stop offset=".54" stopColor="var(--metal-main)" />
          <stop offset="1" stopColor="var(--metal-dark)" />
        </linearGradient>
      </defs>

      <path
        d="M16 27H9c0 11 5 17 14 18"
        fill="none"
        stroke="var(--metal-dark)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      <path
        d="M48 27h7c0 11-5 17-14 18"
        fill="none"
        stroke="var(--metal-dark)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      <path
        d="M16 19h32v14c0 13-6 23-16 23S16 46 16 33V19Z"
        fill={`url(#${gradientId})`}
        stroke="var(--metal-dark)"
        strokeWidth="2"
      />

      <path d="M28 55h8v7h-8z" fill="var(--metal-dark)" />

      <path
        d="M20 61h24l4 7H16l4-7Z"
        fill={`url(#${gradientId})`}
        stroke="var(--metal-dark)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <circle
        cx="32"
        cy="35"
        r="13.5"
        fill="var(--rank-bg)"
        stroke="var(--metal-dark)"
        strokeWidth="2.2"
      />

      <text
        x="32"
        y="40.8"
        textAnchor="middle"
        fontSize="17"
        fontWeight="900"
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="-0.5px"
        fill="var(--rank-color)"
      >
        {rank}
      </text>

      <path
        d="M20 22h24"
        stroke="rgba(255,255,255,.75)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * @param {{
 *   rank: number | null | undefined;
 *   size?: number;
 *   salesCount?: number | null;
 *   ariaLabel?: string | null;
 *   tooltip?: string | null;
 *   showTooltip?: boolean;
 *   className?: string;
 * }} props
 */
export default function S7Top10Badge({
  rank,
  size = 28,
  salesCount = null,
  ariaLabel = null,
  tooltip = null,
  showTooltip = true,
  className = "",
}) {
  const reactId = useId();
  const gradientId = useMemo(
    () => `s7-top10-metal-${String(reactId).replace(/:/g, "")}`,
    [reactId],
  );

  const numericRank = Number(rank);
  if (!Number.isInteger(numericRank) || numericRank < 1 || numericRank > 10) {
    return null;
  }

  const hasFire = numericRank <= 3;
  const defaultTip = buildTop10BadgeTooltip(numericRank, {
    mode: "last_30_days",
    salesCount,
  });
  const label =
    ariaLabel != null && String(ariaLabel).trim() !== ""
      ? String(ariaLabel).trim()
      : buildTop10BadgeAriaLabel(numericRank, { mode: "last_30_days", salesCount });
  const customTip =
    tooltip != null && String(tooltip).trim() !== "" ? String(tooltip).trim() : "";

  const qty = parseTop10QuantitySold(salesCount);
  /** Quantidade em verde (#16a34a — padrão de qty de vendas no SUSE7). */
  let tipContent = customTip || defaultTip;
  if (!customTip && qty != null) {
    const unit = qty === 1 ? "venda" : "vendas";
    tipContent = (
      <>
        {`${numericRank}º mais vendido nos últimos 30 dias — `}
        <span className="s7-top10-badge__tip-sales">
          {qty} {unit}
        </span>
      </>
    );
  }

  const badge = (
    <span
      className={["s7-top10-badge", className].filter(Boolean).join(" ")}
      data-rank={String(numericRank)}
      style={{ "--badge-size": `${size}px` }}
      role="img"
      aria-label={label}
    >
      {hasFire ? <S7Top10FireSvg /> : null}
      <S7Top10TrophySvg rank={numericRank} gradientId={gradientId} />
    </span>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <S7Tooltip content={tipContent} placement="top-start" offset={6} fitContent>
      {badge}
    </S7Tooltip>
  );
}

/**
 * Miniatura + selo Fogo & Troféu à direita, centro vertical.
 *
 * @param {{
 *   children: import("react").ReactNode;
 *   rank: number | null | undefined;
 *   size?: number;
 *   salesCount?: number | null;
 *   ariaLabel?: string | null;
 *   tooltip?: string | null;
 *   showTooltip?: boolean;
 *   className?: string;
 * }} props
 */
export function S7RankedThumbnail({
  children,
  rank,
  size = 28,
  salesCount = null,
  ariaLabel = null,
  tooltip = null,
  showTooltip = true,
  className = "",
}) {
  const numericRank = Number(rank);
  const showBadge = Number.isInteger(numericRank) && numericRank >= 1 && numericRank <= 10;

  if (!showBadge) {
    return children ?? null;
  }

  return (
    <span className={["s7-ranked-thumb", className].filter(Boolean).join(" ")}>
      <span className="s7-ranked-thumb__media">{children}</span>
      <span className="s7-ranked-thumb__badge">
        <S7Top10Badge
          rank={numericRank}
          size={size}
          salesCount={salesCount}
          ariaLabel={ariaLabel}
          tooltip={tooltip}
          showTooltip={showTooltip}
        />
      </span>
    </span>
  );
}
