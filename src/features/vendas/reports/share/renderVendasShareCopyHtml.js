// ======================================================================
// HTML do Copiar — card executivo + detalhamento (mesma ordem e layout do PDF).
// Detalhamento com estilos inline para colagem rica (Google Docs / Word).
// ======================================================================

import { renderVendasShareExecutiveText } from "./renderVendasShareExecutiveText.js";

const INLINE_COPY_ROOT = `font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:11pt;line-height:1.45;color:#111827;min-width:480px;max-width:640px;`;

const INLINE_COPY_EXECUTIVE = "margin:0 0 12px;text-align:center;";

const INLINE_COPY_GAP =
  "display:block;height:28px;margin:0 0 32px;line-height:28px;font-size:1px;color:transparent;";

/**
 * Fragmento HTML para colar — executivo (imagem) + detalhamento abaixo.
 * Detalhamento: mesma estrutura do PDF, com estilos inline para o clipboard.
 *
 * @param {string} executiveImageDataUrl
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @param {readonly Record<string, unknown>[]} detailRows
 * @returns {string}
 */
export function renderVendasShareCopyHtml(executiveImageDataUrl, payload, detailRows) {
  void detailRows;
  const imgSrc = String(executiveImageDataUrl ?? "").replace(/"/g, "&quot;");
  const executiveText = renderVendasShareExecutiveText(payload)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const executivoHtml = imgSrc
    ? `<div style="${INLINE_COPY_EXECUTIVE}"><img src="${imgSrc}" alt="Relatório de Vendas — resumo executivo" style="display:block;margin:0 auto;max-width:480px;width:100%;height:auto;" /></div>`
    : "";
  const headerListHtml =
    executiveText.length > 0
      ? `<div style="margin:0 0 12px 0;">${executiveText
          .map((line) => `<div style="margin:0 0 4px 0;">${line}</div>`)
          .join("")}</div>`
      : "";

  const body = `<div style="${INLINE_COPY_ROOT}">${headerListHtml}${executivoHtml}${
    executivoHtml ? `<div style="${INLINE_COPY_GAP}">&nbsp;</div>` : ""
  }</div>`;

  return `<html><body><!--StartFragment-->${body}<!--EndFragment--></body></html>`;
}
