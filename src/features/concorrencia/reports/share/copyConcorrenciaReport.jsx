// ======================================================================
// Cópia do Relatório de Concorrência — mesma estrutura do PDF/Imprimir.
// Padrão atual: prioriza imagem executiva (PNG) no clipboard.
// ======================================================================

import { buildConcorrenciaReportImageBlob, concorrenciaReportBlobToDataUrl } from "./buildConcorrenciaReportImageBlob.jsx";
import { renderConcorrenciaShareCopyHtml } from "./renderConcorrenciaShareCopyHtml.js";

/**
 * @returns {boolean}
 */
export function isConcorrenciaRichClipboardSupported() {
  return (
    typeof document !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.clipboard != null &&
    (typeof navigator.clipboard.write === "function" || document.queryCommandSupported?.("copy"))
  );
}

/**
 * @param {string} html
 * @returns {Promise<boolean>}
 */
async function copyHtmlViaSelection(html) {
  if (typeof document === "undefined" || !html) return false;

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.contentEditable = "true";
  Object.assign(host.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    width: "640px",
    pointerEvents: "none",
  });
  host.innerHTML = html;
  document.body.appendChild(host);

  try {
    host.focus();
    const range = document.createRange();
    range.selectNodeContents(host);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    const ok = document.execCommand("copy");
    selection?.removeAllRanges();
    return ok;
  } catch {
    return false;
  } finally {
    host.remove();
  }
}

/**
 * @param {string} html
 * @param {string} plainText
 * @returns {Promise<boolean>}
 */
async function copyHtmlViaClipboardApi(html, plainText) {
  if (typeof window.ClipboardItem === "undefined" || !navigator.clipboard?.write) return false;

  try {
    /** @type {Record<string, Blob>} */
    const items = {
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plainText], { type: "text/plain" }),
    };
    await navigator.clipboard.write([new window.ClipboardItem(items)]);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {Blob} imageBlob
 * @returns {Promise<boolean>}
 */
async function copyImageViaClipboardApi(imageBlob) {
  if (!imageBlob || typeof window.ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    return false;
  }

  try {
    const items = { [imageBlob.type || "image/png"]: imageBlob };
    await navigator.clipboard.write([new window.ClipboardItem(items)]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copia somente o relatório executivo (imagem).
 *
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 * @returns {Promise<"image" | "rich" | "text" | null>}
 */
export async function copyConcorrenciaReportToClipboard(payload) {
  if (!payload) return null;

  const imageBlob = await buildConcorrenciaReportImageBlob(payload);
  if (!imageBlob) return null;

  const copiedImage = await copyImageViaClipboardApi(imageBlob);
  if (copiedImage) return "image";

  const executiveImageDataUrl = await concorrenciaReportBlobToDataUrl(imageBlob);
  const html = renderConcorrenciaShareCopyHtml(executiveImageDataUrl);

  if (html && isConcorrenciaRichClipboardSupported()) {
    const viaClipboard = await copyHtmlViaClipboardApi(html, "");
    if (viaClipboard) return "rich";

    const viaSelection = await copyHtmlViaSelection(html);
    if (viaSelection) return "rich";
  }

  return null;
}
