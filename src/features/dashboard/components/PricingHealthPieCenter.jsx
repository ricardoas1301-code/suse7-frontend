// ======================================================================
// Centro da pizza cortada — Central de Saúde da Precificação (hover premium).
// ======================================================================

/**
 * @param {{
 *   cx: number;
 *   cy: number;
 *   label?: string | null;
 *   accentColor?: string | null;
 * }} props
 */
export default function PricingHealthPieCenter({ cx, cy, label = null, accentColor = null }) {
  if (!label) return null;

  return (
    <g className="s7-pricing-health-center__pie-center" aria-hidden="true">
      <circle
        cx={cx}
        cy={cy}
        r={28}
        fill={accentColor ?? "#64748b"}
        className="s7-pricing-health-center__pie-center-disc"
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        className="s7-pricing-health-center__pie-center-label"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * @param {string | null} activeKey
 * @param {Array<{ segment: Record<string, unknown> }>} segmentLayouts
 */
export function resolvePricingHealthPieSegmentState(activeKey, segmentLayouts) {
  const isOnChartFocus =
    activeKey != null &&
    segmentLayouts.some(({ segment }) => String(segment.key ?? "") === activeKey);

  return segmentLayouts.map(({ segment, startDeg, endDeg }) => {
    const key = String(segment.key ?? "");
    const isActive = isOnChartFocus && activeKey === key;
    const isHidden = activeKey != null && !isActive;

    return {
      key,
      segment,
      startDeg,
      endDeg,
      isActive,
      isHidden,
    };
  });
}
