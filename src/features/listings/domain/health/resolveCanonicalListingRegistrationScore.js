// ======================================================================
// Score canônico de qualidade/cadastro do anúncio — SSOT visual compartilhado.
// Consumido por: filtros, lista, Raio-X lateral, Raio-X Resumo.
// ======================================================================

/**
 * Normaliza score bruto para percentual inteiro 0–100.
 * Ausência ou inválido → null (nunca 100% de fallback).
 *
 * @param {unknown} scoreRaw
 * @returns {number | null}
 */
export function toScorePercentCanonico(scoreRaw) {
  if (scoreRaw == null || String(scoreRaw).trim() === "") return null;
  const n = Number(String(scoreRaw).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  if (n > 0 && n <= 1) return Math.max(0, Math.min(100, Math.round(n * 100)));
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Resolve score de cadastro/qualidade a partir de linha de catálogo ou listing do Raio-X.
 *
 * @param {Record<string, unknown> | null | undefined} source
 * @returns {number | null}
 */
export function resolveCanonicalListingRegistrationScore(source) {
  if (source == null || typeof source !== "object") return null;

  const raw =
    source.score_percent ??
    source.registrationQualityScorePercent ??
    source.healthPercent ??
    source.health_percent ??
    source.listingQualityScore ??
    source.listing_quality_score ??
    source.health_listing_quality_score;

  return toScorePercentCanonico(raw);
}
