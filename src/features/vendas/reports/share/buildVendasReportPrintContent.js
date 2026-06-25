// ======================================================================
// Fonte única de renderização — Copiar e Imprimir do Relatório de Vendas.
// Resumo executivo (imagem) + detalhamento das vendas já listadas na tela.
// ======================================================================

import { buildVendasReportImageBlob } from "./copyVendasReportImage.jsx";
import { renderVendasShareCopyHtml } from "./renderVendasShareCopyHtml.js";
import {
  VENDAS_PRINT_SHEET_MAX_HEIGHT_MM,
  VENDAS_PRINT_SHEET_MAX_WIDTH_MM,
  renderVendasSharePrintHtml,
} from "./renderVendasSharePrintHtml.js";
import { renderVendasShareExecutiveText } from "./renderVendasShareExecutiveText.js";

export { VENDAS_PRINT_SHEET_MAX_HEIGHT_MM, VENDAS_PRINT_SHEET_MAX_WIDTH_MM };
export { buildVendasReportDetailRenderer } from "./buildVendasReportDetailRenderer.js";

/**
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export async function vendasReportBlobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Falha ao converter imagem para impressão."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler imagem."));
    reader.readAsDataURL(blob);
  });
}

/**
 * @typedef {{
 *   executiveImageDataUrl: string;
 *   detailRows: Record<string, unknown>[];
 *   detailCount: number;
 *   printHtml: string;
 *   copyHtml: string;
 *   plainText: string;
 * }} VendasReportPrintContent
 */

/**
 * Monta todo o conteúdo compartilhado entre Copiar e Imprimir.
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<VendasReportPrintContent | null>}
 */
export async function buildVendasReportPrintContent(payload) {
  if (!payload) return null;

  const imageBlob = await buildVendasReportImageBlob(payload);

  const executiveImageDataUrl = imageBlob ? await vendasReportBlobToDataUrl(imageBlob) : "";

  return {
    executiveImageDataUrl,
    detailRows: [],
    detailCount: 0,
    printHtml: renderVendasSharePrintHtml(executiveImageDataUrl, payload, []),
    copyHtml: renderVendasShareCopyHtml(executiveImageDataUrl, payload, []),
    plainText: `${renderVendasShareExecutiveText(payload)}\n`,
  };
}
