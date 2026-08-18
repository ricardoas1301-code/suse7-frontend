// ======================================================================
// Card Reputação dos Concorrentes — Central de Saúde da Concorrência.
// ======================================================================

import CompetitionHealthPieCard, {
  formatPercentFromBackend,
} from "./CompetitionHealthPieCard.jsx";

const BUCKET_ORDER = [
  "platinum",
  "gold",
  "mercado_lider",
  "green_reputation",
  "no_reputation",
];

/** @param {Record<string, unknown>} bucket */
function buildReputationLines(bucket) {
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
export default function CompetitionCompetitorReputationCard({ cardData, totalListings }) {
  return (
    <CompetitionHealthPieCard
      cardData={cardData}
      totalListings={totalListings}
      bucketOrder={BUCKET_ORDER}
      cardClassSuffix="reputation"
      headerMode="competitors"
      buildBucketLines={buildReputationLines}
      emptyMessage="Nenhum concorrente analisado."
    />
  );
}
