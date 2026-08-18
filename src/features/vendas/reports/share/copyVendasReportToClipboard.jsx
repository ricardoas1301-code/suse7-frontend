// ======================================================================
// Cópia do Relatório de Vendas — somente imagem do card executivo.
// ======================================================================

import { copyVendasReportImageToClipboard, isImageClipboardSupported } from "./copyVendasReportImage.jsx";

/**
 * @returns {boolean}
 */
export function isVendasRichClipboardSupported() {
  return isImageClipboardSupported();
}

/**
 * Copia somente a imagem do resumo executivo.
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<"image" | null>}
 */
export async function copyVendasReportToClipboard(payload) {
  if (!payload) return null;
  const ok = await copyVendasReportImageToClipboard(payload);
  return ok ? "image" : null;
}
