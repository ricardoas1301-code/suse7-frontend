// ======================================================================
// Percentual direto SUSE7 — 6 → 6,00 (NÃO máscara centésimal 6 → 0,06).
// A vírgula é separador decimal — nunca descartada nem reinterpretada como centavos.
// ======================================================================

import Decimal from "decimal.js";

export const MAX_DIGITOS_INTEIROS_PERCENTUAL_DIRETO = 4;
export const MAX_CASAS_DECIMAIS_PERCENTUAL_DIRETO = 2;

/**
 * @param {unknown} raw
 */
export function limparEntradaPercentualDireto(raw) {
  return String(raw ?? "")
    .replace(/%/g, "")
    .trim();
}

/**
 * Sanitiza durante edição — preserva vírgula decimal e estados intermediários ("6,").
 * @param {unknown} raw
 */
export function sanitizarPercentualDiretoEdicao(raw) {
  let s = limparEntradaPercentualDireto(raw);
  if (s.includes(".") && !s.includes(",")) {
    s = s.replace(".", ",");
  }

  s = s.replace(/[^\d,]/g, "");
  const firstComma = s.indexOf(",");
  if (firstComma === -1) {
    return s.slice(0, MAX_DIGITOS_INTEIROS_PERCENTUAL_DIRETO);
  }

  const intPart = s.slice(0, firstComma).slice(0, MAX_DIGITOS_INTEIROS_PERCENTUAL_DIRETO);
  const decPart = s
    .slice(firstComma + 1)
    .replace(/,/g, "")
    .slice(0, MAX_CASAS_DECIMAIS_PERCENTUAL_DIRETO);

  if (s.endsWith(",") && decPart.length === 0) {
    return `${intPart},`;
  }

  return decPart.length === 0 ? intPart : `${intPart},${decPart}`;
}

/** @deprecated alias interno */
export function sanitizarPercentualDireto(raw) {
  return sanitizarPercentualDiretoEdicao(raw);
}

/**
 * Exibição canônica pt-BR com duas casas decimais (blur/save).
 * @param {unknown} raw
 */
export function formatarPercentualDiretoFinal(raw) {
  const s = sanitizarPercentualDiretoEdicao(raw);
  if (!s) return "";
  if (s.endsWith(",")) {
    const intPart = s.slice(0, -1);
    if (!intPart) return "";
    return `${intPart},00`;
  }
  const [intPart, decPart = ""] = s.split(",");
  const dec = decPart.padEnd(2, "0").slice(0, 2);
  return `${intPart || "0"},${dec}`;
}

/** Alias semântico para edição ao vivo. */
export function formatarPercentualDiretoEdicao(raw) {
  return sanitizarPercentualDiretoEdicao(raw);
}

/**
 * Posiciona o caret preservando a vírgula decimal (não usa contagem só de dígitos).
 * @param {string} textoAnterior
 * @param {string} textoNovo
 * @param {number | null | undefined} cursorAnterior
 */
export function calcularCaretPosicaoDecimal(textoAnterior, textoNovo, cursorAnterior) {
  const pos = cursorAnterior ?? textoAnterior.length;
  if (textoAnterior === textoNovo) return pos;

  const prefixoAnterior = textoAnterior.slice(0, pos);
  const digitosAntes = (prefixoAnterior.match(/\d/g) || []).length;
  const tinhaVirgulaAntes = prefixoAnterior.includes(",");

  if (digitosAntes <= 0) return 0;

  let digitosVistos = 0;
  for (let i = 0; i < textoNovo.length; i += 1) {
    const ch = textoNovo[i];
    if (ch === ",") {
      if (tinhaVirgulaAntes && digitosVistos >= digitosAntes) {
        return Math.min(i + 1, textoNovo.length);
      }
      continue;
    }
    if (/\d/.test(ch)) {
      digitosVistos += 1;
      if (digitosVistos >= digitosAntes && (!tinhaVirgulaAntes || textoNovo.slice(0, i + 1).includes(","))) {
        return i + 1;
      }
    }
  }

  return textoNovo.length;
}

/**
 * @param {unknown} raw
 * @returns {Decimal | null}
 */
export function parsePercentualDiretoParaDecimal(raw) {
  const final = formatarPercentualDiretoFinal(raw);
  if (!final) return null;
  try {
    const d = new Decimal(final.replace(",", "."));
    if (!d.isFinite()) return null;
    return d;
  } catch {
    return null;
  }
}

/**
 * Payload API — ex.: "6.00"
 * @param {unknown} raw
 */
export function percentualDiretoParaPayload(raw) {
  const d = parsePercentualDiretoParaDecimal(raw);
  if (!d || d.lt(0) || d.gt(100)) return null;
  return d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

/**
 * @param {unknown} raw
 */
export function percentualDiretoEstaVazio(raw) {
  return sanitizarPercentualDiretoEdicao(raw) === "";
}

/**
 * @param {unknown} raw
 */
export function formatarPercentualDiretoComSufixo(raw) {
  const final = formatarPercentualDiretoFinal(raw);
  if (!final) return "";
  return `${final} %`;
}
