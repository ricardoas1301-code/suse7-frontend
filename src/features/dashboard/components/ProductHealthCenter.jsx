// ======================================================================
// Central de Saúde dos Produtos — Dashboard executivo (somente renderização).
// SSOT: GET /api/dashboard/products-health-summary
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, PackageX, TrendingUp } from "lucide-react";
import { useAuthBootstrapReady } from "../../../hooks/useAuthBootstrapReady.js";
import { fetchProductsHealthSummary } from "../api/fetchProductsHealthSummary.js";
import VendasExecutiveKpiCard from "../../../components/sales/VendasExecutiveKpiCard.jsx";
import S7DashboardSectionPanel from "../../../components/dashboard/S7DashboardSectionPanel.jsx";
import S7SectionJumpButton from "../../../components/ui/S7SectionJumpButton.jsx";
import "../../../components/sales/VendasExecutiveKpiCard.css";
import ProductStockCoverageCard from "./ProductStockCoverageCard.jsx";
import ProductProfitabilityCard from "./ProductProfitabilityCard.jsx";
import ProductHealthDonutCenter, {
  resolveProductHealthDonutSegmentState,
} from "./ProductHealthDonutCenter.jsx";
import "./ProductHealthCenter.css";

const FRIENDLY_LOAD_ERROR = "Não foi possível carregar a Central de Saúde dos Produtos agora.";
const FRIENDLY_LOAD_ERROR_HINT =
  "Tente atualizar a página. Se continuar, verifique os logs do backend.";

/** @param {unknown} value */
function formatCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("pt-BR");
}

const DEAD_STOCK_DAYS_UI_FALLBACK = 15;

/** @param {unknown} value */
function readCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** @param {unknown} value */
function readDaysThreshold(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** @param {unknown} cards */
function readDeadStockDaysThreshold(cards) {
  if (cards == null || typeof cards !== "object") return null;
  const record = /** @type {Record<string, unknown>} */ (cards);
  const flat = readDaysThreshold(record.dead_stock_days_threshold);
  if (flat != null) return flat;

  const nested = record.dead_stock;
  if (nested != null && typeof nested === "object") {
    const nestedThreshold = readDaysThreshold(/** @type {Record<string, unknown>} */ (nested).days_threshold);
    if (nestedThreshold != null) return nestedThreshold;
  }
  return DEAD_STOCK_DAYS_UI_FALLBACK;
}

/** @param {unknown} value */
function formatBrl(value) {
  const n = Number(String(value ?? "0").replace(",", "."));
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** @param {unknown} value */
function formatMarkup(value) {
  const n = Number(String(value ?? "0").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return "0,00x";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`;
}

/** @param {unknown} value */
function formatPercent(value) {
  const n = Number(String(value ?? "0").replace(",", "."));
  if (!Number.isFinite(n)) return "0%";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

/** @param {unknown} value — percentual já calculado no backend (2 casas). */
function formatPercentFromBackend(value) {
  const n = Number(String(value ?? "0").replace(",", "."));
  if (!Number.isFinite(n)) return "0,00%";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** @param {number} count */
function formatProductsNoun(count) {
  return readCount(count) === 1 ? "produto" : "produtos";
}

/** @param {string} label @param {number} count @param {unknown} percent */
function buildAbcCalloutTooltip(label, count, percent) {
  return `${label}: ${formatCount(count)} produtos representam ${formatPercentFromBackend(percent)} do faturamento`;
}

/** @param {number} count @param {unknown} percent */
function buildAbcNoSalesCalloutTooltip(count, percent) {
  return `${formatCount(count)} produtos sem venda, ${formatPercentFromBackend(percent)} do faturamento`;
}

const ABC_RING_SCALE = 1.09;
const ABC_RING_BAND_WIDTH = 38;
const ABC_RING_BASE_OUTER = 82;
const ABC_RING_OUTER = ABC_RING_BASE_OUTER * ABC_RING_SCALE;
const ABC_RING_INNER = ABC_RING_OUTER - ABC_RING_BAND_WIDTH;

const ABC_DONUT_LAYOUT = {
  viewW: 196,
  viewH: 196,
  cx: 98,
  cy: 98,
  innerR: ABC_RING_INNER,
  outerR: ABC_RING_OUTER,
};

const ABC_SEGMENT_ORDER = ["curve_a", "curve_b", "curve_c"];

/** @param {Record<string, unknown>} segment */
function readSegmentPercent(segment) {
  const n = Number(String(segment.revenue_share_percent ?? "0").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** @param {number} cx @param {number} cy @param {number} r @param {number} deg */
function polarPoint(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * Geometria de renderização — usa percentuais do backend apenas para posicionar labels.
 * @param {Array<Record<string, unknown>>} segments
 */
function buildAbcSegmentLayouts(segments) {
  let cursor = -90;
  /** @type {Array<{
   *   segment: Record<string, unknown>;
   *   startDeg: number;
   *   endDeg: number;
   *   midDeg: number;
   * }>} */
  const layouts = [];

  for (const segment of segments) {
    const pct = readSegmentPercent(segment);
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
 * @param {Array<Record<string, unknown>>} segments
 */
function sortAbcChartSegments(segments) {
  return [...segments].sort((a, b) => {
    const idxA = ABC_SEGMENT_ORDER.indexOf(String(a.key ?? ""));
    const idxB = ABC_SEGMENT_ORDER.indexOf(String(b.key ?? ""));
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
}

/**
 * @param {number} cx @param {number} cy @param {number} innerR @param {number} outerR
 * @param {number} startDeg @param {number} endDeg
 */
function describeAbcDonutSegment(cx, cy, innerR, outerR, startDeg, endDeg) {
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
 * Anel ABC — somente o gráfico (labels ficam na coluna ao lado).
 * @param {{
 *   segmentLayouts: ReturnType<typeof buildAbcSegmentLayouts>;
 *   activeKey: string | null;
 *   centerLabel?: string | null;
 *   centerAccentColor?: string | null;
 *   onSegmentHover: (key: string | null) => void;
 * }} props
 */
function ProductAbcDonutSvg({
  segmentLayouts,
  activeKey,
  centerLabel = null,
  centerAccentColor = null,
  onSegmentHover,
}) {
  const { viewW, viewH, cx, cy, innerR, outerR } = ABC_DONUT_LAYOUT;
  const segmentStates = resolveProductHealthDonutSegmentState(activeKey, segmentLayouts);

  return (
    <svg
      className="s7-products-health-center__abc-donut-svg"
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
            d={describeAbcDonutSegment(cx, cy, innerR, outerR, startDeg, endDeg)}
            fill={color}
            className={[
              "s7-products-health-center__abc-donut-segment",
              `s7-products-health-center__abc-donut-segment--${key}`,
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
 * Card lateral D — produtos sem venda (0% do faturamento).
 * @param {{
 *   bucket: Record<string, unknown>;
 *   isActive: boolean;
 *   isDimmed: boolean;
 *   onHoverStart: () => void;
 *   onHoverEnd: () => void;
 * }} props
 */
function ProductAbcNoSalesLabel({ bucket, isActive, isDimmed, onHoverStart, onHoverEnd }) {
  const key = String(bucket.key ?? "no_sales");
  const count = readCount(bucket.count);

  return (
    <div
      className={[
        "s7-products-health-center__abc-callout-pill",
        "s7-products-health-center__abc-callout-pill--no-sales-d",
        `s7-products-health-center__abc-callout-pill--${key}`,
        isActive ? "s7-products-health-center__abc-callout-pill--active" : "",
        isDimmed ? "s7-products-health-center__abc-callout-pill--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderColor: "#ef4444", "--s7-abc-accent": "#ef4444" }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      tabIndex={0}
      role="group"
      aria-label={buildAbcNoSalesCalloutTooltip(count, bucket.revenue_share_percent)}
    >
      <span className="s7-products-health-center__abc-callout-letter-big" style={{ color: "#ef4444" }}>
        {formatCount(count)}
      </span>
      <div className="s7-products-health-center__abc-callout-copy">
        <p className="s7-products-health-center__abc-callout-line-text s7-products-health-center__abc-callout-line-text--top">
          {formatProductsNoun(count)} sem venda
        </p>
        <p className="s7-products-health-center__abc-callout-line-text s7-products-health-center__abc-callout-line-text--bottom">
          {formatPercentFromBackend(bucket.revenue_share_percent)} do faturamento
        </p>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   segment: Record<string, unknown>;
 *   isActive: boolean;
 *   isDimmed: boolean;
 *   onHoverStart: () => void;
 *   onHoverEnd: () => void;
 * }} props
 */
function ProductAbcCurveLabel({ segment, isActive, isDimmed, onHoverStart, onHoverEnd }) {
  const key = String(segment.key ?? "");
  const label = String(segment.short_label ?? segment.label ?? key);
  const color = String(segment.chart_color ?? "#94a3b8");
  const count = readCount(segment.count);

  return (
    <div
      className={[
        "s7-products-health-center__abc-callout-pill",
        `s7-products-health-center__abc-callout-pill--${key}`,
        isActive ? "s7-products-health-center__abc-callout-pill--active" : "",
        isDimmed ? "s7-products-health-center__abc-callout-pill--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderColor: color, "--s7-abc-accent": color }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      tabIndex={0}
      role="group"
      aria-label={buildAbcCalloutTooltip(label, count, segment.revenue_share_percent)}
    >
      <span className="s7-products-health-center__abc-callout-letter-big" style={{ color }}>
        {formatCount(count)}
      </span>
      <div className="s7-products-health-center__abc-callout-copy">
        <p className="s7-products-health-center__abc-callout-line-text s7-products-health-center__abc-callout-line-text--top">
          {formatProductsNoun(count)} representam
        </p>
        <p className="s7-products-health-center__abc-callout-line-text s7-products-health-center__abc-callout-line-text--bottom">
          {formatPercentFromBackend(segment.revenue_share_percent)} do faturamento
        </p>
      </div>
    </div>
  );
}

/**
 * @param {{ title: string; children: import("react").ReactNode; className?: string }} props
 */
function HealthMainCard({ title, children, className = "" }) {
  return (
    <div
      className={[
        "s7-dashboard-large-card-stack",
        "s7-products-health-center__main-card-stack",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
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
 * @param {Array<Record<string, unknown>>} distribution
 * @param {string[]} order
 */
function sortDistribution(distribution, order) {
  return [...distribution].sort((a, b) => {
    const idxA = order.indexOf(String(a.key ?? ""));
    const idxB = order.indexOf(String(b.key ?? ""));
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
}

/**
 * @param {{
 *   row: Record<string, unknown>;
 *   stepIndex: number;
 *   capSuffix?: string;
 * }} props
 */
function ProductPodiumColumn({ row, stepIndex, capSuffix = "" }) {
  const key = String(row.key ?? "");
  const count = readCount(row.count);
  const shortLabel = String(row.short_label ?? row.label ?? key);
  const stepLabel = String(row.step_label ?? "produtos");
  const isLead = stepIndex === 0;

  return (
    <div
      className={[
        "s7-products-health-center__podium-column",
        `s7-products-health-center__podium-column--${key || "unknown"}`,
        isLead ? "s7-products-health-center__podium-column--lead" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--s7-podium-step-index": stepIndex }}
    >
      <div className="s7-products-health-center__podium-cap-wrap">
        <span className="s7-products-health-center__podium-cap-label">
          {shortLabel}
          {capSuffix ? ` · ${capSuffix}` : ""}
        </span>
      </div>
      <div className="s7-products-health-center__podium-step">
        <p className="s7-products-health-center__podium-count">
          <span className="s7-products-health-center__podium-count-value">{formatCount(count)}</span>
          <span className="s7-products-health-center__podium-count-label">{stepLabel}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   abcCard: Record<string, unknown>;
 *   totalProducts: number;
 * }} props
 */
function ProductAbcCurveCard({ abcCard, totalProducts }) {
  const title = String(abcCard.title ?? "Curva ABC");
  const chart =
    abcCard.chart != null && typeof abcCard.chart === "object"
      ? /** @type {Record<string, unknown>} */ (abcCard.chart)
      : {};
  const buckets = Array.isArray(abcCard.buckets) ? abcCard.buckets : [];
  const noSalesBucket = buckets.find((row) => String(row.key ?? "") === "no_sales") ?? null;
  const segments = Array.isArray(chart.segments) ? chart.segments : [];
  const orderedSegments = sortAbcChartSegments(segments);
  const segmentLayouts = buildAbcSegmentLayouts(segments);
  const noSalesKey = "no_sales";
  const hasData = totalProducts > 0;
  const [activeCurveKey, setActiveCurveKey] = useState(/** @type {string | null} */ (null));

  const ariaSegments = [
    ...orderedSegments.map((segment) => {
      const label = String(segment.short_label ?? segment.label ?? segment.key ?? "");
      return buildAbcCalloutTooltip(label, readCount(segment.count), segment.revenue_share_percent);
    }),
    noSalesBucket
      ? buildAbcNoSalesCalloutTooltip(readCount(noSalesBucket.count), noSalesBucket.revenue_share_percent)
      : null,
  ]
    .filter(Boolean)
    .join("; ");

  const abcDonutCenter = useMemo(() => {
    if (!activeCurveKey) {
      return { label: null, accentColor: null };
    }
    if (activeCurveKey === noSalesKey) {
      return { label: formatCount(readCount(noSalesBucket?.count)), accentColor: "#ef4444" };
    }
    const segment = orderedSegments.find((row) => String(row.key ?? "") === activeCurveKey);
    if (!segment) {
      return { label: null, accentColor: null };
    }
    return {
      label: formatCount(readCount(segment.count)),
      accentColor: String(segment.chart_color ?? "#94a3b8"),
    };
  }, [activeCurveKey, noSalesKey, noSalesBucket, orderedSegments]);

  return (
    <HealthMainCard title={title}>
      <div className="s7-products-health-center__main-card-body s7-products-health-center__main-card-body--abc">
        <HealthPodiumTotalLine totalProducts={totalProducts} />
        {!hasData ? (
          <p className="s7-products-health-center__empty">Nenhum produto monitorado.</p>
        ) : (
          <div
            className="s7-products-health-center__abc-split"
            role="img"
            aria-label={ariaSegments ? `${title} — ${ariaSegments}` : `${title} — distribuição do faturamento histórico`}
          >
            <div className="s7-products-health-center__abc-split__ring">
              <ProductAbcDonutSvg
                segmentLayouts={segmentLayouts}
                activeKey={activeCurveKey}
                centerLabel={abcDonutCenter.label}
                centerAccentColor={abcDonutCenter.accentColor}
                onSegmentHover={setActiveCurveKey}
              />
            </div>
            <div className="s7-products-health-center__abc-split__labels s7-products-health-center__abc-split__labels--abcd">
              {orderedSegments.map((segment) => {
                const segmentKey = String(segment.key ?? "");
                return (
                  <ProductAbcCurveLabel
                    key={segmentKey}
                    segment={segment}
                    isActive={activeCurveKey === segmentKey}
                    isDimmed={activeCurveKey != null && activeCurveKey !== segmentKey}
                    onHoverStart={() => setActiveCurveKey(segmentKey)}
                    onHoverEnd={() => setActiveCurveKey(null)}
                  />
                );
              })}
              {noSalesBucket ? (
                <ProductAbcNoSalesLabel
                  bucket={noSalesBucket}
                  isActive={activeCurveKey === noSalesKey}
                  isDimmed={activeCurveKey != null && activeCurveKey !== noSalesKey}
                  onHoverStart={() => setActiveCurveKey(noSalesKey)}
                  onHoverEnd={() => setActiveCurveKey(null)}
                />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </HealthMainCard>
  );
}

/**
 * @param {{
 *   title: string;
 *   cardClass: string;
 *   distribution: Array<Record<string, unknown>>;
 *   totalProducts: number;
 *   order: string[];
 *   capSuffixForRow?: (row: Record<string, unknown>) => string;
 * }} props
 */
function ProductDistributionCard({
  title,
  cardClass,
  distribution,
  totalProducts,
  order,
  capSuffixForRow = () => "",
}) {
  const hasData = totalProducts > 0 && distribution.length > 0;
  const sorted = sortDistribution(distribution, order);
  const leadIndex = sorted.reduce(
    (bestIdx, row, idx, arr) =>
      readCount(row.count) > readCount(arr[bestIdx]?.count) ? idx : bestIdx,
    0,
  );

  return (
    <HealthMainCard title={title}>
      <div className={`s7-products-health-center__main-card-body ${cardClass}`}>
        <HealthPodiumTotalLine totalProducts={totalProducts} />
        {!hasData ? (
          <p className="s7-products-health-center__empty">Nenhum produto monitorado.</p>
        ) : (
          <div className="s7-products-health-center__distribution-podium" role="img" aria-label={title}>
            {sorted.map((row, index) => (
              <ProductPodiumColumn
                key={String(row.key ?? index)}
                row={row}
                stepIndex={index === leadIndex ? 0 : index + 1}
                capSuffix={capSuffixForRow(row)}
              />
            ))}
          </div>
        )}
      </div>
    </HealthMainCard>
  );
}

/**
 * @param {{ className?: string }} props
 */
export default function ProductHealthCenter({
  className = "",
  sectionJumpDownTargetRef = null,
  sectionJumpDownAriaLabel = "Ir para busca e filtros",
}) {
  const authReady = useAuthBootstrapReady();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [payload, setPayload] = useState(/** @type {Record<string, unknown> | null} */ (null));

  useEffect(() => {
    if (!authReady) {
      setLoading(true);
      return undefined;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      const res = await fetchProductsHealthSummary();
      if (cancelled) return;
      setLoading(false);
      if (!res.ok || !res.payload) {
        setError(FRIENDLY_LOAD_ERROR);
        setPayload(null);
        return;
      }
      setPayload(res.payload);
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady]);

  const totalProducts = readCount(payload?.total_products);
  const abcCard = payload?.abc_mix != null && typeof payload.abc_mix === "object" ? payload.abc_mix : {};
  const stockCard =
    payload?.stock_coverage != null && typeof payload.stock_coverage === "object" ? payload.stock_coverage : {};
  const profitCard =
    payload?.profitability_mix != null && typeof payload.profitability_mix === "object"
      ? payload.profitability_mix
      : {};

  const summaryCards = useMemo(() => {
    const sc = payload?.summary_cards;
    return sc != null && typeof sc === "object" ? /** @type {Record<string, unknown>} */ (sc) : {};
  }, [payload]);

  const productTurnover = useMemo(() => {
    const raw = summaryCards.product_turnover;
    if (raw == null || typeof raw !== "object") {
      return {
        title: "Giro dos Produtos",
        subtitle: "",
        percent: "0.00",
      };
    }
    const record = /** @type {Record<string, unknown>} */ (raw);
    return {
      title: String(record.title ?? "Giro dos Produtos"),
      subtitle: String(record.subtitle ?? ""),
      percent: String(record.percent ?? "0.00"),
    };
  }, [summaryCards]);

  const summaryKpis = useMemo(() => {
    const deadStockRaw = summaryCards.dead_stock;
    const deadStock =
      deadStockRaw != null && typeof deadStockRaw === "object"
        ? /** @type {Record<string, unknown>} */ (deadStockRaw)
        : {};
    const deadStockDataQuality =
      deadStock.data_quality != null && typeof deadStock.data_quality === "object"
        ? /** @type {Record<string, unknown>} */ (deadStock.data_quality)
        : {};
    const deadStockCount = readCount(summaryCards.dead_stock_count ?? deadStock.products_count);
    const deadStockTotal = readCount(deadStock.products_total ?? payload?.total_products);
    const deadStockDaysThreshold = readDeadStockDaysThreshold(summaryCards);
    const deadStockSubtitle =
      String(deadStock.subtitle ?? "").trim() ||
      `${formatCount(deadStockCount)} de ${formatCount(deadStockTotal)} produtos parados há +${formatCount(deadStockDaysThreshold)} dias`;
    const deadStockTooltip =
      String(deadStock.tooltip ?? "").trim() ||
      "Produtos sem vendas nos últimos 15 dias. Valor estimado com base no custo/estoque cadastrado.";
    const deadStockValueHint =
      String(deadStockDataQuality.message ?? "").trim() || null;

    return {
      deadStockCount,
      deadStockTotal,
      deadStockCapitalBrl: String(summaryCards.dead_stock_capital_brl ?? deadStock.stock_value_brl ?? "0.00"),
      deadStockDaysThreshold,
      deadStockSubtitle,
      deadStockTooltip,
      deadStockValueHint,
      stockoutRiskCount: readCount(summaryCards.stockout_risk_count),
      averageMarkup: String(summaryCards.average_markup ?? "0.00"),
      lowMarkupCount: readCount(summaryCards.low_markup_count),
    };
  }, [summaryCards, payload?.total_products]);

  const rootClass = ["s7-products-health-center", className].filter(Boolean).join(" ");

  return (
    <section className={rootClass} aria-label="Central de Saúde dos Produtos">
      <S7DashboardSectionPanel>
        <header className="s7-products-health-center__head s7-section-jump-host">
          <h2 className="s7-products-health-center__title">Central de Saúde dos Produtos</h2>
          {sectionJumpDownTargetRef ? (
            <S7SectionJumpButton
              direction="down"
              targetRef={sectionJumpDownTargetRef}
              ariaLabel={sectionJumpDownAriaLabel}
            />
          ) : null}
        </header>

        {loading ? (
          <p className="s7-products-health-center__loading" role="status">
            Carregando diagnóstico dos produtos…
          </p>
        ) : null}

        {!loading && error ? (
          <div className="s7-products-health-center__error" role="alert">
            <p className="s7-products-health-center__error-title">{error}</p>
            <p className="s7-products-health-center__error-hint">{FRIENDLY_LOAD_ERROR_HINT}</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="s7-products-health-center__cards-row">
              <ProductAbcCurveCard abcCard={abcCard} totalProducts={totalProducts} />
              <ProductStockCoverageCard stockCard={stockCard} totalProducts={totalProducts} />
              <ProductProfitabilityCard profitCard={profitCard} totalProducts={totalProducts} />
            </div>

            <div
              className="s7-products-health-center__executive-kpis s7-dashboard-executive-kpi-row"
              aria-label="Indicadores executivos da Central de Saúde dos Produtos"
            >
              <VendasExecutiveKpiCard
                title="Estoque parado"
                tone="profit"
                value={formatBrl(summaryKpis.deadStockCapitalBrl)}
                subtitle={summaryKpis.deadStockSubtitle}
                titleDica={summaryKpis.deadStockTooltip}
                valueDica={summaryKpis.deadStockValueHint}
                cardClassName="s7-kpi-chrome--health-dead-stock"
                valueIcon={
                  <PackageX className="vendas-executive-kpi__value-icon-svg s7-products-health-kpi-icon--dead-stock" />
                }
                valueClassName="s7-products-health-kpi-value--dead-stock"
              />
              <VendasExecutiveKpiCard
                title="Reposição prioritária"
                tone="profit"
                value={formatCount(summaryKpis.stockoutRiskCount)}
                subtitle="Curva A/B com até 7 dias de estoque"
                cardClassName="s7-kpi-chrome--health-stockout"
                valueIcon={
                  <AlertTriangle className="vendas-executive-kpi__value-icon-svg s7-products-health-kpi-icon--stockout" />
                }
                valueClassName="s7-products-health-kpi-value--stockout"
              />
              <VendasExecutiveKpiCard
                title="Markup praticado"
                tone="conversion"
                value={formatMarkup(summaryKpis.averageMarkup)}
                subtitle={
                  summaryKpis.lowMarkupCount === 1
                    ? "1 produto abaixo de 1,5x"
                    : `${formatCount(summaryKpis.lowMarkupCount)} produtos abaixo de 1,5x`
                }
                cardClassName="s7-kpi-chrome--health-no-sales"
                valueIcon={
                  <TrendingUp className="vendas-executive-kpi__value-icon-svg s7-products-health-kpi-icon--markup" />
                }
                valueClassName="s7-products-health-kpi-value--markup"
              />
              <VendasExecutiveKpiCard
                title={productTurnover.title}
                tone="quantity"
                value={formatPercent(productTurnover.percent)}
                subtitle={productTurnover.subtitle}
                cardClassName="s7-kpi-chrome--health-active"
                valueIcon={
                  <Activity className="vendas-executive-kpi__value-icon-svg s7-products-health-kpi-icon--conversion" />
                }
                valueClassName="s7-products-health-kpi-value--conversion"
              />
            </div>
          </>
        ) : null}
      </S7DashboardSectionPanel>
    </section>
  );
}
