// ======================================================
// Compartilhar / imprimir — Raio-x da venda.
// ======================================================

import suse7LogoUrl from "../../assets/suse7-logo-redonda.png";
import { buildSaleRayxSummary, buildSaleRayxSummaryRenderModel, SALE_RAYX_BRAND_TITLE } from "./saleRayxSummary";
import { buildSaleRayxSummaryPngBlob } from "./saleRayxSummaryImage";

/** Título da aba/janela de impressão (evita duplicar o cabeçalho do resumo). */
const PRINT_WINDOW_TITLE = "Suse7";

/**
 * Padrão premium A4 retrato — mesma escala do Relatório de Vendas (P_2.8.8A).
 * O resumo ocupa a folha de forma proporcional e legível (não mais 1/4).
 */
const PRINT_SHEET_MAX_WIDTH_MM = 160;
const PRINT_SHEET_MAX_HEIGHT_MM = 265;

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
    .s7-rayx-print-sheet {
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
      .s7-rayx-print-sheet {
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
  <img class="s7-rayx-print-sheet" src="${dataUrl.replace(/"/g, "&quot;")}" alt="${escapeHtml(SALE_RAYX_BRAND_TITLE)}" />
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
