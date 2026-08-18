// ======================================================================
// Score canônico de QUALIDADE DO ANÚNCIO — paridade exata com Resumo Raio-X.
// Fonte comprovada (backend mercadoLivreListingEditorAdapter):
//   1. performancePayload.score (mercado_livre_performance) → detail.quality.score_percent
//   2. healthRow.listing_quality_score (suse7_cache / grid health_listing_quality_score)
// NÃO usar: health, health_percent, listing.health, completude, aliases genéricos.
// ======================================================================

import { toScorePercentCanonico } from "./resolveCanonicalListingRegistrationScore.js";

/**
 * Normaliza score oficial de qualidade ML (0–100 ou fração 0–1 em campo comprovado).
 *
 * @param {unknown} scoreRaw
 * @returns {number | null}
 */
export function toListingQualityScorePercent(scoreRaw) {
  return toScorePercentCanonico(scoreRaw);
}

/**
 * Resolve qualidade do anúncio a partir de linha de catálogo, detail ou snapshot.
 *
 * @param {Record<string, unknown> | null | undefined} source
 * @returns {number | null}
 */
export function resolveCanonicalListingQualityScore(source) {
  if (source == null || typeof source !== "object") return null;

  const qualityBlock =
    source.quality != null && typeof source.quality === "object" && !Array.isArray(source.quality)
      ? /** @type {Record<string, unknown>} */ (source.quality)
      : null;

  const raw =
    qualityBlock?.score_percent ??
    source.listing_quality_score_percent ??
    source.listingQualityScorePercent ??
    source.listing_quality_score ??
    source.listingQualityScore ??
    source.health_listing_quality_score ??
    source.initialQualitySnapshot?.score ??
    source.initialQualitySnapshot?.score_percent;

  return toListingQualityScorePercent(raw);
}
