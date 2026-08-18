import ProductHealthProgress from "../../../components/ProductHealthProgress.jsx";
import "./ListingQualityGauge.css";

/**
 * Termômetro semicircular de qualidade do anúncio — família visual única (ProductHealthProgress).
 *
 * @param {{
 *   scorePercent?: number | null;
 *   variant?: "sidebar" | "summary" | "tableCompact";
 * }} props
 */
export default function ListingQualityGauge({ scorePercent = null, variant = "sidebar" }) {
  const hasScore = scorePercent != null && Number.isFinite(Number(scorePercent));
  const clamped = hasScore ? Math.max(0, Math.min(100, Number(scorePercent))) : 0;
  const variantClass = ["sidebar", "summary", "tableCompact"].includes(variant) ? variant : "sidebar";

  return (
    <div
      className={`listing-quality-gauge listing-quality-gauge--${variantClass}`}
      aria-label={hasScore ? `Qualidade do cadastro: ${clamped}%` : "Qualidade do cadastro: sem dados"}
    >
      <ProductHealthProgress
        percent={clamped}
        percentText={hasScore ? null : "—"}
        showLabel={false}
        variant="semi"
        accent="primary"
        suppressTooltip={variantClass === "tableCompact"}
      />
    </div>
  );
}
