import PricingHealthSlicedPieCard, { buildStandardBucketLines } from "./PricingHealthSlicedPieCard.jsx";

const BUCKET_ORDER = [
  "active_promotion",
  "scheduled_promotion",
  "available_promotion",
  "no_promotion",
];

/** @param {{ cardData: Record<string, unknown>; totalListings: number }} props */
export default function PricingPromotionStatusCard({ cardData, totalListings }) {
  return (
    <PricingHealthSlicedPieCard
      cardData={cardData}
      totalListings={totalListings}
      bucketOrder={BUCKET_ORDER}
      cardClassSuffix="promotion-status"
      buildBucketLines={buildStandardBucketLines}
    />
  );
}
