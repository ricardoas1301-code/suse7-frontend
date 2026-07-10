import PricingHealthSlicedPieCard, { buildStandardBucketLines } from "./PricingHealthSlicedPieCard.jsx";

const BUCKET_ORDER = [
  "margin_30_plus",
  "margin_20_29",
  "margin_10_19",
  "margin_0_9",
  "loss",
  "no_data",
];

/** @param {{ cardData: Record<string, unknown>; totalListings: number }} props */
export default function PricingProjectedMarginCard({ cardData, totalListings }) {
  return (
    <PricingHealthSlicedPieCard
      cardData={cardData}
      totalListings={totalListings}
      bucketOrder={BUCKET_ORDER}
      cardClassSuffix="projected-margin"
      buildBucketLines={buildStandardBucketLines}
      compactPills
    />
  );
}
