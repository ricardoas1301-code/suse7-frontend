// ======================================================================
// Apresentação contextual — filtros rápidos Concorrência (S1.6).
// Camada visual: match por concorrente, ordenação por matches, slots visíveis.
// Classificação de linha: competitionHealthListClassifiers.js (SSOT S1.5).
// ======================================================================

import Decimal from "decimal.js";
import {
  COMPETITION_HEALTH_PRICE_TOLERANCE_PCT,
} from "./competitionHealthConstants.js";
import {
  anuncioAtendeFiltroRapidoConcorrencia,
  isConcorrenteAtivoComparavel,
  isConcorrenteInativoMonitorado,
  isFreteGratisConcorrente,
  isConcorrenteLogisticaFull,
  listarConcorrentesAtivosComparaveis,
  normalizarIdFiltroRapidoConcorrencia,
  resolverChaveReputacaoConcorrente,
} from "./competitionHealthListClassifiers.js";

/** Filtros com destaque contextual por concorrente individual. */
export const CONCORRENCIA_CONTEXTUAL_COMPETITOR_FILTER_IDS = new Set([
  "cheaper",
  "more_expensive",
  "free_shipping_competitors",
  "full_competitors",
  "inactive_competitors",
  "platinum",
  "gold",
  "mercado_lider",
  "green_reputation",
  "no_reputation",
]);

/** @param {string} filterId */
export function isContextualCompetitorFilter(filterId) {
  const id = normalizarIdFiltroRapidoConcorrencia(filterId);
  return CONCORRENCIA_CONTEXTUAL_COMPETITOR_FILTER_IDS.has(id);
}

/**
 * Entrada da linha na lista — paridade contextual S1.6.1 para "Mais baratos".
 * Mantém `anuncioAtendeFiltroRapidoConcorrencia` (SSOT agregado/Central) para os demais.
 *
 * @param {{
 *   competitors?: readonly unknown[];
 *   competitorsCount?: number | null;
 *   ownListing?: unknown;
 * }} ctx
 * @param {string} filterId
 */
export function linhaAtendeFiltroListaConcorrencia(ctx, filterId) {
  const id = normalizarIdFiltroRapidoConcorrencia(filterId);
  if (!id || id === "all") return true;

  if (id === "cheaper") {
    const competitors = Array.isArray(ctx?.competitors) ? ctx.competitors : [];
    return contarMatchesContextuaisConcorrentes(competitors, id, ctx?.ownListing ?? null) >= 1;
  }

  return anuncioAtendeFiltroRapidoConcorrencia(ctx, id);
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

/**
 * Match visual por concorrente (explica por que a linha entrou no filtro).
 * @param {unknown} competitor
 * @param {string} filterId
 * @param {unknown} ownListing
 */
export function concorrenteAtendeFiltroContextual(competitor, filterId, ownListing) {
  const id = normalizarIdFiltroRapidoConcorrencia(filterId);
  if (!CONCORRENCIA_CONTEXTUAL_COMPETITOR_FILTER_IDS.has(id)) return true;
  if (!competitor || typeof competitor !== "object") return false;

  if (
    id === "platinum" ||
    id === "gold" ||
    id === "mercado_lider" ||
    id === "green_reputation" ||
    id === "no_reputation"
  ) {
    if (!isConcorrenteAtivoComparavel(competitor)) return false;
    const record = /** @type {Record<string, unknown>} */ (competitor);
    return resolverChaveReputacaoConcorrente(record.reputation) === id;
  }

  if (id === "free_shipping_competitors") {
    const record = /** @type {Record<string, unknown>} */ (competitor);
    return isConcorrenteAtivoComparavel(competitor) && isFreteGratisConcorrente(record.shipping);
  }

  if (id === "full_competitors") {
    const record = /** @type {Record<string, unknown>} */ (competitor);
    return isConcorrenteAtivoComparavel(competitor) && isConcorrenteLogisticaFull(record.shipping);
  }

  if (id === "inactive_competitors") {
    return isConcorrenteInativoMonitorado(competitor);
  }

  if (id === "cheaper" || id === "more_expensive") {
    if (!isConcorrenteAtivoComparavel(competitor)) return false;
    const ourPrice = extrairPrecoProprio(ownListing);
    const theirPrice = extrairPrecoConcorrente(competitor);
    if (ourPrice == null || theirPrice == null) return false;

    if (id === "more_expensive") {
      return theirPrice.lt(ourPrice);
    }

    const toleranceFactor = new Decimal(1).plus(
      new Decimal(COMPETITION_HEALTH_PRICE_TOLERANCE_PCT).div(100),
    );
    return theirPrice.gt(ourPrice.mul(toleranceFactor));
  }

  return false;
}

/**
 * @param {readonly unknown[]} competitors
 * @param {string} filterId
 * @param {unknown} ownListing
 */
export function contarMatchesContextuaisConcorrentes(competitors, filterId, ownListing) {
  if (!isContextualCompetitorFilter(filterId)) return 0;
  const list = Array.isArray(competitors) ? competitors : [];
  let total = 0;
  for (const competitor of list) {
    if (concorrenteAtendeFiltroContextual(competitor, filterId, ownListing)) total += 1;
  }
  return total;
}

/**
 * @param {readonly unknown[]} competitors
 * @param {string} filterId
 * @param {unknown} ownListing
 */
export function calcularRatioMatchesContextuais(competitors, filterId, ownListing) {
  const matches = contarMatchesContextuaisConcorrentes(competitors, filterId, ownListing);
  if (matches <= 0) return 0;
  const base = Math.max(1, listarConcorrentesAtivosComparaveis(competitors).length);
  return matches / base;
}

/**
 * Monta até `limit` slots visíveis: matches primeiro, demais depois (estável).
 * @param {readonly unknown[]} competitors
 * @param {string} filterId
 * @param {unknown} ownListing
 * @param {number} [limit]
 * @returns {Array<{ competitor: unknown | null; contextualMuted: boolean }>}
 */
export function montarSlotsConcorrentesContextuais(competitors, filterId, ownListing, limit = 6) {
  const list = Array.isArray(competitors) ? competitors : [];
  const contextual = isContextualCompetitorFilter(filterId);

  if (!contextual) {
    return Array.from({ length: limit }, (_, idx) => ({
      competitor: list[idx] ?? null,
      contextualMuted: false,
    }));
  }

  /** @type {unknown[]} */
  const matches = [];
  /** @type {unknown[]} */
  const others = [];

  for (const competitor of list) {
    if (concorrenteAtendeFiltroContextual(competitor, filterId, ownListing)) {
      matches.push(competitor);
    } else {
      others.push(competitor);
    }
  }

  const ordered = [...matches, ...others];
  return Array.from({ length: limit }, (_, idx) => {
    const competitor = ordered[idx] ?? null;
    return {
      competitor,
      contextualMuted:
        competitor != null &&
        !concorrenteAtendeFiltroContextual(competitor, filterId, ownListing),
    };
  });
}

/**
 * @param {readonly Record<string, unknown>[]} rows
 * @param {string} filterId
 * @param {(row: Record<string, unknown>) => readonly unknown[]} getCompetitors
 * @param {(row: Record<string, unknown>) => unknown} getOwnListing
 * @param {(row: Record<string, unknown>) => number} getSalesCount
 */
export function ordenarLinhasPorMatchesContextuais(
  rows,
  filterId,
  getCompetitors,
  getOwnListing,
  getSalesCount,
) {
  const id = normalizarIdFiltroRapidoConcorrencia(filterId);
  if (!isContextualCompetitorFilter(id)) return [...rows];

  return [...rows].sort((rowA, rowB) => {
    const competitorsA = getCompetitors(rowA);
    const competitorsB = getCompetitors(rowB);
    const ownA = getOwnListing(rowA);
    const ownB = getOwnListing(rowB);

    const matchA = contarMatchesContextuaisConcorrentes(competitorsA, id, ownA);
    const matchB = contarMatchesContextuaisConcorrentes(competitorsB, id, ownB);
    if (matchB !== matchA) return matchB - matchA;

    const ratioA = calcularRatioMatchesContextuais(competitorsA, id, ownA);
    const ratioB = calcularRatioMatchesContextuais(competitorsB, id, ownB);
    if (ratioB !== ratioA) return ratioB > ratioA ? 1 : -1;

    const salesA = getSalesCount(rowA) || 0;
    const salesB = getSalesCount(rowB) || 0;
    if (salesB !== salesA) return salesB - salesA;

    const idA = String(rowA?.monitored_listing_id ?? rowA?.id ?? "");
    const idB = String(rowB?.monitored_listing_id ?? rowB?.id ?? "");
    return idA.localeCompare(idB, undefined, { numeric: true });
  });
}
