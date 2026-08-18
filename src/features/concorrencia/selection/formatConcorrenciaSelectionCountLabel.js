// ======================================================================
// Rótulo de contagem — Concorrência (anúncios monitorados).
// ======================================================================

import { formatSelectionCountLabel } from "../../../utils/formatSelectionCountLabel.js";

/**
 * @param {number} count
 */
export function formatConcorrenciaSelectionCountLabel(count) {
  return formatSelectionCountLabel(count, "anúncio selecionado", "anúncios selecionados");
}
