// ======================================================================
// HTML do Copiar — somente card executivo (sem detalhamento textual).
// ======================================================================

const CONCORRENCIA_SHARE_COPY_STYLES = `
  .s7-conc-copy {
    font-family: Calibri, "Segoe UI", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #111827;
    min-width: 480px;
    max-width: 640px;
  }
  .s7-conc-copy__executive {
    margin: 0;
    text-align: center;
  }
  .s7-conc-copy__executive img {
    display: block;
    margin: 0 auto;
    max-width: 480px;
    width: 100%;
    height: auto;
  }
`;

/**
 * Fragmento HTML para colar — somente executivo (imagem).
 *
 * @param {string} executiveImageDataUrl
 * @returns {string}
 */
export function renderConcorrenciaShareCopyHtml(executiveImageDataUrl) {
  const imgSrc = String(executiveImageDataUrl ?? "").replace(/"/g, "&quot;");

  const executivoHtml = imgSrc
    ? `<div class="s7-conc-copy__executive"><img src="${imgSrc}" alt="Relatório de Concorrência — resumo executivo" /></div>`
    : "";

  return `<div class="s7-conc-copy"><style>${CONCORRENCIA_SHARE_COPY_STYLES}</style>${executivoHtml}</div>`;
}
