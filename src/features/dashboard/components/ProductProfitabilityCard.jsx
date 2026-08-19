// ======================================================================
// Card Lucratividade dos Produtos — Central de Saúde (somente renderização).
// ======================================================================

import { useMemo, useState } from "react";
import ExecutiveCardEmptyState from "../../../components/sales/ExecutiveCardEmptyState.jsx";
import ProductHealthDonutCenter, {
  resolveProductHealthDonutSegmentState,
} from "./ProductHealthDonutCenter.jsx";
import "./ProductHealthCenter.css";

const PROFIT_MAIN_BUCKET_ORDER = ["high_profit", "profit", "low_profit", "loss", "no_sales"];

const PROFIT_RING_SCALE = 1.09;
const PROFIT_RING_BAND_WIDTH = 38;
const PROFIT_RING_BASE_OUTER = 82;
const PROFIT_RING_OUTER = PROFIT_RING_BASE_OUTER * PROFIT_RING_SCALE;
const PROFIT_RING_INNER = PROFIT_RING_OUTER - PROFIT_RING_BAND_WIDTH;

const PROFIT_DONUT_LAYOUT = {
  viewW: 196,
  viewH: 196,
  cx: 98,
  cy: 98,
  innerR: PROFIT_RING_INNER,
  outerR: PROFIT_RING_OUTER,
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
function readProductsSharePercent(value) {
  const raw = value?.products_share_percent ?? value?.mix_share_percent;
  const n = Number(String(raw ?? "0").replace(",", "."));
  return Number.isFinite(n) ? raw : "0.00";
}

/** @param {unknown} value */
function formatPercentFromBackend(value) {
  const n = Number(String(value ?? "0").replace(",", "."));
  if (!Number.isFinite(n)) return "0,00%";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** @param {number} count */
function formatProductsNoun(count) {
  return readCount(count) === 1 ? "produto" : "produtos";
}

/** Texto da linha 1 e faixa de margem — somente exibição (payload define bucket/key). */
const PROFIT_LINE1_CONFIG = {
  high_profit: { useCom: true, status: "alta lucratividade", margin: "Margem acima de 30%" },
  profit: { useCom: true, status: "lucro", margin: "Margem de 5% a 30%" },
  low_profit: { useCom: true, status: "lucro baixo", margin: "Margem de 0% a 5%" },
  loss: { useCom: true, status: "prejuízo", margin: "Margem abaixo de 0%" },
  no_sales: { useCom: false, status: "sem venda", margin: null },
};

/**
 * @param {number} count
 * @param {{ useCom: boolean; status: string }} config
 */
function buildProfitPrimaryLine(count, config) {
  const noun = formatProductsNoun(count);
  if (config.useCom) {
    return { prefix: `${noun} com `, status: config.status };
  }
  return { prefix: `${noun} `, status: config.status };
}

/** Cor visual do bucket — Lucro usa azul S7 (#3b82f6, mesmo token da Curva A). */
function readProfitAccentColor(key, chartColor) {
  if (key === "profit") return "#3b82f6";
  return String(chartColor ?? "#94a3b8");
}

/** @param {Record<string, unknown>} segment */
function readProfitSegmentPercent(segment) {
  const n = Number(String(segment.products_share_percent ?? segment.mix_share_percent ?? "0").replace(",", "."));
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
function buildProfitSegmentLayouts(segments) {
  let cursor = -90;
  /** @type {Array<{ segment: Record<string, unknown>; startDeg: number; endDeg: number }>} */
  const layouts = [];

  for (const segment of segments) {
    const pct = readProfitSegmentPercent(segment);
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
 */
function sortMainProfitBuckets(buckets) {
  return [...buckets].sort((a, b) => {
    const idxA = PROFIT_MAIN_BUCKET_ORDER.indexOf(String(a.key ?? ""));
    const idxB = PROFIT_MAIN_BUCKET_ORDER.indexOf(String(b.key ?? ""));
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
 *   segmentLayouts: ReturnType<typeof buildProfitSegmentLayouts>;
 *   activeKey: string | null;
 *   centerLabel?: string | null;
 *   centerAccentColor?: string | null;
 *   onSegmentHover: (key: string | null) => void;
 * }} props
 */
function ProfitabilityDonutSvg({
  segmentLayouts,
  activeKey,
  centerLabel = null,
  centerAccentColor = null,
  onSegmentHover,
}) {
  const { viewW, viewH, cx, cy, innerR, outerR } = PROFIT_DONUT_LAYOUT;
  const segmentStates = resolveProductHealthDonutSegmentState(activeKey, segmentLayouts);

  return (
    <svg
      className="s7-products-health-center__abc-donut-svg s7-products-health-center__profit-donut-svg"
      viewBox={`0 0 ${viewW} ${viewH}`}
      role="presentation"
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={outerR + 1} className="s7-products-health-center__abc-donut-bg" />

      {segmentStates.map(({ key, segment, startDeg, endDeg, isActive, isHidden }) => {
        if (isHidden) return null;

        const color = readProfitAccentColor(key, segment.chart_color);

        return (
          <path
            key={key}
            d={describeDonutSegment(cx, cy, innerR, outerR, startDeg, endDeg)}
            fill={color}
            className={[
              "s7-products-health-center__abc-donut-segment",
              "s7-products-health-center__profit-donut-segment",
              `s7-products-health-center__profit-donut-segment--${key}`,
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
function ProfitabilityLabel({ bucket, badgeLabel, isActive, isDimmed, onHoverStart, onHoverEnd }) {
  const key = String(bucket.key ?? "");
  const lineConfig = PROFIT_LINE1_CONFIG[key] ?? {
    useCom: true,
    status: String(bucket.label ?? bucket.short_label ?? key).toLowerCase(),
    margin: String(bucket.profit_range_label ?? "").trim() || null,
  };
  const color = readProfitAccentColor(key, bucket.chart_color);
  const count = readCount(bucket.count);
  const productsShare = readProductsSharePercent(bucket);
  const primaryLine = buildProfitPrimaryLine(count, lineConfig);
  const marginLabel = lineConfig.margin;
  const detailLine = marginLabel
    ? `${marginLabel} | ${formatPercentFromBackend(productsShare)}\u00A0dos produtos`
    : `${formatPercentFromBackend(productsShare)}\u00A0dos produtos`;
  const ariaLabel = `${badgeLabel}. ${primaryLine.prefix}${primaryLine.status}. ${detailLine}`;

  return (
    <div
      className={[
        "s7-products-health-center__profit-callout-pill",
        `s7-products-health-center__profit-callout-pill--${key}`,
        isActive ? "s7-products-health-center__profit-callout-pill--active" : "",
        isDimmed ? "s7-products-health-center__profit-callout-pill--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderColor: color, "--s7-profit-accent": color }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      tabIndex={0}
      role="group"
      aria-label={ariaLabel}
    >
      <span className="s7-products-health-center__profit-callout-index" style={{ color }}>
        {badgeLabel}
      </span>
      <div className="s7-products-health-center__profit-callout-copy">
        <p className="s7-products-health-center__abc-callout-line-text s7-products-health-center__abc-callout-line-text--top">
          {primaryLine.prefix}
          <span style={{ color }}>{primaryLine.status}</span>
        </p>
        <p className="s7-products-health-center__abc-callout-line-text s7-products-health-center__abc-callout-line-text--bottom">
          {detailLine}
        </p>
      </div>
    </div>
  );
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
 *   profitCard: Record<string, unknown>;
 *   totalProducts: number;
 * }} props
 */
export default function ProductProfitabilityCard({ profitCard, totalProducts }) {
  const title = String(profitCard.title ?? "Lucratividade dos Produtos");
  const chart =
    profitCard.chart != null && typeof profitCard.chart === "object"
      ? /** @type {Record<string, unknown>} */ (profitCard.chart)
      : {};
  const financialDataPending =
    profitCard.financial_data_pending != null && typeof profitCard.financial_data_pending === "object"
      ? /** @type {Record<string, unknown>} */ (profitCard.financial_data_pending)
      : {};
  const buckets = Array.isArray(profitCard.buckets) ? profitCard.buckets : [];
  const mainBuckets = sortMainProfitBuckets(
    buckets.filter((bucket) => bucket.is_main_kpi !== false),
  );
  const chartSegments = Array.isArray(chart.segments) ? chart.segments : [];
  const segmentLayouts = buildProfitSegmentLayouts(chartSegments);
  const hasData = totalProducts > 0;
  const [activeBandKey, setActiveBandKey] = useState(/** @type {string | null} */ (null));
  const pendingCount = readCount(financialDataPending.products_count);
  const pendingMessage =
    String(financialDataPending.message ?? "").trim() ||
    (pendingCount > 0
      ? `${formatCount(pendingCount)} produtos com dados financeiros pendentes.`
      : "");

  const ariaSegments = mainBuckets
    .map((bucket, index) => {
      const key = String(bucket.key ?? "");
      const lineConfig = PROFIT_LINE1_CONFIG[key] ?? {
        useCom: true,
        status: String(bucket.label ?? bucket.short_label ?? key).toLowerCase(),
        margin: String(bucket.profit_range_label ?? "").trim() || null,
      };
      const productsShare = readProductsSharePercent(bucket);
      const primaryLine = buildProfitPrimaryLine(readCount(bucket.count), lineConfig);
      const detail = lineConfig.margin
        ? `${lineConfig.margin} | ${formatPercentFromBackend(productsShare)} dos produtos`
        : `${formatPercentFromBackend(productsShare)} dos produtos`;
      return `${formatCount(readCount(bucket.count))}. ${primaryLine.prefix}${primaryLine.status}. ${detail}`;
    })
    .join("; ");

  const profitDonutCenter = useMemo(() => {
    if (!activeBandKey) {
      return { label: null, accentColor: null };
    }
    const bucketIndex = mainBuckets.findIndex((bucket) => String(bucket.key ?? "") === activeBandKey);
    if (bucketIndex < 0) {
      return { label: null, accentColor: null };
    }
    const bucket = mainBuckets[bucketIndex];
    return {
      label: formatCount(readCount(bucket.count)),
      accentColor: readProfitAccentColor(String(bucket.key ?? ""), bucket.chart_color),
    };
  }, [activeBandKey, mainBuckets]);

  return (
    <HealthMainCard title={title}>
      <div className="s7-products-health-center__main-card-body s7-products-health-center__main-card-body--profit">
        <HealthPodiumTotalLine totalProducts={totalProducts} />
        {!hasData ? (
          <ExecutiveCardEmptyState message="Nenhum produto monitorado." />
        ) : (
          <>
            <div
              className="s7-products-health-center__abc-split s7-products-health-center__profit-split"
              role="img"
              aria-label={
                ariaSegments
                  ? `${title} — ${ariaSegments}${pendingMessage ? `; ${pendingMessage}` : ""}`
                  : `${title} — distribuição de lucratividade`
              }
            >
              <div className="s7-products-health-center__abc-split__ring">
                <ProfitabilityDonutSvg
                  segmentLayouts={segmentLayouts}
                  activeKey={activeBandKey}
                  centerLabel={profitDonutCenter.label}
                  centerAccentColor={profitDonutCenter.accentColor}
                  onSegmentHover={setActiveBandKey}
                />
              </div>
              <div className="s7-products-health-center__abc-split__labels s7-products-health-center__profit-split__labels">
                {mainBuckets.map((bucket) => {
                  const bucketKey = String(bucket.key ?? "");
                  return (
                    <ProfitabilityLabel
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
            {pendingCount > 0 && pendingMessage ? (
              <p className="s7-products-health-center__profit-data-quality" role="status">
                {pendingMessage}
              </p>
            ) : null}
          </>
        )}
      </div>
    </HealthMainCard>
  );
}
