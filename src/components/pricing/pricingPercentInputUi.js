// ======================================================
// Entrada de percentual (Precificação Inteligente) — máscara BR, cursor estável.
// ======================================================

export const MAX_DIGITOS_INTEIROS_PERCENTUAL = 4;
export const MAX_CASAS_DECIMAIS_PERCENTUAL = 2;

/**
 * Exibição BR a partir de valor salvo na API (ex.: "12.50" → "12,50").
 * @param {unknown} raw
 */
export function formatarPercentualParaInput(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (s === "") return "";
  return s.replace(".", ",");
}

/**
 * Exibição com sinal para margem espelhada do resultado (ex.: -22,96).
 * Não usa máscara por dígitos — evita zerar/ocultar negativos.
 * @param {unknown} margemPct
 */
export function formatarMargemSignedExibicao(margemPct) {
  if (margemPct == null || !Number.isFinite(Number(margemPct))) return "";
  const n = Number(margemPct);
  const abs = Math.abs(n);
  const texto = abs.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `-${texto}` : texto;
}

/**
 * Sanitiza digitação: até 4 inteiros + vírgula + até 2 decimais.
 * Aceita: 0 | 1 | 10 | 15,5 | 25,75 | 9999,99
 * @param {unknown} raw
 */
export function sanitizarEntradaPercentual(raw) {
  const bruto = String(raw ?? "").replace(/[^\d,]/g, "");
  if (bruto === "") return "";

  const sepIdx = bruto.indexOf(",");
  if (sepIdx === -1) {
    const inteiros = bruto.slice(0, MAX_DIGITOS_INTEIROS_PERCENTUAL);
    return inteiros;
  }

  const inteiros = bruto.slice(0, sepIdx).slice(0, MAX_DIGITOS_INTEIROS_PERCENTUAL);
  const decimais = bruto
    .slice(sepIdx + 1)
    .replace(/,/g, "")
    .slice(0, MAX_CASAS_DECIMAIS_PERCENTUAL);

  if (bruto.endsWith(",") && decimais === "") {
    return `${inteiros},`;
  }

  return decimais === "" ? `${inteiros},` : `${inteiros},${decimais}`;
}

/**
 * Normalização leve após blur (sem padding de casas decimais).
 * @param {unknown} raw
 */
export function formatarPercentualAposBlur(raw) {
  const s = sanitizarEntradaPercentual(raw).trim();
  if (s === "") return "";
  if (s.endsWith(",")) {
    return s.slice(0, -1);
  }
  return s;
}

/**
 * Mantém o cursor estável após sanitização (por contagem de dígitos à esquerda).
 * @param {string} textoAnterior
 * @param {string} textoNovo
 * @param {number | null | undefined} selecaoInicio
 */
export function calcularSelecaoAposSanitizar(textoAnterior, textoNovo, selecaoInicio) {
  const pos = selecaoInicio ?? textoAnterior.length;
  if (textoAnterior === textoNovo) return pos;

  const digitosAntes = (textoAnterior.slice(0, pos).match(/\d/g) || []).length;
  if (digitosAntes <= 0) return 0;

  let vistos = 0;
  for (let i = 0; i < textoNovo.length; i += 1) {
    if (/\d/.test(textoNovo[i])) {
      vistos += 1;
      if (vistos >= digitosAntes) return i + 1;
    }
  }
  return textoNovo.length;
}

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
export function parsePercentualInputParaNumero(raw) {
  const bruto = String(raw ?? "").trim();
  if (bruto === "" || /[,.]$/.test(bruto)) return null;
  const s = formatarPercentualAposBlur(bruto);
  if (s === "") return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
