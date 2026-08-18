// ======================================================================
// Classificadores de lista — paridade com Central de Saúde da Concorrência.
// SSOT servidor: suse7-backend/src/domain/competition/health/*
// Sem float em preço — Decimal.js.
// ======================================================================

import Decimal from "decimal.js";
import {
  COMPETITION_HEALTH_MONITORING_LIMIT,
  COMPETITION_HEALTH_PRICE_TOLERANCE_PCT,
} from "./competitionHealthConstants.js";

const NIVEIS_REPUTACAO_VERDE = new Set(["5_green", "4_light_green"]);

const STATUS_ANUNCIO_ML_ATIVO = "active";
const STATUS_ANUNCIO_ML_INATIVO = new Set([
  "paused",
  "closed",
  "inactive",
  "not_found",
  "under_review",
  "forbidden",
  "unavailable",
]);

/** @param {unknown} value */
function normalizarStatusMl(value) {
  if (value == null || String(value).trim() === "") return null;
  const s = String(value).trim().toLowerCase();
  if (/^[a-z][a-z0-9_]*$/.test(s)) return s;
  return null;
}

/** @param {string | null | undefined} status */
function isMercadoLivreListingActive(status) {
  const s = normalizarStatusMl(status);
  if (!s) return true;
  if (s === STATUS_ANUNCIO_ML_ATIVO) return true;
  if (STATUS_ANUNCIO_ML_INATIVO.has(s)) return false;
  return true;
}

/** @param {unknown} raw */
function toDecimalOrNull(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  try {
    const dec = new Decimal(String(raw).trim().replace(",", "."));
    return dec.isFinite() ? dec : null;
  } catch {
    return null;
  }
}

/** @param {unknown} competitor */
export function isConcorrenteAtivoComparavel(competitor) {
  if (!competitor || typeof competitor !== "object") return false;
  const record = /** @type {Record<string, unknown>} */ (competitor);
  if (record.is_active === false) return false;
  if (record.is_competitor_listing_active === false) return false;

  const status =
    record.competitor_listing_status != null
      ? String(record.competitor_listing_status).trim()
      : record.listing_status != null
        ? String(record.listing_status).trim()
        : null;

  return isMercadoLivreListingActive(status);
}

/** @param {readonly unknown[]} competitors */
export function listarConcorrentesAtivosComparaveis(competitors) {
  const list = Array.isArray(competitors) ? competitors : [];
  return list.filter((c) => isConcorrenteAtivoComparavel(c));
}

/** @param {unknown} competitor */
export function isConcorrenteInativoMonitorado(competitor) {
  if (!competitor || typeof competitor !== "object") return false;
  const record = /** @type {Record<string, unknown>} */ (competitor);
  if (record.is_active === false) return false;
  if (record.is_competitor_listing_active === false) return true;

  const status =
    record.competitor_listing_status != null
      ? String(record.competitor_listing_status).trim()
      : record.listing_status != null
        ? String(record.listing_status).trim()
        : null;

  return !isMercadoLivreListingActive(status);
}

/** @param {unknown} shipping */
export function isFreteGratisConcorrente(shipping) {
  if (!shipping || typeof shipping !== "object") return false;
  const record = /** @type {Record<string, unknown>} */ (shipping);
  if (record.free_shipping === true) return true;
  const cost = record.cost ?? record.shipping_cost;
  if (cost != null && String(cost).trim() !== "") {
    const n = Number(String(cost).replace(",", "."));
    return Number.isFinite(n) && n === 0;
  }
  return false;
}

/** @param {unknown} shipping */
export function isConcorrenteLogisticaFull(shipping) {
  if (!shipping || typeof shipping !== "object") return false;
  const record = /** @type {Record<string, unknown>} */ (shipping);
  const logisticType =
    record.logistic_type != null ? String(record.logistic_type).trim().toLowerCase() : "";
  return logisticType === "fulfillment";
}

/** @param {unknown} competitor */
function extrairPrecoConcorrente(competitor) {
  if (!competitor || typeof competitor !== "object") return null;
  const record = /** @type {Record<string, unknown>} */ (competitor);
  for (const key of ["last_seen_price", "competitor_price", "price"]) {
    const dec = toDecimalOrNull(record[key]);
    if (dec != null && dec.gt(0)) return dec;
  }
  return null;
}

/** @param {unknown} ownListing */
function extrairPrecoProprio(ownListing) {
  if (!ownListing || typeof ownListing !== "object") return null;
  return toDecimalOrNull(/** @type {Record<string, unknown>} */ (ownListing).price);
}

/** @param {readonly unknown[]} competitors */
function resolverMenorPrecoConcorrente(competitors) {
  const list = Array.isArray(competitors) ? competitors : [];
  /** @type {Decimal | null} */
  let min = null;
  for (const competitor of list) {
    if (!isConcorrenteAtivoComparavel(competitor)) continue;
    const price = extrairPrecoConcorrente(competitor);
    if (price == null) continue;
    if (min == null || price.lt(min)) min = price;
  }
  return min;
}

/**
 * @param {unknown} ownListing
 * @param {readonly unknown[]} competitors
 * @returns {"cheaper" | "competitive" | "more_expensive" | "no_comparison"}
 */
export function resolverChavePosicaoPreco(ownListing, competitors) {
  const ourPrice = extrairPrecoProprio(ownListing);
  const minCompetitor = resolverMenorPrecoConcorrente(competitors);
  if (ourPrice == null || !ourPrice.gt(0) || minCompetitor == null) return "no_comparison";

  if (ourPrice.lt(minCompetitor)) return "cheaper";

  const toleranceFactor = new Decimal(1).plus(
    new Decimal(COMPETITION_HEALTH_PRICE_TOLERANCE_PCT).div(100),
  );
  const competitiveCeiling = minCompetitor.mul(toleranceFactor);
  if (ourPrice.lte(competitiveCeiling)) return "competitive";
  return "more_expensive";
}

/** @param {number | null | undefined} competitorsCount */
export function resolverChaveCoberturaMonitoramento(competitorsCount) {
  const count = Math.max(0, Math.trunc(Number(competitorsCount) || 0));
  if (count === 0) return "no_competitors";
  if (count >= COMPETITION_HEALTH_MONITORING_LIMIT) return "complete_monitoring";
  return "incomplete_monitoring";
}

/**
 * @param {unknown} reputation
 * @returns {"platinum" | "gold" | "mercado_lider" | "green_reputation" | "no_reputation"}
 */
export function resolverChaveReputacaoConcorrente(reputation) {
  const rep = reputation && typeof reputation === "object" ? /** @type {Record<string, unknown>} */ (reputation) : {};
  const powerSeller =
    rep.power_seller_status != null ? String(rep.power_seller_status).trim().toLowerCase() : "";

  if (powerSeller === "platinum") return "platinum";
  if (powerSeller === "gold") return "gold";
  if (powerSeller === "silver") return "mercado_lider";

  const levelId = rep.level_id != null ? String(rep.level_id).trim().toLowerCase() : "";
  if (levelId && NIVEIS_REPUTACAO_VERDE.has(levelId)) return "green_reputation";

  return "no_reputation";
}

/**
 * @param {readonly unknown[]} competitors
 * @param {number | null | undefined} [competitorsCount]
 */
export function resolverContagemMonitoramentoLista(competitors, competitorsCount) {
  if (competitorsCount != null && Number.isFinite(Number(competitorsCount))) {
    return Math.max(0, Math.trunc(Number(competitorsCount)));
  }
  return listarConcorrentesAtivosComparaveis(competitors).length;
}

/**
 * @param {{
 *   competitors?: readonly unknown[];
 *   competitorsCount?: number | null;
 *   ownListing?: unknown;
 * }} ctx
 * @param {string} filterId
 */
export function anuncioAtendeFiltroRapidoConcorrencia(ctx, filterId) {
  const id = String(filterId ?? "").trim();
  if (!id || id === "all") return true;

  const competitors = Array.isArray(ctx?.competitors) ? ctx.competitors : [];
  const ownListing = ctx?.ownListing ?? null;
  const count = resolverContagemMonitoramentoLista(competitors, ctx?.competitorsCount);

  if (id === "with") {
    return resolverChaveCoberturaMonitoramento(count) !== "no_competitors";
  }
  if (id === "without") {
    return resolverChaveCoberturaMonitoramento(count) === "no_competitors";
  }
  if (id === "complete") {
    return resolverChaveCoberturaMonitoramento(count) === "complete_monitoring";
  }
  if (id === "incomplete") {
    return resolverChaveCoberturaMonitoramento(count) === "incomplete_monitoring";
  }

  if (id === "cheaper" || id === "competitive" || id === "more_expensive") {
    return resolverChavePosicaoPreco(ownListing, competitors) === id;
  }

  if (id === "free_shipping_competitors") {
    return listarConcorrentesAtivosComparaveis(competitors).some((c) =>
      isFreteGratisConcorrente(/** @type {Record<string, unknown>} */ (c).shipping),
    );
  }

  if (id === "full_competitors") {
    return listarConcorrentesAtivosComparaveis(competitors).some((c) =>
      isConcorrenteLogisticaFull(/** @type {Record<string, unknown>} */ (c).shipping),
    );
  }

  if (id === "inactive_competitors") {
    return competitors.some((c) => isConcorrenteInativoMonitorado(c));
  }

  const reputationKeys = new Set([
    "platinum",
    "gold",
    "mercado_lider",
    "green_reputation",
    "no_reputation",
  ]);
  if (reputationKeys.has(id)) {
    return listarConcorrentesAtivosComparaveis(competitors).some(
      (c) =>
        resolverChaveReputacaoConcorrente(
          /** @type {Record<string, unknown>} */ (c).reputation,
        ) === id,
    );
  }

  return true;
}

/** IDs de filtro rápido com compatibilidade de URL/estado legado. */
export const CONCORRENCIA_QUICK_FILTER_ID_ALIASES = {
  inactive: "inactive_competitors",
};

/**
 * @param {string} filterId
 * @returns {string}
 */
export function normalizarIdFiltroRapidoConcorrencia(filterId) {
  const id = String(filterId ?? "").trim();
  if (!id) return "all";
  return /** @type {Record<string, string>} */ (CONCORRENCIA_QUICK_FILTER_ID_ALIASES)[id] ?? id;
}
