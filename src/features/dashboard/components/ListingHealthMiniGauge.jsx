// ======================================================================
// Mini medidor semicircular — Central de Saúde (faixas de cadastro).
// Reutiliza ProductHealthProgress (Raio-X / Produto).
// ======================================================================

import ProductHealthProgress from "../../../components/ProductHealthProgress.jsx";
import "./ListingHealthMiniGauge.css";

/** @type {Record<string, { gaugeValue: number; accentClass: string }>} */
const TONE_PRESETS = {
  complete: { gaugeValue: 100, accentClass: "s7-listing-health-mini-gauge--complete" },
  excellent: { gaugeValue: 95, accentClass: "s7-listing-health-mini-gauge--excellent" },
  attention: { gaugeValue: 80, accentClass: "s7-listing-health-mini-gauge--attention" },
  critical: { gaugeValue: 60, accentClass: "s7-listing-health-mini-gauge--critical" },
  urgent: { gaugeValue: 25, accentClass: "s7-listing-health-mini-gauge--urgent" },
};

/**
 * @param {{
 *   tone?: string;
 *   gaugeValue?: number | null;
 *   displayText?: string;
 *   ariaLabel?: string;
 *   variant?: "compact" | "hero" | "podium" | "podium-lead";
 * }} props
 */
export default function ListingHealthMiniGauge({
  tone = "neutral",
  gaugeValue = null,
  displayText = "",
  ariaLabel = "",
  variant = "compact",
}) {
  const preset = TONE_PRESETS[tone] ?? TONE_PRESETS.attention;
  const value =
    gaugeValue != null && Number.isFinite(Number(gaugeValue))
      ? Math.max(0, Math.min(100, Number(gaugeValue)))
      : preset.gaugeValue;
  const text = displayText != null && String(displayText).trim() !== "" ? String(displayText).trim() : null;
  const variantClass =
    variant === "podium-lead"
      ? "s7-listing-health-mini-gauge--podium-lead-size"
      : variant === "podium"
        ? "s7-listing-health-mini-gauge--podium-size"
        : variant === "hero"
          ? "s7-listing-health-mini-gauge--hero-size"
          : "s7-listing-health-mini-gauge--compact-size";

  return (
    <div
      className={`s7-listing-health-mini-gauge ${preset.accentClass} ${variantClass}`.trim()}
      aria-label={ariaLabel || undefined}
    >
      <ProductHealthProgress
        percent={value}
        percentText={text}
        showLabel={false}
        variant="semi"
        accent="primary"
        suppressTooltip
      />
    </div>
  );
}
