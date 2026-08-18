// ======================================================================
// Rótulo de contagem de itens selecionados — cards de filtros (catálogos S7).
// ======================================================================

import { formatSelectionCountLabel } from "./formatSelectionCountLabel.js";

/**
 * @param {number} count
 */
export function formatCatalogSelectionCountLabel(count) {
  return formatSelectionCountLabel(count, "produto selecionado", "produtos selecionados");
}
