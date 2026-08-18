// ======================================================================
// Documento de impressão/PDF — Relatório de Concorrência.
// Padrão atual: somente executivo visual (sem detalhamento textual).
// ======================================================================

/** Área útil de impressão — idêntica ao printVendasReport.js */
export const CONCORRENCIA_PRINT_SHEET_MAX_WIDTH_MM = 160;
export const CONCORRENCIA_PRINT_SHEET_MAX_HEIGHT_MM = 265;

/**
 * @param {string} executiveImageDataUrl
 * @returns {string}
 */
export function renderConcorrenciaSharePrintHtml(executiveImageDataUrl) {
  const imgSrc = String(executiveImageDataUrl ?? "").replace(/"/g, "&quot;");

  const paginaExecutiva = imgSrc
    ? `<section class="s7-conc-print__executive" aria-label="Resumo executivo visual">
  <img class="s7-conc-print-sheet" src="${imgSrc}" alt="Relatório de Concorrência" />
</section>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Suse7 — Relatório de Concorrência</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    html, body { margin: 0; padding: 0; background: #fff; color: #111827; box-sizing: border-box; }
    body {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
    }
    .s7-conc-print__executive {
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .s7-conc-print-sheet {
      display: block;
      width: auto;
      height: auto;
      max-width: ${CONCORRENCIA_PRINT_SHEET_MAX_WIDTH_MM}mm;
      max-height: ${CONCORRENCIA_PRINT_SHEET_MAX_HEIGHT_MM}mm;
      object-fit: contain;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    @media print {
      html, body { background: #fff !important; }
      .s7-conc-print-sheet {
        max-width: ${CONCORRENCIA_PRINT_SHEET_MAX_WIDTH_MM}mm !important;
        max-height: ${CONCORRENCIA_PRINT_SHEET_MAX_HEIGHT_MM}mm !important;
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
