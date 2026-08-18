// ======================================================================
// Card base com pizza — Central de Saúde da Concorrência (somente renderização).
// ======================================================================

import { useMemo, useState } from "react";
import CompetitionHealthPieCenter, {
  resolveCompetitionHealthPieSegmentState,
} from "./CompetitionHealthPieCenter.jsx";
import "./CompetitionHealthCenter.css";

const COMPETITION_HEALTH_ALERT_CORAL = "#e8a4a4";
const ALERT_BUCKET_KEYS = new Set(["no_competitors", "more_expensive"]);

/** @param {Record<string, unknown>} segment */
function resolveSegmentColor(segment) {
  const key = String(segment.key ?? "");
  if (ALERT_BUCKET_KEYS.has(key)) return COMPETITION_HEALTH_ALERT_CORAL;
  return String(segment.chart_color ?? "#64748b");
}

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

/** @param {number} count */
function formatCompetitorsLabel(count) {
  const safeCount = Math.max(0, count);
  return safeCount === 1 ? "1 concorrente" : `${formatCount(safeCount)} concorrentes`;
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
function buildSegmentLayouts(segments) {
  let cursor = -90;
  /** @type {Array<{ segment: Record<string, unknown>; startDeg: number; endDeg: number }>} */
  const layouts = [];

  for (const segment of segments) {
    const pct = readSegmentPercent(segment);
    if (pct <= 0) continue;
    const sweep = pct * 3.6;
    const startDeg = cursor;
    const endDeg = cursor + sweep;
    layouts.push({ segment, startDeg, endDeg });
    cursor = endDeg;
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
 *   segmentLayouts: ReturnType<typeof buildSegmentLayouts>;
 *   activeKey: string | null;
 *   centerLabel?: string | null;
 *   centerAccentColor?: string | null;
 *   onSegmentHover: (key: string | null) => void;
 *   cardClassSuffix?: string;
 * }} props
 */
function CompetitionHealthPieSvg({
  segmentLayouts,
  activeKey,
  centerLabel = null,
  centerAccentColor = null,
  onSegmentHover,
  cardClassSuffix = "",
}) {
  const { viewW, viewH, cx, cy, radius } = PIE_LAYOUT;
  const segmentStates = resolveCompetitionHealthPieSegmentState(activeKey, segmentLayouts);

  return (
    <svg
      className={[
        "s7-competition-health-center__pie-svg",
        cardClassSuffix ? `s7-competition-health-center__pie-svg--${cardClassSuffix}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
      viewBox={`0 0 ${viewW} ${viewH}`}
      role="presentation"
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={radius + 1} className="s7-competition-health-center__pie-bg" />

      {segmentStates.map(({ key, segment, startDeg, endDeg, isActive, isHidden }) => {
        if (isHidden) return null;
        const color = resolveSegmentColor(segment);

        return (
          <path
            key={key}
            d={describePieSegment(cx, cy, radius, startDeg, endDeg)}
            fill={color}
            className={[
              "s7-competition-health-center__pie-segment",
              cardClassSuffix ? `s7-competition-health-center__pie-segment--${cardClassSuffix}-${key}` : "",
              isActive ? "s7-competition-health-center__pie-segment--active" : "",
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

      <CompetitionHealthPieCenter
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
  return readCount(bucket.listings_count ?? bucket.count ?? bucket.competitors_count);
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
function CompetitionHealthSidePill({
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
  const color = ALERT_BUCKET_KEYS.has(key)
    ? COMPETITION_HEALTH_ALERT_CORAL
    : String(bucket.chart_color ?? "#64748b");

  return (
    <div
      className={[
        "s7-competition-health-center__side-pill",
        cardClassSuffix ? `s7-competition-health-center__side-pill--${cardClassSuffix}` : "",
        `s7-competition-health-center__side-pill--${key}`,
        isActive ? "s7-competition-health-center__side-pill--active" : "",
        isDimmed ? "s7-competition-health-center__side-pill--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderColor: color, "--s7-competition-accent": color }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      tabIndex={0}
      role="group"
      aria-label={`${badgeLabel}. ${line1}. ${line2}`}
    >
      <span className="s7-competition-health-center__side-pill-badge" style={{ color }}>
        {badgeLabel}
      </span>
      <div className="s7-competition-health-center__side-pill-copy">
        <p className="s7-competition-health-center__side-pill-line s7-competition-health-center__side-pill-line--top">
          {line1}
        </p>
        <p className="s7-competition-health-center__side-pill-line s7-competition-health-center__side-pill-line--bottom">
          {line2}
        </p>
      </div>
    </div>
  );
}

/** @param {{ title: string; children: import("react").ReactNode }} props */
function HealthMainCard({ title, children }) {
  return (
    <div className="s7-dashboard-large-card-stack s7-competition-health-center__main-card-stack">
      <h3 className="s7-dashboard-large-card-head s7-competition-health-center__main-card-head">{title}</h3>
      <article className="s7-dashboard-large-card s7-competition-health-center__main-card">{children}</article>
    </div>
  );
}

/**
 * @param {{
 *   headerMode: "total" | "competitors";
 *   totalListings: number;
 *   cardData: Record<string, unknown>;
 * }} props
 */
function HealthCardHeaderLine({ headerMode, totalListings, cardData }) {
  if (headerMode === "competitors") {
    const totalCompetitors = readCount(
      cardData.total_competitors ?? cardData.base_count ?? cardData.comparison_base_count,
    );
    return (
      <p className="s7-competition-health-center__health-podium-total">
        Concorrentes analisados: {formatCount(totalCompetitors)}
      </p>
    );
  }

  const total = readCount(cardData.total_listings ?? totalListings);
  return (
    <p className="s7-competition-health-center__health-podium-total">
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
 *   headerMode?: "total" | "competitors";
 *   buildBucketLines: (bucket: Record<string, unknown>) => { line1: string; line2: string };
 *   hasDataOverride?: boolean;
 *   emptyMessage?: string;
 * }} props
 */
export default function CompetitionHealthPieCard({
  cardData,
  totalListings,
  bucketOrder,
  cardClassSuffix,
  headerMode = "total",
  buildBucketLines,
  hasDataOverride,
  emptyMessage = "Nenhum anúncio analisado.",
}) {
  const title = String(cardData.title ?? "");
  const chart =
    cardData.chart != null && typeof cardData.chart === "object"
      ? /** @type {Record<string, unknown>} */ (cardData.chart)
      : {};
  const buckets = Array.isArray(cardData.buckets) ? cardData.buckets : [];
  const orderedBuckets = sortBuckets(buckets, bucketOrder);
  const chartSegments = Array.isArray(chart.segments) ? chart.segments : [];
  const segmentLayouts = buildSegmentLayouts(chartSegments);
  const hasData =
    hasDataOverride != null
      ? hasDataOverride
      : headerMode === "competitors"
        ? readCount(cardData.total_competitors ?? cardData.base_count) > 0 && orderedBuckets.length > 0
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
          "s7-competition-health-center__main-card-body",
          cardClassSuffix ? `s7-competition-health-center__main-card-body--${cardClassSuffix}` : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <HealthCardHeaderLine headerMode={headerMode} totalListings={totalListings} cardData={cardData} />
        {!hasData ? (
          <p className="s7-competition-health-center__empty">{emptyMessage}</p>
        ) : (
          <div
            className="s7-competition-health-center__split"
            role="img"
            aria-label={ariaSegments ? `${title} — ${ariaSegments}` : title}
          >
            <div className="s7-competition-health-center__split__chart">
              <CompetitionHealthPieSvg
                segmentLayouts={segmentLayouts}
                activeKey={activeBandKey}
                centerLabel={pieCenter.label}
                centerAccentColor={pieCenter.accentColor}
                onSegmentHover={setActiveBandKey}
                cardClassSuffix={cardClassSuffix}
              />
            </div>
            <div className="s7-competition-health-center__split__labels">
              {orderedBuckets.map((bucket) => {
                const bucketKey = String(bucket.key ?? "");
                const lines = buildBucketLines(bucket);
                return (
                  <CompetitionHealthSidePill
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

export { formatCount, formatCompetitorsLabel, formatPercentFromBackend, formatListingsLabel, readCount };

/** @param {Record<string, unknown>} bucket */
export function buildStandardBucketLines(bucket) {
  const status = String(bucket.label ?? "").trim();
  return {
    line1: status,
    line2: `${formatPercentFromBackend(bucket.share_percent ?? bucket.mix_share_percent)} do total`,
  };
}
