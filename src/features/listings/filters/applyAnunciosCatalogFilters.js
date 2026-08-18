// ======================================================================
// Aplicação de filtros/ordenação — listagem Anúncios (Central de Saúde SSOT).
// ======================================================================

import Decimal from "decimal.js";
import {
  anuncioAtendeFiltroRapidoLista,
  isOrdenacaoFiltroRapidoAnuncios,
  normalizarIdFiltroRapidoAnuncios,
} from "../domain/health/listingHealthListClassifiers.js";

/** @param {unknown} raw */
function parseApiDecimal(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  try {
    const dec = new Decimal(String(raw).trim().replace(",", "."));
    return dec.isFinite() ? dec : null;
  } catch {
    return null;
  }
}

function stableListingId(row) {
  const id = row?.id ?? row?.externalId;
  return id != null ? String(id) : "";
}

function sortByListingIdStable(a, b) {
  return stableListingId(a).localeCompare(stableListingId(b), undefined, { numeric: true });
}

function readListingSalesCount(row) {
  const n = Number(row?.salesCount ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function readListingProfitDec(row) {
  return parseApiDecimal(row?.contributionProfitBrl ?? row?.netProfitBrl);
}

/**
 * @param {Record<string, unknown>[]} rows
 * @param {string} filterId
 */
export function applyAnunciosCatalogFilters(rows, filterId) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const id = normalizarIdFiltroRapidoAnuncios(filterId);
  const filtered = isOrdenacaoFiltroRapidoAnuncios(id)
    ? [...rows]
    : rows.filter((row) => anuncioAtendeFiltroRapidoLista(row, id));

  if (id === "top_profit") {
    return [...filtered].sort((a, b) => {
      const aProfit = readListingProfitDec(a);
      const bProfit = readListingProfitDec(b);
      const aVal = aProfit != null ? aProfit.toNumber() : -Infinity;
      const bVal = bProfit != null ? bProfit.toNumber() : -Infinity;
      if (bVal !== aVal) return bVal - aVal;
      return sortByListingIdStable(a, b);
    });
  }

  return [...filtered].sort((a, b) => {
    const aSales = readListingSalesCount(a);
    const bSales = readListingSalesCount(b);
    if (bSales !== aSales) return bSales - aSales;
    return sortByListingIdStable(a, b);
  });
}
