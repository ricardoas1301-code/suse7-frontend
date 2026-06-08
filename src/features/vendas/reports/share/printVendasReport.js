// ======================================================================
// Imprimir / PDF do Relatório de Vendas (P_2.8.8).
//
// Reaproveita o MESMO render executivo homologado: gera a imagem PNG via
// buildVendasReportImageBlob (VendasExecutiveShareCard + buildVendasSharePayload)
// e a imprime isolada num iframe oculto. Garante impressão apenas do relatório
// (sem navbar/tabela/fundo da página), mesmo pattern do Raio-X da Venda.
// ======================================================================

import { buildVendasReportImageBlob } from "./copyVendasReportImage.jsx";

const PRINT_WINDOW_TITLE = "Suse7 — Relatório de Vendas";

// Área útil de impressão (A4 retrato, margem 12mm) com respiro lateral.
const PRINT_SHEET_MAX_WIDTH_MM = 160;
const PRINT_SHEET_MAX_HEIGHT_MM = 265;

/** @param {number} mm */
function mmToCssPx(mm) {
  return (mm * 96) / 25.4;
}

/**
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToDataUrl(blob) {
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
 * Abre o fluxo de impressão do navegador com o relatório executivo (PDF via
 * "Salvar como PDF"). Mantém fallback seguro: retorna false se não for possível.
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<boolean>}
 */
export async function printVendasReport(payload) {
  if (!payload || typeof window === "undefined" || typeof document === "undefined") return false;

  const blob = await buildVendasReportImageBlob(payload);
  if (!blob) return false;
  const dataUrl = await blobToDataUrl(blob);

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

  const cleanup = () => {
    iframe.remove();
  };

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${PRINT_WINDOW_TITLE}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      box-sizing: border-box;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .s7-vendas-print-sheet {
      display: block;
      width: auto;
      height: auto;
      max-width: ${PRINT_SHEET_MAX_WIDTH_MM}mm;
      max-height: ${PRINT_SHEET_MAX_HEIGHT_MM}mm;
      object-fit: contain;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    @media print {
      html, body {
        background: #fff !important;
      }
      .s7-vendas-print-sheet {
        max-width: ${PRINT_SHEET_MAX_WIDTH_MM}mm !important;
        max-height: ${PRINT_SHEET_MAX_HEIGHT_MM}mm !important;
        object-fit: contain !important;
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <img class="s7-vendas-print-sheet" src="${dataUrl.replace(/"/g, "&quot;")}" alt="Relatório de Vendas" />
</body>
</html>`);
  doc.close();

  const runPrint = () => {
    const img = doc.querySelector("img");
    if (!img) {
      cleanup();
      return;
    }

    const trigger = () => {
      const maxW = mmToCssPx(PRINT_SHEET_MAX_WIDTH_MM);
      const maxH = mmToCssPx(PRINT_SHEET_MAX_HEIGHT_MM);
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
