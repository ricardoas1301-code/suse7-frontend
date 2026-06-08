// Classifica o rótulo de status operacional da venda em um tom de cor (UX).
// Verde: entregue · Azul: a caminho · Vermelho: cancelada · Laranja: a enviar.
// Apenas visual — não altera regra de negócio nem o texto do status.

/**
 * @param {string | null | undefined} label
 * @returns {"entregue" | "caminho" | "cancelada" | "enviar" | "neutro"}
 */
export function resolveSaleStatusToneKey(label) {
  const texto = label != null ? String(label).trim().toLowerCase() : "";
  if (!texto) return "neutro";
  if (texto.includes("cancelad")) return "cancelada";
  if (texto.includes("entregue")) return "entregue";
  if (texto.includes("a caminho")) return "caminho";
  if (texto.includes("enviar") || texto.includes("preparação") || texto.includes("preparacao")) {
    return "enviar";
  }
  return "neutro";
}

/**
 * @param {string | null | undefined} label
 * @returns {string} classe CSS de tom para o rótulo de status
 */
export function getSaleStatusToneClass(label) {
  return `vendas-status-tone vendas-status-tone--${resolveSaleStatusToneKey(label)}`;
}
