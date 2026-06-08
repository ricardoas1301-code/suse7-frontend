// ======================================================================
// Canal WhatsApp do Relatório de Vendas (P_2.8.12F.G).
//
// Padrão oficial: imagem executiva premium + arquivo Excel, ambos derivados
// do MESMO contrato único (buildVendasSharePayload) e do MESMO render visual
// já homologado (VendasExecutiveShareCard). Não cria template/payload paralelo.
//
// Estratégia (frontend, sem backend):
//  1) Web Share API com arquivos (imagem + Excel) — mobile/navegadores aptos.
//  2) Web Share API só com a imagem + download do Excel para anexar.
//  3) Fallback: baixa imagem + Excel e abre o WhatsApp (wa.me) com a legenda.
// ======================================================================

import { buildVendasReportImageBlob } from "./copyVendasReportImage.jsx";
import {
  buildVendasReportXlsxBlob,
  resolveVendasReportBaseName,
} from "./buildVendasReportXlsx.js";
import { renderVendasShareExecutiveText } from "./renderVendasShareExecutiveText.js";

const SHARE_TITLE = "Relatório de Vendas";

/**
 * @param {unknown} err
 * @returns {boolean}
 */
function isAbortError(err) {
  return Boolean(err && typeof err === "object" && "name" in err && err.name === "AbortError");
}

/**
 * @param {Blob} blob
 * @param {string} filename
 */
function downloadBlob(blob, filename) {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * @param {File[]} files
 * @returns {boolean}
 */
function canShareFiles(files) {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    files.length > 0 &&
    navigator.canShare({ files })
  );
}

/**
 * @typedef {"shared-files" | "shared-image" | "fallback-download" | "cancelled" | "noop"} WhatsAppShareStatus
 */

/**
 * Compartilha o relatório pelo WhatsApp (imagem executiva + Excel).
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<WhatsAppShareStatus>}
 */
export async function shareVendasReportWhatsApp(payload) {
  if (!payload) return "noop";

  const caption = renderVendasShareExecutiveText(payload);
  const baseName = resolveVendasReportBaseName(payload);
  const imageFilename = `${baseName}.png`;

  const [imageBlob, xlsx] = await Promise.all([
    buildVendasReportImageBlob(payload),
    buildVendasReportXlsxBlob(payload),
  ]);

  const imageFile = imageBlob
    ? new File([imageBlob], imageFilename, { type: imageBlob.type || "image/png" })
    : null;
  const xlsxFile = xlsx ? new File([xlsx.blob], xlsx.filename, { type: xlsx.blob.type }) : null;

  // 1) Compartilhar imagem + Excel juntos.
  const allFiles = [imageFile, xlsxFile].filter(Boolean);
  if (canShareFiles(allFiles)) {
    try {
      await navigator.share({ files: allFiles, title: SHARE_TITLE, text: caption });
      return "shared-files";
    } catch (err) {
      if (isAbortError(err)) return "cancelled";
      // segue para fallback
    }
  }

  // 2) Compartilhar só a imagem (mais compatível) + baixar o Excel para anexar.
  if (imageFile && canShareFiles([imageFile])) {
    try {
      if (xlsx) downloadBlob(xlsx.blob, xlsx.filename);
      await navigator.share({ files: [imageFile], title: SHARE_TITLE, text: caption });
      return "shared-image";
    } catch (err) {
      if (isAbortError(err)) return "cancelled";
      // segue para fallback
    }
  }

  // 3) Fallback: baixa os arquivos e abre o WhatsApp com a legenda textual.
  if (imageBlob) downloadBlob(imageBlob, imageFilename);
  if (xlsx) downloadBlob(xlsx.blob, xlsx.filename);
  if (typeof window !== "undefined") {
    const url = caption
      ? `https://wa.me/?text=${encodeURIComponent(caption)}`
      : "https://wa.me/";
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return "fallback-download";
}
