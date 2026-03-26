// ======================================================================
// Suse7 — BRL: API → dígitos da máscara (centavos como inteiro em string)
// A API/Postgres devolve valores em REAIS (numeric), muitas vezes como number
// JSON (ex.: 89.9 em vez de 89.90). Não usar “tirar o primeiro ponto” da string:
// "89.9" virava "899" → máscara mostrava R$ 8,99.
// ======================================================================

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
