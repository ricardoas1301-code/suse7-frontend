// ======================================================================
// Imprimir / PDF — Relatório de Concorrência.
// Padrão atual: somente card executivo visual.
// ======================================================================

import {
  buildConcorrenciaReportImageBlob,
  concorrenciaReportBlobToDataUrl,
} from "./buildConcorrenciaReportImageBlob.jsx";
import {
  CONCORRENCIA_PRINT_SHEET_MAX_HEIGHT_MM,
  CONCORRENCIA_PRINT_SHEET_MAX_WIDTH_MM,
  renderConcorrenciaSharePrintHtml,
} from "./renderConcorrenciaSharePrintHtml.js";

const PRINT_WINDOW_TITLE = "Suse7 — Relatório de Concorrência";

/** @param {number} mm */
function mmToCssPx(mm) {
  return (mm * 96) / 25.4;
}

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 * @returns {Promise<boolean>}
 */
export async function printConcorrenciaReport(payload) {
  if (!payload || typeof window === "undefined" || typeof document === "undefined") return false;

  const imageBlob = await buildConcorrenciaReportImageBlob(payload);
  if (!imageBlob) return false;

  const executiveImageDataUrl = await concorrenciaReportBlobToDataUrl(imageBlob);
  const html = renderConcorrenciaSharePrintHtml(executiveImageDataUrl);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", PRINT_WINDOW_TITLE);
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "800px",
    height: "1200px",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  document.body.appendChild(iframe);

  const frameWin = iframe.contentWindow;
  const doc = frameWin?.document;
  if (!doc) {
    iframe.remove();
    return false;
  }

  const cleanup = () => iframe.remove();

  doc.open();
  doc.write(html);
  doc.close();

  const runPrint = () => {
    const img = doc.querySelector(".s7-conc-print-sheet");
    if (!img) {
      cleanup();
      return;
    }

    const trigger = () => {
      const maxW = mmToCssPx(CONCORRENCIA_PRINT_SHEET_MAX_WIDTH_MM);
      const maxH = mmToCssPx(CONCORRENCIA_PRINT_SHEET_MAX_HEIGHT_MM);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
        img.style.width = `${Math.floor(img.naturalWidth * scale)}px`;
        img.style.height = `${Math.floor(img.naturalHeight * scale)}px`;
        img.style.maxWidth = "none";
        img.style.maxHeight = "none";
      }

      try {
        frameWin?.focus();
        frameWin?.print();
      } catch {
        cleanup();
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      requestAnimationFrame(trigger);
      return;
    }

    img.addEventListener("load", () => requestAnimationFrame(trigger), { once: true });
    img.addEventListener("error", cleanup, { once: true });
  };

  frameWin?.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(cleanup, 120_000);

  if (doc.readyState === "complete") {
    runPrint();
  } else {
    iframe.addEventListener("load", runPrint, { once: true });
  }

  return true;
}
