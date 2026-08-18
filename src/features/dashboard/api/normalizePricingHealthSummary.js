// ======================================================================
// Normalização do contrato — Central de Saúde da Precificação.
// Frontend somente renderiza payload pronto do backend.
// ======================================================================

import { formatPercentFromBackend } from "../components/PricingHealthSlicedPieCard.jsx";

/** @param {unknown} value */

function readCount(value) {

  const n = Number(value);

  return Number.isFinite(n) ? n : 0;

}



/** @param {unknown} rawCard @param {string} fallbackTitle */

function normalizePieCard(rawCard, fallbackTitle) {

  if (rawCard == null || typeof rawCard !== "object") {

    return {

      title: fallbackTitle,

      total_listings: 0,

      buckets: [],

      chart: { type: "sliced_pie", segments: [], mix_segments_sum_percent: "0.00" },

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

    buckets: Array.isArray(record.buckets) ? record.buckets : [],

    chart: {

      type: String(chart.type ?? "sliced_pie"),

      segments: Array.isArray(chart.segments) ? chart.segments : [],

      mix_segments_sum_percent: String(chart.mix_segments_sum_percent ?? "0.00"),

    },

  };

}



/** @param {unknown} raw @param {string} fallbackTitle */

function normalizeCountKpi(raw, fallbackTitle) {

  if (raw == null || typeof raw !== "object") {

    return {

      title: fallbackTitle,

      value: 0,

      count: 0,

      subtitle: "",

      data_available: false,

    };

  }



  const record = /** @type {Record<string, unknown>} */ (raw);

  const count = readCount(record.value ?? record.count);



  return {

    title: String(record.title ?? fallbackTitle),

    value: count,

    count,

    subtitle: String(record.subtitle ?? ""),

    data_available: record.data_available !== false,

  };

}



/** @param {unknown} raw @param {string} fallbackTitle */

function normalizePercentKpi(raw, fallbackTitle) {

  if (raw == null || typeof raw !== "object") {

    return {

      title: fallbackTitle,

      percent: null,

      display_value: null,

      count: 0,

      subtitle: "",

      data_available: false,

    };

  }



  const record = /** @type {Record<string, unknown>} */ (raw);
  const percentRaw = record.percent ?? record.display_value ?? record.value;
  const percent = percentRaw != null ? String(percentRaw) : null;

  return {
    title: String(record.title ?? fallbackTitle),
    percent,
    display_value:
      percent != null ? formatPercentFromBackend(percent.replace(/%\s*$/, "")) : null,
    count: readCount(record.count),
    subtitle: String(record.subtitle ?? ""),
    data_available: record.data_available !== false,
  };
}



/** @param {unknown} raw */

export function normalizePricingHealthSummaryPayload(raw) {

  if (raw == null || typeof raw !== "object") {

    return {

      ok: false,

      total_listings: 0,

      offer_status: normalizePieCard(null, "Status da Oferta"),

      projected_margin: normalizePieCard(null, "Margem Projetada"),

      promotion_status: normalizePieCard(null, "Promoções dos Anúncios"),

      summary_cards: {

        classic_listings: normalizeCountKpi(null, "Anúncios Clássico"),

        premium_listings: normalizeCountKpi(null, "Anúncios Premium"),

        free_shipping_listings: normalizePercentKpi(null, "Com frete grátis"),

        active_promotion_listings: normalizeCountKpi(null, "Anúncios em promoção"),

      },

    };

  }



  const record = /** @type {Record<string, unknown>} */ (raw);

  const summaryCards =

    record.summary_cards != null && typeof record.summary_cards === "object"

      ? /** @type {Record<string, unknown>} */ (record.summary_cards)

      : {};

  const promotionCard =

    record.promotion_status != null && typeof record.promotion_status === "object"

      ? record.promotion_status

      : record.pricing_data_quality;



  return {

    ...record,

    ok: record.ok !== false,

    total_listings: readCount(record.total_listings),

    offer_status: normalizePieCard(record.offer_status, "Status da Oferta"),

    projected_margin: normalizePieCard(record.projected_margin, "Margem Projetada"),

    promotion_status: normalizePieCard(promotionCard, "Promoções dos Anúncios"),

    summary_cards: {

      classic_listings: normalizeCountKpi(summaryCards.classic_listings, "Anúncios Clássico"),

      premium_listings: normalizeCountKpi(summaryCards.premium_listings, "Anúncios Premium"),

      free_shipping_listings: normalizePercentKpi(summaryCards.free_shipping_listings, "Com frete grátis"),

      active_promotion_listings: normalizeCountKpi(

        summaryCards.active_promotion_listings,

        "Anúncios em promoção",

      ),

    },

  };

}


