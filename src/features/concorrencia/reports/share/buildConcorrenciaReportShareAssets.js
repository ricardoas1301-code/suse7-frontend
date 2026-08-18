// ======================================================================
// Anexos reutilizáveis do Relatório de Concorrência (WhatsApp, E-mail).
// Imagem executiva + Excel — mesmo contrato do Relatório de Vendas.
// ======================================================================

import { buildConcorrenciaReportImageBlob } from "./buildConcorrenciaReportImageBlob.jsx";
import { buildConcorrenciaReportXlsxBlob, resolveConcorrenciaReportBaseName } from "./buildConcorrenciaReportXlsx.js";
import {
  buildConcorrenciaReportKey,
  buildConcorrenciaReportTemplatePayload,
} from "./buildConcorrenciaSharePayload.js";

/**
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
async function blobToBase64Payload(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 */
export async function buildConcorrenciaReportShareAssets(payload) {
  if (!payload) return null;

  let imageBlob = null;
  let xlsx = null;

  try {
    imageBlob = await buildConcorrenciaReportImageBlob(payload);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[S7 Relatório Concorrência] Falha ao gerar imagem:", err);
    }
  }

  try {
    xlsx = await buildConcorrenciaReportXlsxBlob(payload);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[S7 Relatório Concorrência] Falha ao gerar Excel:", err);
    }
  }

  if (!imageBlob || !xlsx?.blob) return null;

  const baseName = resolveConcorrenciaReportBaseName(payload);
  const [imageBase64, documentBase64] = await Promise.all([
    blobToBase64Payload(imageBlob),
    blobToBase64Payload(xlsx.blob),
  ]);

  return {
    imageBase64,
    imageFilename: `${baseName}.png`,
    documentBase64,
    documentFilename: xlsx.filename || `${baseName}.xlsx`,
    documentMimeType: xlsx.blob.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    templatePayload: buildConcorrenciaReportTemplatePayload(payload),
    reportKey: buildConcorrenciaReportKey(payload),
  };
}
