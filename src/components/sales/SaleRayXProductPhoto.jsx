// ======================================================
// Foto do produto no Raio-x da venda (área livre abaixo dos dados).
// ======================================================

import { useEffect, useState } from "react";
import { resolveSalesRowProductThumbUrl, salesRowThumbCacheKey } from "../../utils/resolveSalesRowProductThumbUrl.js";

/**
 * @param {{ product?: Record<string, unknown> | null; variant?: "default" | "hero" }} props
 */
export default function SaleRayXProductPhoto({ product, variant = "default" }) {
  const [imageUrl, setImageUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const cacheKey = salesRowThumbCacheKey(product);

  useEffect(() => {
    let cancelled = false;
    if (!product || typeof product !== "object") {
      setImageUrl("");
      setFailed(false);
      return;
    }
    setFailed(false);
    (async () => {
      const resolved = await resolveSalesRowProductThumbUrl(product);
      if (cancelled) return;
      setImageUrl(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [product, cacheKey]);

  if (!imageUrl || failed) return null;

  const mediaClassName =
    variant === "hero"
      ? "vendas-sale-rayx__product-media vendas-sale-rayx__product-media--hero"
      : "vendas-sale-rayx__product-media";

  return (
    <div className={mediaClassName} aria-hidden={false}>
      <div className="sales-radar-modal__hero-image-wrapper vendas-sale-rayx__product-media-frame">
        <img
          src={imageUrl}
          alt=""
          className="sales-radar-modal__hero-image vendas-sale-rayx__product-media-image"
          loading="lazy"
          decoding="async"
          onError={() => {
            setFailed(true);
          }}
        />
      </div>
    </div>
  );
}
