// ======================================================================
// Card base com pizza cortada — Central de Saúde da Precificação (somente renderização).
// ======================================================================

import { useMemo, useState } from "react";
import PricingHealthPieCenter, {
  resolvePricingHealthPieSegmentState,
} from "./PricingHealthPieCenter.jsx";
import ExecutiveCardEmptyState from "../../../components/sales/ExecutiveCardEmptyState.jsx";
import "./PricingHealthCenter.css";

const SLICE_GAP_DEG = 1.4;

const PIE_LAYOUT = {
  viewW: 196,
  viewH: 196,
  cx: 98,
  cy: 98,
  radius: 88,
};

/** @param {unknown} value */
function formatCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("pt-BR");
}

/** @param {unknown} value */
function readCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** @param {unknown} value */
function formatPercentFromBackend(value) {
  const n = Number(String(value ?? "0").replace(",", "."));
  if (!Number.isFinite(n)) return "0,00%";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** @param {number} count */
function formatListingsLabel(count) {
  const safeCount = Math.max(0, count);
  return safeCount === 1 ? "1 anúncio" : `${formatCount(safeCount)} anúncios`;
}

/** @param {number} cx @param {number} cy @param {number} r @param {number} deg */
function polarPoint(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * @param {number} cx @param {number} cy @param {number} r
 * @param {number} startDeg @param {number} endDeg
 */
function describePieSegment(cx, cy, r, startDeg, endDeg) {
  const start = polarPoint(cx, cy, r, startDeg);
  const end = polarPoint(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${cx.toFixed(2)} ${cy.toFixed(2)}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

/** @param {Record<string, unknown>} segment */
function readSegmentPercent(segment) {
  const n = Number(String(segment.mix_share_percent ?? "0").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * @param {Array<Record<string, unknown>>} segments
 */
function buildSlicedSegmentLayouts(segments) {
  let cursor = -90;
  /** @type {Array<{ segment: Record<string, unknown>; startDeg: number; endDeg: number }>} */
  const layouts = [];

  const visibleSegments = segments.filter((segment) => readSegmentPercent(segment) > 0);
  const hasMultiple = visibleSegments.length > 1;

  for (const segment of visibleSegments) {
    const pct = readSegmentPercent(segment);
    const fullSweep = pct * 3.6;
    const gap = hasMultiple ? SLICE_GAP_DEG : 0;
    const sweep = Math.max(0.5, fullSweep - gap);
    const startDeg = cursor + gap / 2;
    const endDeg = startDeg + sweep;
    layouts.push({ segment, startDeg, endDeg });
    cursor = endDeg + gap / 2;
  }

  return layouts;
}

/**
 * @param {Array<Record<string, unknown>>} buckets
 * @param {readonly string[]} order
 */
function sortBuckets(buckets, order) {
  return [...buckets].sort((a, b) => {
    const idxA = order.indexOf(String(a.key ?? ""));
    const idxB = order.indexOf(String(b.key ?? ""));
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
}

/**
 * @param {{
 *   segmentLayouts: ReturnType<typeof buildSlicedSegmentLayouts>;
 *   activeKey: string | null;
 *   centerLabel?: string | null;
 *   centerAccentColor?: string | null;
 *   onSegmentHover: (key: string | null) => void;
 *   cardClassSuffix?: string;
 * }} props
 */
function PricingHealthSlicedPieSvg({
  segmentLayouts,
  activeKey,
  centerLabel = null,
  centerAccentColor = null,
  onSegmentHover,
  cardClassSuffix = "",
}) {
  const { viewW, viewH, cx, cy, radius } = PIE_LAYOUT;
  const segmentStates = resolvePricingHealthPieSegmentState(activeKey, segmentLayouts);

  return (
    <svg
      className={[
        "s7-pricing-health-center__pie-svg",
        cardClassSuffix ? `s7-pricing-health-center__pie-svg--${cardClassSuffix}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
      viewBox={`0 0 ${viewW} ${viewH}`}
      role="presentation"
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={radius + 1} className="s7-pricing-health-center__pie-bg" />

      {segmentStates.map(({ key, segment, startDeg, endDeg, isActive, isHidden }) => {
        if (isHidden) return null;
        const color = String(segment.chart_color ?? "#64748b");

        return (
          <path
            key={key}
            d={describePieSegment(cx, cy, radius, startDeg, endDeg)}
            fill={color}
            stroke="#fff"
            strokeWidth="2"
            strokeLinejoin="round"
            className={[
              "s7-pricing-health-center__pie-segment",
              "s7-pricing-health-center__pie-segment--sliced",
              cardClassSuffix ? `s7-pricing-health-center__pie-segment--${cardClassSuffix}-${key}` : "",
              isActive ? "s7-pricing-health-center__pie-segment--active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onMouseEnter={() => onSegmentHover(key)}
            onMouseLeave={() => onSegmentHover(null)}
            onFocus={() => onSegmentHover(key)}
            onBlur={() => onSegmentHover(null)}
          />
        );
      })}

      <PricingHealthPieCenter
        cx={cx}
        cy={cy}
        label={centerLabel}
        accentColor={centerAccentColor}
      />
    </svg>
  );
}

/** @param {Record<string, unknown>} bucket */
function readBucketCount(bucket) {
  return readCount(bucket.listings_count ?? bucket.count);
}

/**
 * @param {{
 *   bucket: Record<string, unknown>;
 *   badgeLabel: string;
 *   isActive: boolean;
 *   isDimmed: boolean;
 *   onHoverStart: () => void;
 *   onHoverEnd: () => void;
 *   line1: string;
 *   line2: string;
 *   cardClassSuffix?: string;
 * }} props
 */
function PricingHealthSidePill({
  bucket,
  badgeLabel,
  isActive,
  isDimmed,
  onHoverStart,
  onHoverEnd,
  line1,
  line2,
  cardClassSuffix = "",
}) {
  const key = String(bucket.key ?? "");
  const color = String(bucket.chart_color ?? "#64748b");

  return (
    <div
      className={[
        "s7-pricing-health-center__side-pill",
        cardClassSuffix ? `s7-pricing-health-center__side-pill--${cardClassSuffix}` : "",
        `s7-pricing-health-center__side-pill--${key}`,
        isActive ? "s7-pricing-health-center__side-pill--active" : "",
        isDimmed ? "s7-pricing-health-center__side-pill--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderColor: color, "--s7-pricing-accent": color }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      tabIndex={0}
      role="group"
      aria-label={`${badgeLabel}. ${line1}. ${line2}`}
    >
      <span className="s7-pricing-health-center__side-pill-badge" style={{ color }}>
        {badgeLabel}
      </span>
      <div className="s7-pricing-health-center__side-pill-copy">
        <p className="s7-pricing-health-center__side-pill-line s7-pricing-health-center__side-pill-line--top">
          {line1}
        </p>
        <p className="s7-pricing-health-center__side-pill-line s7-pricing-health-center__side-pill-line--bottom">
          {line2}
        </p>
      </div>
    </div>
  );
}

/** @param {{ title: string; children: import("react").ReactNode }} props */
function HealthMainCard({ title, children }) {
  return (
    <div className="s7-dashboard-large-card-stack s7-pricing-health-center__main-card-stack">
      <h3 className="s7-dashboard-large-card-head s7-pricing-health-center__main-card-head">{title}</h3>
      <article className="s7-dashboard-large-card s7-pricing-health-center__main-card">{children}</article>
    </div>
  );
}

/**
 * @param {{
 *   totalListings: number;
 *   cardData: Record<string, unknown>;
 * }} props
 */
function HealthCardHeaderLine({ totalListings, cardData }) {
  const total = readCount(cardData.total_listings ?? totalListings);
  return (
    <p className="s7-pricing-health-center__health-podium-total">
      Total de anúncios: {formatCount(total)}
    </p>
  );
}

/**
 * @param {{
 *   cardData: Record<string, unknown>;
 *   totalListings: number;
 *   bucketOrder: readonly string[];
 *   cardClassSuffix: string;
 *   buildBucketLines: (bucket: Record<string, unknown>) => { line1: string; line2: string };
 *   hasDataOverride?: boolean;
 *   emptyMessage?: string;
 *   compactPills?: boolean;
 * }} props
 */
export default function PricingHealthSlicedPieCard({
  cardData,
  totalListings,
  bucketOrder,
  cardClassSuffix,
  buildBucketLines,
  hasDataOverride,
  emptyMessage = "Nenhum anúncio analisado.",
  compactPills = false,
}) {
  const title = String(cardData.title ?? "");
  const chart =
    cardData.chart != null && typeof cardData.chart === "object"
      ? /** @type {Record<string, unknown>} */ (cardData.chart)
      : {};
  const buckets = Array.isArray(cardData.buckets) ? cardData.buckets : [];
  const orderedBuckets = sortBuckets(buckets, bucketOrder);
  const chartSegments = Array.isArray(chart.segments) ? chart.segments : [];
  const segmentLayouts = buildSlicedSegmentLayouts(chartSegments);
  const hasData =
    hasDataOverride != null
      ? hasDataOverride
      : readCount(cardData.total_listings ?? totalListings) > 0;
  const [activeBandKey, setActiveBandKey] = useState(/** @type {string | null} */ (null));

  const pieCenter = useMemo(() => {
    if (!activeBandKey) return { label: null, accentColor: null };
    const index = orderedBuckets.findIndex((row) => String(row.key ?? "") === activeBandKey);
    if (index < 0) return { label: null, accentColor: null };
    const bucket = orderedBuckets[index];
    return {
      label: formatCount(readBucketCount(bucket)),
      accentColor: String(bucket.chart_color ?? "#64748b"),
    };
  }, [activeBandKey, orderedBuckets]);

  const ariaSegments = orderedBuckets
    .map((bucket) => {
      const lines = buildBucketLines(bucket);
      return `${formatCount(readBucketCount(bucket))}. ${lines.line1}. ${lines.line2}`;
    })
    .join("; ");

  return (
    <HealthMainCard title={title}>
      <div
        className={[
          "s7-pricing-health-center__main-card-body",
          cardClassSuffix ? `s7-pricing-health-center__main-card-body--${cardClassSuffix}` : "",
          compactPills ? "s7-pricing-health-center__main-card-body--compact-pills" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <HealthCardHeaderLine totalListings={totalListings} cardData={cardData} />
        {!hasData ? (
          <ExecutiveCardEmptyState message={emptyMessage} />
        ) : (
          <div
            className="s7-pricing-health-center__split"
            role="img"
            aria-label={ariaSegments ? `${title} — ${ariaSegments}` : title}
          >
            <div className="s7-pricing-health-center__split__chart">
              <PricingHealthSlicedPieSvg
                segmentLayouts={segmentLayouts}
                activeKey={activeBandKey}
                centerLabel={pieCenter.label}
                centerAccentColor={pieCenter.accentColor}
                onSegmentHover={setActiveBandKey}
                cardClassSuffix={cardClassSuffix}
              />
            </div>
            <div className="s7-pricing-health-center__split__labels">
              {orderedBuckets.map((bucket) => {
                const bucketKey = String(bucket.key ?? "");
                const lines = buildBucketLines(bucket);
                return (
                  <PricingHealthSidePill
                    key={bucketKey}
                    bucket={bucket}
                    badgeLabel={formatCount(readBucketCount(bucket))}
                    isActive={activeBandKey === bucketKey}
                    isDimmed={activeBandKey != null && activeBandKey !== bucketKey}
                    onHoverStart={() => setActiveBandKey(bucketKey)}
                    onHoverEnd={() => setActiveBandKey(null)}
                    line1={lines.line1}
                    line2={lines.line2}
                    cardClassSuffix={cardClassSuffix}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </HealthMainCard>
  );
}

export { formatCount, formatPercentFromBackend, formatListingsLabel, readCount };

/** @param {Record<string, unknown>} bucket */
export function buildStandardBucketLines(bucket) {
  const status = String(bucket.label ?? "").trim();
  return {
    line1: status,
    line2: `${formatPercentFromBackend(bucket.share_percent ?? bucket.mix_share_percent)} do total`,
  };
}
