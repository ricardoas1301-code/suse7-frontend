import S7Icon from "./ui/S7Icon";
import { getMarketplaceBrand } from "../utils/marketplaceBadge";
import { useState } from "react";

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
  const brand = getMarketplaceBrand(marketplace);
  const px = Number(size);
  const wh = Number.isFinite(px) && px > 0 ? Math.round(px) : 22;
  const [failedSrc, setFailedSrc] = useState(null);
  const imgFailed = Boolean(brand.logoSrc) && failedSrc === brand.logoSrc;

  if (!brand.logoSrc || imgFailed) {
    const iconSize = Math.max(12, Math.round(wh * 0.75));
    return (
      <span className={`anuncios-catalog__mkt-fallback ${className}`.trim()}>
        <S7Icon name={brand.fallbackIcon} size={iconSize} strokeWidth={1.85} />
      </span>
    );
  }
  return (
    <span className={`anuncios-catalog__mkt-badge-wrap ${className}`.trim()}>
      <img
        src={brand.logoSrc}
        alt=""
        className="anuncios-catalog__mkt-logo"
        width={wh}
        height={wh}
        style={{ width: wh, height: wh }}
        loading="lazy"
        onError={() => setFailedSrc(brand.logoSrc)}
      />
    </span>
  );
}
