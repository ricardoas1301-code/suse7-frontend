// ======================================================================
// Código numérico — confirmação consciente de ação destrutiva (4 dígitos)
// ======================================================================

/**
 * Gera código entre 1000 e 9999 usando crypto.getRandomValues.
 */
export function gerarCodigoConfirmacaoDestrutiva() {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    const value = 1000 + (buffer[0] % 9000);
    return String(value);
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * @param {unknown} value
 */
export function normalizarEntradaCodigoConfirmacao(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 4);
}

/**
 * @param {string} expected
 * @param {string} typed
 */
export function codigosConfirmacaoConferem(expected, typed) {
  const left = normalizarEntradaCodigoConfirmacao(expected);
  const right = normalizarEntradaCodigoConfirmacao(typed);
  return left.length === 4 && right.length === 4 && left === right;
}
