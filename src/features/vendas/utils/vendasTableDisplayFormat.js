// ======================================================================
// Formatação visual da tabela de Vendas — somente renderização (P_2.3).
// Não altera payload, backend ou dados persistidos.
// ======================================================================

/** Siglas técnicas preservadas em maiúsculas. */
const SIGLAS_PRESERVADAS = new Set(["SKU", "MLB", "ML", "ID", "CPF", "CNPJ", "BRL", "S7"]);

/**
 * Title Case amigável para Conta, Canal e Comprador na listagem.
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function formatVendasTableTitleCase(text) {
  const t = text != null ? String(text).trim() : "";
  if (!t) return "";
  return t
    .split(/\s+/)
    .filter(Boolean)
    .map(formatVendasTableWordTitleCase)
    .join(" ");
}

/** @param {string} word */
function formatVendasTableWordTitleCase(word) {
  const w = String(word);
  if (!w) return w;

  const upper = w.toUpperCase();
  if (SIGLAS_PRESERVADAS.has(upper)) return upper;

  const isAllUpper = w === upper && /[A-Z]/.test(w);
  const isAllLower = w === w.toLowerCase() && /[a-z]/.test(w);

  if (isAllUpper && w.length > 1) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }

  if (isAllLower) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }

  // Já em formato amigável (ex.: Charles, Rafael)
  if (w.charAt(0) === w.charAt(0).toUpperCase() && w.slice(1) === w.slice(1).toLowerCase()) {
    return w;
  }

  return w;
}
