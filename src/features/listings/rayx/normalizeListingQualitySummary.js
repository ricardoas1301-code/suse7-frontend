/**
 * @param {unknown} value
 */
function toNumberOrNull(value) {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} scoreRaw
 */
function toScorePercent(scoreRaw) {
  const n = toNumberOrNull(scoreRaw);
  if (n == null) return null;
  if (n > 0 && n <= 1) return Math.max(0, Math.min(100, Math.round(n * 100)));
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Fallback SUS7 de apresentação quando não há classificação textual oficial.
 * @param {number | null} scorePercent
 * @param {number | null} objectivesCount
 */
function fallbackQualityPresentation(scorePercent, objectivesCount) {
  if (scorePercent == null) {
    return {
      level_label: "Sem calcular",
      objectives_label: "Ainda não há dados suficientes",
      status_tone: "neutral",
    };
  }
  if (scorePercent >= 100) {
    return {
      level_label: "Qualidade máxima",
      objectives_label: "Objetivos alcançados",
      status_tone: "success",
    };
  }
  if (scorePercent >= 85) {
    return {
      level_label: "Profissional",
      objectives_label:
        objectivesCount != null
          ? `${objectivesCount} objetivo${objectivesCount === 1 ? "" : "s"} para alcançar`
          : "Há melhorias possíveis",
      status_tone: "info",
    };
  }
  if (scorePercent >= 60) {
    return {
      level_label: "Satisfatória",
      objectives_label:
        objectivesCount != null
          ? `${objectivesCount} objetivo${objectivesCount === 1 ? "" : "s"} para alcançar`
          : "Há melhorias recomendadas",
      status_tone: "warning",
    };
  }
  if (scorePercent > 0) {
    return {
      level_label: "Básica",
      objectives_label:
        objectivesCount != null
          ? `${objectivesCount} objetivo${objectivesCount === 1 ? "" : "s"} para alcançar`
          : "Requer atenção",
      status_tone: "danger",
    };
  }
  return {
    level_label: "Sem calcular",
    objectives_label: "Ainda não há dados suficientes",
    status_tone: "neutral",
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} rawListing
 * @param {Record<string, unknown> | null | undefined} listingHealthSource
 */
export function normalizeListingQualitySummary(rawListing, listingHealthSource) {
  const source = listingHealthSource && typeof listingHealthSource === "object" ? listingHealthSource : {};
  const scorePercent = toScorePercent(source.score_percent ?? rawListing?.listingQualityScore ?? rawListing?.healthPercent);
  const objectivesCount = toNumberOrNull(source.objectives_count);

  const fallback = fallbackQualityPresentation(scorePercent, objectivesCount);

  const levelLabelRaw =
    source.level_label != null && String(source.level_label).trim() !== "" ? String(source.level_label).trim() : null;
  const objectivesLabelRaw =
    source.objectives_label != null && String(source.objectives_label).trim() !== ""
      ? String(source.objectives_label).trim()
      : null;
  const toneRaw =
    source.status_tone != null && String(source.status_tone).trim() !== "" ? String(source.status_tone).trim() : null;
  const sourceRaw = source.source != null && String(source.source).trim() !== "" ? String(source.source).trim() : null;

  return {
    score_percent: scorePercent,
    display_value: scorePercent != null ? `${scorePercent}%` : "—",
    score_label: "Qualidade do anúncio",
    level_label: levelLabelRaw ?? fallback.level_label,
    objectives_label: objectivesLabelRaw ?? fallback.objectives_label,
    objectives_count: objectivesCount,
    tone: toneRaw ?? fallback.status_tone,
    status_tone: toneRaw ?? fallback.status_tone,
    source: sourceRaw ?? (scorePercent == null ? "unavailable" : "fallback"),
  };
}

