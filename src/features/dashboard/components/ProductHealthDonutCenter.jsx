// ======================================================================
// Centro do donut — Central de Saúde dos Produtos (hover premium).
// ======================================================================

/**
 * @param {{
 *   cx: number;
 *   cy: number;
 *   innerR: number;
 *   label?: string | null;
 *   accentColor?: string | null;
 * }} props
 */
export default function ProductHealthDonutCenter({ cx, cy, innerR, label = null, accentColor = null }) {
  if (!label) {
    return <circle cx={cx} cy={cy} r={innerR - 1} className="s7-products-health-center__abc-donut-hole-svg" />;
  }

  const discRadius = Math.max(innerR - 8, 24);

  return (
    <g className="s7-products-health-center__abc-donut-center" aria-hidden="true">
      <circle
        cx={cx}
        cy={cy}
        r={discRadius}
        fill={accentColor ?? "#64748b"}
        className="s7-products-health-center__abc-donut-center-disc"
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        className="s7-products-health-center__abc-donut-center-label"
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
export function resolveProductHealthDonutSegmentState(activeKey, segmentLayouts) {
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
