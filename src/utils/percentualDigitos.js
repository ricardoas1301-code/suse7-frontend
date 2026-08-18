// ======================================================================
// Percentual — máscara por dígitos (estilo maquininha / Custo Operacional).
// 2035 → 20,35 | 1000 → 10,00 | 1 → 0,01
// ======================================================================

/** Máximo 9999,99 → 6 dígitos (centésimos de percentual). */
export const MAX_DIGITOS_PERCENTUAL = 6;

/** Simulação PI — máx. 99,99% (4 dígitos na máscara). */
export const MAX_DIGITOS_PERCENTUAL_SIMULACAO = 4;

/**
 * @param {unknown} value
 * @param {number} [maxDigitos]
 */
export function extrairDigitosPercentual(value, maxDigitos = MAX_DIGITOS_PERCENTUAL) {
  const limite =
    Number.isFinite(maxDigitos) && maxDigitos > 0
      ? Math.floor(maxDigitos)
      : MAX_DIGITOS_PERCENTUAL;
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, limite);
}

/**
 * @param {unknown} v — number | string da API (ex.: 12.5 ou "12,50")
 * @returns {string} dígitos centesimais, ex. 12,50% → "1250"
 */
export function apiPercentValueToDigits(v) {
  if (v == null || v === "") return "";

  let n;
  if (typeof v === "number") {
    if (!Number.isFinite(v) || v < 0) return "";
    n = v;
  } else {
    const s = String(v).trim().replace("%", "").replace(/\s/g, "");
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

/**
 * @param {unknown} digitsOnly
 * @param {number} [maxDigitos]
 */
export function formatarPercentualDeDigitos(digitsOnly, maxDigitos = MAX_DIGITOS_PERCENTUAL) {
  const digits = extrairDigitosPercentual(digitsOnly, maxDigitos);
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  if (!Number.isFinite(cents)) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Valor exibido/salvo → dígitos da máscara.
 * @param {unknown} raw
 */
export function valorPercentualExibidoParaDigitos(raw) {
  if (raw == null || String(raw).trim() === "") return "";
  return apiPercentValueToDigits(raw);
}
