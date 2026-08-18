import PricingHealthSlicedPieCard, { buildStandardBucketLines } from "./PricingHealthSlicedPieCard.jsx";

const BUCKET_ORDER = ["healthy", "attention", "critical", "no_data"];

/** @param {{ cardData: Record<string, unknown>; totalListings: number }} props */
export default function PricingOfferStatusCard({ cardData, totalListings }) {
  return (
    <PricingHealthSlicedPieCard
      cardData={cardData}
      totalListings={totalListings}
      bucketOrder={BUCKET_ORDER}
      cardClassSuffix="offer-status"
      buildBucketLines={buildStandardBucketLines}
    />
  );
}
