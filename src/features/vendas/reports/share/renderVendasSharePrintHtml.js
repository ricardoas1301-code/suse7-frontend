// ======================================================================
// Documento de impressão/PDF — Relatório de Vendas.
// Página 1: card visual · P2+: detalhamento das vendas.
// ======================================================================

/** Área útil de impressão — idêntica ao printVendasReport.js */
export const VENDAS_PRINT_SHEET_MAX_WIDTH_MM = 160;
export const VENDAS_PRINT_SHEET_MAX_HEIGHT_MM = 265;

/**
 * @param {string} executiveImageDataUrl
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @param {readonly Record<string, unknown>[]} detailRows
 * @returns {string}
 */
export function renderVendasSharePrintHtml(executiveImageDataUrl, payload, detailRows) {
  void payload;
  void detailRows;
  const imgSrc = String(executiveImageDataUrl ?? "").replace(/"/g, "&quot;");

  const paginaExecutiva = imgSrc
    ? `<section class="s7-vendas-print__executive" aria-label="Resumo executivo visual">
  <img class="s7-vendas-print-sheet" src="${imgSrc}" alt="Relatório de Vendas" />
</section>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Suse7 — Relatório de Vendas</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    html, body { margin: 0; padding: 0; background: #fff; color: #111827; box-sizing: border-box; }
    body {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
    }
    .s7-vendas-print__executive {
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .s7-vendas-print-sheet {
      display: block;
      width: auto;
      height: auto;
      max-width: ${VENDAS_PRINT_SHEET_MAX_WIDTH_MM}mm;
      max-height: ${VENDAS_PRINT_SHEET_MAX_HEIGHT_MM}mm;
      object-fit: contain;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    @media print {
      html, body { background: #fff !important; }
      .s7-vendas-print-sheet {
        max-width: ${VENDAS_PRINT_SHEET_MAX_WIDTH_MM}mm !important;
        max-height: ${VENDAS_PRINT_SHEET_MAX_HEIGHT_MM}mm !important;
        object-fit: contain !important;
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${paginaExecutiva}
</body>
</html>`;
}
