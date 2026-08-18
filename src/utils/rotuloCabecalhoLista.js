/**
 * Converte rótulo de cabeçalho em duas linhas para uma linha (paridade altura Clientes 360).
 * @param {[string, string]} linhas
 * @returns {string}
 */
export function rotuloCabecalhoListaUnicaLinha(linhas) {
  const [primeira, segunda] = linhas;
  if (primeira.endsWith("-")) {
    return `${primeira.slice(0, -1)}${segunda}`;
  }
  return `${primeira} ${segunda}`.replace(/\s+/g, " ").trim();
}
