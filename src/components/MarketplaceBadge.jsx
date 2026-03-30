import { getMarketplaceBadgeAsset } from "../utils/marketplaceBadge";

/**
 * Logo discreta por marketplace (extensível).
 * @param {{ marketplace: string }} props
 */
export default function MarketplaceBadge({ marketplace }) {
  const cfg = getMarketplaceBadgeAsset(marketplace);
  if (!cfg) {
    return (
      <span className="anuncios-catalog__mkt-fallback" title={marketplace || undefined}>
        {marketplace ? String(marketplace).slice(0, 3).toUpperCase() : "—"}
      </span>
    );
  }
  return (
    <span className="anuncios-catalog__mkt-badge-wrap" title={cfg.alt}>
      <img src={cfg.src} alt="" className="anuncios-catalog__mkt-logo" width={22} height={22} loading="lazy" />
    </span>
  );
}
