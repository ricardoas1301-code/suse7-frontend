import { getMarketplaceBadgeAsset } from "../utils/marketplaceBadge";

/**
 * Logo discreta por marketplace (extensível).
 * @param {{
 *   marketplace?: string | null;
 *   label?: string | null;
 *   size?: number;
 *   className?: string;
 * }} props
 */
export default function MarketplaceBadge({ marketplace, label, size = 22, className = "" }) {
  const cfg = getMarketplaceBadgeAsset(marketplace);
  const labelTrim = label != null && String(label).trim() !== "" ? String(label).trim() : "";
  const title = labelTrim || cfg?.alt || (marketplace ? String(marketplace) : undefined);

  if (!cfg) {
    const text =
      labelTrim ||
      (marketplace && String(marketplace).trim() !== "" ? String(marketplace).slice(0, 3).toUpperCase() : "—");
    return (
      <span className={`anuncios-catalog__mkt-fallback ${className}`.trim()} title={title}>
        {text}
      </span>
    );
  }
  const px = Number(size);
  const wh = Number.isFinite(px) && px > 0 ? Math.round(px) : 22;
  return (
    <span className={`anuncios-catalog__mkt-badge-wrap ${className}`.trim()} title={title}>
      <img
        src={cfg.src}
        alt=""
        className="anuncios-catalog__mkt-logo"
        width={wh}
        height={wh}
        style={{ width: wh, height: wh }}
        loading="lazy"
      />
    </span>
  );
}
