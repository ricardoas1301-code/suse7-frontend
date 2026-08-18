// ======================================================================

// Aplicação de filtros/ordenação — listagem Precificações (buckets canônicos).

// ======================================================================



import Decimal from "decimal.js";

import {

  anuncioAtendeFiltroRapidoPrecificacoesLista,

  isOrdenacaoFiltroRapidoPrecificacoes,

  normalizarIdFiltroRapidoPrecificacoes,

} from "../domain/pricingHealth/pricingHealthListClassifiers.js";

import {

  anuncioPossuiFinanceiroAvaliavelCanonicamente,

  lerBucketsCanonicosPrecificacaoDaLinha,

} from "../domain/pricingHealth/pricingHealthBucketReader.js";



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



/** Lucro canônico — somente do bucket SSOT (sem reinterpretar grid). */

function readListingProfitDecCanonicamente(row) {

  const buckets = lerBucketsCanonicosPrecificacaoDaLinha(row);

  if (!buckets || buckets.financial_evaluable !== true) return null;

  return parseApiDecimal(buckets.profit_brl);

}



/**

 * @param {Record<string, unknown>[]} rows

 * @param {string} filterId

 */

export function applyPrecificacoesCatalogFilters(rows, filterId) {

  if (!Array.isArray(rows) || rows.length === 0) return [];



  const id = normalizarIdFiltroRapidoPrecificacoes(filterId);

  const filtered = isOrdenacaoFiltroRapidoPrecificacoes(id)

    ? [...rows]

    : rows.filter((row) => anuncioAtendeFiltroRapidoPrecificacoesLista(row, id));



  if (id === "top_profit") {

    return [...filtered].sort((a, b) => {

      const aProfit = readListingProfitDecCanonicamente(a);

      const bProfit = readListingProfitDecCanonicamente(b);

      const aHas = aProfit != null;

      const bHas = bProfit != null;



      if (aHas && !bHas) return -1;

      if (!aHas && bHas) return 1;

      if (!aHas && !bHas) return sortByListingIdStable(a, b);



      const cmp = bProfit.cmp(aProfit);

      if (cmp !== 0) return cmp;

      return sortByListingIdStable(a, b);

    });

  }



  return [...filtered].sort((a, b) => {

    const aComplete = anuncioPossuiFinanceiroAvaliavelCanonicamente(a);

    const bComplete = anuncioPossuiFinanceiroAvaliavelCanonicamente(b);



    if (aComplete && !bComplete) return -1;

    if (!aComplete && bComplete) return 1;



    const aSales = readListingSalesCount(a);

    const bSales = readListingSalesCount(b);

    if (bSales !== aSales) return bSales - aSales;

    return sortByListingIdStable(a, b);

  });

}


