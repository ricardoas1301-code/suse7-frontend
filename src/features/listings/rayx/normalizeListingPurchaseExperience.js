/**
 * @param {unknown} value
 */
function toNumberOrNull(value) {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} raw
 */
function toScorePercent(raw) {
  const n = toNumberOrNull(raw);
  if (n == null || n < 0) return null;
  if (n > 0 && n <= 1) return Math.max(0, Math.min(100, Math.round(n * 100)));
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * @param {number | null} scorePercent
 */
function toneFromScore(scorePercent) {
  if (scorePercent == null) return "neutral";
  if (scorePercent >= 100) return "success";
  if (scorePercent >= 85) return "info";
  if (scorePercent >= 60) return "warning";
  if (scorePercent > 0) return "danger";
  return "neutral";
}

/**
 * @param {number | null} scorePercent
 */
function fallbackLabel(scorePercent) {
  if (scorePercent == null) return "Ainda não podemos calculá-la";
  if (scorePercent >= 95) return "Muito bem";
  if (scorePercent >= 75) return "Boa";
  if (scorePercent >= 60) return "Regular";
  if (scorePercent > 0) return "Atenção";
  return "Sem calcular";
}

/**
 * @param {Record<string, unknown> | null | undefined} rawListing
 * @param {Record<string, unknown> | null | undefined} purchaseExperienceSource
 */
export function normalizeListingPurchaseExperience(rawListing, purchaseExperienceSource) {
  const source =
    purchaseExperienceSource && typeof purchaseExperienceSource === "object"
      ? purchaseExperienceSource
      : {};

  const scorePercent = toScorePercent(source.score_percent ?? rawListing?.experienceScore ?? rawListing?.experienceStatusScore);
  const label =
    source.label != null && String(source.label).trim() !== ""
      ? String(source.label).trim()
      : fallbackLabel(scorePercent);
  const tone =
    source.tone != null && String(source.tone).trim() !== ""
      ? String(source.tone).trim()
      : toneFromScore(scorePercent);
  const rawSource =
    source.source != null && String(source.source).trim() !== ""
      ? String(source.source).trim()
      : null;

  const displayValue =
    source.display_value != null && String(source.display_value).trim() !== ""
      ? String(source.display_value).trim()
      : scorePercent != null
        ? `${scorePercent}%`
        : "—";

  let description =
    source.description != null && String(source.description).trim() !== ""
      ? String(source.description).trim()
      : null;
  if (description && label && description.toLowerCase() === label.toLowerCase()) {
    description = null;
  }

  return {
    score_percent: scorePercent,
    display_value: displayValue,
    title: "Experiência de compra",
    label,
    description,
    tone,
    source: rawSource ?? (scorePercent == null && label.includes("Ainda não") ? "unavailable" : "fallback"),
  };
}

