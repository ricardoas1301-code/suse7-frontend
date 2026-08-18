// ======================================================================
// Normalização do contrato — Central de Saúde da Concorrência.
// Frontend somente renderiza payload pronto do backend.
// ======================================================================

/** @param {unknown} value */
function readCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** @param {unknown} rawCard @param {string} fallbackTitle @param {"total" | "compared" | "competitors"} headerKind */
function normalizeCard(rawCard, fallbackTitle, headerKind = "total") {
  if (rawCard == null || typeof rawCard !== "object") {
    if (headerKind === "competitors") {
      return {
        title: fallbackTitle,
        base_label: "Concorrentes analisados",
        total_competitors: 0,
        base_count: 0,
        buckets: [],
        chart: { segments: [], mix_segments_sum_percent: "0.00" },
      };
    }
    if (headerKind === "compared") {
      return {
        title: fallbackTitle,
        total_listings: 0,
        base_label: "Comparados",
        base_count: 0,
        compared_listings_count: 0,
        buckets: [],
        chart: { segments: [], mix_segments_sum_percent: "0.00" },
      };
    }
    return {
      title: fallbackTitle,
      total_listings: 0,
      buckets: [],
      chart: { segments: [], mix_segments_sum_percent: "0.00" },
    };
  }

  const record = /** @type {Record<string, unknown>} */ (rawCard);
  const chart =
    record.chart != null && typeof record.chart === "object"
      ? /** @type {Record<string, unknown>} */ (record.chart)
      : {};

  return {
    ...record,
    title: String(record.title ?? fallbackTitle),
    total_listings: readCount(record.total_listings ?? record.total),
    total_competitors: readCount(record.total_competitors),
    base_label: String(record.base_label ?? fallbackTitle),
    base_count: readCount(
      record.base_count ?? record.comparison_base_count ?? record.total_competitors,
    ),
    compared_listings_count: readCount(
      record.compared_listings_count ?? record.comparison_base_count ?? record.base_count,
    ),
    buckets: Array.isArray(record.buckets) ? record.buckets : [],
    chart: {
      ...chart,
      segments: Array.isArray(chart.segments) ? chart.segments : [],
      mix_segments_sum_percent: String(chart.mix_segments_sum_percent ?? "0.00"),
    },
  };
}

/** @param {unknown} raw @param {string} fallbackTitle */
function normalizeSummaryKpi(raw, fallbackTitle) {
  if (raw == null || typeof raw !== "object") {
    return {
      title: fallbackTitle,
      count: 0,
      total_competitors: 0,
      percent: null,
      subtitle: "",
      data_available: false,
    };
  }
  const record = /** @type {Record<string, unknown>} */ (raw);
  return {
    ...record,
    title: String(record.title ?? fallbackTitle),
    count: record.count != null ? readCount(record.count) : null,
    total_competitors: readCount(record.total_competitors),
    percent: record.percent != null ? String(record.percent) : null,
    subtitle: String(record.subtitle ?? ""),
    data_available: record.data_available !== false,
  };
}

/** @param {unknown} raw */
function normalizeSummaryCards(raw) {
  if (raw == null || typeof raw !== "object") {
    return {
      free_shipping_competitors: normalizeSummaryKpi(null, "Concorrentes com frete grátis"),
      full_competitors: normalizeSummaryKpi(null, "Concorrentes no Full"),
      max_price_pressure: normalizeMaxPricePressure(null),
      inactive_competitors: normalizeSummaryKpi(null, "Concorrentes inativos"),
      data_quality: {
        total_listings: 0,
        active_competitors_count: 0,
      },
    };
  }

  const record = /** @type {Record<string, unknown>} */ (raw);
  return {
    free_shipping_competitors: normalizeSummaryKpi(
      record.free_shipping_competitors,
      "Concorrentes com frete grátis",
    ),
    full_competitors: normalizeSummaryKpi(record.full_competitors, "Concorrentes no Full"),
    max_price_pressure: normalizeMaxPricePressure(record.max_price_pressure),
    inactive_competitors: normalizeSummaryKpi(record.inactive_competitors, "Concorrentes inativos"),
    data_quality:
      record.data_quality != null && typeof record.data_quality === "object"
        ? record.data_quality
        : {
            total_listings: 0,
            active_competitors_count: 0,
          },
  };
}

/** @param {unknown} raw */
function normalizeMaxPricePressure(raw) {
  if (raw == null || typeof raw !== "object") {
    return {
      title: "Maior pressão de preço",
      amount_brl: null,
      display_value: null,
      subtitle: "Nenhum concorrente abaixo do seu preço",
      has_value: false,
    };
  }
  const record = /** @type {Record<string, unknown>} */ (raw);
  return {
    ...record,
    title: String(record.title ?? "Maior pressão de preço"),
    amount_brl: record.amount_brl != null ? String(record.amount_brl) : null,
    display_value: record.display_value != null ? String(record.display_value) : null,
    subtitle: String(record.subtitle ?? ""),
    has_value: record.has_value === true,
  };
}

/** @param {Record<string, unknown>} data */
export function normalizeCompetitionHealthSummaryPayload(data) {
  return {
    total_listings: readCount(data.total_listings ?? data.total_products),
    monitored_listings_count: readCount(data.monitored_listings_count),
    comparison_base_count: readCount(data.comparison_base_count),
    total_competitors: readCount(data.total_competitors),
    scope: data.scope ?? null,
    monitoring_coverage: normalizeCard(data.monitoring_coverage, "Cobertura de Monitoramento", "total"),
    price_position: normalizeCard(data.price_position, "Posição de Preço", "compared"),
    competitor_reputation: normalizeCard(
      data.competitor_reputation,
      "Reputação dos Concorrentes",
      "competitors",
    ),
    summary_cards: normalizeSummaryCards(data.summary_cards),
    metadata: data.metadata ?? null,
  };
}
