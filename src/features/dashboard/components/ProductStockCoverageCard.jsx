// ======================================================================
// Card Cobertura de Estoque — Central de Saúde dos Produtos (somente renderização).
// Padrão visual alinhado ao card Curva ABC homologado.
// ======================================================================

import { useMemo, useState } from "react";
import S7Tooltip from "../../../components/ui/S7Tooltip.jsx";
import ProductHealthDonutCenter, {
  resolveProductHealthDonutSegmentState,
} from "./ProductHealthDonutCenter.jsx";
import ExecutiveCardEmptyState from "../../../components/sales/ExecutiveCardEmptyState.jsx";
import "./ProductHealthCenter.css";

const STOCK_BUCKET_ORDER = ["rupture", "critical", "low", "healthy", "no_turnover"];

const STOCK_RING_SCALE = 1.09;
const STOCK_RING_BAND_WIDTH = 38;
const STOCK_RING_BASE_OUTER = 82;
const STOCK_RING_OUTER = STOCK_RING_BASE_OUTER * STOCK_RING_SCALE;
const STOCK_RING_INNER = STOCK_RING_OUTER - STOCK_RING_BAND_WIDTH;

const STOCK_DONUT_LAYOUT = {
  viewW: 196,
  viewH: 196,
  cx: 98,
  cy: 98,
  innerR: STOCK_RING_INNER,
  outerR: STOCK_RING_OUTER,
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

/** @param {number} count */
function formatProductsNoun(count) {
  return readCount(count) === 1 ? "produto" : "produtos";
}

/** Texto da linha 1 — somente exibição (bucket/key vem do payload). */
const STOCK_LINE1_CONFIG = {
  rupture: { useCom: false, status: "sem estoque" },
  critical: { useCom: false, status: "acabam em até 7 dias" },
  low: { useCom: true, status: "estoque baixo" },
  healthy: { useCom: true, status: "estoque em dia" },
  no_turnover: { useCom: false, status: "sem venda recente" },
};

const STOCK_BUCKET_TOOLTIPS = {
  no_turnover: "Produtos sem vendas nos últimos 15 dias.",
};

/**
 * @param {number} count
 * @param {{ useCom: boolean; status: string }} config
 */
function buildStockPrimaryLine(count, config) {
  const noun = formatProductsNoun(count);
  if (config.useCom) {
    return { prefix: `${noun} com `, status: config.status };
  }
  return { prefix: `${noun} `, status: config.status };
}

/** @param {unknown} value */
function formatPercentFromBackend(value) {
  const n = Number(String(value ?? "0").replace(",", "."));
  if (!Number.isFinite(n)) return "0,00%";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** @param {Record<string, unknown>} segment */
function readStockSegmentPercent(segment) {
  const n = Number(String(segment.mix_share_percent ?? "0").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** @param {number} cx @param {number} cy @param {number} r @param {number} deg */
function polarPoint(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * @param {Array<Record<string, unknown>>} segments
 */
function buildStockSegmentLayouts(segments) {
  let cursor = -90;
  /** @type {Array<{ segment: Record<string, unknown>; startDeg: number; endDeg: number; midDeg: number }>} */
  const layouts = [];

  for (const segment of segments) {
    const pct = readStockSegmentPercent(segment);
    if (pct <= 0) continue;
    const sweep = pct * 3.6;
    const startDeg = cursor;
    const endDeg = cursor + sweep;
    layouts.push({
      segment,
      startDeg,
      endDeg,
      midDeg: startDeg + sweep / 2,
    });
    cursor = endDeg;
  }

  return layouts;
}

/**
 * @param {Array<Record<string, unknown>>} buckets
 */
function sortStockBuckets(buckets) {
  return [...buckets].sort((a, b) => {
    const idxA = STOCK_BUCKET_ORDER.indexOf(String(a.key ?? ""));
    const idxB = STOCK_BUCKET_ORDER.indexOf(String(b.key ?? ""));
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
}

function describeDonutSegment(cx, cy, innerR, outerR, startDeg, endDeg) {
  const startOuter = polarPoint(cx, cy, outerR, startDeg);
  const endOuter = polarPoint(cx, cy, outerR, endDeg);
  const startInner = polarPoint(cx, cy, innerR, endDeg);
  const endInner = polarPoint(cx, cy, innerR, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)}`,
    `L ${startInner.x.toFixed(2)} ${startInner.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x.toFixed(2)} ${endInner.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

/**
 * @param {{
 *   segmentLayouts: ReturnType<typeof buildStockSegmentLayouts>;
 *   activeKey: string | null;
 *   centerLabel?: string | null;
 *   centerAccentColor?: string | null;
 *   onSegmentHover: (key: string | null) => void;
 * }} props
 */
function StockCoverageDonutSvg({
  segmentLayouts,
  activeKey,
  centerLabel = null,
  centerAccentColor = null,
  onSegmentHover,
}) {
  const { viewW, viewH, cx, cy, innerR, outerR } = STOCK_DONUT_LAYOUT;
  const segmentStates = resolveProductHealthDonutSegmentState(activeKey, segmentLayouts);

  return (
    <svg
      className="s7-products-health-center__abc-donut-svg s7-products-health-center__stock-donut-svg"
      viewBox={`0 0 ${viewW} ${viewH}`}
      role="presentation"
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={outerR + 1} className="s7-products-health-center__abc-donut-bg" />

      {segmentStates.map(({ key, segment, startDeg, endDeg, isActive, isHidden }) => {
        if (isHidden) return null;

        const color = String(segment.chart_color ?? "#94a3b8");

        return (
          <path
            key={key}
            d={describeDonutSegment(cx, cy, innerR, outerR, startDeg, endDeg)}
            fill={color}
            className={[
              "s7-products-health-center__abc-donut-segment",
              "s7-products-health-center__stock-donut-segment",
              `s7-products-health-center__stock-donut-segment--${key}`,
              isActive ? "s7-products-health-center__abc-donut-segment--active" : "",
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

      <ProductHealthDonutCenter
        cx={cx}
        cy={cy}
        innerR={innerR}
        label={centerLabel}
        accentColor={centerAccentColor}
      />
    </svg>
  );
}

/**
 * @param {{
 *   bucket: Record<string, unknown>;
 *   badgeLabel: string;
 *   isActive: boolean;
 *   isDimmed: boolean;
 *   onHoverStart: () => void;
 *   onHoverEnd: () => void;
 * }} props
 */
function StockCoverageLabel({ bucket, badgeLabel, isActive, isDimmed, onHoverStart, onHoverEnd }) {
  const key = String(bucket.key ?? "");
  const lineConfig = STOCK_LINE1_CONFIG[key] ?? {
    useCom: true,
    status: String(bucket.label ?? bucket.short_label ?? key).toLowerCase(),
  };
  const color = String(bucket.chart_color ?? "#94a3b8");
  const count = readCount(bucket.count);
  const primaryLine = buildStockPrimaryLine(count, lineConfig);
  const mixShareLine = `${formatPercentFromBackend(bucket.mix_share_percent)} do mix`;
  const tooltipContent = STOCK_BUCKET_TOOLTIPS[key] ?? null;
  const ariaLabel = `${badgeLabel}. ${primaryLine.prefix}${primaryLine.status}. ${mixShareLine}`;

  const pillContent = (
    <div
      className={[
        "s7-products-health-center__stock-callout-pill",
        `s7-products-health-center__stock-callout-pill--${key}`,
        isActive ? "s7-products-health-center__stock-callout-pill--active" : "",
        isDimmed ? "s7-products-health-center__stock-callout-pill--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderColor: color, "--s7-stock-accent": color }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      tabIndex={0}
      role="group"
      aria-label={ariaLabel}
    >
      <span className="s7-products-health-center__stock-callout-index" style={{ color }}>
        {badgeLabel}
      </span>
      <div className="s7-products-health-center__stock-callout-copy">
        <p className="s7-products-health-center__abc-callout-line-text s7-products-health-center__abc-callout-line-text--top">
          {primaryLine.prefix}
          {tooltipContent ? (
            <S7Tooltip content={tooltipContent} wrap placement="top-start" offset={8}>
              <span className="s7-products-health-center__stock-callout-status" style={{ color }}>
                {primaryLine.status}
              </span>
            </S7Tooltip>
          ) : (
            <span style={{ color }}>{primaryLine.status}</span>
          )}
        </p>
        <p className="s7-products-health-center__abc-callout-line-text s7-products-health-center__abc-callout-line-text--bottom">
          {mixShareLine}
        </p>
      </div>
    </div>
  );

  return pillContent;
}

/** @param {{ title: string; children: import("react").ReactNode }} props */
function HealthMainCard({ title, children }) {
  return (
    <div className="s7-dashboard-large-card-stack s7-products-health-center__main-card-stack">
      <h3 className="s7-dashboard-large-card-head s7-products-health-center__main-card-head">{title}</h3>
      <article className="s7-dashboard-large-card s7-products-health-center__main-card">{children}</article>
    </div>
  );
}

/** @param {{ totalProducts: number }} props */
function HealthPodiumTotalLine({ totalProducts }) {
  return (
    <p className="s7-products-health-center__health-podium-total">
      Total de produtos: {formatCount(totalProducts)}
    </p>
  );
}

/**
 * @param {{
 *   stockCard: Record<string, unknown>;
 *   totalProducts: number;
 * }} props
 */
export default function ProductStockCoverageCard({ stockCard, totalProducts }) {
  const title = String(stockCard.title ?? "Cobertura de Estoque");
  const chart =
    stockCard.chart != null && typeof stockCard.chart === "object"
      ? /** @type {Record<string, unknown>} */ (stockCard.chart)
      : {};
  const dataQuality =
    stockCard.data_quality != null && typeof stockCard.data_quality === "object"
      ? /** @type {Record<string, unknown>} */ (stockCard.data_quality)
      : {};
  const buckets = Array.isArray(stockCard.buckets) ? stockCard.buckets : [];
  const orderedBuckets = sortStockBuckets(
    buckets.filter((bucket) => String(bucket.key ?? "") !== "excess"),
  );
  const chartSegments = Array.isArray(chart.segments) ? chart.segments : [];
  const segmentLayouts = buildStockSegmentLayouts(chartSegments);
  const hasData = totalProducts > 0;
  const [activeBandKey, setActiveBandKey] = useState(/** @type {string | null} */ (null));
  const showDataQualityWarning = String(dataQuality.status ?? "ok") === "warning";
  const dataQualityMessage = String(
    dataQuality.message ?? "Dados de estoque podem estar incompletos nesta conta.",
  );

  const ariaSegments = orderedBuckets
    .map((bucket, index) => {
      const key = String(bucket.key ?? "");
      const lineConfig = STOCK_LINE1_CONFIG[key] ?? {
        useCom: true,
        status: String(bucket.label ?? bucket.short_label ?? key).toLowerCase(),
      };
      const primaryLine = buildStockPrimaryLine(readCount(bucket.count), lineConfig);
      return `${formatCount(readCount(bucket.count))}. ${primaryLine.prefix}${primaryLine.status}. ${formatPercentFromBackend(bucket.mix_share_percent)} do mix`;
    })
    .join("; ");

  const stockDonutCenter = useMemo(() => {
    if (!activeBandKey) {
      return { label: null, accentColor: null };
    }
    const bucketIndex = orderedBuckets.findIndex((bucket) => String(bucket.key ?? "") === activeBandKey);
    if (bucketIndex < 0) {
      return { label: null, accentColor: null };
    }
    const bucket = orderedBuckets[bucketIndex];
    return {
      label: formatCount(readCount(bucket.count)),
      accentColor: String(bucket.chart_color ?? "#94a3b8"),
    };
  }, [activeBandKey, orderedBuckets]);

  return (
    <HealthMainCard title={title}>
      <div className="s7-products-health-center__main-card-body s7-products-health-center__main-card-body--stock">
        <HealthPodiumTotalLine totalProducts={totalProducts} />
        {showDataQualityWarning ? (
          <p className="s7-products-health-center__stock-data-quality" role="status">
            {dataQualityMessage}
          </p>
        ) : null}
        {!hasData ? (
          <ExecutiveCardEmptyState message="Nenhum produto monitorado." />
        ) : (
          <div
            className="s7-products-health-center__abc-split s7-products-health-center__stock-split"
            role="img"
            aria-label={ariaSegments ? `${title} — ${ariaSegments}` : `${title} — distribuição de cobertura de estoque`}
          >
            <div className="s7-products-health-center__abc-split__ring">
              <StockCoverageDonutSvg
                segmentLayouts={segmentLayouts}
                activeKey={activeBandKey}
                centerLabel={stockDonutCenter.label}
                centerAccentColor={stockDonutCenter.accentColor}
                onSegmentHover={setActiveBandKey}
              />
            </div>
            <div className="s7-products-health-center__abc-split__labels s7-products-health-center__stock-split__labels">
              {orderedBuckets.map((bucket) => {
                const bucketKey = String(bucket.key ?? "");
                return (
                  <StockCoverageLabel
                    key={bucketKey}
                    bucket={bucket}
                    badgeLabel={formatCount(readCount(bucket.count))}
                    isActive={activeBandKey === bucketKey}
                    isDimmed={activeBandKey != null && activeBandKey !== bucketKey}
                    onHoverStart={() => setActiveBandKey(bucketKey)}
                    onHoverEnd={() => setActiveBandKey(null)}
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
