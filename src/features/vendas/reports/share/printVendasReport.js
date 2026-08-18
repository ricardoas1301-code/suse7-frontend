// ======================================================================
// Imprimir / PDF — Relatório de Vendas.
// P1: card visual na mesma escala homologada · P2+: detalhamento das vendas.
// ======================================================================

import {
  VENDAS_PRINT_SHEET_MAX_HEIGHT_MM,
  VENDAS_PRINT_SHEET_MAX_WIDTH_MM,
  buildVendasReportPrintContent,
} from "./buildVendasReportPrintContent.js";

const PRINT_WINDOW_TITLE = "Suse7 — Relatório de Vendas";
const PRINT_IMAGE_TIMEOUT_MS = 8_000;

/** @param {number} mm */
function mmToCssPx(mm) {
  return (mm * 96) / 25.4;
}

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<boolean>}
 */
export async function printVendasReport(payload) {
  if (!payload || typeof window === "undefined" || typeof document === "undefined") return false;

  const content = await buildVendasReportPrintContent(payload);
  if (!content?.printHtml) return false;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", PRINT_WINDOW_TITLE);
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "0",
    height: "0",
    border: "0",
    visibility: "hidden",
  });

  document.body.appendChild(iframe);

  const frameWin = iframe.contentWindow;
  const doc = frameWin?.document;
  if (!doc) {
    iframe.remove();
    return false;
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };

  doc.open();
  doc.write(content.printHtml);
  doc.close();

  const triggerPrint = () => {
    try {
      frameWin?.focus();
      frameWin?.print();
    } catch {
      cleanup();
    }
  };

  const runPrint = () => {
    const img = doc.querySelector(".s7-vendas-print-sheet");
    let printed = false;

    const finalize = () => {
      if (printed) return;
      printed = true;
      requestAnimationFrame(triggerPrint);
    };

    if (!img) {
      finalize();
      return;
    }

    const scaleAndPrint = () => {
      const maxW = mmToCssPx(VENDAS_PRINT_SHEET_MAX_WIDTH_MM);
      const maxH = mmToCssPx(VENDAS_PRINT_SHEET_MAX_HEIGHT_MM);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
        img.style.width = `${Math.floor(img.naturalWidth * scale)}px`;
        img.style.height = `${Math.floor(img.naturalHeight * scale)}px`;
        img.style.maxWidth = "none";
        img.style.maxHeight = "none";
      }
      finalize();
    };

    if (img.complete && img.naturalWidth > 0) {
      requestAnimationFrame(scaleAndPrint);
      return;
    }

    img.addEventListener("load", () => requestAnimationFrame(scaleAndPrint), { once: true });
    img.addEventListener("error", finalize, { once: true });
    window.setTimeout(finalize, PRINT_IMAGE_TIMEOUT_MS);
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
