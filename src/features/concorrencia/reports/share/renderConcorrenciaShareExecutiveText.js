// ======================================================================
// Renderer textual legado — caption WhatsApp/E-mail e fallback auxiliar.
// Padrão atual: texto executivo apenas (detalhamento somente no Excel).
// ======================================================================

import { renderConcorrenciaShareExecutiveCardText } from "./concorrenciaShareReportLayout.js";

export {
  renderConcorrenciaShareExecutiveCardText,
  renderConcorrenciaShareDetalheCopyText,
  renderConcorrenciaShareFullCopyText,
} from "./concorrenciaShareReportLayout.js";

/**
 * @deprecated Preferir renderConcorrenciaShareFullCopyText ou copyConcorrenciaReportToClipboard.
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 * @returns {string}
 */
export function renderConcorrenciaShareExecutiveText(payload) {
  return `${renderConcorrenciaShareExecutiveCardText(payload) || ""}\n`;
}

export { default as ConcorrenciaExecutiveShareCard } from "./renderConcorrenciaExecutiveShareCard.jsx";
export { buildConcorrenciaReportImageBlob, concorrenciaReportBlobToDataUrl } from "./buildConcorrenciaReportImageBlob.jsx";
