// ======================================================
// Compartilhar / imprimir — Raio-x da venda.
// ======================================================

import suse7LogoUrl from "../../assets/suse7-logo-redonda.png";
import { buildSaleRayxSummary, buildSaleRayxSummaryRenderModel, SALE_RAYX_BRAND_TITLE } from "./saleRayxSummary";
import { buildSaleRayxSummaryPngBlob } from "./saleRayxSummaryImage";

/** Título da aba/janela de impressão (evita duplicar o cabeçalho do resumo). */
const PRINT_WINDOW_TITLE = "Suse7";

/**
 * Quadrante superior esquerdo do A4 (folha em 4 partes: ½ largura × ½ altura útil).
 * A4 útil ~190×277 mm (margem 10 mm) → quadrante ~95×138 mm.
 */
const PRINT_PAGE_MARGIN_MM = 10;
const PRINT_PAGE_WIDTH_MM = 210;
const PRINT_PAGE_HEIGHT_MM = 297;
const PRINT_QUADRANT_WIDTH_MM = (PRINT_PAGE_WIDTH_MM - PRINT_PAGE_MARGIN_MM * 2) / 2;
const PRINT_QUADRANT_HEIGHT_MM = (PRINT_PAGE_HEIGHT_MM - PRINT_PAGE_MARGIN_MM * 2) / 2;

/** @param {number} mm */
function mmToCssPx(mm) {
  return (mm * 96) / 25.4;
}

/**
 * @param {{
 *   general?: Record<string, unknown> | null;
 *   product?: Record<string, unknown> | null;
 *   financial?: Record<string, unknown> | null;
 *   profitMargin?: Record<string, unknown> | null;
 *   listingTitle?: string | null;
 *   saleContextMetrics?: Record<string, unknown> | null;
 * }} ctx
 * @returns {string}
 */
export function buildSaleRayxShareText(ctx) {
  return buildSaleRayxSummary(ctx);
}

export { buildSaleRayxSummary, SALE_RAYX_BRAND_TITLE };

/** @param {string} raw */
function escapeHtml(raw) {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML do cabeçalho de marca (logo + título) para copiar com formatação.
 * @param {string} bodyText
 */
export function buildSaleRayxSummaryHtml(bodyText) {
  const body = escapeHtml(bodyText != null ? String(bodyText) : "");
  const logoPath =
    typeof window !== "undefined"
      ? escapeHtml(new URL(String(suse7LogoUrl), window.location.origin).href)
      : escapeHtml(String(suse7LogoUrl));
  const title = escapeHtml(SALE_RAYX_BRAND_TITLE);

  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:640px;">
  <header style="display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin:0 0 14px;">
    <img src="${logoPath}" alt="Suse7" width="56" height="56" style="display:block;object-fit:contain;" />
    <div style="font-size:15px;font-weight:700;line-height:1.3;margin:0;">${title}</div>
  </header>
  <pre style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.45;white-space:pre-wrap;word-break:break-word;margin:0;">${body}</pre>
</div>`;
}

/**
 * Impressão isolada do resumo S7 (PNG = mesmo layout da imagem copiada).
 * @param {import("./saleRayxSummaryRender.js").SaleRayxSummaryRenderModel | {
 *   general?: Record<string, unknown> | null;
 *   product?: Record<string, unknown> | null;
 *   financial?: Record<string, unknown> | null;
 *   profitMargin?: Record<string, unknown> | null;
 *   listingTitle?: string | null;
 * }} modelOrCtx
 */
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

export async function printSaleRayx(modelOrCtx) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const renderModel =
    modelOrCtx && typeof modelOrCtx === "object" && "lines" in modelOrCtx
      ? /** @type {import("./saleRayxSummaryRender.js").SaleRayxSummaryRenderModel} */ (modelOrCtx)
      : buildSaleRayxSummaryRenderModel(
          /** @type {Parameters<typeof buildSaleRayxSummaryRenderModel>[0]} */ (modelOrCtx),
        );

  let dataUrl = "";
  try {
    const blob = await buildSaleRayxSummaryPngBlob({ renderModel });
    dataUrl = await blobToDataUrl(blob);
  } catch (err) {
    throw err instanceof Error ? err : new Error("Falha ao gerar imagem para impressão.");
  }

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
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      box-sizing: border-box;
    }
    body {
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
    }
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
    @media print {
      html, body {
        background: #fff !important;
        height: auto;
        overflow: hidden;
      }
      .s7-rayx-print-root {
        width: ${PRINT_QUADRANT_WIDTH_MM}mm;
        height: ${PRINT_QUADRANT_HEIGHT_MM}mm;
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-after: avoid;
      }
      .s7-rayx-print-sheet {
        max-width: ${PRINT_QUADRANT_WIDTH_MM}mm !important;
        max-height: ${PRINT_QUADRANT_HEIGHT_MM}mm !important;
        object-fit: contain !important;
        object-position: top left !important;
      }
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
    img.addEventListener(
      "error",
      () => {
        cleanup();
      },
      { once: true },
    );
  };

  frameWin?.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(cleanup, 120_000);

  if (doc.readyState === "complete") {
    runPrint();
  } else {
    iframe.addEventListener("load", runPrint, { once: true });
  }
}

/**
 * @param {string} text
 */
export function openWhatsAppShare(text) {
  const trimmed = text != null ? String(text).trim() : "";
  const url = trimmed
    ? `https://wa.me/?text=${encodeURIComponent(trimmed)}`
    : "https://web.whatsapp.com/";
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * @param {string} subject
 * @param {string} body
 */
export function openEmailShare(subject, body) {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
}

/**
 * @param {{ title: string; text: string }} payload
 * @returns {Promise<boolean>}
 */
export async function tryNativeShare(payload) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  try {
    await navigator.share(payload);
    return true;
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && err.name === "AbortError") return true;
    return false;
  }
}
