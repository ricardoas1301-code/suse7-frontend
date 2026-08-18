// ======================================================

// Comparativo visual de preço — card Concorrentes (PI legado)

// Delega para competitivePriceCompare.js (Decimal, rótulos unificados).

// ======================================================



import { montarComparativoConcorrentePreco } from "./competitivePriceCompare.js";



/**

 * @param {unknown} precoNosso

 * @param {unknown} precoConcorrente

 * @param {string} [currency]

 * @returns {{ tipo: "acima" | "abaixo" | "equivalente" | "indisponivel"; rotulo: string | null; classe: string } | null}

 */

export function calcularComparativoPrecoPi(precoNosso, precoConcorrente, currency = "BRL") {

  return montarComparativoConcorrentePreco(precoNosso, precoConcorrente, currency, {

    classePrefixo: "pricing-intelligence-page__competitor-mini-card-compare",

  });

}


