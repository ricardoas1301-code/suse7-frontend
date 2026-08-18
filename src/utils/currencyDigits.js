// ======================================================================
// Suse7 — BRL: API → dígitos da máscara (centavos como inteiro em string)
// A API/Postgres devolve valores em REAIS (numeric), muitas vezes como number
// JSON (ex.: 89.9 em vez de 89.90). Não usar “tirar o primeiro ponto” da string:
// "89.9" virava "899" → máscara mostrava R$ 8,99.
// ======================================================================

/** Máximo de dígitos da máscara BRL → até R$ 99.999.999,99 (10 dígitos centesimais). */
export const MAX_DIGITOS_MOEDA = 10;

/**
 * Mantém só dígitos da digitação, limitado ao teto da máscara.
 * @param {unknown} value
 */
export function extrairDigitosMoeda(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, MAX_DIGITOS_MOEDA);
}

/**
 * Dígitos centesimais → texto BRL (estilo maquininha). "135000" → "R$ 1.350,00".
 * @param {unknown} digitsOnly
 */
export function formatarMoedaDeDigitos(digitsOnly) {
  const digits = extrairDigitosMoeda(digitsOnly);
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  if (!Number.isFinite(cents)) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Dígitos centesimais → número em reais. "135000" → 1350.
 * @param {unknown} digitsOnly
 * @returns {number | null}
 */
export function digitosMoedaParaNumero(digitsOnly) {
  const digits = extrairDigitosMoeda(digitsOnly);
  if (!digits) return null;
  const cents = parseInt(digits, 10);
  if (!Number.isFinite(cents)) return null;
  return cents / 100;
}

/**
 * Número em reais → dígitos centesimais. 1350 → "135000".
 * @param {unknown} valor
 */
export function numeroMoedaParaDigitos(valor) {
  if (valor == null || valor === "") return "";
  const n = typeof valor === "number" ? valor : Number(String(valor).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return "";
  return apiMoneyValueToDigits(n);
}

/**
 * @param {unknown} v - number | string do backend (reais, 2 decimais)
 * @returns {string} só dígitos, ex. 89,90 reais → "8990"; vazio se null/""/inválido
 */
export function apiMoneyValueToDigits(v) {
  if (v == null || v === "") return "";

  let n;
  if (typeof v === "number") {
    if (!Number.isFinite(v) || v < 0) return "";
    n = v;
  } else {
    const s = String(v).trim().replace(/\s/g, "");
    if (!s) return "";
    if (s.includes(",") && s.includes(".")) {
      n = parseFloat(s.replace(/\./g, "").replace(",", "."));
    } else if (s.includes(",")) {
      n = parseFloat(s.replace(",", "."));
    } else {
      n = parseFloat(s);
    }
    if (!Number.isFinite(n) || n < 0) return "";
  }

  const str = n.toFixed(2);
  const [intPart, fracPart = "00"] = str.split(".");
  const frac2 = fracPart.padEnd(2, "0").slice(0, 2);
  return `${intPart}${frac2}`;
}
