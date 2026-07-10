// ======================================================================
// Card Posição de Preço — Central de Saúde da Concorrência.
// ======================================================================

import CompetitionHealthPieCard, {
  formatPercentFromBackend,
} from "./CompetitionHealthPieCard.jsx";

const BUCKET_ORDER = ["cheaper", "competitive", "more_expensive"];

/** @param {Record<string, unknown>} bucket */
function buildPricePositionLines(bucket) {
  const status = String(bucket.label ?? "").trim();
  return {
    line1: status,
    line2: formatPercentFromBackend(bucket.share_percent ?? bucket.mix_share_percent),
  };
}

/**
 * @param {{
 *   cardData: Record<string, unknown>;
 *   totalListings: number;
 * }} props
 */
export default function CompetitionPricePositionCard({ cardData, totalListings }) {
  return (
    <CompetitionHealthPieCard
      cardData={cardData}
      totalListings={totalListings}
      bucketOrder={BUCKET_ORDER}
      cardClassSuffix="price"
      headerMode="total"
      buildBucketLines={buildPricePositionLines}
    />
  );
}
