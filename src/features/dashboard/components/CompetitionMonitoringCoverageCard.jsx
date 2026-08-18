// ======================================================================
// Card Cobertura de Monitoramento — Central de Saúde da Concorrência.
// ======================================================================

import CompetitionHealthPieCard, { buildStandardBucketLines } from "./CompetitionHealthPieCard.jsx";

const BUCKET_ORDER = ["complete_monitoring", "incomplete_monitoring", "no_competitors"];

/**
 * @param {{
 *   cardData: Record<string, unknown>;
 *   totalListings: number;
 * }} props
 */
export default function CompetitionMonitoringCoverageCard({ cardData, totalListings }) {
  return (
    <CompetitionHealthPieCard
      cardData={cardData}
      totalListings={totalListings}
      bucketOrder={BUCKET_ORDER}
      cardClassSuffix="monitoring"
      headerMode="total"
      buildBucketLines={buildStandardBucketLines}
    />
  );
}
