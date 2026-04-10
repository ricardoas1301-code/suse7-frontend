-- =====================================================================
-- Coerência tarifa: zerar % absurda; backfill de % só quando implícito ≤ 25%.
-- Alinhado a mapMlToListingHealthRow (MAX_DERIVED_SALE_FEE_PERCENT / teto 30).
-- =====================================================================

UPDATE public.marketplace_listing_health
SET sale_fee_percent = NULL
WHERE sale_fee_percent IS NOT NULL
  AND sale_fee_percent::numeric > 30;

UPDATE public.marketplace_listing_health h
SET sale_fee_percent = ROUND(
  (
    (h.sale_fee_amount::numeric / NULLIF(
      COALESCE(
        NULLIF(h.promotional_price_brl, 0::numeric),
        NULLIF(h.promotion_price, 0::numeric),
        l.price::numeric
      ),
      0::numeric
    )) * 100
  )::numeric,
  2
)
FROM public.marketplace_listings l
WHERE l.user_id = h.user_id
  AND l.marketplace = h.marketplace
  AND l.external_listing_id = h.external_listing_id
  AND h.sale_fee_percent IS NULL
  AND h.sale_fee_amount IS NOT NULL
  AND h.sale_fee_amount > 0
  AND COALESCE(
    NULLIF(h.promotional_price_brl, 0::numeric),
    NULLIF(h.promotion_price, 0::numeric),
    l.price::numeric
  ) IS NOT NULL
  AND COALESCE(
    NULLIF(h.promotional_price_brl, 0::numeric),
    NULLIF(h.promotion_price, 0::numeric),
    l.price::numeric
  ) > 0
  AND (
    (h.sale_fee_amount::numeric / NULLIF(
      COALESCE(
        NULLIF(h.promotional_price_brl, 0::numeric),
        NULLIF(h.promotion_price, 0::numeric),
        l.price::numeric
      ),
      0::numeric
    )) * 100
  ) <= 25
  AND (
    (h.sale_fee_amount::numeric / NULLIF(
      COALESCE(
        NULLIF(h.promotional_price_brl, 0::numeric),
        NULLIF(h.promotion_price, 0::numeric),
        l.price::numeric
      ),
      0::numeric
    )) * 100
  ) > 0;
