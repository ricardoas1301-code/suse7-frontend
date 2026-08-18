// ======================================================
// Referência e diff de preço × concorrentes (PI Concorrentes)
// Somente apresentação — Decimal para diferença monetária (sem float).
// Preparado para atalhos futuros (média, menor, maior, empatar).
// ======================================================

import Decimal from "decimal.js";

import { parsePrecoMonetario } from "../concorrencia/concorrenciaCompetitorDisplay.js";

/** @typedef {"classic" | "premium"} ListingTypeChoice */

/**
 * @param {unknown} value
 * @returns {Decimal | null}
 */
function paraDecimalMonetario(value) {
  const reais = parsePrecoMonetario(value);
  if (reais == null) return null;
  try {
    return new Decimal(reais).toDecimalPlaces(2);
  } catch {
    return null;
  }
}

/**
 * Preço de referência para comparar concorrentes — somente cenário VENDENDO.
 *
 * @param {{
 *   tipoVendendo: ListingTypeChoice;
 *   precoVendendoExibido?: number | null;
 *   precoVendendoBase?: number | null;
 *   editandoVendendo?: boolean;
 *   precoVendendoEdicao?: number | null;
 * }} params
 * @returns {Decimal | null}
 */
export function getCompetitivePriceReference({
  tipoVendendo: _tipoVendendo,
  precoVendendoExibido = null,
  precoVendendoBase = null,
  editandoVendendo = false,
  precoVendendoEdicao = null,
}) {
  if (editandoVendendo) {
    const edicao = paraDecimalMonetario(precoVendendoEdicao);
    if (edicao != null && edicao.gt(0)) return edicao;
  }

  const exibido = paraDecimalMonetario(precoVendendoExibido);
  if (exibido != null && exibido.gt(0)) return exibido;

  const base = paraDecimalMonetario(precoVendendoBase);
  if (base != null && base.gt(0)) return base;

  return null;
}

/**
 * diff = meu_preco_vendendo_simulado - preco_concorrente
 *
 * @param {unknown} meuPreco
 * @param {unknown} precoConcorrente
 * @returns {{ tipo: "acima" | "abaixo" | "equivalente"; diff: Decimal; diffAbs: Decimal } | null}
 */
export function calculateCompetitorPriceDiff(meuPreco, precoConcorrente) {
  const nosso = paraDecimalMonetario(meuPreco);
  const deles = paraDecimalMonetario(precoConcorrente);
  if (nosso == null || deles == null) return null;

  const diff = nosso.minus(deles);
  if (diff.isZero()) {
    return { tipo: "equivalente", diff, diffAbs: new Decimal(0) };
  }

  return {
    tipo: diff.gt(0) ? "acima" : "abaixo",
    diff,
    diffAbs: diff.abs(),
  };
}

/**
 * @param {{ tipo: "acima" | "abaixo" | "equivalente"; diffAbs: Decimal } | null} diffResult
 * @param {string} [currency]
 * @param {{ classePrefixo?: string }} [opts]
 * @returns {{ tipo: "acima" | "abaixo" | "equivalente" | "indisponivel"; rotulo: string | null; classe: string }}
 */
export function formatCompetitorDiffLabel(diffResult, currency = "BRL", opts = {}) {
  const prefixo = opts.classePrefixo ?? "s7-concorrente-card__compare";

  if (diffResult == null) {
    return {
      tipo: "indisponivel",
      rotulo: null,
      seta: null,
      texto: null,
      classe: `${prefixo}--indisponivel`,
    };
  }

  if (diffResult.tipo === "equivalente") {
    return {
      tipo: "equivalente",
      rotulo: "= mesmo preço",
      seta: "=",
      texto: "mesmo preço",
      classe: `${prefixo}--neutral`,
    };
  }

  const diffFmt = diffResult.diffAbs.toNumber().toLocaleString("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  });

  if (diffResult.tipo === "acima") {
    return {
      tipo: "acima",
      rotulo: `↑ ${diffFmt} acima`,
      seta: "↑",
      texto: `${diffFmt} acima`,
      classe: `${prefixo}--acima`,
    };
  }

  return {
    tipo: "abaixo",
    rotulo: `↓ ${diffFmt} abaixo`,
    seta: "↓",
    texto: `${diffFmt} abaixo`,
    classe: `${prefixo}--abaixo`,
  };
}

/**
 * Atalho PI — referência + diff + rótulo para um concorrente.
 *
 * @param {unknown} precoReferenciaVendendo
 * @param {unknown} precoConcorrente
 * @param {string} [currency]
 * @param {{ classePrefixo?: string }} [opts]
 */
export function montarComparativoConcorrentePreco(
  precoReferenciaVendendo,
  precoConcorrente,
  currency = "BRL",
  opts = {},
) {
  const diff = calculateCompetitorPriceDiff(precoReferenciaVendendo, precoConcorrente);
  return formatCompetitorDiffLabel(diff, currency, opts);
}
