// =============================================================================
// Adapter — Impressão (mesma imagem do renderer)
// =============================================================================

import { SALE_RAYX_BRAND_TITLE } from "../../../components/sales/saleRayxSummary.js";
import {
  generateSaleRayxShareImage,
  type SaleRayXShareInput,
} from "./SaleRayXShareRenderer.js";

const PRINT_WINDOW_TITLE = "Suse7";
const PRINT_PAGE_MARGIN_MM = 10;
const PRINT_PAGE_WIDTH_MM = 210;
const PRINT_PAGE_HEIGHT_MM = 297;
const PRINT_QUADRANT_WIDTH_MM = (PRINT_PAGE_WIDTH_MM - PRINT_PAGE_MARGIN_MM * 2) / 2;
const PRINT_QUADRANT_HEIGHT_MM = (PRINT_PAGE_HEIGHT_MM - PRINT_PAGE_MARGIN_MM * 2) / 2;

function escapeHtml(raw: string) {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mmToCssPx(mm: number) {
  return (mm * 96) / 25.4;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
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

export async function printSaleRayxShare(input: SaleRayXShareInput): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const { blob } = await generateSaleRayxShareImage(input, "print");
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
    return;
  }

  const cleanup = () => {
    iframe.remove();
  };

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(PRINT_WINDOW_TITLE)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    html, body { margin: 0; padding: 0; background: #fff; box-sizing: border-box; }
    body { display: flex; justify-content: flex-start; align-items: flex-start; }
    .s7-rayx-print-root {
      box-sizing: border-box;
      width: ${PRINT_QUADRANT_WIDTH_MM}mm;
      height: ${PRINT_QUADRANT_HEIGHT_MM}mm;
      max-width: ${PRINT_QUADRANT_WIDTH_MM}mm;
      max-height: ${PRINT_QUADRANT_HEIGHT_MM}mm;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .s7-rayx-print-sheet {
      display: block;
      width: 100%;
      height: 100%;
      max-width: ${PRINT_QUADRANT_WIDTH_MM}mm;
      max-height: ${PRINT_QUADRANT_HEIGHT_MM}mm;
      object-fit: contain;
      object-position: top left;
    }
  </style>
</head>
<body>
  <div class="s7-rayx-print-root">
    <img class="s7-rayx-print-sheet" src="${dataUrl.replace(/"/g, "&quot;")}" alt="${escapeHtml(SALE_RAYX_BRAND_TITLE)}" />
  </div>
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
      const maxW = mmToCssPx(PRINT_QUADRANT_WIDTH_MM);
      const maxH = mmToCssPx(PRINT_QUADRANT_HEIGHT_MM);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
        img.style.width = `${Math.floor(img.naturalWidth * scale)}px`;
        img.style.height = `${Math.floor(img.naturalHeight * scale)}px`;
      }
      try {
        frameWin?.focus();
        frameWin?.print();
      } catch {
        cleanup();
      }
    };
    if (img.complete && img.naturalWidth > 0) requestAnimationFrame(trigger);
    else img.addEventListener("load", () => requestAnimationFrame(trigger), { once: true });
  };

  frameWin?.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(cleanup, 120_000);

  if (doc.readyState === "complete") runPrint();
  else iframe.addEventListener("load", runPrint, { once: true });
}
